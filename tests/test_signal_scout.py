"""Unit tests for the SignalScout bot."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

# Ensure the repo root is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from bots.signal_scout.main import run, DEFAULT_CONFIG
from bots.signal_scout.sources import hackernews, rss


class TestSignalScoutRun:
    """Tests for signal_scout.main.run()"""

    def _make_signal(self, idx: int = 0) -> dict:
        from datetime import datetime, timezone
        return {
            "id": f"hn-{idx}",
            "title": f"Test Signal {idx}",
            "url": f"https://example.com/{idx}",
            "source": "hackernews",
            "score": 100 + idx,
            "comments": 10 + idx,
            "tags": ["show-hn"],
            "collected_at": datetime.now(timezone.utc).isoformat(),
        }

    def test_run_returns_correct_schema_keys(self):
        signals = [self._make_signal(i) for i in range(3)]
        with patch("bots.signal_scout.main.hackernews.fetch", return_value=signals):
            output = run({"sources": ["hackernews"], "max_signals": 10, "min_score": 0})

        assert "signals" in output
        assert "metadata" in output
        assert output["metadata"]["sources_used"] == ["hackernews"]
        assert output["metadata"]["total_fetched"] == 3

    def test_run_deduplicates_by_url(self):
        """Signals with the same URL should be deduplicated."""
        sig = self._make_signal(1)
        signals = [sig, sig.copy()]  # two identical URLs
        with patch("bots.signal_scout.main.hackernews.fetch", return_value=signals):
            output = run({"sources": ["hackernews"], "max_signals": 10, "min_score": 0})
        assert len(output["signals"]) == 1

    def test_run_caps_at_max_signals(self):
        signals = [self._make_signal(i) for i in range(20)]
        with patch("bots.signal_scout.main.hackernews.fetch", return_value=signals):
            output = run({"sources": ["hackernews"], "max_signals": 5, "min_score": 0})
        assert len(output["signals"]) <= 5

    def test_run_unknown_source_is_skipped(self):
        output = run({"sources": ["nonexistent_source"], "max_signals": 10, "min_score": 0})
        assert output["signals"] == []
        assert output["metadata"]["total_fetched"] == 0

    def test_run_multiple_sources(self):
        hn_signals = [self._make_signal(0)]
        rss_signals = [self._make_signal(1)]
        rss_signals[0]["source"] = "rss_techcrunch"
        rss_signals[0]["url"] = "https://techcrunch.com/article/1"
        rss_signals[0]["id"] = "rss-001"

        with (
            patch("bots.signal_scout.main.hackernews.fetch", return_value=hn_signals),
            patch("bots.signal_scout.main.rss.fetch", return_value=rss_signals),
        ):
            output = run({"sources": ["hackernews", "rss_techcrunch"], "max_signals": 10, "min_score": 0})

        assert len(output["signals"]) == 2


class TestHackerNewsSource:
    """Tests for signal_scout.sources.hackernews"""

    def _make_algolia_response(self, hits: list[dict]) -> bytes:
        return json.dumps({"hits": hits}).encode()

    def test_fetch_returns_list(self):
        fake_hits = [
            {
                "objectID": "12345",
                "title": "Show HN: A cool tool",
                "url": "https://example.com",
                "points": 200,
                "num_comments": 50,
                "created_at": "2024-01-01T10:00:00.000Z",
                "_tags": ["story", "show_hn"],
            }
        ]
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({"hits": fake_hits}).encode()
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)

        with patch("urllib.request.urlopen", return_value=mock_response):
            signals = hackernews.fetch(min_score=0, max_signals=10)

        assert len(signals) == 1
        assert signals[0]["id"] == "hn-12345"
        assert signals[0]["title"] == "Show HN: A cool tool"
        assert signals[0]["source"] == "hackernews"
        assert signals[0]["score"] == 200

    def test_fetch_skips_empty_title(self):
        fake_hits = [{"objectID": "1", "title": "", "url": "https://x.com", "points": 100, "num_comments": 5, "created_at": "2024-01-01T00:00:00Z", "_tags": []}]
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({"hits": fake_hits}).encode()
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)

        with patch("urllib.request.urlopen", return_value=mock_response):
            signals = hackernews.fetch(min_score=0, max_signals=10)

        assert signals == []

    def test_fetch_returns_empty_on_network_error(self):
        with patch("urllib.request.urlopen", side_effect=OSError("network down")):
            signals = hackernews.fetch(min_score=0, max_signals=10)
        assert signals == []


class TestRSSSource:
    """Tests for signal_scout.sources.rss"""

    _SAMPLE_RSS = b"""<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Article One</title>
      <link>https://example.com/article-1</link>
      <pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Article Two</title>
      <link>https://example.com/article-2</link>
      <pubDate>Tue, 02 Jan 2024 10:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>"""

    def test_fetch_parses_rss(self):
        mock_response = MagicMock()
        mock_response.read.return_value = self._SAMPLE_RSS
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)

        with patch("urllib.request.urlopen", return_value=mock_response):
            signals = rss.fetch("rss_techcrunch", max_signals=10)

        assert len(signals) == 2
        assert signals[0]["title"] == "Article One"
        assert signals[0]["source"] == "rss_techcrunch"
        assert signals[0]["url"] == "https://example.com/article-1"

    def test_fetch_unknown_source_returns_empty(self):
        signals = rss.fetch("not_a_real_source", max_signals=10)
        assert signals == []

    def test_fetch_returns_empty_on_network_error(self):
        with patch("urllib.request.urlopen", side_effect=OSError("network down")):
            signals = rss.fetch("rss_techcrunch", max_signals=10)
        assert signals == []
