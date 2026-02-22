"""Spec generation logic for the SpecWriter bot.

Uses template-based generation by default.
If OPENAI_API_KEY is set, it uses the OpenAI Chat API to produce richer specs.
"""
from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).resolve().parents[2] / "templates"

# Tech stack heuristics based on idea keywords
STACK_MAP = {
    "ai": ["Python 3.11", "FastAPI", "OpenAI API", "PostgreSQL", "Docker"],
    "api": ["Python 3.11", "FastAPI", "PostgreSQL", "Redis", "Docker"],
    "cli": ["Python 3.11", "Click", "SQLite"],
    "analytics": ["Python 3.11", "FastAPI", "PostgreSQL", "Chart.js", "Docker"],
    "extension": ["TypeScript", "React", "Chrome Extensions API"],
    "mobile": ["React Native", "Expo", "Node.js", "PostgreSQL"],
    "dashboard": ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
}

DEFAULT_STACK = ["Python 3.11", "FastAPI", "PostgreSQL", "React", "Docker"]


def _pick_stack(title: str) -> list[str]:
    title_lower = title.lower()
    for keyword, stack in STACK_MAP.items():
        if keyword in title_lower:
            return stack
    return DEFAULT_STACK


def _template_spec(idea: dict[str, Any]) -> dict[str, Any]:
    """Generate a spec using simple templates (no external API required)."""
    title = idea.get("title", "Untitled MVP")
    rationale = idea.get("rationale", "")
    tags = idea.get("tags", [])
    complexity = idea.get("complexity", "medium")

    stack = _pick_stack(title)

    features = [
        {
            "name": "Core functionality",
            "description": f"Implement the primary value proposition: {title}",
            "priority": "must-have",
        },
        {
            "name": "User authentication",
            "description": "Email/password + OAuth login (GitHub / Google)",
            "priority": "must-have",
        },
        {
            "name": "REST API",
            "description": "JSON REST API for all core operations",
            "priority": "must-have",
        },
        {
            "name": "Basic dashboard",
            "description": "Web UI to interact with the core feature",
            "priority": "should-have",
        },
        {
            "name": "Webhook / notifications",
            "description": "Notify users on key events via email or Slack",
            "priority": "nice-to-have",
        },
    ]

    complexity_desc = {"low": "1–2 weeks", "medium": "2–4 weeks", "high": "4–8 weeks"}.get(
        complexity, "2–4 weeks"
    )

    return {
        "title": title,
        "description": f"A SaaS MVP inspired by: {title}. {rationale}",
        "problem_statement": (
            f"Developers and indie hackers need a reliable solution for: {title}. "
            "Existing tools are either too complex, too expensive, or not focused enough."
        ),
        "target_audience": "Developers, indie hackers, and small teams",
        "features": features,
        "tech_stack": stack,
        "mvp_scope": (
            f"Build a minimal, shippable product in {complexity_desc} focusing on "
            "core functionality, auth, and a basic API. No enterprise features in v1."
        ),
        "monetization": "Freemium: free tier with usage limits, paid plans at $9/$29/$99/month",
        "success_metrics": [
            "100 sign-ups in the first month",
            "10 paying customers within 60 days",
            "< 500 ms median API response time",
            "Zero critical security issues",
        ],
    }


def _openai_spec(idea: dict[str, Any], api_key: str) -> dict[str, Any]:
    """Generate a spec using OpenAI Chat API (optional enrichment)."""
    try:
        import urllib.request  # stdlib only – avoid extra dependency at import time

        prompt = (
            f"Generate a concise MVP specification for the following SaaS idea in JSON.\n\n"
            f"Idea title: {idea.get('title')}\n"
            f"Rationale: {idea.get('rationale')}\n"
            f"Tags: {', '.join(idea.get('tags', []))}\n\n"
            "Return ONLY valid JSON matching this structure (no markdown fences):\n"
            '{"title":"...","description":"...","problem_statement":"...","target_audience":"...",'
            '"features":[{"name":"...","description":"...","priority":"must-have|should-have|nice-to-have"}],'
            '"tech_stack":["..."],"mvp_scope":"...","monetization":"...",'
            '"success_metrics":["..."]}'
        )

        payload = json.dumps({
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
        }).encode()

        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
            data = json.loads(resp.read())
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
    except Exception as exc:
        logger.warning("OpenAI spec generation failed (%s). Falling back to template.", exc)
        return _template_spec(idea)


def generate_spec(idea: dict[str, Any]) -> dict[str, Any]:
    """Generate a spec for the given idea.

    Uses OpenAI if OPENAI_API_KEY is set, otherwise uses templates.
    """
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if api_key:
        logger.info("Using OpenAI API to generate spec for: %s", idea.get("title"))
        return _openai_spec(idea, api_key)
    logger.info("Using template-based spec for: %s", idea.get("title"))
    return _template_spec(idea)
