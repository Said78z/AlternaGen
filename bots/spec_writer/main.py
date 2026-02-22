"""SpecWriter CLI entrypoint.

Usage:
    python -m bots.spec_writer --in idea_ranker_out.json [--idea-rank 1] [--out out.json]
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

import jsonschema

from bots.spec_writer.writer import generate_spec

logger = logging.getLogger(__name__)

SCHEMA_IN_PATH = Path(__file__).resolve().parents[2] / "schemas" / "idea_ranker_output.json"
SCHEMA_OUT_PATH = Path(__file__).resolve().parents[2] / "schemas" / "spec_writer_output.json"


def _load_schema(path: Path) -> dict:
    with path.open() as fh:
        return json.load(fh)


def run(input_data: dict, idea_rank: int = 1) -> dict:
    """Execute the SpecWriter pipeline.

    Args:
        input_data: IdeaRanker output dict.
        idea_rank: Which ranked idea to write a spec for (1 = best).

    Returns:
        SpecWriter output dict.
    """
    schema_in = _load_schema(SCHEMA_IN_PATH)
    jsonschema.validate(input_data, schema_in)

    ideas = input_data.get("ideas", [])
    if not ideas:
        raise ValueError("No ideas in input — run IdeaRanker first.")

    # Pick the requested rank (default: rank 1 = best idea)
    idea = next((i for i in ideas if i.get("rank") == idea_rank), ideas[0])

    spec = generate_spec(idea)

    output = {
        "spec": spec,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_idea": idea,
    }

    schema_out = _load_schema(SCHEMA_OUT_PATH)
    jsonschema.validate(output, schema_out)
    logger.info("SpecWriter: spec generated for '%s'.", spec.get("title"))

    return output


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stderr,
    )

    parser = argparse.ArgumentParser(
        description="SpecWriter: generate an MVP specification from ranked ideas."
    )
    parser.add_argument(
        "--in",
        dest="input",
        required=True,
        help="Path to IdeaRanker output JSON file",
    )
    parser.add_argument(
        "--idea-rank",
        type=int,
        default=1,
        help="Which ranked idea to spec (default: 1 = best)",
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
    output = run(input_data=input_data, idea_rank=args.idea_rank)

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
