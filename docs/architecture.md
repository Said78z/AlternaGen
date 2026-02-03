# AlternaGen V1 - Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>React + TypeScript]
        EXT[Browser Extension<br/>Chrome]
    end

    subgraph "API Gateway"
        API[Express API<br/>TypeScript]
    end

    subgraph "Authentication"
        CLERK[Clerk Auth<br/>JWT Tokens]
    end

    subgraph "Business Logic"
        AUTH_SVC[Auth Service]
        USER_SVC[User Service]
        PROFILE_SVC[Profile Service]
        JOB_SVC[Job Service]
        APP_SVC[Application Service]
        MATCH_SVC[Matching Service<br/>OpenAI]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Users, Jobs, Applications)]
    end

    subgraph "External Services"
        OPENAI[OpenAI API<br/>Embeddings + GPT]
        STORAGE[File Storage<br/>CV Upload]
    end

    WEB -->|HTTPS| API
    EXT -->|HTTPS| API
    
    API -->|Validate Token| CLERK
    API --> AUTH_SVC
    API --> USER_SVC
    API --> PROFILE_SVC
    API --> JOB_SVC
    API --> APP_SVC
    API --> MATCH_SVC

    AUTH_SVC --> CLERK
    USER_SVC --> DB
    PROFILE_SVC --> DB
    PROFILE_SVC --> STORAGE
    JOB_SVC --> DB
    APP_SVC --> DB
    MATCH_SVC --> DB
    MATCH_SVC --> OPENAI

    style WEB fill:#3b82f6,color:#fff
    style EXT fill:#3b82f6,color:#fff
    style API fill:#10b981,color:#fff
    style CLERK fill:#8b5cf6,color:#fff
    style DB fill:#ef4444,color:#fff
    style OPENAI fill:#f59e0b,color:#fff
```

## Data Flow: Save Job from Extension

```mermaid
sequenceDiagram
    participant User
    participant Extension
    participant API
    participant Clerk
    participant JobService
    participant MatchService
    participant DB
    participant OpenAI

    User->>Extension: Click "Save Job"
    Extension->>Extension: Extract job data from page
    Extension->>API: POST /jobs (with auth token)
    API->>Clerk: Validate JWT token
    Clerk-->>API: Token valid, user_id
    API->>JobService: createJob(user_id, jobData)
    JobService->>DB: INSERT INTO jobs
    DB-->>JobService: job_id
    JobService->>MatchService: calculateMatch(user_id, job_id)
    MatchService->>DB: GET user profile
    DB-->>MatchService: profile data
    MatchService->>OpenAI: Generate embeddings
    OpenAI-->>MatchService: embeddings
    MatchService->>MatchService: Calculate similarity score
    MatchService->>DB: INSERT INTO match_scores
    MatchService-->>JobService: match_score
    JobService-->>API: job + match_score
    API-->>Extension: 201 Created
    Extension->>User: "Job saved! 85% match"
