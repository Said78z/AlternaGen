"""IdeaRanker bot – main entry point.

Reads the output of SignalScout, scores and ranks signals, outputs top-N ideas.

Usage:
    python -m bots.idea_ranker --in signal_scout_output.json [--out out.json] [--top-n 5]

Scoring formula (composite 0–100):
    composite = w_score * norm_score + w_comments * norm_comments + w_recency * norm_recency

Where:
    norm_score    = signal.score / max(scores) * 100
    norm_comments = signal.comments / max(comments) * 100
    norm_recency  = decay based on age (newer = higher, 24h window)
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from math import exp

from bots.utils import get_logger, load_json, save_json, validate

log = get_logger("bots.idea_ranker")

DEFAULT_WEIGHTS = {"score": 0.5, "comments": 0.3, "recency": 0.2}
DEFAULT_TOP_N = 5


def _normalize(values: list[float]) -> list[float]:
    """Min-max normalize a list to [0, 100]."""
    mn, mx = min(values), max(values)
    if mx == mn:
        return [50.0] * len(values)
    return [(v - mn) / (mx - mn) * 100.0 for v in values]


def _recency_score(collected_at: str, now: datetime) -> float:
    """Return a recency value in [0, 1] using exponential decay.

    Signals collected within the last 24 h score near 1.0.
    """
    try:
        ts = datetime.fromisoformat(collected_at)
        # Make sure both are timezone-aware
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        age_hours = max((now - ts).total_seconds() / 3600, 0)
    except Exception:
        return 0.5
    # half-life ≈ 12 hours
    return exp(-age_hours / 12.0)


def _build_rationale(signal: dict, composite: float, weights: dict) -> str:
    parts = []
    if weights.get("score", 0) > 0 and signal.get("score", 0) > 0:
        parts.append(f"score={signal['score']} pts")
    if weights.get("comments", 0) > 0 and signal.get("comments", 0) > 0:
        parts.append(f"{signal['comments']} comments")
    if weights.get("recency", 0) > 0:
        parts.append("recent signal")
    tag_str = ", ".join(signal.get("tags", [])[:3])
    if tag_str:
        parts.append(f"topics: {tag_str}")
    return f"Composite score {composite:.1f}/100 – " + "; ".join(parts) if parts else f"Composite score {composite:.1f}/100"


def run(signals: list[dict], top_n: int = DEFAULT_TOP_N, weights: dict | None = None) -> dict:
    """Rank *signals* and return IdeaRanker output dict."""
    if weights is None:
        weights = dict(DEFAULT_WEIGHTS)

    # Normalise weights to sum to 1
    total_w = sum(weights.values())
    if total_w <= 0:
        weights = dict(DEFAULT_WEIGHTS)
        total_w = 1.0
    w = {k: v / total_w for k, v in weights.items()}

    now = datetime.now(timezone.utc)

    raw_scores = [float(s.get("score", 0)) for s in signals]
    raw_comments = [float(s.get("comments", 0)) for s in signals]
    recency_values = [_recency_score(s.get("collected_at", ""), now) for s in signals]

    norm_scores = _normalize(raw_scores)
    norm_comments = _normalize(raw_comments)
    # recency is already [0,1]; scale to [0,100]
    norm_recency = [r * 100.0 for r in recency_values]

    scored: list[tuple[float, dict]] = []
    for i, signal in enumerate(signals):
        composite = (
            w.get("score", 0) * norm_scores[i]
            + w.get("comments", 0) * norm_comments[i]
            + w.get("recency", 0) * norm_recency[i]
        )
        scored.append((composite, signal))

    scored.sort(key=lambda x: x[0], reverse=True)

    ideas: list[dict] = []
    for rank, (composite, signal) in enumerate(scored[:top_n], start=1):
        ideas.append(
            {
                "rank": rank,
                "id": signal["id"],
                "title": signal["title"],
                "url": signal["url"],
                "source": signal["source"],
                "composite_score": round(composite, 2),
                "raw_score": int(signal.get("score", 0)),
                "raw_comments": int(signal.get("comments", 0)),
                "tags": signal.get("tags", []),
                "rationale": _build_rationale(signal, composite, w),
            }
        )

    output = {
        "ideas": ideas,
        "metadata": {
            "run_at": now.isoformat(),
            "total_input_signals": len(signals),
            "weights_used": {k: round(v, 4) for k, v in w.items()},
        },
    }
    log.info("IdeaRanker done: ranked %d ideas (top %d returned)", len(signals), len(ideas))
    return output


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="IdeaRanker – rank signals into ideas")
    parser.add_argument(
        "--in",
        dest="input",
        required=True,
        help="Path to signal_scout_output.json",
    )
    parser.add_argument(
        "--out",
        default="out/idea_ranker_output.json",
        help="Path to write output JSON",
    )
    parser.add_argument("--top-n", type=int, default=DEFAULT_TOP_N)
    parser.add_argument(
        "--weights",
        default=None,
        help='JSON string of weights, e.g. \'{"score":0.5,"comments":0.3,"recency":0.2}\'',
    )
    args = parser.parse_args(argv)

    try:
        scout_output = load_json(args.input)
    except Exception as exc:
        log.error("Failed to load input file '%s': %s", args.input, exc)
        sys.exit(1)

    signals = scout_output.get("signals", [])
    if not signals:
        log.error("No signals found in input file")
        sys.exit(1)

    weights = None
    if args.weights:
        try:
            weights = json.loads(args.weights)
        except json.JSONDecodeError as exc:
            log.error("Invalid weights JSON: %s", exc)
            sys.exit(1)

    ranker_input = {"signals": signals, "top_n": args.top_n}
    if weights:
        ranker_input["weights"] = weights

    try:
        validate(ranker_input, "idea_ranker_input.json")
    except Exception as exc:
        log.error("Input validation failed: %s", exc)
        sys.exit(1)

    output = run(signals, top_n=args.top_n, weights=weights)

    try:
        validate(output, "idea_ranker_output.json")
    except Exception as exc:
        log.warning("Output validation warning: %s", exc)

    save_json(output, args.out)
    log.info("Output written to %s", args.out)


if __name__ == "__main__":
    main()
