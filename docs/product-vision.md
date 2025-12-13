# AlternaGen - Product Vision V1

**Version**: 1.0  
**Date**: December 2025  
**Status**: Vision Phase - Awaiting Validation

---

## 🎯 Executive Summary

**AlternaGen** is an AI-powered SaaS platform that transforms the alternance (apprenticeship) hunting experience for Gen Z students in France. We solve the overwhelming, time-consuming, and often discouraging process of finding quality apprenticeship opportunities by providing intelligent automation, personalized matching, and seamless application tracking.

**Mission**: Empower every student to find their perfect alternance without the stress.

---

## 💔 The Problem

### User Pain Points (Gen Z Students)

1. **Information Overload**
   - Hundreds of job boards (LinkedIn, Indeed, Welcome to the Jungle, HelloWork, etc.)
   - Fragmented information across platforms
   - No centralized view of opportunities

2. **Time-Consuming Process**
   - Manual searching across multiple sites
   - Copy-pasting applications
   - Tracking applications in spreadsheets or notes
   - Average: 3-5 hours/week just searching

3. **Low Success Rate**
   - Generic applications don't stand out
   - Missing opportunities due to poor timing
   - No feedback on why applications fail
   - Demotivation after repeated rejections

4. **Lack of Guidance**
   - Unclear which companies match their profile
   - No AI-powered recommendations
   - Limited insights on market trends

### Market Context

- **Target**: 700,000+ students in alternance programs in France
- **Growth**: +8% yearly increase in alternance contracts
- **Competition**: Fragmented (job boards, career services, manual processes)
- **Opportunity**: No dominant AI-first solution for this specific market

---

## ✨ The Solution

### Value Proposition

> **"Your AI-powered alternance hunting assistant that finds, matches, and tracks opportunities - so you can focus on landing your dream role."**

### Core Features (V1 MVP)

#### 1. **Smart Job Discovery**
- Browser extension to save jobs with one click
- Auto-extraction of job details (title, company, location, description)
- Centralized dashboard of all saved opportunities

#### 2. **Intelligent Profile Matching**
- User profile with skills, preferences, and goals
- AI-powered compatibility scoring for each job
- Personalized recommendations based on profile

#### 3. **Application Tracking**
- Kanban-style pipeline (Saved → Applied → Interview → Offer)
- Status updates and notes
- Timeline view of application history

#### 4. **AI-Powered Insights**
- Match score explanation (why this job fits)
- Application tips based on job requirements
- Market insights (trending skills, companies hiring)

---

## 👤 User Journey

### Primary Persona: **Léa, 21, Business School Student**

**Context**: Looking for a 1-year alternance in marketing (M1)

#### Current Journey (Without AlternaGen)
1. Opens 5+ job board tabs every morning
2. Manually searches "alternance marketing Paris"
3. Copy-pastes interesting offers to Excel
4. Loses track of where she applied
5. Misses deadlines, forgets follow-ups
6. Feels overwhelmed and demotivated

#### Future Journey (With AlternaGen)
1. **Discovery**: Browses LinkedIn, sees interesting offer
2. **Save**: Clicks AlternaGen extension → Job saved instantly
3. **Match**: Opens dashboard → Sees 85% match score with explanation
4. **Apply**: Clicks "Applied" → Moves to pipeline
5. **Track**: Gets reminder to follow up after 1 week
6. **Insights**: Receives AI tip: "Your profile matches 3 similar roles at Company X"

**Result**: 70% less time searching, 3x more organized, higher confidence

---

## 🎨 MVP Scope Definition

### ✅ MUST HAVE (V1 - Launch Blocker)

| Feature | Description | Priority |
|---------|-------------|----------|
| **User Authentication** | Secure signup/login with Clerk | P0 |
| **User Profile** | Skills, education, preferences, CV upload | P0 |
| **Browser Extension** | Save jobs from any site with one click | P0 |
| **Job Dashboard** | View all saved jobs in one place | P0 |
| **Basic Matching** | Simple compatibility score (0-100%) | P0 |
| **Application Tracking** | Kanban board (Saved/Applied/Interview/Offer/Rejected) | P0 |
| **Job Details View** | Full job info with company, description, requirements | P0 |

### 🟡 SHOULD HAVE (V1 - Nice to Have)

| Feature | Description | Priority |
|---------|-------------|----------|
| **AI Match Explanation** | Why this job matches your profile | P1 |
| **Search & Filters** | Filter by location, company, match score | P1 |
| **Application Notes** | Add notes to each application | P1 |
| **Email Notifications** | Weekly digest of new matches | P1 |
| **Mobile Responsive** | Works on mobile browsers | P1 |

