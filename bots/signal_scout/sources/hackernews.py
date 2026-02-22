"""HackerNews API source for SignalScout.

Uses the official HN Firebase REST API (no auth, no scraping):
  https://hacker-news.firebaseio.com/v0/
"""
from __future__ import annotations

import datetime
import logging
import time
from typing import Any

import requests

logger = logging.getLogger(__name__)

HN_BASE = "https://hacker-news.firebaseio.com/v0"
TOP_STORIES_URL = f"{HN_BASE}/topstories.json"
ITEM_URL = f"{HN_BASE}/item/{{item_id}}.json"

TIMEOUT = 10  # seconds per request


def _fetch_item(session: requests.Session, item_id: int) -> dict[str, Any] | None:
    """Fetch a single HN item by ID."""
    try:
        resp = session.get(ITEM_URL.format(item_id=item_id), timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception as exc:
        logger.warning("Failed to fetch HN item %s: %s", item_id, exc)
        return None


def fetch_signals(limit: int = 20) -> list[dict[str, Any]]:
    """Fetch top HackerNews stories and return them as signals.

    Args:
        limit: Maximum number of stories to return.

    Returns:
        List of signal dicts compatible with the SignalScout output schema.
    """
    signals: list[dict[str, Any]] = []
    session = requests.Session()
    session.headers["User-Agent"] = "AlternaGen-SignalScout/1.0"

    try:
        resp = session.get(TOP_STORIES_URL, timeout=TIMEOUT)
        resp.raise_for_status()
        top_ids: list[int] = resp.json()
    except Exception as exc:
        logger.error("Failed to fetch HN top stories: %s", exc)
        return signals

    # Fetch item details up to the requested limit (with a small delay to be polite)
    for item_id in top_ids[:limit]:
        item = _fetch_item(session, item_id)
        if not item or item.get("type") != "story":
            continue
        signals.append({
            "id": f"hn-{item_id}",
            "title": item.get("title", ""),
            "url": item.get("url") or f"https://news.ycombinator.com/item?id={item_id}",
            "score": float(item.get("score", 0)),
            "source": "hackernews",
            "tags": [],
            "comments": int(item.get("descendants", 0)),
            "published_at": _unix_to_iso(item.get("time")),
        })
        time.sleep(0.05)  # ~50 ms courtesy delay

    logger.info("HackerNews: collected %d signals", len(signals))
    return signals


def _unix_to_iso(unix_ts: int | None) -> str:
    """Convert a Unix timestamp to an ISO 8601 string."""
    if unix_ts is None:
        return ""
    return datetime.datetime.fromtimestamp(unix_ts, tz=datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
