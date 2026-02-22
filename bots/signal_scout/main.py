"""SignalScout bot – main entry point.

Usage:
    python -m bots.signal_scout [--config config.json] [--out out.json]

Fetches market/tech signals from configured sources and outputs a validated JSON.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone

from bots.utils import get_logger, save_json, validate
from bots.signal_scout.sources import hackernews, rss

log = get_logger("bots.signal_scout")

DEFAULT_CONFIG = {
    "sources": ["hackernews", "rss_techcrunch"],
    "max_signals": 30,
    "min_score": 50,
}

RSS_SOURCES = {"rss_techcrunch", "rss_producthunt", "rss_indiehackers"}


def run(config: dict) -> dict:
    """Execute SignalScout with the given *config* dict.

    Returns the output dict (signal_scout_output schema).
    """
    sources = config.get("sources", DEFAULT_CONFIG["sources"])
    max_signals = int(config.get("max_signals", DEFAULT_CONFIG["max_signals"]))
    min_score = int(config.get("min_score", DEFAULT_CONFIG["min_score"]))

    all_signals: list[dict] = []

    for source in sources:
        if source == "hackernews":
            signals = hackernews.fetch(min_score=min_score, max_signals=max_signals)
        elif source in RSS_SOURCES:
            signals = rss.fetch(source_name=source, max_signals=max_signals)
        else:
            log.warning("Unknown source '%s' – skipping", source)
            continue
        all_signals.extend(signals)

    # De-duplicate by URL
    seen_urls: set[str] = set()
    unique_signals: list[dict] = []
    for sig in all_signals:
        if sig["url"] not in seen_urls:
            seen_urls.add(sig["url"])
            unique_signals.append(sig)

    # Cap at max_signals total
    unique_signals = unique_signals[:max_signals]

    output = {
        "signals": unique_signals,
        "metadata": {
            "run_at": datetime.now(timezone.utc).isoformat(),
            "sources_used": sources,
            "total_fetched": len(unique_signals),
        },
    }

    log.info(
        "SignalScout done: %d signals collected from %s",
        len(unique_signals),
        sources,
    )
    return output


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        description="SignalScout – collect market/tech signals"
    )
    parser.add_argument(
        "--config",
        default=None,
        help="Path to JSON config file (overrides defaults)",
    )
    parser.add_argument(
        "--out",
        default="out/signal_scout_output.json",
        help="Path to write output JSON (default: out/signal_scout_output.json)",
    )
    parser.add_argument(
        "--sources",
        nargs="+",
        help="Space-separated list of sources to use",
    )
    parser.add_argument(
        "--max-signals",
        type=int,
        default=None,
        help="Maximum number of signals to collect",
    )
    parser.add_argument(
        "--min-score",
        type=int,
        default=None,
        help="Minimum HN score to include",
    )
    args = parser.parse_args(argv)

    # Build config: start with defaults, overlay file config, overlay CLI flags
    config = dict(DEFAULT_CONFIG)
    if args.config:
        try:
            with open(args.config, encoding="utf-8") as fh:
                file_config = json.load(fh)
            config.update(file_config)
        except Exception as exc:
            log.error("Failed to load config file '%s': %s", args.config, exc)
            sys.exit(1)

    if args.sources:
        config["sources"] = args.sources
    if args.max_signals is not None:
        config["max_signals"] = args.max_signals
    if args.min_score is not None:
        config["min_score"] = args.min_score

    try:
        validate(config, "signal_scout_input.json")
    except Exception as exc:
        log.error("Input validation failed: %s", exc)
        sys.exit(1)

    output = run(config)

    try:
        validate(output, "signal_scout_output.json")
    except Exception as exc:
        log.warning("Output validation warning: %s", exc)

    save_json(output, args.out)
    log.info("Output written to %s", args.out)


if __name__ == "__main__":
    main()
