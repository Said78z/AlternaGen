"""Unit tests for the SpecWriter bot."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from bots.spec_writer.main import run, _slugify, _spec_id, _infer_tech_stack, _infer_target_users


def _make_idea(title: str = "SaaS tool for developers", tags: list | None = None) -> dict:
    return {
        "rank": 1,
        "id": "sig-abc123",
        "title": title,
        "url": "https://example.com/signal",
        "source": "hackernews",
        "composite_score": 78.5,
        "raw_score": 350,
        "raw_comments": 80,
        "tags": tags or ["show-hn", "developer-tools"],
        "rationale": "High engagement signal with broad developer interest.",
    }


class TestSlugify:
    def test_basic(self):
        assert _slugify("Hello World") == "hello-world"

    def test_special_chars(self):
        result = _slugify("AI/ML Tools #2024!")
        assert "/" not in result
        assert "#" not in result
        assert " " not in result

    def test_max_length(self):
        long = "a" * 100
        assert len(_slugify(long)) <= 50


class TestSpecId:
    def test_format(self):
        sid = _spec_id("abc123def456")
        assert sid.startswith("SPEC-")
        parts = sid.split("-")
        assert len(parts) == 3
        # date part should be 8 digits
        assert len(parts[1]) == 8
        assert parts[1].isdigit()


class TestInferTechStack:
    def test_default_stack(self):
        idea = _make_idea("Generic SaaS platform")
        stack = _infer_tech_stack(idea)
        assert "frontend" in stack
        assert "backend" in stack
        assert "database" in stack
        assert "infra" in stack

    def test_mobile_stack(self):
        idea = _make_idea("Mobile app for iOS", tags=["mobile", "ios"])
        stack = _infer_tech_stack(idea)
        assert "React Native" in stack["frontend"]

    def test_cli_stack(self):
        idea = _make_idea("CLI tool for devops", tags=["cli"])
        stack = _infer_tech_stack(idea)
        assert "CLI" in stack["frontend"] or "cli" in stack["frontend"].lower()


class TestInferTargetUsers:
    def test_returns_list(self):
        idea = _make_idea()
        users = _infer_target_users(idea)
        assert isinstance(users, list)
        assert len(users) >= 1

    def test_enterprise_keywords(self):
        idea = _make_idea("Enterprise B2B platform", tags=["enterprise", "b2b"])
        users = _infer_target_users(idea)
        assert any("B2B" in u or "team" in u.lower() or "engineer" in u.lower() or "CTO" in u for u in users)


class TestSpecWriterRun:
    def test_run_returns_correct_keys(self):
        idea = _make_idea()
        output = run(idea)
        assert "spec" in output
        assert "metadata" in output

    def test_spec_has_required_fields(self):
        idea = _make_idea()
        output = run(idea)
        spec = output["spec"]
        for key in ["id", "title", "problem", "solution", "target_users",
                    "core_features", "tech_stack", "milestones", "markdown"]:
            assert key in spec, f"Missing key: {key}"

    def test_spec_id_format(self):
        idea = _make_idea()
        output = run(idea)
        assert output["spec"]["id"].startswith("SPEC-")

    def test_markdown_contains_title(self):
        idea = _make_idea(title="Amazing Idea")
        output = run(idea)
        assert "Amazing Idea" in output["spec"]["markdown"]

    def test_markdown_contains_problem(self):
        idea = _make_idea()
        output = run(idea)
        assert output["spec"]["problem"]
        assert output["spec"]["problem"] in output["spec"]["markdown"]

    def test_core_features_have_priority(self):
        idea = _make_idea()
        output = run(idea)
        for feature in output["spec"]["core_features"]:
            assert feature["priority"] in ("P0", "P1", "P2")

    def test_milestones_not_empty(self):
        idea = _make_idea()
        output = run(idea)
        assert len(output["spec"]["milestones"]) >= 1

    def test_metadata_has_idea_id(self):
        idea = _make_idea()
        output = run(idea)
        assert output["metadata"]["idea_id"] == "sig-abc123"

    def test_template_recorded_in_metadata(self):
        idea = _make_idea()
        output = run(idea, template="custom_template")
        assert output["metadata"]["template_used"] == "custom_template"

    def test_extra_context_added_to_solution(self):
        idea = _make_idea()
        output = run(idea, extra_context="Focus on enterprise customers.")
        assert "enterprise customers" in output["spec"]["solution"]

    def test_signal_source_url_preserved(self):
        idea = _make_idea()
        output = run(idea)
        assert output["spec"]["signal_source_url"] == "https://example.com/signal"
