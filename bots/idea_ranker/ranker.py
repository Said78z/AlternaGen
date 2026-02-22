"""Ranking logic for the IdeaRanker bot.

Scores each signal based on:
- Source popularity (HN score, number of comments)
- SaaS-relevant keyword presence
- Recency
"""
from __future__ import annotations

import math
import re
from datetime import datetime, timezone
from typing import Any

# Keywords that suggest a SaaS/tool opportunity
SAAS_KEYWORDS = [
    "saas", "tool", "api", "platform", "sdk", "cli", "dashboard",
    "automation", "ai", "ml", "agent", "bot", "scraper", "analytics",
    "integration", "plugin", "extension", "service", "app", "startup",
    "developer", "devtools", "open source", "productivity", "workflow",
    "launch", "build", "ship", "product",
]

# Weights for scoring components
WEIGHT_POPULARITY = 0.4
WEIGHT_ENGAGEMENT = 0.2
WEIGHT_KEYWORDS = 0.3
WEIGHT_RECENCY = 0.1

MAX_SCORE = 100.0


def _keyword_score(text: str) -> float:
    """Return a 0-1 score based on SAAS_KEYWORDS found in the text."""
    text_lower = text.lower()
    hits = sum(1 for kw in SAAS_KEYWORDS if kw in text_lower)
    return min(hits / 5.0, 1.0)  # cap at 5 keyword hits


def _recency_score(published_at: str) -> float:
    """Return a 0-1 score based on how recent the signal is (decay over 7 days)."""
    if not published_at:
        return 0.5  # neutral if unknown
    try:
        # Handle both "Z" suffix and naive datetimes
        dt_str = published_at.replace("Z", "+00:00")
        pub = datetime.fromisoformat(dt_str)
        now = datetime.now(timezone.utc)
        if pub.tzinfo is None:
            pub = pub.replace(tzinfo=timezone.utc)
        age_hours = max((now - pub).total_seconds() / 3600, 0)
        # Exponential decay: half-life of 48 hours
        return math.exp(-age_hours / 48.0)
    except Exception:
        return 0.5


def score_signal(signal: dict[str, Any]) -> float:
    """Compute a 0-100 composite score for a signal."""
    raw_score = float(signal.get("score", 0))
    comments = int(signal.get("comments", 0))
    title = signal.get("title", "")
    published_at = signal.get("published_at", "")

    # Normalise raw_score (HN top stories go up to ~3000, RSS length ~2000)
    norm_popularity = min(raw_score / 1000.0, 1.0)
    norm_engagement = min(comments / 200.0, 1.0)
    kw_score = _keyword_score(title)
    rec_score = _recency_score(published_at)

    composite = (
        WEIGHT_POPULARITY * norm_popularity
        + WEIGHT_ENGAGEMENT * norm_engagement
        + WEIGHT_KEYWORDS * kw_score
        + WEIGHT_RECENCY * rec_score
    )
    return round(composite * MAX_SCORE, 2)


def _build_rationale(signal: dict[str, Any], composite: float) -> str:
    """Generate a human-readable rationale string."""
    parts = []
    if signal.get("score", 0) > 200:
        parts.append(f"high community score ({int(signal['score'])})")
    if signal.get("comments", 0) > 50:
        parts.append(f"active discussion ({signal['comments']} comments)")
    kw_hits = [kw for kw in SAAS_KEYWORDS if kw in signal.get("title", "").lower()]
    if kw_hits:
        parts.append(f"SaaS-relevant keywords: {', '.join(kw_hits[:3])}")
    if not parts:
        parts.append("trending signal with moderate engagement")
    return "; ".join(parts).capitalize() + "."


def _estimate_complexity(title: str) -> str:
    high_kw = ["ai", "ml", "agent", "platform", "infrastructure"]
    low_kw = ["tool", "cli", "plugin", "extension", "script", "bot"]
    title_lower = title.lower()
    if any(kw in title_lower for kw in high_kw):
        return "high"
    if any(kw in title_lower for kw in low_kw):
        return "low"
    return "medium"


def rank_signals(signals: list[dict[str, Any]], top_n: int = 5) -> list[dict[str, Any]]:
    """Rank signals and return the top N as idea dicts.

    Args:
        signals: List of signal dicts from SignalScout.
        top_n: Number of top ideas to return.

    Returns:
        Ranked list of idea dicts.
    """
    scored = [(score_signal(s), s) for s in signals]
    scored.sort(key=lambda x: x[0], reverse=True)

    ideas: list[dict[str, Any]] = []
    for rank, (composite, signal) in enumerate(scored[:top_n], start=1):
        title = signal.get("title", "Untitled idea")
        ideas.append({
            "rank": rank,
            "title": title,
            "score": composite,
            "rationale": _build_rationale(signal, composite),
            "signals": [signal],
            "tags": signal.get("tags", []),
            "market_size": "unknown",
            "complexity": _estimate_complexity(title),
        })

    return ideas
