"""Unit tests for the IdeaRanker bot."""
from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from bots.idea_ranker.main import run, _normalize, _recency_score, DEFAULT_WEIGHTS


def _make_signal(idx: int = 0, score: int = 100, comments: int = 10, hours_old: float = 1.0) -> dict:
    collected_at = (datetime.now(timezone.utc) - timedelta(hours=hours_old)).isoformat()
    return {
        "id": f"sig-{idx}",
        "title": f"Signal {idx}",
        "url": f"https://example.com/{idx}",
        "source": "hackernews",
        "score": score,
        "comments": comments,
        "tags": [],
        "collected_at": collected_at,
    }


class TestNormalize:
    def test_all_same_values_returns_50(self):
        result = _normalize([5.0, 5.0, 5.0])
        assert all(v == 50.0 for v in result)

    def test_normalized_range_is_0_to_100(self):
        result = _normalize([0.0, 50.0, 100.0])
        assert result[0] == 0.0
        assert result[-1] == 100.0
        assert 0.0 <= result[1] <= 100.0

    def test_single_value(self):
        result = _normalize([42.0])
        assert result == [50.0]


class TestRecencyScore:
    def test_very_recent_scores_near_1(self):
        now = datetime.now(timezone.utc)
        recent = now.isoformat()
        score = _recency_score(recent, now)
        assert score > 0.99

    def test_24h_old_scores_lower(self):
        now = datetime.now(timezone.utc)
        old = (now - timedelta(hours=24)).isoformat()
        score = _recency_score(old, now)
        assert score < 0.2

    def test_invalid_date_returns_0_5(self):
        now = datetime.now(timezone.utc)
        score = _recency_score("not-a-date", now)
        assert score == 0.5


class TestIdeaRankerRun:
    def test_run_returns_correct_keys(self):
        signals = [_make_signal(i, score=100 + i * 10) for i in range(5)]
        output = run(signals, top_n=3)
        assert "ideas" in output
        assert "metadata" in output
        assert len(output["ideas"]) == 3

    def test_run_ranks_highest_first(self):
        """The signal with the highest composite score should be rank=1."""
        low = _make_signal(0, score=10, comments=1, hours_old=20)
        high = _make_signal(1, score=500, comments=200, hours_old=1)
        output = run([low, high], top_n=2)
        assert output["ideas"][0]["rank"] == 1
        assert output["ideas"][0]["id"] == "sig-1"

    def test_run_ranks_are_sequential(self):
        signals = [_make_signal(i, score=100 + i * 5) for i in range(5)]
        output = run(signals, top_n=5)
        ranks = [idea["rank"] for idea in output["ideas"]]
        assert ranks == sorted(ranks)
        assert ranks[0] == 1

    def test_run_top_n_limits_output(self):
        signals = [_make_signal(i) for i in range(10)]
        output = run(signals, top_n=3)
        assert len(output["ideas"]) == 3

    def test_run_top_n_larger_than_signals(self):
        signals = [_make_signal(i) for i in range(2)]
        output = run(signals, top_n=10)
        assert len(output["ideas"]) == 2

    def test_run_metadata_has_correct_keys(self):
        signals = [_make_signal(0)]
        output = run(signals, top_n=1)
        meta = output["metadata"]
        assert "run_at" in meta
        assert meta["total_input_signals"] == 1
        assert "weights_used" in meta

    def test_run_composite_score_within_range(self):
        signals = [_make_signal(i, score=100 + i) for i in range(5)]
        output = run(signals, top_n=5)
        for idea in output["ideas"]:
            assert 0.0 <= idea["composite_score"] <= 100.0

    def test_custom_weights_normalised(self):
        """Weights summing to > 1 should be normalised."""
        signals = [_make_signal(i) for i in range(3)]
        output = run(signals, top_n=3, weights={"score": 2, "comments": 2, "recency": 0})
        meta_weights = output["metadata"]["weights_used"]
        total = sum(meta_weights.values())
        assert abs(total - 1.0) < 1e-6

    def test_run_idea_has_rationale(self):
        signals = [_make_signal(0, score=300, comments=50)]
        output = run(signals, top_n=1)
        assert output["ideas"][0]["rationale"]