### 🔵 LATER (V2+)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Automated Job Scraping** | Apify-powered daily job discovery | P2 |
| **AI Application Generator** | Auto-generate cover letters | P2 |
| **Company Insights** | Glassdoor-style company reviews | P2 |
| **Interview Prep** | AI-powered interview questions | P2 |
| **Referral Network** | Connect with students at target companies | P2 |
| **Analytics Dashboard** | Success rate, time-to-hire metrics | P2 |
| **Mobile App** | Native iOS/Android apps | P3 |

---

## 🏗️ V1 Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Web App (React)          Browser Extension (Chrome)        │
│  - Dashboard              - One-click save                   │
│  - Profile                - Job extraction                   │
│  - Job tracking           - Background sync                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (Express)                     │
├─────────────────────────────────────────────────────────────┤
│  /auth          - Clerk integration                          │
│  /users         - User CRUD                                  │
│  /profiles      - Profile management                         │
│  /jobs          - Job CRUD + matching                        │
│  /applications  - Application tracking                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  MatchingService    - AI scoring (OpenAI embeddings)        │
│  JobService         - Job management logic                   │
│  ProfileService     - Profile analysis                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                         │
│  - users                                                     │
│  - profiles                                                  │
│  - jobs                                                      │
│  - applications                                              │
│  - match_scores                                              │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Strategy

**Provider**: Clerk  
**Why**: Production-ready, handles edge cases, great DX

**Flow**:
1. User signs up via web app
2. Clerk creates user + session
3. Backend receives webhook → Creates user record in DB
4. Frontend stores Clerk token
5. All API calls include `Authorization: Bearer <token>`
6. Backend validates token with Clerk SDK

**Security**:
- JWT-based authentication
- Refresh tokens handled by Clerk
- CORS configured for web app + extension origins

---

## 📊 Data Model V1

### Core Entities

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  education_level VARCHAR(50), -- "Bac+3", "Bac+5", etc.
  field_of_study VARCHAR(100), -- "Marketing", "Computer Science"
  skills TEXT[], -- Array of skills
  preferred_locations TEXT[], -- ["Paris", "Lyon"]
  preferred_sectors TEXT[], -- ["Tech", "Finance"]
  cv_url VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

#### **jobs**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  requirements TEXT,
  url VARCHAR(500) UNIQUE,
  source VARCHAR(100), -- "LinkedIn", "Indeed", etc.
  saved_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_saved_at ON jobs(saved_at DESC);
```

#### **applications**
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'saved', -- saved, applied, interview, offer, rejected
  notes TEXT,
  applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

CREATE INDEX idx_applications_user_status ON applications(user_id, status);
```

#### **match_scores**
```sql
CREATE TABLE match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  explanation TEXT,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);
```

---

## 🔌 API Boundaries

### REST API Endpoints (V1)

#### **Authentication**
- `POST /auth/webhook` - Clerk webhook for user creation

#### **Users**
- `GET /users/me` - Get current user
- `PATCH /users/me` - Update current user

#### **Profiles**
- `GET /profiles/me` - Get current user's profile
- `POST /profiles/me` - Create profile
- `PATCH /profiles/me` - Update profile
- `POST /profiles/me/cv` - Upload CV (multipart)

#### **Jobs**
- `GET /jobs` - List user's saved jobs (paginated, filterable)
- `POST /jobs` - Save a new job (from extension)
- `GET /jobs/:id` - Get job details
- `DELETE /jobs/:id` - Delete a saved job

#### **Applications**
- `GET /applications` - List applications by status
- `POST /applications` - Create application (link job to user)
- `PATCH /applications/:id` - Update status/notes
- `DELETE /applications/:id` - Delete application

#### **Matching**
- `POST /match/calculate` - Calculate match score for a job
- `GET /match/recommendations` - Get top recommended jobs

### API Response Format

**Success**:
```json
{
  "success": true,
  "data": { ... }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format"
  }
}
```

---

## 🎨 UI/UX Principles

1. **Speed First**: Every action < 200ms perceived latency
2. **Mobile-First**: Responsive design from day 1
3. **Minimal Friction**: Max 3 clicks to any feature
4. **Visual Feedback**: Loading states, success/error messages
5. **Gen Z Aesthetic**: Modern, colorful, not corporate

### Key Screens (V1)

1. **Landing Page** - Value prop + CTA
2. **Signup/Login** - Clerk-powered
3. **Onboarding** - Profile creation wizard (3 steps)
4. **Dashboard** - Job cards with match scores
5. **Job Detail** - Full job info + actions
6. **Profile Settings** - Edit profile/preferences
7. **Application Board** - Kanban view

---

## 📈 Success Metrics (V1)

### Product KPIs

