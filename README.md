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

CC0-1.0 — do whatever you want (including commercial use).  
This explicitly allows use by AI tools (including GitHub Copilot) and redistribution of generated derivatives.

## 👥 Team

Built with ❤️ by the AlternaGen team
