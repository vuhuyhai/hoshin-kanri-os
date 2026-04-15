# MASTER BUILD SPEC — Hoshin Kanri OS

> **Architectural reference only.** For dev setup see `DEVELOPMENT.md`. For AI agent onboarding (conventions, pitfalls, don'ts) see `AGENTS.md`. This file documents *what* the system is — the other two cover *how to work on it*.
>
> Last verified: 2026-04-15. Sections below reflect the state after the `chore: consolidate pending refactors` + `feat(blog)` commits. The directory tree and migrations list can still drift — `ls supabase/migrations/` and `find app lib -type d` are authoritative when in doubt.

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
│   ├── page.tsx                  # Landing page (public) — redirects authed users to /dashboard
│   ├── globals.css               # Global styles (neo-brutalism design tokens)
│   ├── sitemap.ts                # Dynamic sitemap.xml (static routes + blog slugs)
│   ├── robots.ts                 # robots.txt (blocks /admin, /dashboard, /api)
│   │
│   ├── (auth)/login/page.tsx     # Email/password login
│   ├── register/page.tsx         # Sign-up
│   ├── reset-password/, update-password/, auth/callback/
│   │
│   ├── x-ray/                    # Public — Business X-Ray (lead gen tool)
│   ├── x/[slug]/page.tsx         # Public — Shared X-Matrix view
│   │
│   ├── blog/                     # Public — Content marketing (chienluoc.org/blog)
│   │   ├── page.tsx              # Listing (paginated)
│   │   └── [slug]/               # Detail page + ViewTracker client component
│   │
│   ├── lien-he/, dieu-khoan/, chinh-sach-bao-mat/  # Static pages
│   │
│   ├── onboarding/setup-org/     # Org setup after first login
│   │
│   ├── dashboard/                # Protected — requires auth + org_members row
│   │   ├── layout.tsx            # Shell (Sidebar + Header + auth guard)
│   │   ├── page.tsx, help/
│   │   ├── discovery/            # Strategy Discovery Hub
│   │   │   ├── swot/             # 3-phase AI-guided SWOT + coaching + guide
│   │   │   ├── pain-mapper/, vision-workshop/, synthesis/
│   │   │   ├── benchmark/
│   │   │   └── xray-history/
│   │   ├── x-matrix/new/         # X-Matrix Wizard (5-step)
│   │   ├── kpi/                  # KPI dashboard + tracker
│   │   ├── report/               # AI monthly report
│   │   └── settings/
│   │
│   ├── admin/                    # Super-admin only (is_super_admin flag)
│   │   ├── login/                # Admin sign-in (redirects to /admin on success)
│   │   ├── _components/          # AdminSidebar, PlanBadge, CustomerFilter, etc.
│   │   ├── _actions.ts           # Server actions (changePlan, addNote, ...)
│   │   └── (dashboard)/          # Layout group with sidebar
│   │       ├── page.tsx, customers/, hoshin-explorer/
│   │       └── blog/             # Blog CMS — list, new, [id]/edit, BlogForm, _actions
│   │
│   └── api/                      # API Routes — see Section 6 for full list
│
├── components/
│   ├── analytics/
│   │   ├── IdentifyUser.tsx      # PostHog user identification
│   │   └── TrackMount.tsx        # Fire PostHog event on mount (StrictMode-safe)
│   ├── blog/MarkdownRenderer.tsx # react-markdown + remark-gfm + neo-brutal styling
│   ├── layout/                   # header, sidebar, bottom-nav, footer
│   ├── providers/                # auth-listener, posthog-provider, theme-provider
│   ├── swot/                     # SWOT-specific UI (wizard, matrix, cells, chat)
│   ├── ui/                       # shadcn/ui primitives
│   └── x-matrix/                 # X-Matrix wizard steps + review
│
├── lib/
│   ├── utils.ts
│   ├── supabase/                 # client.ts · server.ts (+ role helpers) · admin.ts (service-role) · types.ts
│   ├── ai/
│   │   ├── client.ts             # createAnthropicClient() — single factory w/ retries + timeout
│   │   ├── models.ts             # AI_MODELS.reasoning / .fast semantic aliases
│   │   └── stream-json.ts        # streamClaudeJson() SSE helper
│   ├── http/
│   │   ├── fetch-json.ts         # postJson + FetchJsonError
│   │   └── sse-client.ts         # postSse + SseError
│   ├── validation/
│   │   ├── index.ts              # parseBody() + isValidEmail()
│   │   └── schemas.ts            # Zod schemas grouped by domain
│   ├── blog/                     # queries.ts · schema.ts (domain-local Zod)
│   ├── admin/                    # queries.ts, hoshin-explorer-data.ts
│   ├── email/                    # send.ts · templates.ts
│   ├── analytics/events.ts       # Typed PostHog event helpers
│   ├── discovery/                # types · prompts · benchmark-data
│   ├── pql/signals.ts
│   ├── swot/                     # types · frameworks · coaching-prompts · coaching-draft-prompt · coaching-tracker · tows-* · factor-utils · sync-to-xmatrix · xray-to-swot-mapper · evidence-searcher · query-generator · synthesis-engine
│   ├── x-matrix/                 # types · utils
│   ├── x-ray/                    # types · questions
│   ├── kpi/                      # (if present)
│   └── rate-limit.ts             # DB-backed rate limit (fail-open)
│
├── supabase/
│   ├── migrations/               # 001 → 022 (sequential, apply in order)
│   ├── manual-scripts/           # One-off data migrations not part of the ordered sequence
│   ├── cleanup_users.sql
│   └── seed.sql
│
├── scripts/
│   └── apply-migration.mjs       # Apply a migration via Supabase Management API (no CLI needed)
│
├── proxy.ts                      # Next.js middleware — session refresh + /admin gating
├── next.config.ts                # Minimal (ignoreBuildErrors removed — types are clean now)
├── vercel.json                   # Vercel deployment config
├── package.json, tsconfig.json, components.json, postcss.config.mjs, eslint.config.mjs
├── AGENTS.md, DEVELOPMENT.md, MASTER_BUILD_SPEC.md, README.md
└── plans/                        # Work-in-progress notes (not shipped code)
```

**Latest migration as of this writing**: `022_blog_posts.sql`. Check `ls supabase/migrations/` for the real top of the list.

---

## 4. Database Schema

**15+ tables** trong Supabase PostgreSQL (and growing — `ls supabase/migrations/` to see latest). Tat ca co RLS (Row Level Security).

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

### Content / Admin Tables

#### `profiles`
- `id` (FK → auth.users), `full_name`, `avatar_url`
- `is_super_admin` (boolean) — gated at `proxy.ts` for `/admin/*` routes

#### `admin_notes`
- `org_id` (FK), `content`, `created_at`
- Free-form notes on customers, super-admin only

#### `subscriptions`
- `org_id` (FK, unique), `plan`, `status`, `current_period_end`
- Synced with future billing integration; used for MRR dashboard

#### `blog_posts`
- `id` (uuid PK), `slug` (unique), `title`, `excerpt`, `cover_url`
- `content_md` (text), `status` ('draft'|'published'), `author_id` (FK → auth.users)
- `published_at`, `views_count`, `created_at`, `updated_at`
- **Not org-scoped** — platform-level content for chienluoc.org
- RLS: public SELECT where `status='published'`; super-admin SELECT all; writes go through service-role from `/admin/blog` server actions
- RPC `increment_blog_post_views(slug)` runs with security-definer, revoked from anon/authenticated — called from `/api/blog/[slug]/view` through the admin client

### Infra Tables

#### `rate_limits`
- `bucket`, `window_start`, `count` — service-role-only, no policies
- Written via `increment_rate_limit` RPC from `lib/rate-limit.ts`
- Cleaned up daily by pg_cron (migration 020)

#### `swot_factors`
- Per-row S/W/O/T items with atomic code reservation via `reserve_factor_codes` RPC (migration 014)

#### `tows_strategies`
- AI-generated or hand-written SO/ST/WO/WT strategies, synced into `x_matrices` on demand

#### `evidence_cache`
- Tavily search result cache keyed on normalized query, 7-day TTL

### RLS Rules Summary
- **SELECT** (per-org tables): User chi thay data cua org minh (thong qua org_members)
- **SELECT blog_posts**: Public — only rows where `status='published'`. Super-admin can read drafts too.
- **INSERT x_matrices, swot**: Chi CEO
- **INSERT kpis**: CEO hoac Manager
- **INSERT kpi_entries**: Chi user do (user_id = auth.uid())
- **UPDATE org**: Chi CEO
- **All writes on `blog_posts`, `rate_limits`**: service-role only (no policies granted to anon/authenticated)

---

## 5. Authentication

- **Method**: Email/password (Supabase auth). Magic link flow is wired but not the primary path anymore.
- **Registration**: `/register` → `/api/auth/register` (Zod-validated, rate-limited, sends verification email via Resend) → email confirm → `/login`.
- **Password reset**: `/reset-password` → `/api/auth/forgot-password` (dual-key rate limit: IP + email bucket, returns fake-success for unknown emails to avoid user enumeration) → email link → `/update-password`.
- **Middleware** (`proxy.ts`): Refreshes Supabase session cookies for `/dashboard/*`, `/onboarding/*`, `/login`, `/admin/*`. **Also gates `/admin/*` against `profiles.is_super_admin`** using a service-role client (see pitfall #6 in AGENTS.md) — non-admin authed users hitting `/admin/*` are redirected to `/dashboard`.
- **Auth Guard**: `dashboard/layout.tsx` checks `supabase.auth.getUser()` → redirect to `/login` if no user, redirect to `/onboarding/setup-org` if no org membership.
- **Role-based writes**: `requireOrgRole(supabase, userId, orgId, ALLOWED_ROLES)` in `lib/supabase/server.ts` returns a clean 403 *before* the RLS policy would throw 42501. Always use it on write routes so the client gets a friendly error message instead of a raw 500.
- **Dev Login**: `/api/auth/dev-login` — development helper, not used in prod.

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

### Flow G: Blog (Public + Admin CMS)
```
Public:  /blog → listing (12/page) → /blog/[slug] detail
         Emits: view-count API (rate-limited 1/30min/IP+slug, session-dedup'd)
         SEO:   generateMetadata + OG + JSON-LD Article + sitemap.xml entry

Admin:   /admin/blog → list (drafts + published)
         /admin/blog/new  (Markdown editor + live preview + auto-slugify)
         /admin/blog/[id]/edit
         Auth gate: proxy.ts checks profiles.is_super_admin
         Storage: blog_posts table (not org-scoped), RLS public-read published
```

### Flow H: Super-Admin Dashboard (Auth-gated)
```
/admin/login → proxy.ts verifies is_super_admin → /admin
  · /admin/customers           Customer list + plan management
  · /admin/customers/[id]      Detail + notes + plan toggle
  · /admin/hoshin-explorer     AI-powered concept research
  · /admin/blog                Blog CMS (see Flow G)
```

---

## 7. AI Integration

**Provider**: Anthropic Claude API (`@anthropic-ai/sdk`)

### AI-Powered Features

| Feature | API Route | Model | What AI Does |
|---------|-----------|-------|-------------|
| X-Ray Scoring | `/api/x-ray/score` | reasoning | Scores 7 OPEX pillars, exec summary, top 3 actions |
| SWOT Coaching (turn-by-turn) | `/api/swot/coaching` | reasoning | Conversational 8M/Porter/PESTEL coaching loop |
| SWOT Draft (one-shot) | `/api/swot/coaching-draft` | reasoning + `tool_use` | Full 4-quadrant draft via forced tool call |
| SWOT Suggest More | `/api/swot/suggest-more` | reasoning | Add items to a single quadrant on demand |
| SWOT Conflict Check | `/api/swot/conflict-check` | reasoning | Flag contradictions/duplicates across quadrants |
| SWOT Context Cards | `/api/swot/context-cards` | reasoning | Generate 6 external-context cards (3 O + 3 T) |
| SWOT Synthesis | `/api/swot/synthesis` | — | Rules-based engine (`synthesizeSwot`), no AI call |
| SWOT Evidence | `/api/swot/evidence` | — | Tavily web search + cache, not Claude |
| SWOT Factor Quality | `/api/swot-analyses/[id]/factors/[factorId]/quality-check` | **fast** | Score & improve a single S/W/O/T item |
| TOWS Strategy | `/api/swot-analyses/[id]/strategies/ai-generate` | reasoning | Generate SO/ST/WO/WT strategies from paired factors |
| Pain Mapper | `/api/discovery/pain-mapper` | reasoning (streamed) | Pain points → Hoshin candidates, streamed via `streamClaudeJson` |
| Vision Draft | `/api/discovery/vision-draft` | reasoning (streamed) | Workshop answers → vision + year goals, streamed |
| Discovery Synthesis | `/api/discovery/synthesis` | reasoning (streamed) | Aggregate all discovery data → X-Matrix prefill, streamed |
| X-Matrix Prefill | `/api/x-matrix/prefill` | reasoning | Wizard pre-fill from discovery data |
| Monthly Report | `/api/report/monthly` | reasoning | KPI data → exec-style monthly report |
| Hoshin Explorer (admin) | `/api/admin/hoshin-explorer` | reasoning | Super-admin research tool — concept breakdown w/ Vietnamese examples |

**All routes** go through `createAnthropicClient()` (retries, timeout) and `AI_MODELS.reasoning` / `AI_MODELS.fast` — never instantiate the SDK or hard-code a model ID. Streaming routes use `streamClaudeJson()` + client-side `postSse()` so TTFB is ~200ms regardless of total generation time.

### Analysis Frameworks Used
- **Internal (Strengths/Weaknesses)**: 8M Model (Man, Machine, Material, Method, Measurement, Nature, Management, Money)
- **External (Opportunities/Threats)**: Porter's 5 Forces + PESTEL Analysis
- **Strategy Matrix**: SO/ST/WO/WT cross-analysis (TOWS)
- **Operational Assessment**: 7 OPEX pillars (Lean, Six Sigma, Workplace, Value Chain, CX, Value Innovation, Value AI) — powers `/x-ray`

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
- **API routes** use `createClient()` from `lib/supabase/server.ts` for auth; `createAdminClient()` from `lib/supabase/admin.ts` for service-role writes only
- **Client components** use `createClient()` from `lib/supabase/client.ts`
- **Every POST/PUT/PATCH route with a body** validates with Zod via `parseBody(request, schema)` — schemas in `lib/validation/schemas.ts` grouped by domain, or a feature-local file like `lib/blog/schema.ts`
- **AI API routes**: Go through `createAnthropicClient()` (retries, timeout) and `AI_MODELS.reasoning | .fast`. Streaming routes use `streamClaudeJson()`; client consumes with `postSse()` from `lib/http/sse-client.ts`
- **Rate limit public routes** with `checkRateLimit({ key, limit, windowSeconds })` (IP-based, fail-open on infra errors). Dual-key IP + identifier for endpoints that can be weaponized against a specific victim
- **Role checks** before writes: `requireOrgRole(supabase, user.id, orgId, ADMIN_ROLES|WRITE_ROLES|ALL_ROLES)` returns a clean 403 before the RLS policy throws 42501
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
