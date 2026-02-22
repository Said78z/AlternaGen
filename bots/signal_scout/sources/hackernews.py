"""HackerNews Algolia API source.

Uses the **official** HN Search API (https://hn.algolia.com/api) – no scraping.
Endpoint: GET /api/v1/search?tags=story&numericFilters=points>=<min_score>
"""
from __future__ import annotations

import urllib.request
import urllib.parse
import json
from datetime import datetime, timezone
from typing import Any

from bots.utils import get_logger

ALGOLIA_BASE = "https://hn.algolia.com/api/v1/search"

log = get_logger(__name__)


def _get(url: str, timeout: int = 15) -> Any:
    """Simple HTTP GET, returns parsed JSON."""
    with urllib.request.urlopen(url, timeout=timeout) as resp:  # noqa: S310
        return json.loads(resp.read().decode())


def fetch(min_score: int = 50, max_signals: int = 30) -> list[dict]:
    """Fetch top HN stories with score >= *min_score*.

    Returns a list of signal dicts conforming to the signal_scout_output schema.
    """
    params = urllib.parse.urlencode(
        {
            "tags": "story",
            "numericFilters": f"points>={min_score}",
            "hitsPerPage": min(max_signals, 100),
        }
    )
    url = f"{ALGOLIA_BASE}?{params}"
    log.info("Fetching HackerNews signals: %s", url)

    try:
        data = _get(url)
    except Exception as exc:
        log.error("Failed to fetch HackerNews signals: %s", exc)
        return []

    signals: list[dict] = []
    for hit in data.get("hits", []):
        story_id = hit.get("objectID", "")
        title = hit.get("title") or hit.get("story_title") or ""
        story_url = hit.get("url") or f"https://news.ycombinator.com/item?id={story_id}"
        score = hit.get("points") or 0
        comments = hit.get("num_comments") or 0
        created_at = hit.get("created_at") or datetime.now(timezone.utc).isoformat()

        if not title:
            continue

        signals.append(
            {
                "id": f"hn-{story_id}",
                "title": title,
                "url": story_url,
                "source": "hackernews",
                "score": int(score),
                "comments": int(comments),
                "tags": _extract_tags(hit),
                "collected_at": created_at,
            }
        )

    log.info("HackerNews: collected %d signals", len(signals))
    return signals


def _extract_tags(hit: dict) -> list[str]:
    """Extract topic tags from a HN hit."""
    tags: list[str] = []
    for raw_tag in hit.get("_tags", []):
        if raw_tag.startswith("story_"):
            continue
        tags.append(raw_tag)
    return tags