```

## Database Schema (Entity Relationship)

```mermaid
erDiagram
    USERS ||--o| PROFILES : has
    USERS ||--o{ JOBS : saves
    USERS ||--o{ APPLICATIONS : creates
    JOBS ||--o{ APPLICATIONS : "tracked in"
    USERS ||--o{ MATCH_SCORES : has
    JOBS ||--o{ MATCH_SCORES : "scored for"

    USERS {
        uuid id PK
        string clerk_id UK
        string email UK
        string first_name
        string last_name
        timestamp created_at
    }

    PROFILES {
        uuid id PK
        uuid user_id FK
        string education_level
        string field_of_study
        text[] skills
        text[] preferred_locations
        string cv_url
        text bio
    }

    JOBS {
        uuid id PK
        uuid user_id FK
        string title
        string company
        string location
        text description
        string url UK
        string source
        timestamp saved_at
    }

    APPLICATIONS {
        uuid id PK
        uuid user_id FK
        uuid job_id FK
        string status
        text notes
        timestamp applied_at
    }

    MATCH_SCORES {
        uuid id PK
        uuid user_id FK
        uuid job_id FK
        integer score
        text explanation
        timestamp calculated_at
    }
```

## Component Architecture (Frontend)

```
web/kassy-kube/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── dashboard/
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobList.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── profile/
│   │   │   ├── ProfileForm.tsx
│   │   │   └── CVUpload.tsx
│   │   ├── jobs/
│   │   │   ├── JobDetail.tsx
│   │   │   └── MatchScore.tsx
│   │   └── applications/
│   │       ├── KanbanBoard.tsx
│   │       └── ApplicationCard.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── JobDetail.tsx
│   │   └── Applications.tsx
│   ├── services/
│   │   ├── api.ts          # Axios instance
│   │   ├── auth.ts         # Clerk integration
│   │   ├── jobs.ts         # Job API calls
│   │   └── profiles.ts     # Profile API calls
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useJobs.ts
│   │   └── useProfile.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── job.ts
│   │   └── application.ts
│   └── utils/
│       ├── formatters.ts
│       └── validators.ts
```

## Component Architecture (Backend)

```
api/
├── src/
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── profiles.routes.ts
│   │   ├── jobs.routes.ts
│   │   ├── applications.routes.ts
│   │   └── match.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── profiles.controller.ts
│   │   ├── jobs.controller.ts
│   │   ├── applications.controller.ts
│   │   └── match.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── profile.service.ts
│   │   ├── job.service.ts
│   │   ├── application.service.ts
│   │   └── matching.service.ts
│   ├── models/
│   │   ├── user.model.ts
│   │   ├── profile.model.ts
│   │   ├── job.model.ts
│   │   ├── application.model.ts
│   │   └── matchScore.model.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── utils/
│   │   ├── database.ts
│   │   ├── logger.ts
│   │   └── validators.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
```

## Deployment Architecture (AWS)

```mermaid
graph TB
    subgraph "Users"
        BROWSER[Web Browser]
        CHROME[Chrome Extension]
    end

    subgraph "CDN & Load Balancing"
        CF[CloudFront<br/>Static Assets]
        ALB[Application Load Balancer]
    end

    subgraph "Compute (ECS Fargate)"
        WEB_TASK[Web Container<br/>Nginx + React]
        API_TASK[API Container<br/>Node.js + Express]
    end

    subgraph "Data & Storage"
        RDS[(RDS PostgreSQL<br/>Multi-AZ)]
        S3[S3 Bucket<br/>CV Files]
    end

    subgraph "External Services"
        CLERK_EXT[Clerk Auth]
        OPENAI_EXT[OpenAI API]
    end

    subgraph "Monitoring"
        CW[CloudWatch<br/>Logs + Metrics]
        SENTRY[Sentry<br/>Error Tracking]
    end

    BROWSER -->|HTTPS| CF
    CHROME -->|HTTPS| ALB
    CF --> WEB_TASK
    ALB --> API_TASK

    WEB_TASK --> API_TASK
    API_TASK --> RDS
    API_TASK --> S3
    API_TASK --> CLERK_EXT
    API_TASK --> OPENAI_EXT

    API_TASK --> CW
    API_TASK --> SENTRY
    WEB_TASK --> SENTRY

    style BROWSER fill:#3b82f6,color:#fff
    style CHROME fill:#3b82f6,color:#fff
    style CF fill:#f59e0b,color:#fff
    style ALB fill:#10b981,color:#fff
    style WEB_TASK fill:#8b5cf6,color:#fff
    style API_TASK fill:#8b5cf6,color:#fff
    style RDS fill:#ef4444,color:#fff
    style S3 fill:#f59e0b,color:#fff
```

## Security Architecture

```mermaid
graph LR
    subgraph "Client"
        USER[User]
    end

    subgraph "Auth Flow"
        LOGIN[Clerk Login]
        JWT[JWT Token]
    end

    subgraph "API Security"
        CORS[CORS Middleware]
        AUTH_MW[Auth Middleware]
        RATE[Rate Limiting]
        VALID[Input Validation]
    end

    subgraph "Data Security"
        ENCRYPT[Encryption at Rest]
        SSL[SSL/TLS in Transit]
        BACKUP[Automated Backups]
    end

    USER --> LOGIN
    LOGIN --> JWT
    JWT --> CORS
    CORS --> AUTH_MW
    AUTH_MW --> RATE
    RATE --> VALID
    VALID --> ENCRYPT
    ENCRYPT --> SSL
    SSL --> BACKUP

    style USER fill:#3b82f6,color:#fff
    style JWT fill:#10b981,color:#fff
    style AUTH_MW fill:#ef4444,color:#fff
    style ENCRYPT fill:#8b5cf6,color:#fff
```

## Matching Algorithm Flow

```mermaid
flowchart TD
    START[New Job Saved] --> GET_PROFILE[Get User Profile]
    GET_PROFILE --> EXTRACT[Extract Job Requirements]
    
    EXTRACT --> EMBED_PROFILE[Generate Profile Embedding<br/>OpenAI]
    EXTRACT --> EMBED_JOB[Generate Job Embedding<br/>OpenAI]
    
    EMBED_PROFILE --> SIMILARITY[Calculate Cosine Similarity]
    EMBED_JOB --> SIMILARITY
    
    SIMILARITY --> SCORE_CALC[Calculate Match Score<br/>0-100%]
    
    SCORE_CALC --> EXPLAIN{Score > 60%?}
    
    EXPLAIN -->|Yes| GPT_EXPLAIN[Generate Explanation<br/>GPT-4]
    EXPLAIN -->|No| SIMPLE_EXPLAIN[Simple Explanation]
    
    GPT_EXPLAIN --> SAVE[Save to match_scores]
    SIMPLE_EXPLAIN --> SAVE
    
    SAVE --> RETURN[Return Score + Explanation]
    
    style START fill:#10b981,color:#fff
    style SIMILARITY fill:#f59e0b,color:#fff
    style GPT_EXPLAIN fill:#8b5cf6,color:#fff
    style RETURN fill:#3b82f6,color:#fff
```

---

## Technology Stack Summary

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | React 19 + TypeScript | Type safety, modern hooks, fast |
| **Build Tool** | Vite | Lightning-fast HMR, modern |
| **Styling** | Tailwind CSS | Utility-first, rapid prototyping |
| **State** | React Query + Context | Server state + local state |
| **Backend** | Express + TypeScript | Mature, flexible, TypeScript support |
| **Database** | PostgreSQL 15 | Relational data, ACID, JSON support |
| **ORM** | Prisma | Type-safe, migrations, great DX |
| **Auth** | Clerk | Production-ready, webhooks, UI |
| **AI** | OpenAI API | Embeddings + GPT-4 for matching |
| **File Storage** | AWS S3 | Scalable, cheap, reliable |
| **Deployment** | Docker + ECS Fargate | Containerized, serverless compute |
| **CI/CD** | GitHub Actions | Free, integrated, flexible |
| **Monitoring** | CloudWatch + Sentry | Logs + error tracking |
| **Testing** | Vitest + Supertest | Fast, modern, TypeScript |

---

## API Rate Limits & Quotas

| Service | Limit | Cost Impact |
|---------|-------|-------------|
| **Clerk** | 10,000 MAU free | $0 until 10k users |
| **OpenAI** | Pay-per-use | ~$0.10 per match (embeddings + GPT) |
| **AWS RDS** | db.t3.micro | ~$15/month |
| **AWS ECS** | 2 tasks (256 CPU) | ~$30/month |
| **AWS S3** | 5GB storage | ~$0.12/month |

**Total Estimated Cost (500 users)**: ~$50-100/month

---

## Scalability Considerations

### Current Capacity (V1)
- **Users**: 10,000 MAU (Clerk free tier)
- **Requests**: ~100 req/s (single ECS task)
- **Database**: 20GB storage (RDS)
- **Files**: 5GB (S3)

### Scaling Strategy (V2+)
1. **Horizontal Scaling**: Add more ECS tasks (auto-scaling)
2. **Database**: Read replicas for analytics queries
3. **Caching**: Redis for frequently accessed data
4. **CDN**: CloudFront for static assets
5. **Queue**: SQS for async job processing (matching)

---

**Document Status**: ✅ Complete - Ready for Review

**Next**: Await founder validation before Phase 2 (Execution)
