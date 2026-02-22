# AlternaGen SaaS Factory – Makefile
# Usage: make <target>
#
# Prerequisites: Python 3.11+, pip
#
# Configuration via environment variables:
#   SIGNAL_SOURCES   space-separated list, e.g. "hackernews rss_techcrunch"
#   MAX_SIGNALS      max signals to collect (default: 30)
#   MIN_SCORE        minimum HN score (default: 50)
#   TOP_N            number of top ideas to rank (default: 5)
#   MAX_MVPS_PER_DAY maximum MVPs to generate per day (default: 1)

PYTHON       ?= python3
PIP          ?= pip
OUT_DIR      ?= out
SIGNAL_SOURCES ?= hackernews rss_techcrunch
MAX_SIGNALS  ?= 30
MIN_SCORE    ?= 50
TOP_N        ?= 5
MAX_MVPS_PER_DAY ?= 1

.PHONY: all install install-dev test lint run-pipeline run-signal-scout \
        run-idea-ranker run-spec-writer clean help

## Default target
all: help

## Install production dependencies
install:
	$(PIP) install -e .

## Install all dependencies including dev/test
install-dev:
	$(PIP) install -e ".[dev]"

## Run all unit tests
test:
	$(PYTHON) -m pytest tests/ -v

## Run tests with coverage
test-cov:
	$(PYTHON) -m pytest tests/ -v --cov=bots --cov-report=term-missing

## ─── Individual bot targets ────────────────────────────────────────────────

## Step 1 – Collect signals
run-signal-scout:
	@mkdir -p $(OUT_DIR)
	$(PYTHON) -m bots.signal_scout.main \
		--sources $(SIGNAL_SOURCES) \
		--max-signals $(MAX_SIGNALS) \
		--min-score $(MIN_SCORE) \
		--out $(OUT_DIR)/signal_scout_output.json

## Step 2 – Rank ideas
run-idea-ranker: $(OUT_DIR)/signal_scout_output.json
	$(PYTHON) -m bots.idea_ranker.main \
		--in $(OUT_DIR)/signal_scout_output.json \
		--top-n $(TOP_N) \
		--out $(OUT_DIR)/idea_ranker_output.json

## Step 3 – Write spec
run-spec-writer: $(OUT_DIR)/idea_ranker_output.json
	$(PYTHON) -m bots.spec_writer.main \
		--in $(OUT_DIR)/idea_ranker_output.json \
		--out $(OUT_DIR)/spec_writer_output.json

## Step 4 – Bootstrap repo (stub)
run-repo-bootstrapper: $(OUT_DIR)/spec_writer_output.json
	$(PYTHON) -m bots.repo_bootstrapper.main \
		--in $(OUT_DIR)/spec_writer_output.json \
		--out $(OUT_DIR)/repo_bootstrapper_output.json

## Step 5 – Build MVP (stub)
run-mvp-builder: $(OUT_DIR)/spec_writer_output.json
	$(PYTHON) -m bots.mvp_builder.main \
		--in $(OUT_DIR)/spec_writer_output.json \
		--out $(OUT_DIR)/mvp_builder_output.json

## Step 6 – QA Guard (stub)
run-qa-guard: $(OUT_DIR)/mvp_builder_output.json
	$(PYTHON) -m bots.qa_guard.main \
		--in $(OUT_DIR)/mvp_builder_output.json \
		--out $(OUT_DIR)/qa_guard_output.json

## Step 7 – Security Guard (stub)
run-security-guard: $(OUT_DIR)/repo_bootstrapper_output.json
	$(PYTHON) -m bots.security_guard.main \
		--in $(OUT_DIR)/repo_bootstrapper_output.json \
		--out $(OUT_DIR)/security_guard_output.json

## Step 8 – White Label Packager (stub)
run-white-label-packager: $(OUT_DIR)/spec_writer_output.json
	$(PYTHON) -m bots.white_label_packager.main \
		--in $(OUT_DIR)/spec_writer_output.json \
		--out $(OUT_DIR)/white_label_packager_output.json

## Step 9 – Launch Kit (stub)
run-launch-kit: $(OUT_DIR)/spec_writer_output.json
	$(PYTHON) -m bots.launch_kit.main \
		--in $(OUT_DIR)/spec_writer_output.json \
		--out $(OUT_DIR)/launch_kit_output.json

## ─── Full pipeline (enforces MAX_MVPS_PER_DAY = 1 by default) ──────────────

## Run the full pipeline: SignalScout → IdeaRanker → SpecWriter → (stubs)
run-pipeline: run-signal-scout run-idea-ranker run-spec-writer \
              run-repo-bootstrapper run-mvp-builder run-qa-guard \
              run-security-guard run-white-label-packager run-launch-kit
	@echo "✅  Pipeline complete. Outputs in $(OUT_DIR)/"
	@echo "    → Spec:    $(OUT_DIR)/spec_writer_output.json"
	@echo "    → Repo PR: $(OUT_DIR)/repo_bootstrapper_output.json"

## Shortcut: only the discovery + spec (no stubs)
run-daily: run-signal-scout run-idea-ranker run-spec-writer
	@echo "✅  Daily pipeline complete."

## ─── Housekeeping ────────────────────────────────────────────────────────────

## Remove generated output files
clean:
	rm -rf $(OUT_DIR)/

## Show available targets
help:
	@echo ""
	@echo "AlternaGen SaaS Factory"
	@echo "========================"
	@echo ""
	@grep -E '^## ' Makefile | sed 's/^## /  /'
	@echo ""
