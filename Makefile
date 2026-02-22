.PHONY: help install run-pipeline run-pipeline-early run-signal-scout run-idea-ranker run-spec-writer test lint clean

PYTHON      ?= python3
OUT_DIR     ?= out
SOURCES     ?= hackernews,rss
LIMIT       ?= 20

help: ## Show this help message
	@echo "SaaS Factory — available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-28s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  Variables (override with make VAR=value):"
	@echo "    OUT_DIR   Output directory        (default: out)"
	@echo "    SOURCES   Signal sources          (default: hackernews,rss)"
	@echo "    LIMIT     Max signals per source  (default: 20)"

install: ## Install Python dependencies
	$(PYTHON) -m pip install -r requirements.txt

run-pipeline: ## Run the full 9-bot pipeline (SignalScout → LaunchKit)
	$(PYTHON) -m bots.pipeline \
		--phase full \
		--sources "$(SOURCES)" \
		--limit $(LIMIT) \
		--out-dir $(OUT_DIR)

run-pipeline-early: ## Run early pipeline only (SignalScout + IdeaRanker + SpecWriter)
	$(PYTHON) -m bots.pipeline \
		--phase early \
		--sources "$(SOURCES)" \
		--limit $(LIMIT) \
		--out-dir $(OUT_DIR) \
		--skip-limit-check

run-signal-scout: ## Run SignalScout bot only
	$(PYTHON) -m bots.signal_scout \
		--sources "$(SOURCES)" \
		--limit $(LIMIT) \
		--out $(OUT_DIR)/signal_scout.json

run-idea-ranker: ## Run IdeaRanker bot (requires $(OUT_DIR)/signal_scout.json)
	$(PYTHON) -m bots.idea_ranker \
		--in $(OUT_DIR)/signal_scout.json \
		--out $(OUT_DIR)/idea_ranker.json

run-spec-writer: ## Run SpecWriter bot (requires $(OUT_DIR)/idea_ranker.json)
	$(PYTHON) -m bots.spec_writer \
		--in $(OUT_DIR)/idea_ranker.json \
		--out $(OUT_DIR)/spec_writer.json

test: ## Run all bot unit tests
	$(PYTHON) -m pytest bots/ -v --tb=short

test-coverage: ## Run tests with coverage report
	$(PYTHON) -m pytest bots/ --cov=bots --cov-report=term-missing -v

lint: ## Lint all bot code with ruff (if installed) or flake8
	@if command -v ruff >/dev/null 2>&1; then \
		ruff check bots/ schemas/; \
	elif command -v flake8 >/dev/null 2>&1; then \
		flake8 bots/ --max-line-length=120; \
	else \
		echo "No linter found. Install ruff: pip install ruff"; \
	fi

clean: ## Remove generated output files
	rm -rf $(OUT_DIR)/
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	rm -f .saas_factory_state.json
