# MASTER BUILD SPEC — Hoshin Kanri OS

> Upload file nay vao Project Knowledge cua Claude de no hieu ngu canh va cau truc app.
> Last updated: 2026-04-10 (verified & updated)

---

## 1. Product Overview

**Hoshin Kanri OS** la mot SaaS web app giup SME Viet Nam **bien chien luoc thanh hanh dong do duoc trong 90 ngay**, su dung phuong phap Hoshin Kanri (Policy Deployment) ket hop AI.

**Target user**: CEO / Owner cua SME Viet Nam (1-200 nhan vien), cac nganh: Fitness, F&B, B2B Services, Retail, Education.

**Core value proposition**: Tu phan tich hien trang → SWOT → Pain Mapping → Vision → X-Matrix → KPI Tracking — tat ca duoc AI ho tro, viet bang tieng Viet, phu hop van hoa doanh nghiep Viet.

### Business Model
- **Free tier**: Day du tinh nang co ban
- **Pro tier**: Nang cao (chua implement)
- **Consulting upsell**: PQL (Product-Qualified Lead) engine tu dong detect khi org san sang cho tu van

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | **Next.js** (App Router) | 16.2.3 |
| Language | **TypeScript** | ^5 |
| UI | **React** | 19.2.4 |
| Styling | **Tailwind CSS** v4 + **shadcn/ui** | v4 / v4.2.0 |
| State Management | **Zustand** | ^5.0.12 |
| Backend/DB | **Supabase** (PostgreSQL + Auth + RLS) | ^2.103.0 |
| AI | **Anthropic Claude API** (@anthropic-ai/sdk) | ^0.86.1 |
| Analytics | **PostHog** (posthog-js) | ^1.365.5 |
| Hosting | **Vercel** | - |
| Notifications (planned) | **Zalo OA** | - |
| Design System | Neobrutalism / Swiss style | Custom |

### Key Libraries
- `@supabase/ssr` — SSR cookie management cho Supabase auth
- `react-markdown` — Render AI responses
- `sonner` — Toast notifications
- `next-themes` — Dark/light mode
- `lucide-react` — Icons
- `class-variance-authority` + `clsx` + `tailwind-merge` — Styling utilities

---

## 3. Project Structure

