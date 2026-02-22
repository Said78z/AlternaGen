"""SecurityGuard bot – stub implementation.

Scans the MVP for security vulnerabilities.

Usage:
    python -m bots.security_guard --in mvp_builder_output.json [--out out.json]
"""
from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone

from bots.utils import get_logger, load_json, save_json

log = get_logger("bots.security_guard")


def run(repo_url: str = "") -> dict:
    """Run security scan. (Stub – returns simulated output.)"""
    log.info("[STUB] SecurityGuard: would scan %s", repo_url or "local artifacts")
    return {
        "passed": True,
        "vulnerabilities": [],
        "metadata": {
            "run_at": datetime.now(timezone.utc).isoformat(),
            "repo_url": repo_url,
        },
    }


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="SecurityGuard [stub]")
    parser.add_argument("--in", dest="input", required=True)
    parser.add_argument("--out", default="out/security_guard_output.json")
    args = parser.parse_args(argv)

    try:
        data = load_json(args.input)
    except Exception as exc:
        log.error("Failed to load input: %s", exc)
        sys.exit(1)

    repo_url = data.get("repo_url", "")
    output = run(repo_url)
    save_json(output, args.out)
    log.info("Output written to %s", args.out)


if __name__ == "__main__":
    main()
