"""SignalScout CLI entrypoint.

Usage:
    python -m bots.signal_scout [--sources hackernews,rss] [--limit 20] [--out out.json]

Collects trending signals from HackerNews and RSS feeds, validates against the
output JSON schema, and writes the result to a file or stdout.
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import jsonschema

from bots.signal_scout.sources import hackernews, rss

logger = logging.getLogger(__name__)

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "schemas" / "signal_scout_output.json"

# Daily safety limit: configurable via env var DAILY_MVP_LIMIT (default: 1)
DAILY_MVP_LIMIT = int(os.environ.get("DAILY_MVP_LIMIT", "1"))

SOURCES_MAP = {
    "hackernews": lambda limit=20: hackernews.fetch_signals(limit=limit),
    "rss": lambda limit=20: rss.fetch_signals(limit_per_feed=limit),
}


def _load_schema() -> dict:
    with SCHEMA_PATH.open() as fh:
        return json.load(fh)


def run(sources: list[str], limit: int) -> dict:
    """Execute the SignalScout pipeline and return the output dict."""
    all_signals: list[dict] = []

    for source_name in sources:
        if source_name not in SOURCES_MAP:
            logger.warning("Unknown source: %s — skipping", source_name)
            continue
        fetcher = SOURCES_MAP[source_name]
        fetched = fetcher(limit=limit)
        all_signals.extend(fetched)

    # Deduplicate by URL
    seen_urls: set[str] = set()
    unique_signals: list[dict] = []
    for sig in all_signals:
        url = sig.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_signals.append(sig)

    output = {
        "signals": unique_signals,
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sources_used": sources,
    }

    # Validate against schema
    schema = _load_schema()
    jsonschema.validate(output, schema)
    logger.info("Output validated against schema. %d signals collected.", len(unique_signals))

    return output


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        stream=sys.stderr,
    )

    parser = argparse.ArgumentParser(
        description="SignalScout: collect trending signals from public APIs and RSS feeds."
    )
    parser.add_argument(
        "--sources",
        default="hackernews,rss",
        help="Comma-separated list of sources to use (default: hackernews,rss)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Max signals per source (default: 20)",
    )
    parser.add_argument(
        "--out",
        default="-",
        help="Output file path (default: stdout)",
    )
    args = parser.parse_args()

    sources = [s.strip() for s in args.sources.split(",") if s.strip()]
    output = run(sources=sources, limit=args.limit)

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
