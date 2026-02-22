"""
MVPBuilder bot (stub).

Generates initial code scaffold from spec (FastAPI + React template).
Input:  spec_writer_output.json
Output: { "files_generated": [...], "timestamp": "..." }
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)


def run(input_data: dict) -> dict:
    spec = input_data.get("spec", {})
    stack = spec.get("tech_stack", [])
    output = {
        "files_generated": [],
        "stack_used": stack,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "stub — MVPBuilder not yet fully implemented",
    }
    logger.info("MVPBuilder (stub): would scaffold %s", stack)
    return output


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s", stream=sys.stderr)
    parser = argparse.ArgumentParser(description="MVPBuilder: scaffold MVP code from spec.")
    parser.add_argument("--in", dest="input", required=True)
    parser.add_argument("--out", default="-")
    args = parser.parse_args()
    data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    output = run(data)
    text = json.dumps(output, indent=2)
    if args.out == "-":
        print(text)
    else:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
