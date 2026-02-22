# AlternaGen

**AI-Powered Alternance Hunting Platform + SaaS Factory**

AlternaGen is a SaaS platform that helps students find apprenticeship opportunities (alternance) using AI agents. The platform combines automated job scraping, intelligent matching, and a browser extension for seamless job saving.

It also includes a **SaaS Factory** — a modular pipeline of bots that automatically scout trending signals, rank MVP ideas, write specs, and bootstrap repositories.

---

## 🏭 SaaS Factory

A pipeline of composable bots, each with a stable JSON I/O contract:

```
SignalScout → IdeaRanker → SpecWriter → RepoBootstrapper → MVPBuilder
→ QAGuard → SecurityGuard → WhiteLabelPackager → LaunchKit
```

### Quick Start (SaaS Factory)

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the early pipeline (SignalScout + IdeaRanker + SpecWriter)
make run-pipeline-early

# Run the full 9-bot pipeline
make run-pipeline

# Run individual bots
make run-signal-scout
make run-idea-ranker   # requires out/signal_scout.json
make run-spec-writer   # requires out/idea_ranker.json

# Run tests
make test
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key for richer SpecWriter output (optional) | — |
| `DAILY_MVP_LIMIT` | Max MVPs to generate per day | `1` |
| `GITHUB_TOKEN` | GitHub token for RepoBootstrapper + Actions | — |

### Bot I/O Contracts

Every bot follows the same pattern:

- **Input**: reads a JSON file from the previous bot (or no input for SignalScout)
- **Output**: writes a validated JSON file (validated against `/schemas/*.json`)
- **CLI**: `python -m bots.<bot_name> --in input.json --out output.json`

| Bot | Input schema | Output schema |
|---|---|---|
| `signal_scout` | — | `schemas/signal_scout_output.json` |
| `idea_ranker` | `schemas/signal_scout_output.json` | `schemas/idea_ranker_output.json` |
| `spec_writer` | `schemas/idea_ranker_output.json` | `schemas/spec_writer_output.json` |
| `repo_bootstrapper` | `schemas/spec_writer_output.json` | — |
| `mvp_builder` | spec_writer output | — |
| `qa_guard` | mvp_builder output | — |
| `security_guard` | qa_guard output | — |
| `white_label_packager` | security_guard output | — |
| `launch_kit` | white_label_packager output | — |

### Signal Sources

| Source ID | Description | API |
|---|---|---|
| `hackernews` | Top stories from HackerNews | [Firebase REST API](https://hacker-news.firebaseio.com/v0/) — no auth |
| `rss` | TechCrunch Startups + Dev.to feeds | Public RSS/Atom — no auth |

#### Adding a new source

1. Create `bots/signal_scout/sources/my_source.py`
2. Implement `fetch_signals(limit: int) -> list[dict]` — each dict must match the `signal_scout_output.json` signal item schema
3. Register it in `bots/signal_scout/main.py` inside `SOURCES_MAP`
4. Pass its ID via `--sources my_source` or in `SOURCES` env var

### Adding a new bot

1. Create `bots/<bot_name>/` with `__init__.py` and `main.py`
2. Implement `run(input_data: dict) -> dict` in `main.py`
3. Add a `main()` CLI entrypoint with `--in` / `--out` args
4. Add JSON schemas to `/schemas/` and validate I/O with `jsonschema`
5. Add unit tests in `bots/<bot_name>/tests/`
6. Wire it into `bots/pipeline.py` at the correct position
7. Add a `make run-<bot_name>` target to the `Makefile`

### GitHub Actions

| Workflow | Trigger | What it does |
|---|---|---|
| `daily-pipeline.yml` | Daily at 06:00 UTC + manual | Runs SignalScout→IdeaRanker→SpecWriter, creates a GitHub issue |
| `mvp-bootstrap.yml` | Issue labeled `mvp` | Creates a bootstrap branch + draft PR |

> **Note:** Auto-merge is **disabled** by design. The bootstrap PR is always opened as a draft and requires human review.

### Example: End-to-End Run

```bash
# 1. Collect signals from HackerNews and RSS
python -m bots.signal_scout --sources hackernews,rss --limit 20 --out out/signal_scout.json

# 2. Rank signals into MVP ideas
python -m bots.idea_ranker --in out/signal_scout.json --top 5 --out out/idea_ranker.json

# 3. Write a spec for the #1 idea
python -m bots.spec_writer --in out/idea_ranker.json --idea-rank 1 --out out/spec_writer.json

# View the spec
cat out/spec_writer.json | python -m json.tool
```

Or simply:

```bash
make run-pipeline-early   # runs all 3 above steps at once
```

---

## 🚀 Quick Start



### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/[YOUR_ORG]/altergen.git
   cd altergen
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001
   - API Health: http://localhost:3001/health

### Development Workflow

**Frontend Development**
```bash
cd web/kassy-kube
npm install
npm run dev     # Start dev server
npm run lint    # Run linter
npm run test    # Run tests
npm run build   # Build for production
```

**Backend Development**
```bash
cd api
npm install
npm run dev     # Start dev server with hot reload
npm run lint    # Run linter
npm run build   # Build TypeScript
npm run start   # Start production server
```

## 📁 Project Structure

```
altergen/
├── web/
│   └── kassy-kube/        # Frontend (Vite + React + TypeScript)
├── api/                     # Backend (Express + TypeScript)
├── infra/                   # Infrastructure as Code (Terraform)
├── docs/                    # Documentation
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docker-compose.yml      # Local development environment
└── README.md
```

## 🏗️ Architecture

- **Frontend**: Vite + React + TypeScript
- **Backend**: Express + TypeScript
- **Database**: PostgreSQL 15
- **Auth**: Clerk
- **AI**: OpenAI API
- **Scraping**: Apify
- **Deployment**: Docker + GitHub Actions + GHCR

## 🔧 Configuration

### Environment Variables

**API (.env)**
```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@db:5432/altergen
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3001
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## 🚢 Deployment

The project uses GitHub Actions for CI/CD. On push to `main`:
1. Lint and test all code
2. Build applications
3. Build and push Docker images to GHCR
4. Deploy to production (manual trigger)

## 📚 Documentation

- [API Documentation](./docs/api.md)
- [Frontend Guide](./docs/frontend.md)
- [Infrastructure Setup](./infra/README.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 🔐 Security

- Never commit `.env` files
- Use GitHub Secrets for CI/CD credentials
- Keep dependencies up to date
- Follow security best practices

## 📝 License

Private - All Rights Reserved

## 👥 Team

Built with ❤️ by the AlternaGen team
