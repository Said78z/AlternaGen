"""
SaaS Factory pipeline runner.

Executes the full bot chain:
  SignalScout → IdeaRanker → SpecWriter → RepoBootstrapper → MVPBuilder
  → QAGuard → SecurityGuard → WhiteLabelPackager → LaunchKit

Usage:
    python -m bots.pipeline [--out-dir out/] [--sources hackernews,rss] [--limit 20]
    python -m bots.pipeline --phase early   # Only SignalScout + IdeaRanker + SpecWriter
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import date, datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

DAILY_LIMIT = int(os.environ.get("DAILY_MVP_LIMIT", "1"))
STATE_FILE = Path(".saas_factory_state.json")


def _check_daily_limit() -> bool:
    """Return True if we're allowed to run today, False if limit exceeded."""
    today = date.today().isoformat()
    state: dict = {}
    if STATE_FILE.exists():
        try:
            state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    count_today = state.get(today, 0)
    if count_today >= DAILY_LIMIT:
        logger.warning(
            "Daily MVP limit reached (%d/%d). Set DAILY_MVP_LIMIT env var to increase.",
            count_today,
            DAILY_LIMIT,
        )
        return False
    # Increment counter
    state[today] = count_today + 1
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")
    return True


def _write(out_dir: Path, name: str, data: dict) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{name}.json"
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    logger.info("Wrote %s", path)
    return path


def run_pipeline(
    out_dir: Path,
    sources: list[str],
    limit: int,
    phase: str = "full",
) -> dict[str, dict]:
    """Run the full (or partial) pipeline and return all outputs."""
    from bots.signal_scout.main import run as signal_scout_run
    from bots.idea_ranker.main import run as idea_ranker_run
    from bots.spec_writer.main import run as spec_writer_run

    results: dict[str, dict] = {}

    # 1. SignalScout
    logger.info("=== [1/9] SignalScout ===")
    ss_out = signal_scout_run(sources=sources, limit=limit)
    _write(out_dir, "signal_scout", ss_out)
    results["signal_scout"] = ss_out

    # 2. IdeaRanker
    logger.info("=== [2/9] IdeaRanker ===")
    ir_out = idea_ranker_run(input_data=ss_out, top_n=5)
    _write(out_dir, "idea_ranker", ir_out)
    results["idea_ranker"] = ir_out

    # 3. SpecWriter
    logger.info("=== [3/9] SpecWriter ===")
    sw_out = spec_writer_run(input_data=ir_out, idea_rank=1)
    _write(out_dir, "spec_writer", sw_out)
    results["spec_writer"] = sw_out

    if phase == "early":
        logger.info("Phase 'early' complete. Stopping at SpecWriter.")
        return results

    from bots.repo_bootstrapper.main import run as repo_run
    from bots.mvp_builder.main import run as mvp_run
    from bots.qa_guard.main import run as qa_run
    from bots.security_guard.main import run as sec_run
    from bots.white_label_packager.main import run as wlp_run
    from bots.launch_kit.main import run as lk_run

    # 4. RepoBootstrapper
    logger.info("=== [4/9] RepoBootstrapper ===")
    rb_out = repo_run(sw_out)
    _write(out_dir, "repo_bootstrapper", rb_out)
    results["repo_bootstrapper"] = rb_out

    # 5. MVPBuilder
    logger.info("=== [5/9] MVPBuilder ===")
    mb_out = mvp_run(sw_out)
    _write(out_dir, "mvp_builder", mb_out)
    results["mvp_builder"] = mb_out

    # 6. QAGuard
    logger.info("=== [6/9] QAGuard ===")
    qa_out = qa_run(mb_out)
    _write(out_dir, "qa_guard", qa_out)
    results["qa_guard"] = qa_out

    # 7. SecurityGuard
    logger.info("=== [7/9] SecurityGuard ===")
    sec_out = sec_run(qa_out)
    _write(out_dir, "security_guard", sec_out)
    results["security_guard"] = sec_out

    # 8. WhiteLabelPackager
    logger.info("=== [8/9] WhiteLabelPackager ===")
    wlp_out = wlp_run(sec_out)
    _write(out_dir, "white_label_packager", wlp_out)
    results["white_label_packager"] = wlp_out

    # 9. LaunchKit
    logger.info("=== [9/9] LaunchKit ===")
    lk_out = lk_run(wlp_out)
    _write(out_dir, "launch_kit", lk_out)
    results["launch_kit"] = lk_out

    return results


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stderr,
    )

    parser = argparse.ArgumentParser(description="SaaS Factory pipeline runner.")
    parser.add_argument("--out-dir", default="out", help="Directory to write bot outputs (default: out/)")
    parser.add_argument("--sources", default="hackernews,rss", help="Comma-separated signal sources")
    parser.add_argument("--limit", type=int, default=20, help="Max signals per source")
    parser.add_argument(
        "--phase",
        choices=["early", "full"],
        default="full",
        help="'early' stops after SpecWriter; 'full' runs the entire pipeline",
    )
    parser.add_argument(
        "--skip-limit-check",
        action="store_true",
        help="Bypass the daily MVP limit check (for testing/CI)",
    )
    args = parser.parse_args()

    if not args.skip_limit_check and not _check_daily_limit():
        sys.exit(1)

    sources = [s.strip() for s in args.sources.split(",") if s.strip()]
    out_dir = Path(args.out_dir)

    results = run_pipeline(out_dir=out_dir, sources=sources, limit=args.limit, phase=args.phase)
    logger.info("Pipeline complete. Outputs in %s/", out_dir)

    # Print spec summary to stdout
    spec = results.get("spec_writer", {}).get("spec", {})
    if spec:
        print(f"\n{'='*60}")
        print(f"  MVP SPEC: {spec.get('title')}")
        print(f"{'='*60}")
        print(f"  {spec.get('description', '')[:200]}")
        print(f"\n  Tech stack: {', '.join(spec.get('tech_stack', []))}")
        print(f"  MVP scope : {spec.get('mvp_scope', '')[:150]}")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
