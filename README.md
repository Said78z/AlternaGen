# AlternaGen

**AI-Powered Alternance Hunting Platform**

AlternaGen is a SaaS platform that helps students find apprenticeship opportunities (alternance) using AI agents. The platform combines automated job scraping, intelligent matching, and a browser extension for seamless job saving.

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

## 🎯 KassyKube — SMMA Content Generator Module

A SaaS module inside AlternaGen that generates **30 content ideas + scripts + hooks + CTAs** tailored to an SMMA agency, based on a questionnaire.

### Features

1. **Questionnaire** — Capture agency profile (niche, target audience, tone, etc.)
2. **AI Generation** — Generate exactly 30 TikTok/Reels content items via OpenAI
3. **Library** — Browse, filter, search, and edit generated content
4. **Calendar** — Schedule content items with a date and platform
5. **Repurpose** — Adapt TikTok content to Instagram Reels format
6. **CSV Export** — Download all or selected items as a CSV file
7. **Performance Tracking** — Enter metrics (views, likes, leads, revenue) and view a dashboard

### Running the SMMA Module Locally

#### Prerequisites
- Node.js 22+
- PostgreSQL 15+
- Clerk account (for auth)
- OpenAI API key

#### 1. Backend setup

```bash
cd api
cp .env.example .env
# Fill in DATABASE_URL, CLERK_SECRET_KEY, OPENAI_API_KEY

npm install
npx prisma generate
npx prisma migrate deploy   # or prisma migrate dev for local dev
npm run dev                 # starts on http://localhost:3001
```

#### 2. Frontend setup

```bash
cd web/kassy-kube
cp .env.example .env
# Fill in VITE_CLERK_PUBLISHABLE_KEY and VITE_API_URL

npm install                 # installs from workspace root
npm run dev                 # starts on http://localhost:3000
```

#### 3. Environment variables

**api/.env**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/altergen
CLERK_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk-proj-...
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**web/kassy-kube/.env**
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

#### 4. Available API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | /smma/questionnaire | Save agency profile |
| GET | /smma/questionnaire | Get agency profile |
| POST | /smma/generate | Generate 30 content items |
| GET | /smma/content | List content (filter/search) |
| GET | /smma/content/:id | Get single content item |
| PUT | /smma/content/:id | Update content item |
| POST | /smma/calendar | Create calendar event |
| GET | /smma/calendar | List calendar events |
| POST | /smma/content/:id/repurpose | Repurpose TikTok → Reels |
| GET | /smma/export | Download CSV |
| POST | /smma/content/:id/metrics | Save performance metrics |
| GET | /smma/metrics/dashboard | Aggregated metrics dashboard |

All routes require a Bearer token (Clerk JWT) in the Authorization header.

#### Language support (i18n)

The frontend supports **FR** and **EN**. The active language is stored in `localStorage` (key: `lang`) and toggled from the sidebar. The `t(key)` function in `src/lib/i18n.ts` maps translation keys to strings in both languages.



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
