"""Unit tests for SignalScout bot."""
from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import jsonschema
import pytest

from bots.signal_scout.main import run
from bots.signal_scout.sources import hackernews, rss

SCHEMA_PATH = Path(__file__).resolve().parents[3] / "schemas" / "signal_scout_output.json"


def _load_schema() -> dict:
    with SCHEMA_PATH.open() as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# HackerNews source tests
# ---------------------------------------------------------------------------

SAMPLE_TOP_IDS = [1, 2, 3]
SAMPLE_ITEM = {
    "id": 1,
    "type": "story",
    "title": "Show HN: A new SaaS tool for developers",
    "url": "https://example.com/tool",
    "score": 250,
    "descendants": 42,
    "time": 1700000000,
}


def test_hackernews_fetch_signals_returns_list():
    """fetch_signals should return a list even when the API fails."""
    with patch("requests.Session.get") as mock_get:
        mock_get.side_effect = Exception("network error")
        result = hackernews.fetch_signals(limit=5)
    assert isinstance(result, list)


def test_hackernews_fetch_signals_happy_path():
    """fetch_signals should parse items correctly."""
    top_ids_response = MagicMock()
    top_ids_response.json.return_value = [1]
    top_ids_response.raise_for_status = MagicMock()

    item_response = MagicMock()
    item_response.json.return_value = SAMPLE_ITEM
    item_response.raise_for_status = MagicMock()

    with patch("requests.Session.get", side_effect=[top_ids_response, item_response]):
        result = hackernews.fetch_signals(limit=1)

    assert len(result) == 1
    assert result[0]["source"] == "hackernews"
    assert result[0]["title"] == SAMPLE_ITEM["title"]
    assert result[0]["score"] == float(SAMPLE_ITEM["score"])


# ---------------------------------------------------------------------------
# RSS source tests
# ---------------------------------------------------------------------------

def test_rss_fetch_signals_empty_feed():
    """fetch_signals should handle empty/failed feeds gracefully."""
    bad_feeds = [{"id": "test", "url": "http://localhost:9999/nonexistent", "label": "Test"}]
    result = rss.fetch_signals(feeds=bad_feeds, limit_per_feed=5)
    assert isinstance(result, list)


def test_rss_entry_to_signal():
    """_entry_to_signal should produce a valid signal dict."""
    entry = MagicMock()
    entry.title = "Great new SaaS product"
    entry.link = "https://example.com/saas"
    entry.published = "2024-01-01T00:00:00Z"
    entry.summary = "A" * 100
    entry.tags = []

    signal = rss._entry_to_signal(entry, feed_id="test_feed")

    assert signal["title"] == "Great new SaaS product"
    assert signal["url"] == "https://example.com/saas"
    assert signal["source"] == "rss:test_feed"
    assert isinstance(signal["score"], float)


# ---------------------------------------------------------------------------
# Integration: run() output validates against JSON schema
# ---------------------------------------------------------------------------

def test_run_output_validates_schema():
    """run() should produce output that validates against the JSON schema."""
    mock_signal = {
        "id": "hn-123",
        "title": "Test Signal",
        "url": "https://example.com",
        "score": 100.0,
        "source": "hackernews",
        "tags": [],
        "comments": 5,
        "published_at": "2024-01-01T00:00:00Z",
    }

    # Patch the entry in SOURCES_MAP directly (the dict holds bound references)
    with patch("bots.signal_scout.main.SOURCES_MAP", {"hackernews": lambda **kw: [mock_signal]}):
        output = run(sources=["hackernews"], limit=5)

    schema = _load_schema()
    jsonschema.validate(output, schema)

    assert "signals" in output
    assert "timestamp" in output
    assert "sources_used" in output
    assert output["signals"][0]["id"] == "hn-123"


def test_run_deduplicates_signals():
    """run() should deduplicate signals with the same URL."""
    dup_signal = {
        "id": "hn-1",
        "title": "Dup",
        "url": "https://same.com",
        "score": 10.0,
        "source": "hackernews",
        "tags": [],
        "comments": 0,
        "published_at": "",
    }
    rss_dup = {**dup_signal, "id": "rss-1", "source": "rss:test"}

    fake_map = {
        "hackernews": lambda **kw: [dup_signal],
        "rss": lambda **kw: [rss_dup],
    }
    with patch("bots.signal_scout.main.SOURCES_MAP", fake_map):
        output = run(sources=["hackernews", "rss"], limit=5)

    assert len(output["signals"]) == 1
