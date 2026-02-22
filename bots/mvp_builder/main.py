"""MVPBuilder bot – stub implementation.

Generates boilerplate code for an MVP based on the spec.

Usage:
    python -m bots.mvp_builder --in spec_writer_output.json [--out out.json]
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone

from bots.utils import get_logger, load_json, save_json

log = get_logger("bots.mvp_builder")


def run(spec: dict, repo_url: str = "") -> dict:
    """Build MVP artifacts. (Stub – returns simulated output.)"""
    log.info("[STUB] MVPBuilder: would generate code for spec %s", spec.get("id"))
    return {
        "status": "partial",
        "artifacts": ["README.md", "Dockerfile", "src/app.py", "tests/test_app.py"],
        "metadata": {
            "run_at": datetime.now(timezone.utc).isoformat(),
            "spec_id": spec.get("id"),
        },
    }


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="MVPBuilder [stub]")
    parser.add_argument("--in", dest="input", required=True)
    parser.add_argument("--out", default="out/mvp_builder_output.json")
    args = parser.parse_args(argv)

    try:
        data = load_json(args.input)
    except Exception as exc:
        log.error("Failed to load input: %s", exc)
        sys.exit(1)

    spec = data.get("spec", {})
    output = run(spec)
    save_json(output, args.out)
    log.info("Output written to %s", args.out)


if __name__ == "__main__":
    main()