```
hoshin-kanri-os/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (ThemeProvider, PHProvider, AuthListener, Toaster)
│   ├── page.tsx                  # Landing page (public)
│   ├── globals.css               # Global styles
│   │
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx        # Magic link login (Supabase OTP)
│   │   └── auth/callback/route.ts # OAuth callback handler
│   │
│   ├── x-ray/                    # Public - Business X-Ray (lead gen tool)
│   │   ├── page.tsx
│   │   └── components/           # XRayForm, QuestionStep, XRayReport, EmailCaptureStep, XRayProgress
│   │
│   │
│   ├── x/[slug]/page.tsx         # Public - Shared X-Matrix view
│   │
│   ├── onboarding/
│   │   └── setup-org/page.tsx    # Org setup after first login
│   │
│   ├── dashboard/                # Protected - requires auth + org membership
│   │   ├── layout.tsx            # Dashboard shell (Sidebar + Header + auth guard)
│   │   ├── page.tsx              # Dashboard home (discovery checklist OR quick actions)
│   │   │
│   │   ├── discovery/            # Strategy Discovery Hub
│   │   │   ├── page.tsx          # Hub overview
│   │   │   ├── swot/             # SWOT Analysis module (3-phase AI-guided)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── coaching/     # Phase 1: AI coaching
│   │   │   │   ├── strategy/     # Strategy generation from SWOT
│   │   │   │   └── components/   # SwotContainer, Phase1-3, SwotResults, SwotHubClient
│   │   │   ├── pain-mapper/      # Pain → Goal Mapper
│   │   │   ├── vision-workshop/  # Vision Workshop (AI-assisted)
│   │   │   ├── synthesis/        # AI Strategy Synthesis (aggregate all discovery data)
│   │   │   ├── benchmark/        # KPI Benchmark Library
│   │   │   └── xray-history/     # X-Ray Assessment History
│   │   │       ├── page.tsx      # List past X-Ray assessments
│   │   │       └── [id]/page.tsx # View specific past assessment
│   │   │
│   │   ├── x-matrix/
│   │   │   └── new/page.tsx      # X-Matrix Wizard (5-step creation)
│   │   │
│   │   ├── kpi/                  # KPI Dashboard & Tracker
│   │   │   ├── page.tsx
│   │   │   └── components/       # KpiCard, KpiDashboardClient, KpiSparkline, KpiUpdateForm
│   │   │
│   │   ├── report/page.tsx       # Monthly Report (AI-generated)
│   │   │
│   │   └── settings/             # Org settings
│   │       ├── page.tsx
│   │       └── components/
│   │
│   └── api/                      # API Routes
│       ├── auth/dev-login/       # Dev-only login helper
│       ├── debug/                # Debug endpoint
│       ├── discovery/            # pain-mapper, synthesis, vision-draft, vision-save
│       ├── kpi/                  # entry, list
│       ├── pql/check/            # PQL signal detection
│       ├── report/monthly/       # AI monthly report generation
│       ├── settings/org/         # Org settings CRUD
│       ├── swot/                 # coaching, evidence, generate-queries, strategy, sync-xmatrix, synthesis
│       ├── x-matrix/             # create, prefill, share
│       └── x-ray/                # X-Ray
│           ├── score/            # X-Ray scoring (AI)
│           └── history/          # X-Ray assessment history
│
├── components/
│   ├── analytics/IdentifyUser.tsx    # PostHog user identification
│   ├── layout/
│   │   ├── header.tsx                # Top header bar
│   │   ├── sidebar.tsx               # Navigation sidebar (desktop + mobile sheet)
│   │   ├── bottom-nav.tsx            # Mobile bottom navigation
│   │   └── footer.tsx                # Footer component
│   ├── providers/
│   │   ├── auth-listener.tsx         # Supabase auth state listener
│   │   ├── posthog-provider.tsx      # PostHog provider
│   │   └── theme-provider.tsx        # next-themes provider
│   ├── swot/                         # SWOT-specific UI components
│   │   ├── AiCoachAvatar.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ExtendedSwotMatrix.tsx
│   │   ├── PhaseCard.tsx
│   │   └── SwotCell.tsx
│   ├── ui/                           # shadcn/ui components
│   │   ├── alert-dialog, avatar, badge, button, card, checkbox
│   │   ├── dropdown-menu, input, label, logo, radio-group
│   │   ├── select, separator, sheet, textarea
│   └── x-matrix/                     # X-Matrix Wizard components
│       ├── XMatrixWizard.tsx         # Main wizard orchestrator
│       ├── Step1Vision.tsx           # Vision & Year Goals
│       ├── Step2Hoshins.tsx          # Annual Hoshins (max 5)
│       ├── Step3Initiatives.tsx      # Initiatives per Hoshin
│       ├── Step4Kpis.tsx             # KPIs per Hoshin
│       ├── XMatrixReview.tsx         # Final review step
│       └── WizardProgress.tsx        # Step indicator
│
├── lib/
│   ├── utils.ts                      # cn() utility
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server Supabase client
│   │   └── types.ts                  # Auto-generated DB types
│   ├── ai/
│   │   └── swot-strategy.ts          # SWOT strategy AI logic
│   ├── analytics/
│   │   └── events.ts                 # PostHog event tracking functions
│   ├── discovery/
│   │   ├── types.ts                  # PainMapper, Vision, Benchmark, Synthesis types
│   │   ├── prompts.ts                # AI prompts for discovery
│   │   └── benchmark-data.ts         # Industry KPI benchmark data
│   ├── pql/
│   │   └── signals.ts                # PQL detection logic
│   ├── swot/
│   │   ├── types.ts                  # SWOT types (8M, Porter, PESTEL)
│   │   ├── frameworks.ts             # Framework definitions (8M, Porter 5 Forces, PESTEL)
│   │   ├── coaching-prompts.ts       # AI coaching prompts
│   │   ├── coaching-persistence.ts   # Persist coaching session state
│   │   ├── coaching-tracker.ts       # Track coaching progress
│   │   ├── swot-session-store.ts     # Zustand store for SWOT session
│   │   └── sync-to-xmatrix.ts        # Sync SWOT results to X-Matrix
│   ├── x-matrix/
│   │   ├── types.ts                  # X-Matrix data types + limits
│   │   └── utils.ts                  # X-Matrix utilities
│   └── x-ray/
│       ├── types.ts                  # X-Ray types
│       └── questions.ts              # X-Ray assessment questions
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # Core tables + indexes + triggers
│   │   ├── 002_rls_policies.sql      # Row Level Security policies
│   │   ├── 003_fix_step_completed_constraint.sql  # Expand discovery step_completed CHECK
│   │   ├── 004_xray_leads.sql        # xray_leads table (public lead capture)
│   │   └── 005_xray_results.sql      # xray_results table (org-linked history)
│   └── seed.sql                      # Seed data
│
├── middleware.ts                      # Supabase session refresh middleware
├── next.config.ts                     # Next.js config
├── vercel.json                        # Vercel deployment config
├── package.json
├── tsconfig.json
├── components.json                    # shadcn/ui config
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 4. Database Schema

**11 tables** trong Supabase PostgreSQL, tat ca co RLS (Row Level Security).

### Core Tables

#### `organizations`
- `id` (uuid PK), `name`, `industry`, `headcount` ('1-10'|'10-50'|'50-200'), `city`
- `plan_tier` ('free'|'pro'), `zalo_oa_token` (nullable)

#### `users`
- `id` (uuid PK, FK → auth.users), `email`, `full_name`, `zalo_user_id`

#### `org_members`
- `org_id` (FK → organizations), `user_id` (FK → users)
- `role` ('CEO'|'Manager'|'Member') — dung de phan quyen
- UNIQUE(org_id, user_id)

### Strategy Tables

#### `x_matrices`
- `org_id` (FK), `year`, `title`, `status` ('draft'|'active'|'archived')
- `vision_json` (JSONB) — chua toan bo X-Matrix data (vision, yearGoals, hoshins, initiatives, kpis)

#### `swot_analyses`
- `org_id` (FK), `quadrant` ('S'|'W'|'O'|'T'), `framework_source` (8M/Porter/PESTEL IDs)
- `statement`, `evidence_json` (JSONB array), `implication`

#### `discovery_sessions`
- `org_id` (FK), `user_id` (FK)
- `step_completed` ('x-ray'|'current_state'|'swot'|'swot_coaching'|'swot_evidence'|'swot_synthesis'|'pain_mapper'|'vision'|'synthesis'|'xray_history')
- `data_json` (JSONB) — luu data cua tung buoc discovery

### Operational Tables

#### `kpis`
- `org_id` (FK), `x_matrix_id` (FK nullable), `owner_user_id` (FK nullable)
- `name`, `unit`, `target_value`, `frequency` ('daily'|'weekly'|'monthly')
- `is_active`, `dept_level` ('company'|'dept')

#### `kpi_entries`
- `kpi_id` (FK), `user_id` (FK), `value`, `note`, `period_date`

#### `notification_logs`
- `org_id`, `user_id`, `type` ('zalo'|'email'|'in_app'), `status`, `payload`

### Lead Gen Tables

#### `xray_leads`
- `id` (uuid PK), `email`, `company_name`, `industry`, `headcount`
- `answers_json` (JSONB), `result_json` (JSONB)
- `overall_score`, `overall_level`, `converted` (boolean)

#### `xray_results`
- `id` (uuid PK), `org_id` (FK), `user_id` (FK)
- `overall_score`, `overall_level`
- `result_json` (JSONB), `answers_json` (JSONB)

### RLS Rules Summary
- **SELECT**: User chi thay data cua org minh (thong qua org_members)
- **INSERT x_matrices, swot**: Chi CEO
- **INSERT kpis**: CEO hoac Manager
- **INSERT kpi_entries**: Chi user do (user_id = auth.uid())
- **UPDATE org**: Chi CEO

---

## 5. Authentication

- **Method**: Magic Link (Supabase OTP via email)
- **Flow**: Enter email → Receive magic link → Click link → `/auth/callback` exchanges code for session
- **Middleware** (`middleware.ts`): Refreshes Supabase session cookies for `/dashboard/*`, `/onboarding/*`, `/login`
- **Auth Guard**: `dashboard/layout.tsx` checks `supabase.auth.getUser()` → redirect to `/login` if no user, redirect to `/onboarding/setup-org` if no org membership
- **Dev Login**: `/api/auth/dev-login` — development only helper

---

## 6. Core User Flows

### Flow A: Lead Generation (Public, No Auth)
```
Landing Page → Business X-Ray (5 dimensions, ~5 min)
  → Email capture → AI scores answers → X-Ray Report
  → CTA: "Dang nhap de tao X-Matrix"
```

**5 X-Ray Dimensions**: Strategy, Execution, People, Finance, Customer
Scoring levels: critical / weak / moderate / strong

### Flow B: Strategy Discovery (Auth Required)
```
Dashboard → Discovery Hub → 4 steps (any order):
  1. SWOT Analysis (3-phase AI-guided)
     - Phase 1: AI Coaching (conversational, asks about 8M/Porter/PESTEL)
     - Phase 2: Evidence Collection (AI-generated search queries → web evidence)
     - Phase 3: Synthesis (AI combines coaching + evidence → SWOT items)
  2. Pain → Goal Mapper (list pains → AI generates Hoshin candidates)
  3. Vision Workshop (guided questions → AI drafts vision + year goals)
  4. AI Strategy Synthesis (aggregates all discovery data → X-Matrix prefill)
```

### Flow C: X-Matrix Creation (Auth Required)
```
Discovery complete → X-Matrix Wizard (5 steps):
  Step 1: Vision & Year Goals (max 3 goals)
  Step 2: Annual Hoshins (max 5, AI-suggested or manual)
  Step 3: Initiatives per Hoshin (max 3 each, timeframe: 30d/60d/90d)
  Step 4: KPIs per Hoshin (max 2 each, assign owner)
  Step 5: Review & Save

Limits (Hoshin discipline):
  - MAX_YEAR_GOALS: 3
  - MAX_HOSHINS: 5
  - MAX_INITIATIVES_PER_HOSHIN: 3
  - MAX_KPIS_PER_HOSHIN: 2
```

### Flow D: KPI Tracking (Auth Required)
```
Dashboard → KPI Tracker
  → View KPI cards with sparkline charts
  → Add KPI entries (value + note + period_date)
  → Color coding: green (>=target), yellow (70-100% target), red (<70% target)
```

### Flow E: Monthly Report (Auth Required)
```
Dashboard → Monthly Report → AI generates report based on KPI data
```

### Flow F: Share X-Matrix (Public)
```
Dashboard → Share X-Matrix → generates slug → /x/[slug] (public page)
```

---

## 7. AI Integration

**Provider**: Anthropic Claude API (`@anthropic-ai/sdk`)

### AI-Powered Features

| Feature | API Route | What AI Does |
|---------|-----------|-------------|
| X-Ray Scoring | `/api/x-ray/score` | Scores 5 dimensions, generates executive summary |
| SWOT Coaching | `/api/swot/coaching` | Conversational coaching using 8M/Porter/PESTEL frameworks |
| Search Query Gen | `/api/swot/generate-queries` | Generates web search queries for evidence |
| SWOT Synthesis | `/api/swot/synthesis` | Combines CEO input + evidence → structured SWOT items |
| SWOT Strategy | `/api/swot/strategy` | Generates SO/ST/WO/WT strategies from SWOT |
| Pain Mapper | `/api/discovery/pain-mapper` | Converts pain points → Hoshin candidates with rationale |
| Vision Draft | `/api/discovery/vision-draft` | Generates vision statement + year goals from workshop answers |
| AI Synthesis | `/api/discovery/synthesis` | Aggregates all discovery data → X-Matrix prefill |
| X-Matrix Prefill | `/api/x-matrix/prefill` | Pre-fills wizard with AI-suggested data |
| Monthly Report | `/api/report/monthly` | AI-generated monthly performance report |

### Analysis Frameworks Used
- **Internal (Strengths/Weaknesses)**: 8M Model (Man, Machine, Material, Method, Measurement, Nature, Management, Money)
- **External (Opportunities/Threats)**: Porter's 5 Forces + PESTEL Analysis
- **Strategy Matrix**: SO/ST/WO/WT cross-analysis

---

## 8. Analytics & Growth

### PostHog Events
- **Activation**: `x_ray_completed`, `discovery_step_completed`, `x_matrix_completed`
- **Engagement**: `kpi_entry_added`, `kpi_dashboard_viewed`
- **Retention**: `monthly_report_generated`, `x_matrix_shared`
- **User Identity**: `identify` with orgId, orgName, role, industry

### PQL (Product-Qualified Lead) Engine
Located at `lib/pql/signals.ts`. Triggers when ALL 3 signals met:
1. **Active >= 3 weeks** (based on kpi_entries dates)
2. **>= 2 org members**
3. **>= 1 KPI red for 2+ consecutive weeks** (value < 70% target)

Output: PQL alert email to sales team for consulting upsell.

---

## 9. Design System

**Style**: Neobrutalism / Swiss Design hybrid

### Typography
- **Display font**: `Barlow Condensed` (headings, nav, labels)
- **Body font**: `Montserrat` (body text)
- Both loaded with Vietnamese subset

### Design Tokens (from CSS)
- Thick borders (`border-2`, `border-[3px]`, `border-ink`)
- Sharp corners (no border-radius by default)
- Bold shadows (`shadow-brutal-sm`, `shadow-brutal-md`)
- Warm background (`bg-bg-warm`, `bg-bg-muted-warm`)
- High contrast text (`text-ink`)
- Accent brand color (`accent-brand`)

### Component Patterns
- Sidebar: Fixed left, 240px, neobrutalist nav items with left border indicator
- Cards: Bold borders, no rounded corners
- Buttons: `btn-brutal` class with shadow + border
- Mobile: Sheet-based sidebar

---

## 10. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only

# Anthropic AI
ANTHROPIC_API_KEY=

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# App
NEXT_PUBLIC_APP_URL=                # e.g. https://hoshinkanri.vn
```

---

## 11. Key Conventions & Patterns

### Code Patterns
- **Server Components by default**, `'use client'` only when needed (interactivity, hooks)
- **API routes** use `createClient()` from `lib/supabase/server.ts` for auth
- **Client components** use `createClient()` from `lib/supabase/client.ts`
- **AI API routes**: Accept request body → call Anthropic API → return structured response
- **Zustand stores** for complex client-side state (SWOT session)
- **JSONB columns** for flexible/nested data (vision_json, evidence_json, data_json)

### Naming Conventions
- Files: kebab-case (`pain-mapper`, `vision-workshop`)
- Components: PascalCase (`KpiCard.tsx`, `SwotContainer.tsx`)
- API routes: `app/api/[domain]/[action]/route.ts`
- Types: Centralized in `lib/[domain]/types.ts`

### Language
- **UI text**: Vietnamese (tieng Viet)
- **Code/comments**: English
- **Variable names**: English

### Hoshin Kanri Discipline
The app enforces strict limits based on Hoshin Kanri methodology:
- Max 3 year goals (focus)
- Max 5 hoshins (strategic priorities)
- Max 3 initiatives per hoshin (actionable)
- Max 2 KPIs per hoshin (measurable)

---

## 12. Navigation Map

```
/                       → Landing page (public)
/login                  → Magic link login
/x-ray                  → Business X-Ray assessment (public, lead gen)
/x/[slug]               → Shared X-Matrix view (public)
/onboarding/setup-org   → Org setup (after first login)
/dashboard              → Dashboard home
/dashboard/discovery    → Discovery Hub
/dashboard/discovery/swot           → SWOT module
/dashboard/discovery/swot/coaching  → SWOT coaching sub-page
/dashboard/discovery/swot/strategy  → SWOT strategy sub-page
/dashboard/discovery/pain-mapper    → Pain Mapper
/dashboard/discovery/vision-workshop → Vision Workshop
/dashboard/discovery/synthesis      → AI Strategy Synthesis
/dashboard/discovery/benchmark      → KPI Benchmark Library
/dashboard/discovery/xray-history   → X-Ray Assessment History
/dashboard/discovery/xray-history/[id] → View past X-Ray assessment
/dashboard/x-matrix/new            → X-Matrix Wizard
/dashboard/kpi                      → KPI Dashboard
/dashboard/report                   → Monthly Report
/dashboard/settings                 → Org Settings
```

---

## 13. API Routes Map

```
POST /api/auth/dev-login              → Dev login helper
GET  /api/debug                       → Debug info

POST /api/x-ray/score                 → Score X-Ray answers with AI
GET  /api/x-ray/history               → Fetch X-Ray assessment history

POST /api/swot/coaching               → AI coaching conversation
POST /api/swot/generate-queries       → Generate evidence search queries
POST /api/swot/evidence               → Collect evidence
POST /api/swot/synthesis              → Synthesize SWOT items
POST /api/swot/strategy               → Generate strategies from SWOT
POST /api/swot/sync-xmatrix           → Sync SWOT to X-Matrix

POST /api/discovery/pain-mapper       → Pain → Hoshin candidates
POST /api/discovery/vision-draft      → AI vision draft
POST /api/discovery/vision-save       → Save vision
POST /api/discovery/synthesis         → Full AI synthesis

POST /api/x-matrix/create            → Save X-Matrix
POST /api/x-matrix/prefill           → AI prefill X-Matrix wizard
GET  /api/x-matrix/share?slug=xxx    → Get shared X-Matrix data

POST /api/kpi/entry                   → Add KPI entry
GET  /api/kpi/list                    → List KPIs for org

POST /api/pql/check                   → Check PQL signals
POST /api/report/monthly              → Generate monthly report

GET/PUT /api/settings/org             → Org settings
```

---

## 14. Deployment

- **Platform**: Vercel
- **Framework preset**: Next.js (`vercel.json: { "framework": "nextjs" }`)
- **Database**: Supabase (hosted PostgreSQL)
- **DNS/Domain**: TBD (likely hoshinkanri.vn)
