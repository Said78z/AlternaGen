"""Unit tests for SpecWriter bot."""
from __future__ import annotations

import json
from pathlib import Path

import jsonschema
import pytest

from bots.spec_writer.main import run
from bots.spec_writer.writer import _pick_stack, _template_spec, generate_spec

SCHEMA_PATH = Path(__file__).resolve().parents[3] / "schemas" / "spec_writer_output.json"


def _load_schema() -> dict:
    with SCHEMA_PATH.open() as fh:
        return json.load(fh)


SAMPLE_IDEA = {
    "rank": 1,
    "title": "Open-source SaaS tool for developer productivity",
    "score": 75.0,
    "rationale": "High community score; SaaS-relevant keywords: saas, tool.",
    "signals": [],
    "tags": ["saas", "tool"],
    "market_size": "medium",
    "complexity": "low",
}

VALID_INPUT = {
    "ideas": [SAMPLE_IDEA],
    "timestamp": "2024-06-01T10:00:00Z",
    "total_signals_processed": 10,
}


# ---------------------------------------------------------------------------
# Stack picker
# ---------------------------------------------------------------------------

def test_pick_stack_ai_keyword():
    stack = _pick_stack("AI-powered platform for analytics")
    assert "Python 3.11" in stack
    assert "OpenAI API" in stack


def test_pick_stack_cli_keyword():
    stack = _pick_stack("A CLI tool for git workflows")
    assert "Click" in stack


def test_pick_stack_default():
    stack = _pick_stack("Something completely different")
    assert "FastAPI" in stack


# ---------------------------------------------------------------------------
# Template spec
# ---------------------------------------------------------------------------

def test_template_spec_required_fields():
    spec = _template_spec(SAMPLE_IDEA)
    assert "title" in spec
    assert "description" in spec
    assert "features" in spec
    assert "tech_stack" in spec
    assert "mvp_scope" in spec
    assert isinstance(spec["features"], list)
    assert len(spec["features"]) > 0


def test_template_spec_feature_priorities():
    spec = _template_spec(SAMPLE_IDEA)
    valid_priorities = {"must-have", "should-have", "nice-to-have"}
    for feature in spec["features"]:
        assert feature["priority"] in valid_priorities


def test_generate_spec_without_api_key(monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    spec = generate_spec(SAMPLE_IDEA)
    assert "title" in spec
    assert spec["title"] == SAMPLE_IDEA["title"]


# ---------------------------------------------------------------------------
# Integration: run() validates against schema
# ---------------------------------------------------------------------------

def test_run_output_validates_schema():
    output = run(input_data=VALID_INPUT, idea_rank=1)
    schema = _load_schema()
    jsonschema.validate(output, schema)


def test_run_output_structure():
    output = run(input_data=VALID_INPUT)
    assert "spec" in output
    assert "timestamp" in output
    assert "source_idea" in output
    assert output["source_idea"]["rank"] == 1


def test_run_picks_correct_idea_rank():
    second_idea = {**SAMPLE_IDEA, "rank": 2, "title": "Second idea", "score": 50.0}
    multi_input = {**VALID_INPUT, "ideas": [SAMPLE_IDEA, second_idea]}
    output = run(input_data=multi_input, idea_rank=2)
    assert output["spec"]["title"] == "Second idea"


def test_run_raises_on_empty_ideas():
    empty_input = {"ideas": [], "timestamp": "2024-01-01T00:00:00Z", "total_signals_processed": 0}
    with pytest.raises(ValueError, match="No ideas"):
        run(input_data=empty_input)
