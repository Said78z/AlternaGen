"""RSS feed source for SignalScout.

Fetches public RSS/Atom feeds from permitted sources (no scraping).
Default feeds: TechCrunch Startups, Product Hunt, Dev.to trending.
"""
from __future__ import annotations

import hashlib
import logging
from typing import Any

import feedparser

logger = logging.getLogger(__name__)

# Safe, publicly available RSS feeds — no authentication needed
DEFAULT_FEEDS = [
    {
        "id": "techcrunch_startups",
        "url": "https://techcrunch.com/category/startups/feed/",
        "label": "TechCrunch Startups",
    },
    {
        "id": "devto_trending",
        "url": "https://dev.to/feed",
        "label": "Dev.to",
    },
]


def _entry_to_signal(entry: Any, feed_id: str) -> dict[str, Any]:
    """Convert a feedparser entry to a signal dict."""
    title = getattr(entry, "title", "") or ""
    link = getattr(entry, "link", "") or ""
    published = getattr(entry, "published", "") or ""
    summary = getattr(entry, "summary", "") or ""

    # Derive a stable ID from the URL
    sig_id = f"rss-{feed_id}-{hashlib.sha256(link.encode()).hexdigest()[:8]}"

    # Extract tags from categories if present
    tags: list[str] = []
    for tag in getattr(entry, "tags", []):
        term = getattr(tag, "term", "")
        if term:
            tags.append(term.lower())

    return {
        "id": sig_id,
        "title": title,
        "url": link,
        "score": float(len(summary)),  # Use summary length as a proxy score
        "source": f"rss:{feed_id}",
        "tags": tags[:10],
        "comments": 0,
        "published_at": published,
    }


def fetch_signals(
    feeds: list[dict[str, Any]] | None = None,
    limit_per_feed: int = 10,
) -> list[dict[str, Any]]:
    """Fetch signals from RSS feeds.

    Args:
        feeds: List of feed dicts with 'id' and 'url' keys. Defaults to DEFAULT_FEEDS.
        limit_per_feed: Max entries to collect per feed.

    Returns:
        List of signal dicts compatible with the SignalScout output schema.
    """
    if feeds is None:
        feeds = DEFAULT_FEEDS

    signals: list[dict[str, Any]] = []
    for feed_cfg in feeds:
        feed_id = feed_cfg["id"]
        feed_url = feed_cfg["url"]
        logger.info("Fetching RSS feed: %s (%s)", feed_cfg.get("label", feed_id), feed_url)
        try:
            parsed = feedparser.parse(feed_url)
            entries = parsed.entries[:limit_per_feed]
            for entry in entries:
                signals.append(_entry_to_signal(entry, feed_id))
            logger.info("RSS %s: collected %d signals", feed_id, len(entries))
        except Exception as exc:
            logger.warning("Failed to fetch RSS feed %s: %s", feed_url, exc)

    return signals
