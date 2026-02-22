"""IdeaRanker CLI entrypoint.

Usage:
    python -m bots.idea_ranker --in signal_scout_out.json [--top 5] [--out out.json]
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

import jsonschema

from bots.idea_ranker.ranker import rank_signals

logger = logging.getLogger(__name__)

SCHEMA_IN_PATH = Path(__file__).resolve().parents[2] / "schemas" / "signal_scout_output.json"
SCHEMA_OUT_PATH = Path(__file__).resolve().parents[2] / "schemas" / "idea_ranker_output.json"


def _load_schema(path: Path) -> dict:
    with path.open() as fh:
        return json.load(fh)


def run(input_data: dict, top_n: int = 5) -> dict:
    """Execute the IdeaRanker pipeline.

    Args:
        input_data: SignalScout output dict.
        top_n: Number of top ideas to produce.

    Returns:
        IdeaRanker output dict.
    """
    # Validate input
    schema_in = _load_schema(SCHEMA_IN_PATH)
    jsonschema.validate(input_data, schema_in)

    signals = input_data.get("signals", [])
    ideas = rank_signals(signals, top_n=top_n)

    output = {
        "ideas": ideas,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_signals_processed": len(signals),
    }

    # Validate output
    schema_out = _load_schema(SCHEMA_OUT_PATH)
    jsonschema.validate(output, schema_out)
    logger.info("IdeaRanker: produced %d ideas from %d signals.", len(ideas), len(signals))

    return output


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stderr,
    )

    parser = argparse.ArgumentParser(
        description="IdeaRanker: rank collected signals into actionable MVP ideas."
    )
    parser.add_argument(
        "--in",
        dest="input",
        required=True,
        help="Path to SignalScout output JSON file",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=5,
        help="Number of top ideas to produce (default: 5)",
    )
    parser.add_argument(
        "--out",
        default="-",
        help="Output file path (default: stdout)",
    )
    args = parser.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        logger.error("Input file not found: %s", in_path)
        sys.exit(1)

    input_data = json.loads(in_path.read_text(encoding="utf-8"))
    output = run(input_data=input_data, top_n=args.top)

    output_json = json.dumps(output, indent=2, ensure_ascii=False)
    if args.out == "-":
        print(output_json)
    else:
        out_path = Path(args.out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(output_json, encoding="utf-8")
        logger.info("Output written to %s", out_path)


if __name__ == "__main__":
    main()
