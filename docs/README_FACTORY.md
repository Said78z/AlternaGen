# AlternaGen SaaS Factory 🏭

A modular, bot-driven pipeline that automatically discovers trending tech/market signals, ranks MVP ideas, and generates structured specifications — with optional GitHub bootstrapping.

```
SignalScout → IdeaRanker → SpecWriter → RepoBootstrapper → MVPBuilder
                                                              ↓
                                               QAGuard → SecurityGuard
                                                              ↓
                                         WhiteLabelPackager → LaunchKit
```

Each bot has a stable JSON contract (input → output), is executable via CLI, and plugs into GitHub Actions.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Directory Structure](#directory-structure)
3. [Environment Variables](#environment-variables)
4. [Running Locally](#running-locally)
5. [End-to-End Example](#end-to-end-example)
6. [GitHub Actions](#github-actions)
7. [Adding a New Signal Source](#adding-a-new-signal-source)
8. [Adding a New Bot](#adding-a-new-bot)
9. [Bot Reference](#bot-reference)
10. [Security & Rate Limits](#security--rate-limits)

---

## Quick Start

```bash
# 1. Clone and enter the repo
git clone https://github.com/Said78z/AlternaGen.git
cd AlternaGen

# 2. Create a Python 3.11+ virtual environment
python3.11 -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate

# 3. Install dependencies
make install-dev                 # or: pip install -e ".[dev]"

# 4. Run the full pipeline
make run-pipeline
```

Output files will appear in `out/`.

---

## Directory Structure

```
AlternaGen/
├── bots/                        # All bot source code
│   ├── utils.py                 # Shared utilities (logging, JSON I/O, validation)
│   ├── signal_scout/            # Bot 1: Signal collection
│   │   ├── main.py
│   │   └── sources/
│   │       ├── hackernews.py    # HN Algolia API source
│   │       └── rss.py           # Generic RSS source
│   ├── idea_ranker/             # Bot 2: Idea ranking
│   ├── spec_writer/             # Bot 3: Spec generation
│   ├── repo_bootstrapper/       # Bot 4: GitHub repo scaffold [stub]
│   ├── mvp_builder/             # Bot 5: Code generation [stub]
│   ├── qa_guard/                # Bot 6: QA checks [stub]
│   ├── security_guard/          # Bot 7: Security scan [stub]
│   ├── white_label_packager/    # Bot 8: White-label packaging [stub]
│   └── launch_kit/              # Bot 9: Launch collateral [stub]
├── schemas/                     # JSON Schema files for IO validation
│   ├── signal_scout_input.json
│   ├── signal_scout_output.json
│   ├── idea_ranker_input.json
│   ├── idea_ranker_output.json
│   ├── spec_writer_input.json
│   ├── spec_writer_output.json
│   └── pipeline_stubs.json
├── templates/                   # Spec and issue templates
│   ├── spec_default.md
│   └── mvp_issue_template.md
├── docs/                        # Documentation
├── tests/                       # Unit tests
├── .github/workflows/
│   ├── daily.yml                # Daily: SignalScout → IdeaRanker → SpecWriter → Issue
│   └── build.yml                # Build: issue label → bootstrap branch + PR
├── Makefile
├── pyproject.toml
└── README.md
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | ✅ (Actions) | — | GitHub token for creating issues and PRs |
| `SIGNAL_SOURCES` | ❌ | `hackernews rss_techcrunch` | Space-separated list of sources |
| `MAX_SIGNALS` | ❌ | `30` | Max signals to collect per run |
| `MIN_SCORE` | ❌ | `50` | Minimum HN score for a signal to be included |
| `TOP_N` | ❌ | `5` | Number of top ideas to rank |
| `MAX_MVPS_PER_DAY` | ❌ | `1` | Safety limit (enforced via `concurrency` in Actions) |

No external API keys are required for the default sources. All sources use official public APIs/RSS.

---

## Running Locally

### Run the full pipeline at once

```bash
make run-pipeline
```

### Run individual bots

```bash
# Step 1 – Collect signals
make run-signal-scout

# Step 2 – Rank ideas
make run-idea-ranker

# Step 3 – Write spec
make run-spec-writer
```

### Override configuration

```bash
make run-pipeline SIGNAL_SOURCES="hackernews rss_indiehackers" MAX_SIGNALS=50 TOP_N=10
```

### Run via Python CLI directly

```bash
python -m bots.signal_scout.main \
  --sources hackernews rss_techcrunch \
  --max-signals 30 \
  --min-score 50 \
  --out out/signal_scout_output.json

python -m bots.idea_ranker.main \
  --in out/signal_scout_output.json \
  --top-n 5 \
  --out out/idea_ranker_output.json

python -m bots.spec_writer.main \
  --in out/idea_ranker_output.json \
  --out out/spec_writer_output.json
```

### Run tests

```bash
make test                # all tests
make test-cov            # with coverage
```

---

## End-to-End Example

Below is a complete example of running the discovery → spec pipeline:

```
$ make run-daily

python -m bots.signal_scout.main \
  --sources hackernews rss_techcrunch --max-signals 30 --min-score 50 ...

[INFO] bots.signal_scout: SignalScout done: 28 signals collected from ['hackernews', 'rss_techcrunch']

python -m bots.idea_ranker.main --in out/signal_scout_output.json --top-n 5 ...

[INFO] bots.idea_ranker: IdeaRanker done: ranked 28 ideas (top 5 returned)

python -m bots.spec_writer.main --in out/idea_ranker_output.json ...

[INFO] bots.spec_writer: SpecWriter done: spec_id=SPEC-20240101-HN-12345678
```

**Output spec (`out/spec_writer_output.json`):**

```json
{
  "spec": {
    "id": "SPEC-20240101-HN-12345678",
    "title": "MVP: Show HN: I built an AI tool that generates SaaS ideas",
    "problem": "Market signal detected: trending with 850 pts...",
    "solution": "Build a focused SaaS product that...",
    "target_users": ["Independent developers", "SaaS founders"],
    "core_features": [
      { "name": "Core MVP Feature", "description": "...", "priority": "P0" },
      { "name": "User Authentication", "description": "...", "priority": "P0" }
    ],
    "tech_stack": {
      "frontend": "Next.js + Tailwind CSS",
      "backend": "FastAPI (Python)",
      "database": "PostgreSQL",
      "infra": "Vercel + Railway"
    },
    "milestones": [...],
    "markdown": "# MVP Spec: ...\n\n## Problem Statement\n..."
  }
}
```

---

## GitHub Actions

### Daily pipeline (`daily.yml`)

Runs every day at 06:00 UTC. Executes `SignalScout → IdeaRanker → SpecWriter` and creates a GitHub issue labelled `mvp-idea`.

**Manual trigger** (GitHub UI → Actions → "Daily SaaS Factory Pipeline" → "Run workflow"):
- Override sources, max signals, etc.

### Build pipeline (`build.yml`)

Triggered when a human adds the label **`mvp-approved`** to a `mvp-idea` issue.

1. Extracts the spec ID from the issue body
2. Creates a bootstrap branch `bootstrap/mvp-issue-<N>`
3. Scaffolds `mvp/issue-<N>/` with a README
4. Opens a PR (NOT auto-merged — human review required)
5. Comments on the original issue with the PR link

**⚠️ Auto-merge is disabled by design.** A human must review and merge the PR.

### Required GitHub Settings

1. **Labels**: Create `mvp-idea`, `auto-generated`, `mvp-approved`, `mvp-bootstrap` labels in your repo (or let the workflow create them automatically via the fallback).
2. **Permissions**: The `GITHUB_TOKEN` needs `issues: write` and `pull-requests: write`.
3. **Branch protection**: Ensure `main` branch is protected to prevent unintended merges.

---

## Adding a New Signal Source

1. **Create the source file** at `bots/signal_scout/sources/<your_source>.py`:

```python
# bots/signal_scout/sources/my_source.py
from bots.utils import get_logger
log = get_logger(__name__)

def fetch(max_signals: int = 30) -> list[dict]:
    """Fetch signals from My Source.
    
    Must return dicts conforming to signal_scout_output.json signal items.
    """
    signals = []
    # ... your fetching logic using requests/urllib/RSS ...
    return signals
```

The required keys for each signal dict are:
```python
{
    "id": "mysource-unique-id",      # str, unique
    "title": "Article title",         # str, non-empty
    "url": "https://...",             # str, valid URI
    "source": "my_source",            # str, your source name
    "score": 0,                       # int >= 0
    "comments": 0,                    # int >= 0
    "tags": [],                       # list[str]
    "collected_at": "2024-...",       # ISO-8601 datetime
}
```

2. **Register the source** in `bots/signal_scout/main.py`:

```python
# In the run() function, add your source name to the if/elif chain:
elif source == "my_source":
    signals = my_source.fetch(max_signals=max_signals)
```

3. **Add the source name** to the allowed enum in `schemas/signal_scout_input.json`:

```json
"enum": ["hackernews", "rss_techcrunch", "rss_producthunt", "rss_indiehackers", "my_source"]
```

4. **Write a test** in `tests/test_signal_scout.py` following the existing pattern.

---

## Adding a New Bot

Each bot follows the same pattern: **JSON in → JSON out**, with a CLI entry point.

1. **Create the bot directory**:

```bash
mkdir -p bots/my_bot
```

2. **Create `bots/my_bot/__init__.py`** (empty or with docstring).

3. **Create `bots/my_bot/main.py`**:

```python
"""MyBot – short description.

Usage:
    python -m bots.my_bot.main --in input.json [--out out.json]
"""
import argparse, sys
from datetime import datetime, timezone
from bots.utils import get_logger, load_json, save_json, validate

log = get_logger("bots.my_bot")

def run(input_data: dict) -> dict:
    """Core bot logic. Returns output dict."""
    # ... your logic ...
    return {
        "result": "...",
        "metadata": {"run_at": datetime.now(timezone.utc).isoformat()},
    }

def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--in", dest="input", required=True)
    parser.add_argument("--out", default="out/my_bot_output.json")
    args = parser.parse_args(argv)
    
    data = load_json(args.input)
    output = run(data)
    save_json(output, args.out)

if __name__ == "__main__":
    main()
```

4. **Create JSON schemas** in `schemas/my_bot_input.json` and `schemas/my_bot_output.json`.

5. **Add to `Makefile`**:

```makefile
run-my-bot: $(OUT_DIR)/previous_bot_output.json
	$(PYTHON) -m bots.my_bot.main \
		--in $(OUT_DIR)/previous_bot_output.json \
		--out $(OUT_DIR)/my_bot_output.json
```

6. **Register as a CLI script** in `pyproject.toml`:

```toml
[project.scripts]
my-bot = "bots.my_bot.main:main"
```

7. **Write tests** in `tests/test_my_bot.py`.

8. **Add to the pipeline** in `run-pipeline` Make target.

---

## Bot Reference

| Bot | Status | Input | Output | Description |
|-----|--------|-------|--------|-------------|
| `signal_scout` | ✅ Full | config | signals list | Fetches trending signals from HN API + RSS |
| `idea_ranker` | ✅ Full | signals | ranked ideas | Scores ideas by engagement + recency |
| `spec_writer` | ✅ Full | top idea | MVP spec + markdown | Generates structured MVP specification |
| `repo_bootstrapper` | 🔧 Stub | spec | repo + PR URLs | Creates GitHub repo and bootstrap PR |
| `mvp_builder` | 🔧 Stub | spec | code artifacts | Generates project boilerplate |
| `qa_guard` | 🔧 Stub | artifacts | QA report | Runs automated tests |
| `security_guard` | 🔧 Stub | repo URL | security report | Scans for vulnerabilities |
| `white_label_packager` | 🔧 Stub | spec + brand | package URL | Packages for white-label distribution |
| `launch_kit` | 🔧 Stub | spec | landing + checklist | Generates launch collateral |

### Default Signal Sources

| Source ID | Type | URL | Auth |
|-----------|------|-----|------|
| `hackernews` | REST API | https://hn.algolia.com/api | None |
| `rss_techcrunch` | RSS | https://techcrunch.com/feed/ | None |
| `rss_producthunt` | RSS | https://www.producthunt.com/feed | None |
| `rss_indiehackers` | RSS | https://www.indiehackers.com/feed.xml | None |

---

## Security & Rate Limits

- **No aggressive scraping**: Only official APIs and public RSS feeds are used.
- **Rate limiting**: The HN Algolia API has a generous rate limit (10k requests/day for free). The daily pipeline makes 1 request.
- **1 MVP/day limit**: Enforced via GitHub Actions `concurrency: group: daily-pipeline` (configurable via `MAX_MVPS_PER_DAY`).
- **No auto-merge**: The build workflow creates a PR but requires human approval before merging.
- **Token security**: `GITHUB_TOKEN` is used with minimum required permissions per workflow.
