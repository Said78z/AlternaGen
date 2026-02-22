"""RSS feed sources for SignalScout.

Supported feeds (public, no auth required):
  - rss_techcrunch : TechCrunch latest articles
  - rss_producthunt: Product Hunt daily digest (unofficial RSS)
  - rss_indiehackers: Indie Hackers posts
"""
from __future__ import annotations

import urllib.request
import hashlib
import re
from datetime import datetime, timezone
from typing import Any
from xml.etree import ElementTree as ET

from bots.utils import get_logger

log = get_logger(__name__)

FEEDS: dict[str, str] = {
    "rss_techcrunch": "https://techcrunch.com/feed/",
    "rss_producthunt": "https://www.producthunt.com/feed",
    "rss_indiehackers": "https://www.indiehackers.com/feed.xml",
}


def _safe_text(el: ET.Element | None) -> str:
    if el is None:
        return ""
    return (el.text or "").strip()


def _parse_date(raw: str) -> str:
    """Try to parse an RSS date string to ISO-8601; fall back to now."""
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S%z",
    ):
        try:
            dt = datetime.strptime(raw.strip(), fmt)
            return dt.astimezone(timezone.utc).isoformat()
        except ValueError:
            continue
    return datetime.now(timezone.utc).isoformat()


def _strip_html(text: str) -> str:
    """Very simple HTML tag stripper."""
    return re.sub(r"<[^>]+>", "", text).strip()


def _get_xml(url: str, timeout: int = 15) -> ET.Element | None:
    """Fetch an RSS/Atom feed and return the root XML element."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "AlternaGen-SignalScout/1.0 (RSS reader)"},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310
            content = resp.read()
        return ET.fromstring(content)
    except Exception as exc:
        log.error("Failed to fetch RSS %s: %s", url, exc)
        return None


def fetch(source_name: str, max_signals: int = 30) -> list[dict]:
    """Fetch signals from *source_name* RSS feed.

    Returns a list of signal dicts conforming to the signal_scout_output schema.
    """
    url = FEEDS.get(source_name)
    if not url:
        log.error("Unknown RSS source: %s. Available: %s", source_name, list(FEEDS))
        return []

    log.info("Fetching RSS feed %s: %s", source_name, url)
    root = _get_xml(url)
    if root is None:
        return []

    # Handle both RSS (channel/item) and Atom (entry) feeds
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    items: list[Any] = (
        root.findall("channel/item")
        or root.findall("atom:entry", ns)
        or root.findall("entry")
    )

    signals: list[dict] = []
    def _first_found(el: ET.Element, *tags: object) -> ET.Element | None:
        """Return the first non-None result from el.find() calls."""
        for tag_args in tags:
            if isinstance(tag_args, tuple):
                found = el.find(*tag_args)
            else:
                found = el.find(tag_args)  # type: ignore[arg-type]
            if found is not None:
                return found
        return None

    for item in items[:max_signals]:
        title_el = _first_found(item, "title", ("atom:title", ns))
        link_el = _first_found(item, "link", ("atom:link", ns))
        date_el = _first_found(
            item,
            "pubDate",
            ("dc:date", {"dc": "http://purl.org/dc/elements/1.1/"}),
            ("atom:published", ns),
            "published",
            "updated",
        )

        title = _safe_text(title_el)
        if not title:
            continue

        # <link> can be text content OR href attribute (Atom)
        link = _safe_text(link_el)
        if not link and link_el is not None:
            link = link_el.get("href", "")

        if not link:
            continue

        raw_date = _safe_text(date_el)
        collected_at = _parse_date(raw_date) if raw_date else datetime.now(timezone.utc).isoformat()

        uid = hashlib.md5(link.encode()).hexdigest()[:12]  # noqa: S324 – non-crypto use

        signals.append(
            {
                "id": f"{source_name}-{uid}",
                "title": _strip_html(title),
                "url": link,
                "source": source_name,
                "score": 0,
                "comments": 0,
                "tags": [],
                "collected_at": collected_at,
            }
        )

    log.info("%s: collected %d signals", source_name, len(signals))
    return signals
