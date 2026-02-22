"""Unit tests for IdeaRanker bot."""
from __future__ import annotations

import json
from pathlib import Path

import jsonschema
import pytest

from bots.idea_ranker.main import run
from bots.idea_ranker.ranker import (
    _keyword_score,
    _recency_score,
    rank_signals,
    score_signal,
)

SCHEMA_PATH = Path(__file__).resolve().parents[3] / "schemas" / "idea_ranker_output.json"


def _load_schema() -> dict:
    with SCHEMA_PATH.open() as fh:
        return json.load(fh)


# Sample signals for testing
SAMPLE_SIGNALS = [
    {
        "id": "hn-1",
        "title": "Show HN: Open-source SaaS tool for developer productivity",
        "url": "https://example.com/a",
        "score": 500.0,
        "source": "hackernews",
        "tags": ["saas", "tool"],
        "comments": 120,
        "published_at": "2024-06-01T10:00:00Z",
    },
    {
        "id": "hn-2",
        "title": "Ask HN: What are you building?",
        "url": "https://example.com/b",
        "score": 50.0,
        "source": "hackernews",
        "tags": [],
        "comments": 200,
        "published_at": "2024-06-01T09:00:00Z",
    },
    {
        "id": "rss-1",
        "title": "New AI platform launches for analytics automation",
        "url": "https://example.com/c",
        "score": 300.0,
        "source": "rss:techcrunch",
        "tags": ["ai", "analytics"],
        "comments": 0,
        "published_at": "2024-06-01T08:00:00Z",
    },
]


# ---------------------------------------------------------------------------
# Scoring helpers
# ---------------------------------------------------------------------------

def test_keyword_score_with_saas_keywords():
    assert _keyword_score("Open-source SaaS tool for developer") > 0.0


def test_keyword_score_no_keywords():
    assert _keyword_score("Some random blog post about cooking") == 0.0


def test_keyword_score_caps_at_one():
    text = " ".join(["saas tool api platform sdk cli automation analytics integration plugin"])
    assert _keyword_score(text) <= 1.0


def test_recency_score_recent():
    from datetime import datetime, timedelta, timezone
    recent = (datetime.now(timezone.utc) - timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    assert _recency_score(recent) > 0.9


def test_recency_score_old():
    assert _recency_score("2020-01-01T00:00:00Z") < 0.1


def test_recency_score_empty():
    assert _recency_score("") == 0.5


# ---------------------------------------------------------------------------
# Ranking
# ---------------------------------------------------------------------------

def test_rank_signals_returns_correct_count():
    ideas = rank_signals(SAMPLE_SIGNALS, top_n=2)
    assert len(ideas) == 2


def test_rank_signals_sorted_by_score():
    ideas = rank_signals(SAMPLE_SIGNALS, top_n=3)
    scores = [i["score"] for i in ideas]
    assert scores == sorted(scores, reverse=True)


def test_rank_signals_rank_field():
    ideas = rank_signals(SAMPLE_SIGNALS, top_n=3)
    assert ideas[0]["rank"] == 1
    assert ideas[1]["rank"] == 2
    assert ideas[2]["rank"] == 3


def test_rank_signals_empty_input():
    ideas = rank_signals([], top_n=5)
    assert ideas == []


# ---------------------------------------------------------------------------
# Integration: run() validates against schema
# ---------------------------------------------------------------------------

VALID_INPUT = {
    "signals": SAMPLE_SIGNALS,
    "timestamp": "2024-06-01T10:00:00Z",
    "sources_used": ["hackernews"],
}


def test_run_output_validates_schema():
    output = run(input_data=VALID_INPUT, top_n=3)
    schema = _load_schema()
    jsonschema.validate(output, schema)


def test_run_output_structure():
    output = run(input_data=VALID_INPUT, top_n=2)
    assert "ideas" in output
    assert "timestamp" in output
    assert "total_signals_processed" in output
    assert output["total_signals_processed"] == len(SAMPLE_SIGNALS)
    assert len(output["ideas"]) == 2


def test_run_empty_signals():
    empty_input = {"signals": [], "timestamp": "2024-01-01T00:00:00Z", "sources_used": []}
    output = run(input_data=empty_input, top_n=5)
    assert output["ideas"] == []
    assert output["total_signals_processed"] == 0