| Metric | Target (3 months) | Measurement |
|--------|-------------------|-------------|
| **Active Users** | 500 | Weekly active users |
| **Jobs Saved** | 5,000 | Total jobs in DB |
| **Profile Completion** | 70% | Users with full profile |
| **Extension Installs** | 300 | Chrome Web Store |
| **Avg. Match Score** | 65% | Mean score across all matches |
| **Application Conversion** | 30% | Saved → Applied rate |

### Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Response Time** | < 200ms (p95) | CloudWatch |
| **Uptime** | 99.5% | Pingdom |
| **Error Rate** | < 1% | Sentry |
| **Page Load Time** | < 2s | Lighthouse |

---

## 🚀 Go-to-Market Strategy

### Phase 1: Friends & Family (Week 1-2)
- 20 beta testers from network
- Manual onboarding + feedback sessions
- Iterate on UX based on feedback

### Phase 2: Campus Launch (Week 3-6)
- Partner with 2-3 business schools
- Student ambassador program
- LinkedIn + Instagram organic content

### Phase 3: Viral Loop (Week 7-12)
- Referral program (invite friends → unlock features)
- Success stories on social media
- Product Hunt launch

---

## 💰 Business Model (Future)

**V1**: Free (focus on growth)

**V2+**:
- **Freemium**: Free for 10 saved jobs, $9/month unlimited
- **Premium**: $19/month (AI cover letters, priority support)
- **Enterprise**: B2B2C via schools ($500/year per school)

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Low user adoption | High | Strong campus partnerships, referral program |
| AI matching inaccurate | Medium | Start with simple scoring, iterate with feedback |
| Extension breaks on sites | Medium | Graceful fallbacks, manual entry option |
| Competitor launches similar | Medium | Speed to market, focus on Gen Z UX |
| Data privacy concerns | High | GDPR compliance, transparent data usage |

---

## 🛠️ Technical Constraints

### Must Respect
1. **No Terraform Apply** without explicit approval
2. **Atomic Commits** with passing CI
3. **Test Coverage** > 70% for critical paths
4. **No Heavy Dependencies** without justification
5. **Backwards Compatibility** for API changes

### Technology Stack (Locked)
- Frontend: Vite + React + TypeScript
- Backend: Express + TypeScript
- Database: PostgreSQL 15
- Auth: Clerk
- AI: OpenAI API
- Deployment: Docker + AWS

---

## 📅 V1 Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Vision** (Current) | 1 week | This document + validation |
| **Core Backend** | 2 weeks | Auth, CRUD APIs, DB schema |
| **Core Frontend** | 2 weeks | Dashboard, profile, job views |
| **Extension V1** | 1 week | Job saving functionality |
| **AI Matching** | 1 week | Basic scoring algorithm |
| **Testing & Polish** | 1 week | Bug fixes, UX improvements |
| **Beta Launch** | - | Week 8 |

**Total**: 8 weeks to beta-ready V1

---

## ✅ Next Steps

### Immediate Actions (Pending Validation)

1. **Founder Review**: Validate vision, scope, and priorities
2. **Design Mockups**: Create Figma wireframes for key screens
3. **DB Schema Finalization**: Review and approve data model
4. **API Contract**: Finalize endpoint specifications
5. **Sprint Planning**: Break down Phase 2 into 2-week sprints

### Questions for Founder

1. Is the MVP scope aligned with your vision? Any must-haves missing?
2. Timeline: Is 8 weeks realistic, or should we cut scope?
3. Design: Do you have brand guidelines, or should I propose a design system?
4. Monetization: Should we plan for paid features in V1, or pure growth focus?
5. Partnerships: Any schools/organizations already in talks?

---

## 📝 Appendix

### Competitive Landscape

| Competitor | Strengths | Weaknesses | Our Advantage |
|------------|-----------|------------|---------------|
| **LinkedIn** | Huge network | Generic, not alternance-focused | Specialized for students |
| **Indeed** | Job volume | No tracking, no AI | Intelligent matching |
| **Welcome to the Jungle** | Great UX | Not student-focused | Gen Z-first design |
| **School Career Services** | Trusted | Manual, slow | Automated, fast |

### Technology Decisions

**Why Clerk over Auth0?**
- Better DX, faster integration
- Generous free tier (10k MAU)
- Built-in user management UI

**Why PostgreSQL over MongoDB?**
- Relational data (users ↔ jobs ↔ applications)
- Strong consistency guarantees
- Better for analytics queries

**Why OpenAI over custom ML?**
- Faster time to market
- No ML expertise required
- Good enough for V1 matching

---

**Document Status**: 🟡 Awaiting Founder Validation

**Next Review**: After Phase 1 approval → Move to Phase 2 (Execution)
