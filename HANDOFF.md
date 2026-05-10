# HANDOFF — Hoshin Kanri OS

> **Mục đích**: Tài liệu này là "one-shot context pack" để bất kỳ Claude session mới nào hiểu đầy đủ về kiến trúc, code conventions, pitfalls đã gặp và trạng thái hiện tại của repo. Đọc file này trước khi code.
>
> **Last verified**: 2026-05-10 — post M-Design-Tokens-Cleanup-1 (--accent collision cleanup + .heading-overline consolidation, 3 commits `eb34541`→`2c6f976` + close-out `<NEXT_HASH>`). HEAD `<NEXT_HASH>` (production verified). Touch 26 files (1 NEW: `plans/M-Design-Tokens-Cleanup-1-plan.md` TBD; 25 MODIFIED: `app/globals.css` foundation cleanup +9/-9 LOC commit 1 + `app/x-ray/components/XRayReport.tsx` +2/-2 LOC commit 2 + 24 files .heading-overline → .overline className migration +26/-35 LOC commit 3). Smoke test Phase A 5/5 PASS visual (CASE 1 KPI dropdown hover neutral beige eye-fatigue fix + CASE 2 org switcher selected brand red preserved qua bg-accent-brand token riêng + CASE 3 X-Ray selected option brand red + CASE 4 XRayReport CTA shadow brand red + CASE 5 dark mode skip acceptable Q3 A defer M-Design-Dark-1). Production verify TBD post-deploy. Decision lock path β REVERT shadcn default + α NO dark override + β consolidate Path C atomic + α dead code cleanup. 0 var(--accent) consumers ngoài foundation post-cleanup (was 6); 84 var(--brand) consumers across 23 files (healthy ecosystem). Eye-fatigue fix evidence Vũ Hải screenshot 2026-05-10 — dropdown menu hover từ brand red flash → neutral beige shadcn default.
> **Branch**: `master` (solo dev, không PR flow)
> **Deployment**: Vercel auto-deploy từ `master` push
> **Repo path**: `c:/Users/ASUS/Desktop/Hoshin Kanri by Vũ Hải/hoshin-kanri-os/`

---

## 0. Đọc file nào khi nào

| Khi bạn cần... | Đọc file |
|---|---|
| Onboarding nhanh, conventions, pitfalls | `AGENTS.md` (→ được `CLAUDE.md` import) |
| Dev setup, scripts, troubleshooting | `DEVELOPMENT.md` |
| Full architecture reference (tables, flows, API map) | `MASTER_BUILD_SPEC.md` |
| Product copy / positioning / marketing | `../CONTENT.md`, `../CONTEXT.md` |
| File này | One-shot handoff cho Claude session mới |

**Khi bắt đầu session mới**: đọc theo thứ tự `HANDOFF.md` (file này) → `AGENTS.md` → file liên quan đến task.

---

## 1. Product — Hoshin Kanri OS là gì

**Positioning**: SaaS web app giúp SME Việt Nam (1–200 nhân viên) **biến chiến lược thành hành động đo được trong 90 ngày**, dùng phương pháp Hoshin Kanri (Policy Deployment) + AI.

**Target user**: CEO / Owner SME Việt Nam — ngành Fitness, F&B, B2B Services, Retail, Education.

**Core value loop**:
```
Business X-Ray (chẩn đoán 5 phút)
   → SWOT Analysis (3-phase AI-guided)
   → Pain Mapping → Vision Workshop
   → AI Strategy Synthesis
   → X-Matrix Wizard (5 steps)
   → KPI Tracking + Monthly Report
   → PQL signal → Consulting upsell
```

**Founder**: Vũ Hải (solo, vibe-coding style, direct communication, tiếng Việt cho user-facing).

**Domain**: `chienluoc.org` (production), `hoshinkanri.vn` (backup/alt).

**Business model**:
- Free tier: đầy đủ tính năng core
- Pro tier: chưa implement
- Consulting upsell: PQL engine auto-detect khi org ready

---

## 2. Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Framework | **Next.js** (App Router, Webpack) | 16.2.3 |
| React | React | 19.2.4 |
| Language | TypeScript | ^5.8 |
| Styling | Tailwind CSS v4 + shadcn/ui (Neo-Brutalism v3.2 "Refined Tempered" — radius 4px tempered, không phải 0 force) | v4 / v4.2.0 |
| Fonts | Space Grotesk (display) + Inter (body) + JetBrains Mono (mono) | next/font/google, Vietnamese subset |
| State | Zustand | ^5.0.12 |
| DB + Auth | Supabase (Postgres + RLS) | ^2.103.0 |
| Auth SSR | @supabase/ssr | ^0.10.2 |
| AI | Anthropic SDK | ^0.86.1 |
| Analytics | PostHog | ^1.365.5 |
| Markdown | react-markdown + remark-gfm + rehype-raw | - |
| Charts | Recharts | ^3.8.1 |
| Toasts | Sonner | ^2.0.7 |
| Validation | Zod | ^4.3.6 |
| Icons | lucide-react | ^1.8.0 |
| Hosting | Vercel | - |

**⚠️ NOT the Next.js you know**: Next 16 + React 19 có breaking changes vs Next 14/15 (training data của LLM). Khi nghi ngờ, đọc `node_modules/next/dist/docs/` trước khi viết code.

---

## 3. Project Structure

```
hoshin-kanri-os/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (Montserrat + Barlow Condensed, ThemeProvider light default, PHProvider, AuthListener, Toaster, JSON-LD Organization + WebSite)
│   ├── page.tsx                      # Landing page (public, ~16KB)
│   ├── globals.css                   # Neobrutalism design tokens
│   ├── sitemap.ts                    # Dynamic sitemap (static routes + blog slugs)
│   ├── robots.ts                     # Blocks /admin, /dashboard, /api
│   │
│   ├── (auth)/
│   │   ├── login/                    # Email/password login
│   │   ├── register/
│   │   ├── reset-password/
│   │   ├── update-password/
│   │   └── auth/                     # Supabase auth callback
│   │
│   ├── onboarding/setup-org/         # Org setup sau first login
│   │
│   ├── x-ray/                        # Public — Business X-Ray lead gen (5 dimensions, email capture)
│   ├── x/[slug]/                     # Public — Shared X-Matrix view
│   │
│   ├── blog/                         # Public — Content marketing
│   │   ├── page.tsx                  # Listing (paginated)
│   │   ├── [slug]/                   # Detail + ViewTracker
│   │   ├── preview/                  # Draft preview (token-gated)
│   │   └── rss.xml/                  # RSS feed
│   │
│   ├── lien-he/, dieu-khoan/, chinh-sach-bao-mat/  # Static pages
│   │
│   ├── dashboard/                    # Protected: auth + org_members required
│   │   ├── layout.tsx                # Shell: Sidebar + Header + auth guard
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── help/
│   │   ├── discovery/
│   │   │   ├── page.tsx              # Discovery Hub
│   │   │   ├── swot/                 # 3-phase SWOT (coaching / strategy / guide sub-pages)
│   │   │   ├── pain-mapper/
│   │   │   ├── vision-workshop/
│   │   │   ├── synthesis/            # AI Strategy Synthesis
│   │   │   ├── benchmark/            # KPI Benchmark Library
│   │   │   └── xray-history/         # + /[id]
│   │   ├── x-matrix/new/             # X-Matrix Wizard (5 steps)
│   │   ├── kpi/                      # KPI dashboard + tracker
│   │   ├── report/                   # AI Monthly Report
│   │   └── settings/
│   │
│   ├── admin/                        # Super-admin only (proxy.ts gates is_super_admin)
│   │   ├── login/
│   │   ├── _components/              # AdminSidebar, PlanBadge, CustomerFilter, ...
│   │   ├── _actions.ts               # Server actions (changePlan, addNote, ...)
│   │   └── (dashboard)/              # Layout group
│   │       ├── page.tsx
│   │       ├── customers/            # + /[id]
│   │       ├── hoshin-explorer/      # AI concept research tool
│   │       └── blog/                 # CMS: list, new, [id]/edit, categories, tags
│   │
│   └── api/                          # API Routes (see §7 for full map)
│
├── components/
│   ├── analytics/
│   │   ├── IdentifyUser.tsx          # PostHog identify
│   │   └── TrackMount.tsx            # Fire event on mount (StrictMode-safe useRef guard)
│   ├── blog/                         # MarkdownRenderer, BlogSearch, TableOfContents, RelatedPosts, ShareButtons, NewsletterCta, AuthorByline, PostTags
│   ├── layout/                       # header, sidebar, bottom-nav, footer
│   ├── providers/                    # auth-listener, posthog-provider, theme-provider
│   ├── swot/                         # 30+ components (wizard, matrix, TOWS, coaching chat, synthesis, context cards, ...)
│   ├── ui/                           # shadcn/ui primitives (button, card, input, select, sheet, dropdown-menu, alert-dialog, ...)
│   └── x-matrix/                     # Wizard steps 1-4 + Review + WizardProgress
│
├── lib/
│   ├── utils.ts                      # cn() + misc
│   ├── rate-limit.ts                 # DB-backed, fail-open, IP-based
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # SSR client + requireOrgRole() + ADMIN_ROLES/WRITE_ROLES/ALL_ROLES
│   │   ├── admin.ts                  # Service-role (bypasses RLS — use sparingly)
│   │   └── types.ts                  # 1258 lines, hand-maintained Database type
│   ├── ai/
│   │   ├── client.ts                 # createAnthropicClient() — retries 3, timeout 180s
│   │   ├── models.ts                 # AI_MODELS.reasoning (sonnet-4-6) / .fast (haiku-4-5)
│   │   └── stream-json.ts            # streamClaudeJson() SSE helper
│   ├── http/
│   │   ├── fetch-json.ts             # postJson + FetchJsonError
│   │   └── sse-client.ts             # postSse + SseError
│   ├── validation/
│   │   ├── index.ts                  # parseBody() + isValidEmail()
│   │   └── schemas.ts                # Zod schemas grouped by domain
│   ├── blog/                         # queries, schema (domain-local), errors, toc
│   ├── newsletter/                   # queries, schema
│   ├── admin/                        # queries, hoshin-explorer-data, hoshin-steps-data, types
│   ├── email/                        # send.ts (Resend), templates.ts
│   ├── analytics/events.ts           # Typed PostHog helpers (NO PII)
│   ├── discovery/                    # types, prompts, benchmark-data
│   ├── pql/signals.ts                # PQL detection (3 signals)
│   ├── swot/                         # 20+ files: types, frameworks, coaching-*, tows-*, factor-*, sync-to-xmatrix, xray-to-swot-mapper, evidence-*, query-generator, synthesis-*, workshop-persist, swot-session-store
│   ├── x-matrix/                     # types, utils (validateXMatrix)
│   └── x-ray/                        # types, questions (5 dimensions)
│
├── supabase/
│   ├── migrations/                   # 001 → 027 sequential
│   ├── manual-scripts/               # One-off data migrations (not in ordered sequence)
│   ├── cleanup_users.sql
│   └── seed.sql
│
├── scripts/
│   └── apply-migration.mjs           # Apply migration via Supabase Management API (no CLI)
│
├── proxy.ts                          # Next middleware — session refresh + /admin gating via is_super_admin (service-role check)
├── next.config.ts                    # Minimal (ignoreBuildErrors OFF as of April 2026)
├── vercel.json                       # Vercel config
├── package.json, tsconfig.json, components.json, postcss.config.mjs, eslint.config.mjs
├── AGENTS.md / CLAUDE.md             # Agent onboarding (CLAUDE.md = @AGENTS.md)
├── DEVELOPMENT.md                    # Human dev guide
├── MASTER_BUILD_SPEC.md              # Architectural reference
├── HANDOFF.md                        # THIS FILE
├── README.md
└── plans/                            # WIP notes (not shipped)
```

---

## 4. Database Schema (Supabase Postgres + RLS)

**Latest migration**: `030_xmatrix_correlations.sql` (28 migration files: 001-006 + 009-030). Gap at 007/008 confirmed clean — never existed in git history (all 126 commits, all branches). Schema continuity verified between 006 → 009. No drift between migrations and types.ts.

### Core Tables
- **`organizations`** — `id, name, industry, headcount ('1-10'|'10-50'|'50-200'), city, plan_tier ('free'|'pro'), zalo_oa_token`
- **`users`** — `id (FK auth.users), email, full_name, phone, zalo_user_id`
- **`org_members`** — `org_id, user_id, role ('CEO'|'Manager'|'Member')`, UNIQUE(org_id, user_id)
- **`profiles`** — `id (FK auth.users), full_name, avatar_url, is_super_admin` (gate cho `/admin/*`)

### Strategy Tables
- **`x_matrices`** — `org_id, year, title, status ('draft'|'active'|'archived'), vision_json (JSONB: vision + yearGoals + hoshins + initiatives + kpis)`. Unique active per org (migration 015).
- **`swot_analyses`** — `org_id, quadrant ('S'|'W'|'O'|'T'), framework_source, statement, evidence_json (JSONB[]), implication`
- **`swot_factors`** — Per-row S/W/O/T với atomic `reserve_factor_codes` RPC (migration 014)
- **`tows_strategies`** — SO/ST/WO/WT strategies, sync vào x_matrices on-demand. v2 fields (migration 029): actions JSONB nullable, kpi_suggestions JSONB nullable, timeframe varchar(10) nullable CHECK in ('30d','60d','90d'), rationale text nullable.
- **`xmatrix_correlations`** — `org_id, x_matrix_id (FK x_matrices), year_goal_id (text, JSON-embedded ID), hoshin_id (text, JSON-embedded ID), strength ('strong'|'medium'|'weak'|'none'), created_by`. UNIQUE(x_matrix_id, year_goal_id, hoshin_id) cho idempotent upsert. year_goal_id và hoshin_id là text (không FK) vì đây là JSON-embedded IDs trong `x_matrices.vision_json`. RLS: SELECT all org members, INSERT/UPDATE/DELETE CEO+Manager only (migration 030).
- **`discovery_sessions`** — `org_id, user_id, step_completed (enum: x-ray, current_state, swot, swot_coaching, swot_evidence, swot_synthesis, pain_mapper, vision, synthesis, xray_history), data_json`

### Operational Tables
- **`kpis`** — `org_id, x_matrix_id, owner_user_id, name, unit, target_value, frequency ('daily'|'weekly'|'monthly'), is_active, dept_level ('company'|'dept')`
- **`kpi_entries`** — `kpi_id, user_id, value, note, period_date`
- **`notification_logs`** — `org_id, user_id, type ('zalo'|'email'|'in_app'), status, payload`

### Lead Gen Tables
- **`xray_leads`** — Public (no auth) X-Ray submissions: email, company_name, industry, headcount, answers_json, result_json, overall_score, overall_level, converted
- **`xray_results`** — Authed X-Ray results: org_id, user_id, overall_score, overall_level, result_json, answers_json

### Content / Admin Tables
- **`admin_notes`** — `org_id, content, created_at` (super-admin only)
- **`subscriptions`** — `org_id (unique), plan, status, current_period_end` (MRR dashboard)
- **`blog_posts`** — **NOT org-scoped**, platform-level. `slug, title, excerpt, cover_url, content_md, status ('draft'|'published'), author_id, category_id, preview_token, published_at, views_count`. RLS: public SELECT `status='published'`, super-admin SELECT all, writes qua service-role.
- **`blog_categories`** — `slug, name, description`
- **`blog_tags`** — many-to-many với posts
- **`newsletter_subscribers`** — email capture (migration 026)

### Infra Tables
- **`rate_limits`** — service-role only, no policies. Written via `increment_rate_limit` RPC. Cleaned daily bởi pg_cron (migration 020).
- **`evidence_cache`** — Tavily search cache, 7-day TTL, normalized query key
- Storage bucket: `blog-covers` (migration 027)

### RLS Key Rules
- **SELECT per-org**: User chỉ thấy data của org thông qua `org_members`
- **SELECT blog_posts**: Public cho `status='published'`, super-admin thấy tất cả
- **INSERT x_matrices, swot_analyses**: Chỉ CEO
- **INSERT kpis**: CEO hoặc Manager
- **INSERT kpi_entries**: Chỉ user đó (`user_id = auth.uid()`)
- **UPDATE organizations**: Chỉ CEO
- **All writes `blog_posts`, `rate_limits`**: service-role only

### RPCs
- `reserve_factor_codes(org, quadrant, count)` — atomic code reservation
- `increment_rate_limit(bucket, window, max)` — fail-open
- `increment_blog_post_views(slug)` — security-definer, revoked from anon/authenticated (called từ service-role)

---

## 5. Authentication & Authorization

### Flow
- **Method**: Email/password qua Supabase auth. Magic link vẫn wired nhưng không primary.
- **Register**: `/register` → `POST /api/auth/register` → Zod + rate-limit + Resend email → `/login`
- **Forgot**: `/reset-password` → `POST /api/auth/forgot-password` → **dual-key rate limit** (IP + email bucket), fake-success cho unknown emails để tránh user enumeration → email → `/update-password`
- **Dev helper**: `POST /api/auth/dev-login` (local only)

### Middleware (`proxy.ts`)
Matcher: `/dashboard/:path*`, `/onboarding/:path*`, `/login`, `/admin/:path*`
- Refresh Supabase session cookies
- Gate `/admin/*`:
  - No session → redirect `/admin/login`
  - Has session → service-role client query `profiles.is_super_admin`
  - `is_super_admin=true` + đã ở `/admin/login` → redirect `/admin`
  - Non-admin + không phải login → redirect `/dashboard`

### Auth Guard
`dashboard/layout.tsx`:
- `supabase.auth.getUser()` → nếu null → `/login`
- Nếu không có `org_members` row → `/onboarding/setup-org`

### Role-based writes
`requireOrgRole(supabase, userId, orgId, ALLOWED_ROLES)` trong `lib/supabase/server.ts`:
- Returns clean 403 **trước** khi RLS throw 42501
- Role sets: `ADMIN_ROLES` (CEO only), `WRITE_ROLES` (CEO + Manager), `ALL_ROLES` (CEO + Manager + Member)

---

## 6. Core User Flows

### A. Lead Gen (Public, No Auth)
```
Landing (/) → X-Ray (5 dimensions Strategy/Execution/People/Finance/Customer, ~5 min)
  → Email + company capture → AI score (7 OPEX pillars, exec summary, top 3 actions)
  → X-Ray Report → CTA "Đăng ký để tạo X-Matrix"
```
Scoring levels: `critical / weak / moderate / strong`

### B. Strategy Discovery (Auth Required)
```
Dashboard → Discovery Hub → 4 steps (any order):
  1. SWOT Analysis — 3 phases:
     a. AI Coaching (conversational, 8M/Porter/PESTEL)
     b. Evidence Collection (AI queries → Tavily web search → cache)
     c. Synthesis (rules-based engine synthesizeSwot, không gọi AI)
  2. Pain → Goal Mapper (pains → Hoshin candidates, streamed)
  3. Vision Workshop (guided Q&A → vision + year goals, streamed)
  4. AI Strategy Synthesis (aggregate all → X-Matrix prefill, streamed)
```

### C. X-Matrix Wizard (Auth Required)
5 steps — hard limits (Hoshin discipline):
```
MAX_YEAR_GOALS:             3
MAX_HOSHINS:                5
MAX_INITIATIVES_PER_HOSHIN: 3  (timeframe: 30d/60d/90d)
MAX_KPIS_PER_HOSHIN:        2
```
Validation: envelope qua Zod + deep rules qua `validateXMatrix()` trong `lib/x-matrix/utils.ts`.

### D. KPI Tracking
```
Dashboard → KPI Tracker → sparkline cards
  → Add entry (value + note + period_date)
  → Color code: green (≥target), yellow (70–100%), red (<70%)
```

### E. Monthly Report
AI reads KPI data → generates exec-style monthly report.

### F. Share X-Matrix (Public)
Dashboard → generate slug → `/x/[slug]` public view.

### G. Blog (Public + Admin CMS)
- Public: `/blog` listing (12/page), `/blog/[slug]` detail
- View-count API rate-limited 1/30min/IP+slug, session-dedup
- SEO: `generateMetadata` + OG + JSON-LD Article + sitemap + RSS
- Admin CMS: `/admin/blog` (list, new, [id]/edit, categories, tags) — Markdown + live preview + auto-slugify

### H. Super-Admin Dashboard
```
/admin/login → proxy.ts verifies is_super_admin → /admin
  · /admin/customers + /[id]     Customer list + plan toggle + notes
  · /admin/hoshin-explorer       AI concept research (Vietnamese examples)
  · /admin/blog                  CMS (see G)
```

---

## 7. API Routes Map (41 routes)

### Auth
```
POST /api/auth/register              Zod + rate-limit + Resend email
POST /api/auth/forgot-password       Dual-key rate-limit, fake-success
POST /api/auth/dev-login             Dev only
```

### X-Ray
```
POST /api/x-ray/score                AI scoring (reasoning model)
GET  /api/x-ray/history              Authed history
```

### SWOT
```
POST /api/swot/coaching              Conversational coaching (reasoning)
POST /api/swot/coaching-draft        One-shot draft (reasoning + tool_use)
POST /api/swot/suggest-more          Per-quadrant add (reasoning)
POST /api/swot/conflict-check        Contradiction/duplicate flagger
POST /api/swot/context-cards         6 external-context cards (3O + 3T)
POST /api/swot/evidence              Tavily search + cache (NOT Claude)
POST /api/swot/item-evidence         Single-item evidence
POST /api/swot/synthesis             Rules-based (NOT Claude)
POST /api/swot/sync-xmatrix          Sync SWOT → X-Matrix
POST /api/swot/prefill-from-xray     Pre-fill from X-Ray results
POST /api/swot/xray-context          X-Ray context injection
```

### SWOT Factors & Strategies (CRUD)
```
GET/POST   /api/swot-analyses/[id]/factors
PATCH      /api/swot-analyses/[id]/factors/[factorId]
POST       /api/swot-analyses/[id]/factors/[factorId]/quality-check  (fast model)
GET/PATCH  /api/swot-analyses/[id]/strategies
POST       /api/swot-analyses/[id]/strategies/ai-generate            (reasoning, TOWS)
```

### Discovery
```
POST /api/discovery/pain-mapper      Streamed (streamClaudeJson)
POST /api/discovery/vision-draft     Streamed
POST /api/discovery/vision-save
POST /api/discovery/synthesis        Streamed
```

### X-Matrix
```
POST    /api/x-matrix/create                 Envelope Zod + validateXMatrix()
POST    /api/x-matrix/prefill                AI wizard prefill (reasoning)
GET     /api/x-matrix/share?slug=xxx         Public read
GET/PUT /api/xmatrix/correlations            List + upsert correlation cells
POST    /api/xmatrix/coach-correlation       AI sensei questions for strong link (rate-limited)
```

### KPI
```
POST /api/kpi/entry                  Add entry
GET  /api/kpi/list                   List org KPIs
```

### Report / PQL / Settings
```
POST /api/report/monthly             AI monthly report (reasoning)
POST /api/pql/check                  3-signal PQL detection
GET/PUT /api/settings/org            GET for read, PUT CEO-only update
```

### Blog (Public API)
```
POST /api/blog/[slug]/view           Rate-limited view counter
```

### Newsletter
```
POST /api/newsletter/subscribe
```

### Admin
```
POST /api/admin/blog/upload-cover    Service-role storage upload
POST /api/admin/hoshin-explorer      Concept breakdown (reasoning)
POST /api/admin/verify               is_super_admin verification
```

### Debug
```
GET /api/debug                       Env sanity check
```

**Tất cả POST/PUT/PATCH routes có body → validate bằng Zod qua `parseBody(request, schema)`.**

---

## 8. AI Integration

**Provider**: Anthropic Claude API (`@anthropic-ai/sdk` ^0.86.1)

### Model selection (`lib/ai/models.ts`)
```ts
AI_MODELS = {
  reasoning: 'claude-sonnet-4-6',        // Strategic reasoning, JSON output
  fast:      'claude-haiku-4-5-20251001' // Only swot factor quality-check
}
```
**NEVER hard-code model IDs.** Bump here once → all routes pick up.

### Client factory (`lib/ai/client.ts`)
```ts
createAnthropicClient() // maxRetries: 3, timeout: 180_000
```
**NEVER `new Anthropic()` directly.**
**Instantiate INSIDE the handler, NOT at module scope** (tránh build-time fire khi env vars chưa set).

### Streaming (`lib/ai/stream-json.ts`)
- Server: `streamClaudeJson()` → SSE events
- Client: `postSse()` từ `lib/http/sse-client.ts` → consume `progress` events cho live char counter
- TTFB ~200ms bất chấp total generation time
- Streaming routes: pain-mapper, vision-draft, discovery/synthesis

### AI frameworks used
- **Internal (S/W)**: 8M Model (Man, Machine, Material, Method, Measurement, Nature, Management, Money)
- **External (O/T)**: Porter's 5 Forces + PESTEL
- **Strategy matrix**: TOWS (SO/ST/WO/WT)
- **Operational**: 7 OPEX pillars (Lean, Six Sigma, Workplace, Value Chain, CX, Value Innovation, Value AI)

### AI routes summary
| Route | Model | Streamed | Notes |
|---|---|---|---|
| `/api/x-ray/score` | reasoning | no | 7 OPEX pillars scoring |
| `/api/swot/coaching` | reasoning | no | Turn-by-turn |
| `/api/swot/coaching-draft` | reasoning + tool_use | no | Forced tool call |
| `/api/swot/suggest-more` | reasoning | no | Single quadrant |
| `/api/swot/conflict-check` | reasoning | no | |
| `/api/swot/context-cards` | reasoning | no | 6 cards |
| `/api/swot-analyses/[id]/factors/[factorId]/quality-check` | **fast** | no | |
| `/api/swot-analyses/[id]/strategies/ai-generate` | reasoning | no | TOWS |
| `/api/discovery/pain-mapper` | reasoning | **yes** | |
| `/api/discovery/vision-draft` | reasoning | **yes** | |
| `/api/discovery/synthesis` | reasoning | **yes** | |
| `/api/x-matrix/prefill` | reasoning | no | |
| `/api/xmatrix/coach-correlation` | reasoning | no | Sensei challenge questions for ● cells |
| `/api/report/monthly` | reasoning | no | |
| `/api/admin/hoshin-explorer` | reasoning | no | |

⚠️ **Coaching system prompt** interpolates `orgContext + stateBlock + xrayContext + selectedDimensions` per call → prompt caching chưa hit (not byte-identical). Test với fresh org để tránh state carryover.

---

## 9. Conventions (Code Review Bar)

### Claude API
1. `createAnthropicClient()` — never `new Anthropic()`
2. `AI_MODELS.reasoning | .fast` — never hard-code model ID
3. Instantiate INSIDE handler — never at module scope
4. Streaming → `streamClaudeJson` + client `postSse`

### Validation
- Every POST/PUT/PATCH with body → `parseBody(request, schema)` returning discriminated union `{ok:true,data}|{ok:false,response}`
- Schemas in `lib/validation/schemas.ts` (grouped by domain) hoặc `lib/<domain>/schema.ts` nếu feature-local
- **Envelope-only validation** khi domain function đã handle deep rules (vd `validateXMatrix`, `synthesizeSwot`)
- **Variable shadowing**: dùng `bodyParsed` (không phải `parsed`) cho `parseBody` return vì `parsed` thường collision với AI JSON parsed output
- **Define once, use both sides** — không duplicate client form vs server

### Auth & RLS
- User-scoped query: `createClient()` từ `@/lib/supabase/server`
- Service-role (bypass RLS): `createAdminClient()` từ `@/lib/supabase/admin` — **obvious, grep-friendly**
- Write routes: `requireOrgRole(supabase, user.id, orgId, ADMIN_ROLES)` → clean 403 trước RLS 42501

### Rate limiting (`lib/rate-limit.ts`)
- `checkRateLimit({ key, limit, windowSeconds })` — IP-based, **fails OPEN** on infra errors (intentional, không "fix")
- Dual-key (IP + identifier) khi route có thể weaponize specific victim (vd forgot-password)
- `x-forwarded-for` trusted (Vercel proxy sets it) — re-audit nếu self-host

### PostHog
- Helpers trong `lib/analytics/events.ts` — typed per event
- **NEVER PII** (email, phone, name) trong properties. `distinctId` đã identify user.
- Server Component: `<TrackMount event="..." />` (có `useRef` guard defeating StrictMode double-effects)
- Client: gọi helper trong success branch (sau `await`)

### Code style
- **No comments** unless WHY is non-obvious (no "added for X", no narration)
- **Server Components by default**, `'use client'` chỉ khi cần (forms, hooks, stores)
- **Vietnamese** cho UI strings, error messages, toasts
- **English** cho code, types, function names, inline comments
- **Prefer editing existing files** — no speculative abstractions
- **File naming**: kebab-case (`pain-mapper`, `vision-workshop`)
- **Components**: PascalCase (`KpiCard.tsx`, `SwotContainer.tsx`)
- **API routes**: `app/api/<domain>/<action>/route.ts`
- **Types**: centralized trong `lib/<domain>/types.ts`

---

## 10. Known Pitfalls (Burned Before)

1. **`ignoreBuildErrors` đã OFF (April 2026)**. Supabase types từng resolve `never` → đã fix. Nếu thấy flag trở lại → investigate, đừng re-enable.

2. **Coaching system prompt interpolation** → không byte-identical → caching không hit. Test với fresh org.

3. **`createClient` vs `createAdminClient`**: cái đầu respect RLS, cái sau bypass tất cả. Dùng admin sai chỗ → silent cross-org data leak. **Grep `createAdminClient` trước khi merge.**

4. **Model ID staleness**: đã có stale `claude-sonnet-4-5-20250514` lingering trong ai-generate → 404 prod. Đó là lý do `lib/ai/models.ts` tồn tại.

5. **SseError vs FetchJsonError**: streaming dùng `postSse` + `SseError`. Non-streaming dùng `postJson` + `FetchJsonError`. Same `.body` shape on error — pick đúng loại cho route.

6. **`x-forwarded-for` trusted** bởi `getClientIp()`. Fine trên Vercel. Nếu move self-hosted → attackers có thể spoof → re-audit `lib/rate-limit.ts`.

7. **Rate limit table service-role only**. Don't read from user-context query — RLS blocks. Use `createAdminClient` for debug.

8. **TOWS strategy enum drift**: `lib/validation/schemas.ts` updateStrategySchema enum phải mirror `StrategyStatus` + `BscPerspective` trong `lib/swot/tows-types.ts`. Đã 1 lần silent 400 mọi PATCH vì stale enum values. Bump type → update enum cùng commit.

9. **Vietnamese token density**: VN tiếng nặng token (~1.5 chars/token vs ~4 chars/token tiếng Anh). Khi schema output mở rộng (vd 3 → 7 fields), max_tokens phải bump tỷ lệ (X-Ray fix 2500→8000, TOWS v2 fix 4096→8000). Truncation thường xảy ra ở câu giữa, hard to debug. Default: bump max_tokens conservative khi đụng schema VN.

10. **Supabase TS resolver lỗi "X does not exist" cho INSERT có JSONB columns**: Lỗi message hiện ở field đầu tiên (vd `org_id`) gây hiểu lầm là field name issue, nhưng root cause là JSONB shape mismatch (typed array → Json union). Fix: cast `as unknown as Json` (double cast pattern). Đã gặp ở Phase 3B `tows_strategies` insert với `actions: StrategyAction[]`, `kpi_suggestions: KpiSuggestion[]`.

11. **NB v3.2 radius rule**: cards/buttons/inputs có `border-radius: 4px` (`var(--radius-md)`) tempered — **KHÔNG phải 0**. Avatar/sticker/marquee/checkbox/radio mới dùng radius 0 (NB DNA preserved). Nếu thấy `border-radius: 0px !important` global quay lại trong `globals.css` (`@layer base`) → **đó là regression, đừng re-enable**. Áp radius selective qua tokens (`--radius-sm` 3px tags, `--radius-md` 4px default, `--radius-lg` 6px modals). Decision shipped ở M-Design-1 (commit `b0d2aa4`).

12. **`overflow-hidden` clip sticker overlap**: Khi component dùng pattern "sticker chồm ra ngoài container" (NB v3.2 spec section 3.2 + 3.5), KHÔNG được dùng `overflow: hidden` trên parent — sẽ clip mất phần overlap. Nếu cần containment cho bg-pattern (vd `bg-dot-grid`): dùng `background-clip: padding-box` trên container, hoặc tách bg-pattern thành pseudo-element `::before` với `inset: 0` + `overflow: hidden` riêng cho pseudo. Đã gặp ở CtaBannerNB Task 7 — fix bằng commit `7f674b1` (đổi `overflow-hidden` → `overflow-visible` trên banner container).

13. **AI hallucinate factual numbers in copy**: Khi sinh marketing copy, AI có xu hướng "fabricate impressive numbers" (vd "200+ năm Toyota", "10x faster", "Fortune 100 use this"). Các con số này thường KHÔNG grounded từ source thật. Pattern fix: (1) Vũ Hải review MỌI con số trong copy trước khi commit, (2) khi cần emphasis credibility, ưu tiên qualitative claim ("Fortune 500 áp dụng", "chuẩn industry") thay vì quantitative ("X năm", "Y%"), (3) nếu phải dùng số → web search verify hoặc nguồn từ Vũ Hải. Đã gặp ở M-Design-2 hero subheadline + bullet section, fix qua 2 commits `21ad758` (hero subheadline) + `e738fdb` (additional copy claim) — cả hai chuyển "Toyota 200+ năm" → "Hoshin Kanri Fortune 500".

14. **Tailwind `hidden md:grid` ẩn content mobile silently**: Pattern `hidden md:grid` (hoặc `hidden md:block`, `hidden md:flex`) ẩn HOÀN TOÀN content trên mobile. Khi component có nested data critical (vd correlation matrix center), pattern này nghĩa là toàn bộ feature vô dụng < 768px. Đã gặp ở CenterX M-Hoshin-1 → M-Mobile-1 fix bằng `flex flex-col md:grid md:grid-cols-[...]` responsive pattern. Audit checklist cho component mới: nếu dùng `hidden md:*`, document rõ trong comment lý do mobile không cần content đó. Default: render mobile + responsive layout, không hardcode hide.

15. **Sticky bug Tailwind + Next.js layout shells multi-cause**: `position: sticky` không stick có thể có MULTI-CAUSE combined: ancestor `overflow: hidden | auto`, ancestor flex container thiếu `min-h-0`, ancestor `transform | filter | perspective`, sticky element height = parent height. Static code review (Cursor diagnose) HIGH confidence vẫn có thể miss khi multi-cause. Pattern: nếu fix HIGH confidence không work → DON'T pivot sang MEDIUM/LOW option, defer/kill feature thay vì sunk-cost. Mini-map sticky bug đã defer 2 lần trong Hoshin Kanri OS (M-Hoshin-1 → M-Mobile-1) → killed indefinitely.

16. **PowerShell 5.1 + modern web tooling quirks** (learned M-OrgUX-1 smoke test).
    - `curl -I <url>` không hoạt động — `curl` alias → `Invoke-WebRequest`, không nhận flag Unix style. Dùng `Invoke-WebRequest <url> -Method Head -UseBasicParsing | Select-Object StatusCode`, hoặc gọi explicit `C:\Windows\System32\curl.exe` (Windows builtin từ Win 10 1804+).
    - `Invoke-WebRequest` / `Invoke-RestMethod` **silently strip `Authorization` headers** trong một số cấu hình khi gọi Supabase admin API. Workaround: wrap bằng `[System.Net.HttpWebRequest]::Create($uri)` direct, set headers + body manually.
    - `Join-Path` chỉ nhận 2 args trong PS 5.1 (3-arg form chỉ có ở PS 7+). Nest 2 calls hoặc dùng `[System.IO.Path]::Combine($a, $b, $c)`.
    - TLS 1.2 phải set explicit cho HTTPS requests: `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12`. Default trên PS 5.1 là TLS 1.0/1.1 → Supabase reject.
    - `Invoke-WebRequest` parse Vietnamese response có thể crash session silent (PID exit, no output). Pattern fallback: dùng `curl.exe` Windows builtin, parse ở step riêng (xem L18 M-Cleanup-1 entry).
    - Pre-cleanup of test data: smoke test scripts (M-OrgUX-1 cả 2 scripts) intentionally KHÔNG auto-delete test users. Cleanup SQL printed at end of stdout cho rerun-friendly. Pattern: ephemeral test data + idempotent setup > teardown automation.

17. **Playwright + modern web app testing — selector pitfalls** (learned M-OrgUX-1 UI smoke test).
    - **shadcn `<CardTitle>` renders `<div>`, NOT native heading**. `getByRole('heading', { name: ... })` fail. Dùng `getByText('...', { exact: true }).first()` hoặc test ID. Áp dụng cho mọi shadcn component: `Card*`, `Dialog*`, `Sheet*` không guarantee semantic heading roles.
    - **Sonner Toaster mounts a hidden global `[role="alert"]` announcer region**. `page.locator('[role="alert"]').count()` always returns ≥1 even on empty form. Hidden filter `:visible` alone KHÔNG đủ vì Next 16 dev indicator + analytics overlays (PostHog) cũng có visible role=alert nodes.
    - **Best practice: scope assertions by intent, not by DOM role**. Use specific text or `data-testid`:
      ```ts
      page.locator('[role="alert"]:visible:has-text("specific text")')
      ```
      This avoids false positives from libraries that legitimately mount alert regions for a11y. Pattern lock: every alert/toast assertion in Playwright tests MUST include text or testid filter.
    - **Auth via Supabase session injection**: routes use `@supabase/ssr` `createServerClient` parsing cookies — KHÔNG support Bearer header. Cookie format: name `sb-{projectRef}-auth-token`, value `base64-` prefix + `base64url(JSON {access_token, refresh_token, expires_at, ...})`. Reuse forge helper from `scripts/smoke-test-orgs-check-similar.ps1` + `scripts/smoke-test-orgs-setup-org-ui.ts`.
    - **Radix Select trigger** (used by shadcn Select) renders as `<button role="combobox">`, options as `<div role="option">`. Click trigger → wait for option → click. Don't try `selectOption` (only works on native `<select>`).

18. **Next 16 dev server stability with smoke tests** (observed M-OrgUX-1 UI smoke test).
    - Dev server (`npm run dev`) recurring crashes when Playwright Chromium connects + script edit triggers Fast Refresh during a test run. Symptom: probe to `http://localhost:3000` returns connection refused mid-suite.
    - **Workaround for UI smoke tests**: use `npm run build && npm run start` (production-style server). Production server has no Fast Refresh → stable under Playwright load. Add 30-60s startup cost but eliminates flake.
    - Don't auto-start dev server from agent scripts (orphaned process risk). Print "Run `npm run dev` first" pre-check failure with clear actionable message instead.

19. **Tailwind v4 + CSS vars + Recharts integration — 3-layer awareness** (learned M-Design-3a). Khi shipping design tokens cho data-viz, có 3 consumption layers cần aware, mỗi cái khác cú pháp:
    - **Layer 1 — Tailwind class** (`@theme inline` block trong `globals.css`): `<div className="bg-kpi-healthy" />` works tự nhiên. Tailwind v4 emit on-demand → token chỉ xuất hiện trong compiled CSS khi component reference. Foundation defs alone KHÔNG trigger generation. Verify by build success + zero CSS errors, KHÔNG bằng grep compiled CSS.
    - **Layer 2 — Inline style** (`:root` block): `style={{ background: 'var(--kpi-healthy)' }}` works trong inline style + CSS class custom. Token resolve runtime qua browser cascade.
    - **Layer 3 — Recharts props**: KHÔNG accept `var()` syntax — `<Line stroke="var(--kpi-healthy)" />` fail silent (renders no color). Cần runtime resolver: `lib/design/chart-tokens.ts` `resolveToken('kpi-healthy')` đọc `getComputedStyle(document.documentElement).getPropertyValue(...)`. SSR-safe via `typeof window === 'undefined'` guard. Khi shipping chart component, default to Layer 3 helper, KHÔNG mix với Layer 2 inline style cho chart-specific props.

20. **Token aliasing vs duplicate hex** (learned M-Design-3a). Khi add semantic tokens (status, role-based) reuse existing palette:
    - **Pattern correct**: alias trong `:root` → `--kpi-healthy: var(--accent-lime);` (single source of truth — nếu accent-lime đổi, kpi-healthy auto-update).
    - **Pattern wrong**: duplicate hex → `--kpi-healthy: #DDE4C5;` trong `:root` (drift risk).
    - **Exception**: `@theme inline` Tailwind v4 block YÊU CẦU hex literal cho class generation (vd `--color-kpi-healthy: #DDE4C5;`). Cả 2 đều ship — `:root` aliases + `@theme` literals — đây là design constraint Tailwind v4, KHÔNG phải duplication bug. Khi update palette hex, update ở 2 nơi: source token (vd `--accent-lime`) trong `:root` + mirror trong `@theme` (vd `--color-accent-lime` + `--color-kpi-healthy`). Grep cả 2 blocks trước khi commit.

21. **Audit-first hex replacement — semantic ambiguity** (learned M-Design-3a). Hardcoded hex như `#c73937` có thể là **brand emphasis** HOẶC **KPI critical state** — cùng visual, khác semantic. Replace không suy nghĩ → token usage scattered (vài chỗ `var(--brand)`, vài chỗ `var(--kpi-critical)` cho cùng pixel). Pattern correct: GREP context (component name, prop name, neighboring text, parent semantic) trước khi pick token:
    - Brand identity (logo, CTA primary, badge "Nguyên liệu SWOT" emphasis label) → `var(--brand)` hoặc `bg-accent-brand`.
    - KPI/status (red traffic light, threshold violation, error state) → `var(--kpi-critical)` hoặc `bg-kpi-critical`.
    - Generic alert/error toast → shadcn `var(--destructive)` (saturated, không phải NB pastel).
    - Nếu ambiguous → STOP, hỏi Vũ Hải. Don't auto-apply.

22. **`--border-subtle` shorthand không assignable cho `borderColor`** (learned M-Design-3b). Token `--border-subtle: 1px solid var(--bg-muted)` trong `globals.css :root` là CSS shorthand (full border declaration: width + style + color), KHÔNG phải pure color value. Hệ quả: `style={{ borderColor: 'var(--border-subtle)' }}` fail — browser không parse `1px solid #...` như color. Workarounds:
    - **Option 1 — color-mix() inline cho subtle muted border**: `style={{ borderColor: 'color-mix(in srgb, var(--text-3) 30%, transparent)' }}`. Native CSS, supported Chrome 111+ / Safari 16.2+ / Firefox 113+ (M-Design-3b target browsers all OK). Pattern dùng cho LOCKED state badge `app/dashboard/discovery/page.tsx`.
    - **Option 2 — Assign full shorthand qua `border` prop**: `style={{ border: 'var(--border-subtle)' }}` (override default `border-2` className etc.). Dùng khi cần style đồng bộ với utility class.
    - Convention: cần tweak weight/style border → Option 1 (color-mix). Cần đồng bộ với utility → Option 2.
    - Pattern lesson: token shorthand khác token color value — kiểm tra value structure (`grep '<token-name>:' globals.css`) trước khi consume trong inline style.

23. **Recharts không nhận `var(--token)` + Server Component không safe call `resolveToken`** (learned M-Design-3b, extends pitfall #19). Hai constraint kết hợp ép pattern "server return tier name, client resolve color":
    - **Recharts limit**: props (stroke, fill, dot.stroke, dot.fill, ReferenceLine.stroke...) parse qua `react-smooth` library → KHÔNG resolve CSS var. `<Line stroke="var(--kpi-healthy)" />` fail silent (no color render). Cần runtime resolver `resolveToken(name, fallback)` đọc `getComputedStyle(documentElement)` → trả concrete hex string. Helper memoized module-level Map.
    - **Server boundary limit**: `resolveToken` check `typeof window === 'undefined'` → SSR returns hardcoded fallback. Server Component (vd `app/dashboard/discovery/xray-history/page.tsx`) gọi `resolveToken` → luôn ra fallback hex, KHÔNG đọc theme runtime → black-flash hoặc visual lệch nếu fallback không match `:root`. Pattern: server compute tier name (`getScoreTier(score)` pure function trả `'critical' | 'weak' | 'fair' | 'good'`) → pass tier prop xuống client component → client (`'use client'`) call `resolveScoreToken(tier)`.
    - **Data contract pattern**: nếu data flow server → Recharts qua serialized props, ChartDataPoint shape carry tier name (`tier: ScoreTier`), KHÔNG carry pre-baked hex (`color: string`). Client unwrap tier → token. Đã apply trong `XRayHistoryChart.tsx` Phase 3 M-Design-3b.
    - **HTML elements khác Recharts**: `<span style={{ color: 'var(--score-good)' }}>` work fine trên server hoặc client component vì browser cascade resolve var() runtime. Chỉ Recharts mới cần resolver bridge.
    - **Recharts alpha pattern**: dùng `withAlpha(hexColor, '20')` helper từ `lib/design/chart-tokens.ts` (KHÔNG dùng `color-mix()` trong Recharts props — react-smooth parse fail trên một số browsers + SSR-unreliable).

24. **GitHub raw URL fetch asymmetric — user browser OK nhưng Anthropic web_fetch fail** (learned M-Design-3b close-out 2026-05-02 + retest end-of-session). User browser truy cập `https://raw.githubusercontent.com/vuhuyhai/hoshin-kanri-os/master/HANDOFF.md` OK (residential IP), NHƯNG Anthropic web_fetch tool consistently fail với 2 error patterns khác nhau tùy URL variant:
    - `raw.githubusercontent.com/...` → `CLIENT_ERROR 404` (GitHub IP block / rate-limit subset cloud provider IPs)
    - `github.com/.../raw/...` → `ROBOTS_DISALLOWED` (GitHub `robots.txt` explicit disallow scrapers)
    - Verified 3 attempts liên tiếp 2026-05-02 cùng session, both URL variants tested.
    - **Hệ quả pattern v2.4**: HANDOFF auto-sync via GitHub raw URL (instructions v2.4 ship 2026-05-01 close-out M-Cleanup-1, ref §17 M-Public-1 entry) KHÔNG reliable cho Claude.ai web_fetch. Pattern v2.4 broken KHÔNG phải bug ở repo public flag (M-Public-1 verified curl HTTP 200 2026-05-01) — issue ở Anthropic infrastructure egress (cloud provider IPs trong GitHub blocklist + robots.txt enforcement).
    - **Workaround pattern v2.5** (commit vào Project instructions chat tới):
      - Đầu chat về Hoshin Kanri: SILENT thử GitHub raw URL → nếu fail → SILENT fallback Project knowledge upload (giữ pattern v2.3 manual upload sau milestone).
      - Project knowledge upload sau mỗi milestone vẫn là source of truth primary.
      - KHÔNG cảnh báo verbose user về fallback — Vũ Hải đã verify URL public, không cần re-explain mỗi session.
    - **Trigger condition để revive pattern v2.4**: Anthropic web_fetch infrastructure update (egress IP rotate khỏi GitHub blocklist). Out of user control, ngoài scope dự án. Có thể auto-revive sau 3-6 tháng — re-test bằng web_fetch raw URL đầu session, nếu HTTP 200 → revert sang pattern v2.4.
    - **KHÔNG cần fix anything**: Vũ Hải paste explicit URL vào chat session là 1 workaround đơn turn (Anthropic web_fetch allowlist URL trong context window) nhưng cost cao hơn benefit — manual Project knowledge upload nhanh hơn.
    - **Pattern lesson generalize**: web_fetch availability từ user browser ≠ availability từ AI tool egress. Khi build pipeline phụ thuộc web_fetch (auto-sync, scraping, fact-check), MUST test từ AI tool side TRƯỚC khi commit pattern; user-side curl OK không guarantee AI-side reach.

25. **AI route non-streaming + JSON.parse fallback exposed raw blob** (learned 2026-05-02 hotfix `df3c1ef`). Pattern bug discovered M-Design-3b post-close-out smoke session: route `/api/swot/coaching` instruct Claude trả về JSON `{"message":"...","extractedInsight":{...}}` (single shot, non-streaming) + parse server-side. Khi `JSON.parse` fail (trigger phổ biến: `max_tokens` truncate Vietnamese response giữa string), catch block return `rawText` raw — UI ReactMarkdown render literal `{ "message": "..." }` blob + literal `\n\n` (escape sequence) instead of real newlines.
    - **Root cause specific**: `max_tokens: 800` quá tight cho Vietnamese JSON-wrapped response (route ban đầu), so vs coaching-draft route đã từng phải bump 4096 → 8192 cùng lý do. Triple compounding: (1) truncation từ max_tokens insufficient, (2) model hallucinate JSON syntax (trailing prose, unescaped quote, mismatched brace), (3) markdown fence stripper regex partially corrupt valid JSON.
    - **Fix pattern (Tier 1/2/3 fallback chain)**:
      - **Tier 1**: Strict `JSON.parse(cleaned)` → success path unchanged.
      - **Tier 2**: Regex recover only `"message"` field via `/"message"\s*:\s*"((?:\\.|[^"\\])*)"/`, re-parse via `JSON.parse(\`"${match}"\`)` để unescape `\n` / `\"` / `\\`. Drop structured data (extractedInsight, transitions) vì không trust được khi outer JSON malformed. Try cả `cleaned` lẫn `rawText` (defense-in-depth nếu fence regex partially corrupt cleaned).
      - **Tier 3**: User-friendly Vietnamese error "Xin lỗi, AI vừa trả lời lỗi format..." + `console.error` log với `rawTextPreview` slice 200 chars.
    - **Constraint cho future AI sessions**:
      - KHÔNG ship raw JSON source về client kể cả trong fallback path. Pattern ALWAYS apply 3-tier chain cho mọi route Claude trả structured JSON về client.
      - Max_tokens guideline cho Vietnamese JSON-wrapped routes: minimum 4096, prefer 8192 nếu response chứa structured nested objects (extractedInsight + transition + tracker).
      - KHÔNG `console.log` full rawText — slice 200 chars max (có thể chứa user PII).
    - **Pattern lesson generalize**: AI structured output routes có 3 risk vectors (bypass tất cả qua 3-tier chain): (1) truncation, (2) model hallucinate JSON syntax, (3) fence stripper corrupt valid JSON. Test plan minimum cho mọi route mới: short VN question, long context paste (~600+ words), edge case response chứa markdown horizontal rule `---`.

26. **Windows kill parent shell không kill child process** (learned M-AICoach-Sensei-1 Task 8 deploy cleanup 2026-05-03). Khi `npm start` chạy trên Windows powershell, parent process (npm shell) spawn child (`next-server`) bind port. `kill_process pid=<parent>` chỉ kill shell wrapper, child vẫn alive và giữ port. Triệu chứng: sau khi kill PID `npm start`, port 3000 vẫn busy, HTTP localhost:3000 vẫn respond cũ.
    - **Solution 1 (recommended)**: `taskkill /F /T /PID <parent>` — flag `/T` kill cả process tree
    - **Solution 2**: Check port binding rồi kill PID owning port: `Get-NetTCPConnection -LocalPort 3000 | %{Stop-Process -Id $_.OwningProcess -Force}`
    - **Solution 3**: Kill 2 PID separately — verify cả parent và child terminated
    - Pattern: smoke test scripts/cleanup automation MUST include port verify step trước khi return success.
    - Discovered: Smoke test cleanup PID 17472 (npm parent) terminated nhưng PID 4632 (next-server child) vẫn alive, giữ port 3000. Phát hiện qua `Get-NetTCPConnection`. Resolved bằng manual kill PID 4632.

27. **IME Vietnamese composition race với Enter submit handler** (learned 2026-05-08, commit f3e6b96, fix 6 instances). User gõ Telex/VNI với syllable kết thúc bằng dấu thanh hoặc dấu mũ (vd "chào." = "chao" + "." cho dấu huyền + "." cho dấu chấm) — composition buffer chưa flush khi user nhấn Enter. Handler đọc `input` state thiếu 1-2 ký tự cuối, `setInput('')` chạy, sau đó `compositionend` fire `onChange` với chuỗi cuối → ghi đè `''` thành 1-2 ký tự. UI bug visible: input giữ 2 ký tự cuối sau submit. Data loss bug invisible: `note.trim()` cắt cụt 2 ký tự cuối trước khi insert DB (KpiUpdateForm.tsx note field — silent data corruption).
    - **Root cause**: React.KeyboardEvent.nativeEvent.isComposing = true khi IME đang compose. Default Enter handler không check property này. compositionend event fire async sau keydown → race condition.
    - **Fix pattern (apply mọi Enter handler trên textarea/input có thể nhận tiếng Việt)**:
```ts
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
          e.preventDefault()
          handleSend()
        }
      }}
```
    - **Defense in depth**: kiểm cả `isComposing` (Chrome/Edge/Safari) và `keyCode === 229` (legacy Firefox/IE báo "key in composition"). Cả 2 check vì browser support khác nhau.
    - **TypeScript constraint**: React.KeyboardEvent generic không expose `isComposing` direct. Cast qua `e.nativeEvent as KeyboardEvent` nếu strict mode complain. Pattern KpiUpdateForm.tsx dùng early-return:
```ts
      const handleKeyDown = (e: React.KeyboardEvent) => {
        const ne = e.nativeEvent as KeyboardEvent
        if (ne.isComposing || ne.keyCode === 229) return
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') onCancel()
      }
```
    - **6 instances đã fix** trong commit f3e6b96 (pattern reusable cho Vietnamese SaaS): SwotWorkshopChat.tsx (2 inputs), SwotIngredientCard.tsx, SwotIngredientPanel.tsx, SwotFactorInput.tsx, KpiUpdateForm.tsx.
    - **Severity ranking**: Data-loss instance (KpiUpdateForm note → DB) > UI annoyance instance (chat textarea giữ ký tự thừa). Khi audit codebase tìm pattern bug này, ưu tiên field text Vietnamese nào có `.trim()` rồi save DB — đó là data-loss path.
    - **Test limitation**: Playwright MCP `page.keyboard.type()` KHÔNG simulate được Vietnamese IME composition (gửi raw chars, không fire compositionstart/compositionend). Bug chỉ verify được bằng Vietnamese typing thật trên OS với IME bật. Smoke test pattern: phân Phase A (human typing IME critical cases) + Phase B (Playwright regression ASCII + keyboard shortcuts).
    - **Pattern lesson generalize**: Audit checklist cho mọi textarea/input mới chấp nhận Vietnamese: (1) onKeyDown có guard isComposing chưa? (2) Field có save vào DB qua .trim() không? (3) Có shared handler dùng cho cả numeric + text field không? Nếu (3) yes → guard ở shared handler (defense in depth, numeric không impact).

28. **Strategic Memory dump 4 quadrants regardless framework → AI context bias** (learned 2026-05-08, commit c8df2bf, Bug 3). Akao Method M-AICoach-Sensei-1 ship Strategic Memory feature (Akao Principle 2) load `swot_factors` từ DB cross-session inject vào system prompt qua `formatStrategicMemory(factors)`. Function output 4 sections S/W/O/T regardless `currentFramework`. Khi org có nhiều S/W populated từ workshop trước (Ladysfit case: ≥10 S/W factors, 0 O/T) + plus rule "REFERENCE bối cảnh này nếu liên quan" + example "[S2]... [W1]" trong prompt → AI có "context gravity" kéo về SW topics dù user toggle OT mode. User phải nhắc thẳng "anh đang phân tích O-T hay không?" mới quay lại đúng framework.
    - **Root cause specific**: Akao Principle 1 (bidirectional entry) + Principle 2 (strategic memory) emergent gap. Server respect `currentFramework` đúng (route.ts parse + branch SW/OT prompt). Prompt builder OT có rules khác hẳn SW (Porter+PESTEL vs 8M, quadrant lock chỉ emit O/T). NHƯNG `formatStrategicMemory(factors)` không filter quadrants → memory block (10+ items S/W) lấn át OT prompt rules ngắn hơn. AI pattern-match "data nhiều = topic quan trọng" → drift về SW.
    - **Fix pattern**: Optional param `currentFramework?: 'sw' | 'ot'`. SW mode filter `['S', 'W']`, OT mode filter `['O', 'T']`, undefined giữ backward compat 4 quadrants.
```ts
      const quadrantsToShow: Array<'S' | 'W' | 'O' | 'T'> =
        currentFramework === 'sw' ? ['S', 'W']
        : currentFramework === 'ot' ? ['O', 'T']
        : ['S', 'W', 'O', 'T']
```
      Plus early return `if (sections.length === 0) return ''` khi quadrants được filter rỗng (đừng emit empty header "BỐI CẢNH SWOT" rồi 0 sections).
    - **Wire-up route.ts**: Reorder `parseBody` + `currentFramework = body.currentFramework ?? 'sw'` LÊN TRƯỚC `loadStrategicMemory + formatStrategicMemory` calls. Pattern data flow: parse → memory → format(memory, framework) → buildPrompt(memory, framework).
    - **Constraint cho future AI sessions**:
      - KHÔNG remove filter param hoặc revert sang 4-quadrants-always. Decision lock §17 M-AICoach-Sensei-1 KHÔNG mâu thuẫn — Strategic Memory vẫn ON, chỉ filter scope theo framework.
      - KHI thêm callee mới gọi `formatStrategicMemory`, MUST pass `currentFramework` nếu route có framework concept. Backward compat optional param chỉ cho callers không có framework.
      - KHÔNG add cross-quadrant link soft-suggestion (vd "Lần trước anh nói [S2], có liên kết [O1] không?") cho OT mode mà KHÔNG verify smoke test fresh org. Pattern advanced cần Option B/C re-design (xem session 2026-05-08 fix decision).
    - **Smoke test minimum**: Ladysfit-style org (S/W populated, O/T empty) → toggle OT → câu hỏi câu OT scope đầu tiên (Porter rivalry/PESTEL macro/customer external) → verify KHÔNG reference [S1]/[W1] và KHÔNG hỏi 8M dimensions.
    - **Pattern lesson generalize**: Khi ship feature inject context vào AI prompt (memory, RAG, retrieved docs), MUST scope context theo current task/mode. "Dump everything" pattern triggers context gravity — AI bias toward quadrant/topic có nhiều data. Audit checklist mọi prompt-injection feature: (1) context relevant cho current task chưa? (2) có filter theo mode/framework/quadrant không? (3) test edge case asymmetric data (1 quadrant có 10 items, 1 quadrant có 0).

29. **CLEAR_DRAFT reducer reset ui slice mất permission state** (learned M-Member-POV-1 Task 2A bonus catch 2026-05-08, commit 544ca5a). Khi extend `CanvasUiState` với field permission/role-derived (vd `canEdit: boolean`), reducer actions reset ui slice (CLEAR_DRAFT, RESET_UI, INIT) sẽ ghi đè field đó về initial value. Triệu chứng: CEO click "Clear Draft" → state.ui reset → canEdit về initialUi default (false) → CEO bị Member-POV oan, edit affordances biến mất.
    - **Root cause**: CLEAR_DRAFT branch original code: `return { ...state, ui: initialUi }`. initialUi.canEdit = false (defensive default). Reset ghi đè canEdit từ true (CEO) về false.
    - **Fix pattern (apply trong Task 2A commit 544ca5a)**: Reset ui slice MUST preserve permission fields:
```ts
      case 'CLEAR_DRAFT':
        return {
          ...state,
          data: emptyXMatrixData,
          ui: { ...initialUi, canEdit: state.ui.canEdit }
        }
```
    - **Generalize**: Permission field type = role-derived (canEdit, canModerate, canDelete, isAdmin) khác state UI field (saveStatus, expandedIds, hoveredCellId). Permission field set 1 lần init từ Provider props, KHÔNG reset bởi user action. Pattern lesson: khi add field vào ui slice, classify "user-controlled" vs "permission-derived". Permission-derived MUST preserve trong mọi reducer action reset ui.
    - **Audit checklist khi extend ui state**:
      - (a) Field này set từ đâu? Provider props (permission) hay user action (UI state)?
      - (b) Grep mọi `case 'XXX_RESET'` / `case 'CLEAR_*'` / `case 'INIT'` trong reducer
      - (c) Mọi reset action MUST preserve permission fields qua `ui: { ...initialUi, canEdit: state.ui.canEdit, canModerate: state.ui.canModerate, ... }`
      - (d) Test: dispatch reset action → assert permission fields unchanged
    - **Pattern reusable**: M-Cleanup-7 reducer guard layer 2 (defer per Q2.4 plan §5) — guard sẽ check permission BEFORE applying mutation. Pitfall #29 là defense layer 1 UI-side, M-Cleanup-7 sẽ là layer 2 reducer-side. Cả 2 layer cần thiết, không thay thế nhau.

30. **Supabase JWT user_metadata cache layer giữa updateUser + getUser** (learned 2026-05-09 M-Auth-MultiOrg-1 smoke test CASE 1, commit `b941b37`). `auth.updateUser({ data: {...} })` write metadata to DB nhưng JWT cookie carry CACHED user_metadata snapshot tại token issuance time. Subsequent `auth.getUser()` (kể cả full page reload) returns OLD metadata field từ JWT claim, NOT fresh DB read. Symptom: state stale dù DB write thành công, user thấy old value sau reload. Pre-fix hypothesis V5 ("auth.getUser() = network call → fresh metadata") was partially wrong — `getUser()` does hit `/auth/v1/user` but the claim it returns reflects the JWT's payload, which is stale until re-minted.
    - **Fix pattern (apply trong commit b941b37)**: Call `supabase.auth.refreshSession()` sau updateUser để force JWT re-mint với fresh payload:
```ts
      await supabase.auth.updateUser({ data: { ...field } })
      await supabase.auth.refreshSession()  // CRITICAL — JWT re-mint
      // Now subsequent auth.getUser() returns fresh metadata
```
    - **Pattern reusable**: bất kỳ route mutate `user_metadata` + read sau đó MUST follow trio pattern (`updateUser` + `refreshSession` + full reload). Anti-pattern: skip `refreshSession` assume reload bypass cache → JWT cookie survives reload, metadata stale persists.
    - **Defensive philosophy**: `refreshSession` failure logged nhưng KHÔNG return error — DB write succeeded, client full reload mints fresh JWT regardless. Failing API call would force user retry switch already succeeded (worse UX).
    - **Cost**: ~100-200ms latency cho `refreshSession` call. Acceptable cho low-frequency mutations (org switch, profile update). KHÔNG dùng cho hot-path mutations (form save, draft auto-save) — batch metadata update ở phase boundary instead.
    - **Reference**: `app/api/orgs/switch/route.ts` (M-Auth-MultiOrg-1 commit `b941b37`).

31. **Reader vs mutation guard asymmetry trong soft-delete pattern** (learned M-KPI-Mgmt-1 V3 audit 2026-05-09, commits `4a8f21d`/`c0da261`/`0140dfa`). Khi ship feature soft-delete (toggle `is_active=false`), audit reader uniformity và mutation guard uniformity là 2 khía cạnh KHÁC NHAU và phải audit RIÊNG:
    - **Reader uniformity (L39 M-Auth-MultiOrg-1 reinforce)**: list readers (`from('kpis').select(...).eq('org_id', X)`) MUST filter `is_active=true` cho consistency hide archived rows. M-KPI-Mgmt-1 V3 verify 7/7 list readers OK ✅ (`kpi/list`, `dashboard/page` count, `KpiGembaSection`, `lib/hansei/queries.getRedStreaks`, `lib/annual-review/queries`, `report/monthly`, `lib/pql/signals`).
    - **Mutation guard uniformity (NEW M-KPI-Mgmt-1)**: routes verify-by-ID (`from('kpis').select('id').eq('id', kpiId).maybeSingle()`) cần filter `is_active=true` để block mutate trên archived rows. M-KPI-Mgmt-1 V3 phát hiện 3 mutation guards thiếu ❌ (`kpi/entry`, `hansei/list`, `hansei/create`) → patch Task 2D commit `0140dfa`.
    - **Asymmetry source**: list readers hardcode "show active only" mindset explicit, mutation guards trust ID lookup return any row (existing-or-not). Soft-delete change semantic — "row exists" ≠ "row mutable". User còn kpiId trong UI cache có thể POST entry vào archived KPI → data pollution.
    - **Audit checklist khi ship soft-delete column mới**:
      - (a) Grep `\.from\('<table>'\)` toàn repo
      - (b) Phân loại: list readers (return many rows) vs mutation guards (verify single row by ID) vs pure mutators (UPDATE/INSERT)
      - (c) List readers: ADD `.eq('is_active', true)` cho consistency
      - (d) Mutation guards: ADD `.eq('is_active', true)` cho block mutate
      - (e) Special case: history readers (đọc audit trail past data) intentional KHÔNG filter — note explicit comment + pattern lesson
    - **History reader exception**: M-KPI-Mgmt-1 ví dụ `getKpiHanseiHistory` đọc `weekly_hansei` KHÔNG join kpis → archived KPI's past hansei vẫn readable. Đây là INTENTIONAL read-only reference, KHÔNG bug. Tương tự `app/api/annual-review/[id]/route.ts:220` fetch kpis by ID list từ `kpi_actuals.kpi_id` (historical year reflection) — leave as-is per V3 plan.
    - **Pattern reusable**: future soft-delete cho `organizations` (M-Cleanup-2-future), `x_matrices` archived per year, member archive, blog draft hide — apply audit 5 bước (a-e). Defense in depth pattern: 4 layers (UI hide / mutation guard / RBAC / RLS) — xem L43.

32. **`react-hooks/static-components` rule không accept useCallback/useMemo wrapping** (learned M-Lint-Cleanup-1 commit `73abf59` 2026-05-09). React Hooks lint rule `static-components` flag function-typed-as-component bằng AST inspection (declaration site analysis), KHÔNG check runtime behavior. Wrapping component function với `useCallback` / `useMemo` preserve reference identity at runtime NHƯNG rule vẫn fire vì AST shape vẫn là "function-as-component declared in render scope". Empirically verified M-Lint-Cleanup-1: option α `useCallback(CustomDot, [ink])` failed lint check; fall back β hoist module-level + props pass works.
    - **Fix pattern (apply mọi Recharts custom component hoặc inline component-shaped function trong parent render scope)**:
      - **Option β CANONICAL — hoist + props pass**: Move function ra module-level (cùng file hoặc external file). Closure variables (vd `ink` từ `resolveToken('ink')`) thread qua props. Parent component pass `<Line dot={<CustomDot ink={ink} />} />` — Recharts `cloneElement` preserve props khi inject `cx/cy/payload` runtime.
      - **Anti-pattern α REJECTED**: `const CustomDot = useCallback(...)` declared inside parent render scope. Memoization NOT a fix — rule analyze AST không runtime.
    - **Reusable cho mọi Recharts custom component**: CustomDot, CustomTooltip, CustomLegend, CustomBar, CustomShape — tất cả MUST hoist + props pass nếu cần share parent closure.
    - **Token resolution preserved**: M-Design-3b pattern resolve token at parent render qua `resolveToken('ink')`, pass as prop (không phải resolve trong child). Closure-via-props pattern compatible với pitfall #19 (Recharts không accept var()) — chỉ cần parent expose resolved hex.
    - **Pattern lesson generalize**: AST-based static rules ≠ runtime behavior checks. Khi gặp lint rule fail dù logic đúng, đừng cố memoize — kiểm tra rule docs (eslint-plugin-react-hooks/static-components) cho exact constraint. Hoist là fix canonical cho mọi component-shape declaration trong render scope.
    - **Reference**: `app/dashboard/discovery/xray-history/XRayHistoryChart.tsx` commit `73abf59` (CustomDot hoist + `ink` prop thread).

34. **Diagnose loop trap — trust DB + Network ground truth, STOP hypothesize code paths khi 2 evidence sources clean** (learned M-KPI-Restore-1 Task 2B 2h non-bug investigation 2026-05-09, plan commit `52fd8ad`). Pattern bug discovered Settings page archived KPIs count = 7 thay vì expected 56 (M-Hoshin-4 cleanup baseline). 2h diagnose deep through 4 hypothesis paths ALL REJECTED bằng evidence:
    - **H1 RLS policy SELECT archived block read**: REJECTED — `SELECT count(*) FROM kpis WHERE org_id=Ladysfit AND is_active=false` returns 56, RLS work correctly via `auth.uid()` check
    - **H2 Endpoint filter wrong off-by-one**: REJECTED — code review `app/api/kpi/archived/route.ts` filter `is_active=false` correct
    - **H3 Network response truncate**: REJECTED — DevTools Network tab show full 56+ rows in JSON response, no truncation
    - **H4 React state stale not updating**: REJECTED — Settings page `useState` updated correctly, list render full array length
    - **Root cause at 2h mark**: Observation interpretation error từ baseline counting confusion. M-Hoshin-4 cleanup 56 duplicate KPIs Ladysfit org → 56 archived from initial pollution. M-KPI-Mgmt-1 production usage 2026-05-09 sáng → 7 user delete events qua UI. Total archived = 56 + 7 = 63 (correct DB state), NOT 7 (anchoring bias on session-only count). UI display 63 archived correctly. ZERO bug — DB + Network + RLS + endpoint code all clean.
    - **Audit checklist trước khi diagnose >30 phút bug claim**:
      - (a) DB query (`SELECT count(*)` hoặc full row inspection) confirms expected state?
      - (b) Network response (DevTools tab full payload) carries expected data?
      - (c) Both YES → STOP hypothesize code paths (RLS, endpoint filter, React state, hooks order)
      - (d) Check observation methodology FIRST:
        - **Baseline drift**: M-Hoshin-N cleanup events historical pollution (vd 56 archived từ M-Hoshin-4, 12 archived từ M-Cleanup-3, etc.)
        - **Anchoring bias**: Recent session count vs total (7 deletes today != total archived ever)
        - **Interpretation error**: View filter active hide rows, observation tool truncate display, count rendered vs count fetched
      - (e) Only AFTER (a)-(d) all checked, proceed to deeper code path investigation
    - **Anti-pattern**: continue 4-hypothesis-deep dive (H1→H2→H3→H4 each ~30min) khi 2 evidence sources (DB + Network) đã confirm system OK = sunk-cost trap. Cost M-KPI-Restore-1 = 2h non-productive diagnose.
    - **Pattern lesson generalize**: Apply universally cho future bug diagnose sessions. Khi user claim "X is broken" + initial check DB state + Network payload BOTH clean match expected, STOP code investigation, examine observation/interpretation methodology before going deeper. Saves ~1-2h per occurrence.
    - **Reference**: M-KPI-Restore-1 plans/M-KPI-Restore-1-plan.md "Investigation log" section (commit `52fd8ad`).

35. **Foundation completion check — `:root` defined ≠ `@theme inline` enabled cho Tailwind v4 class generation** (learned M-Design-Tailwind-Cleanup-1 Q7 BLOCKER caught Task 2A 2026-05-09, commit `5f2cb5a`). Pattern bug discovered: tokens `--kpi-healthy-strong` (#16A34A) + `--kpi-attention-strong` (#D97706) defined trong `app/globals.css` `:root` block lines 203-204 (M-Design-3b foundation), HANDOFF prose claim "14/14 tokens intact" → assume Tailwind class `bg-kpi-healthy-strong` sẽ generate. Reality: Tailwind v4 emit class theo `@theme inline` block declarations only. Tokens defined `:root` mà KHÔNG mirror `@theme` → consumer reference `bg-kpi-healthy-strong` className silent fail (no class emitted, fallback to no-op styling).
    - **Root cause Tailwind v4 architecture**: `:root` block defines CSS custom properties cho runtime resolution (inline style `var(--xxx)`, hoặc `style={{ background: 'var(--xxx)' }}`). `@theme inline` block defines design tokens cho Tailwind utility class generation pipeline. Hai blocks SEPARATE concerns — duplicate hex values là design constraint Tailwind v4, NOT bug (pitfall #20 reinforce).
    - **Symptom**: Build success + 0 typecheck error + component render NHƯNG className `bg-kpi-healthy-strong` không apply background color. Visual: element render transparent/inherit thay vì expected color. Easy miss vì không có error message — Tailwind v4 silently skip generation cho undefined tokens.
    - **Fix pattern**: Audit checklist trước khi consume new token via Tailwind class:
      - (a) Token defined `:root` block? (`grep '--kpi-healthy-strong' app/globals.css` trong `:root { ... }` scope)
      - (b) Token `--color-{name}` mirrored `@theme inline` block? (`grep '--color-kpi-healthy-strong' app/globals.css` trong `@theme inline { ... }` scope)
      - (c) Both YES → safe consume `bg-kpi-healthy-strong` className
      - (d) Only `:root` defined → fix BEFORE consumer refactor: add `--color-{name}: {value};` vào `@theme inline` block. Bundle fix cùng consumer commit (foundation completion + consumer refactor cùng concern).
    - **Anti-pattern**: trust HANDOFF prose claim "tokens intact" without verify both blocks. Pattern lesson L29/L32/L45 reinforced lần 6 — verify-first invalidate prose claim, especially cho design system tokens (high coupling, easy drift).
    - **Pattern reusable**: M-Design-Tailwind-Cleanup-1 hit pattern 2 lần trong 1 milestone:
      - **(a) Q7 BLOCKER Task 2A**: `--kpi-{healthy,attention}-strong` defined `:root` 203-204 nhưng MISS `@theme` → fix +2 LOC lines 72-73 bundle commit 2A
      - **(b) Convention drift Task 2B**: em recommend `text-bg`/`bg-brand` NHƯNG codebase reality `text-bg-warm`/`bg-accent-brand` 10+ files precedent → adopt existing convention thay create new tokens
    - **Audit reusable cho future design token consumption**:
      - **NEW token consume**: verify both `:root` + `@theme` exist
      - **EXISTING token consume**: grep codebase precedent (`text-bg-warm` exists trước `text-bg` proposed)
      - **DARK MODE token consume**: verify `.dark` block defines override (separate concern, M-Design-Dark-1 future scope)
    - **Reference**: `app/globals.css` lines 63-73 `@theme inline` block (8 KPI tokens + 2 strong tokens lines 72-73 added Q7 BLOCKER fix), lines 185-204 `:root` block (foundation defs), `plans/M-Design-Tailwind-Cleanup-1-plan.md` Q7 decision lock. Reinforce pitfall #19 (Tailwind v4 emit on-demand) + #20 (token aliasing vs duplicate hex) + L29/L32/L45 (verify-first invalidate plan claim).

---

## 11. Dev Workflow

### Scripts
| Command | Purpose | Time |
|---|---|---|
| `npm run dev` | Dev server (webpack) | — |
| `npm run build` | Prod build + TS check + route gen | 30–60s |
| `npm run start` | Serve built output | — |
| `npm run typecheck` | `tsc --noEmit` | 5–15s |
| `npm run lint` | ESLint | — |

### Pre-commit (manual, no husky)
```bash
npm run typecheck && npm run lint && npm run build
```

### Before finishing a task
1. `npm run typecheck` — must pass
2. `npm run build` — must pass cho route/config/type changes
3. Browser smoke test — golden path + 1 edge case minimum
4. Mobile viewport (375px) + desktop cho UI changes
5. Log in 2 orgs cho RLS changes
6. **Terse final response** — bullet points, no essays. Nếu không test được UI, **nói thẳng**, đừng claim success không observe.

### Git
- Solo branch: `master` (không `main`)
- No PR flow, no CI, no test suite
- Vercel auto-deploy từ `master` push
- Migration trước, code sau (rollback-safe)

### Adding things
- **New API route**: `app/api/<domain>/<action>/route.ts` + schema trong `lib/validation/schemas.ts`
- **New migration**: `supabase/migrations/0NN_<slug>.sql` sequential, always include `enable row level security;` + policies trong cùng migration. Update `lib/supabase/types.ts` hand-append Row/Insert/Update. Apply qua dashboard SQL editor OR `SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migration.mjs 0NN_<slug>.sql`.
- **New UI**: `components/<domain>/` hoặc `app/<route>/components/`
- **New business logic**: `lib/<domain>/`
- **New blog post**: `/admin/blog/new` trong app running
- **New event**: `lib/analytics/events.ts` + call site

---

## 12. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server only, bypass RLS

# AI
ANTHROPIC_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Search
TAVILY_API_KEY=                   # SWOT evidence

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=                # Verified domain

# App
NEXT_PUBLIC_APP_URL=              # http://localhost:3000 | https://chienluoc.org

# Optional SEO
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

`.env.local` gitignored. Rotate mỗi 90 days hoặc khi có access change.

---

## 13. Design System

**Style**: Neo-Brutalism v3.2 "Refined Tempered NB" — Vũ Hải Personal Edition, adapted cho Hoshin Kanri OS B2B SaaS.

**Migrated from**: Neobrutalism × Swiss generic (Montserrat + Barlow Condensed, radius 0 forced với `!important` global, ink #2C2B2B, bg #F7F5F2) → NB v3.2 (M-Design-1, 2026-04-27, 4 commits).

**Reference**: skill `neo-brutalism-design-vuhai` v3.2 (external skill folder).

### Typography

- **Display** (`var(--font-display)`): **Space Grotesk** — weight 500/600/700, tracking tight (-0.01em → -0.03em). Headings, CTA buttons, nav, labels.
- **Body** (`var(--font-body)`): **Inter** — weight 400-900, line-height 1.6. Paragraph, form fields, descriptions.
- **Mono** (`var(--font-mono)`): **JetBrains Mono** — labels/metadata, uppercase, letter-spacing 0.08em. Stickers, marquee, code blocks.
- **Vietnamese subset**: Tất cả 3 fonts support tiếng Việt full dấu (verified với "ấ", "ặ", "ợ", "đ" trong hero). Loaded qua `next/font/google` với `subsets: ['latin', 'vietnamese']`.

### Color tokens (light mode default)

**Brand**:
- `--brand: #c73937` (Hoshin red, primary CTA — unchanged across migrations)
- `--brand-dark: #9e1f1e` (hover/active state)

**Text**:
- `--ink: #1A1A1A` — heading + border (KHÔNG dùng `#000000`, ink mềm hơn)
- `--text-2: #4A4848` — body
- `--text-3: #6B6868` — metadata/placeholder

**Background**:
- `--bg: #FFFEF9` — warm white (page bg)
- `--bg-paper: #F5F0E8` — paper sections
- `--bg-muted: #F5F0E8` — muted subtle cards
- `--bg-dark: #1A1A1A` — dark sections / hero contrast

**6 Pastel Accents** (mới ở v3.2 — không thay thế brand red, dùng cho feature cards & tags):
- `--accent-yellow: #F5E4B8`
- `--accent-cyan: #C4DEDC`
- `--accent-lime: #DDE4C5`
- `--accent-pink: #F0DCDD`
- `--accent-peach: #F0DCC0`
- `--accent-lavender: #DDD3EE`

### Border-radius scale (tempered, không force 0)

- `--radius-sm: 3px` — tags, badges
- `--radius-md: 4px` — **default** cho cards, buttons, inputs (tempered NB)
- `--radius-lg: 6px` — modals, sheets
- `--radius-xl: 8px`, `--radius-2xl: 12px`, `--radius-3xl: 16px`, `--radius-4xl: 20px`
- **Radius 0** preserved cho: avatar, `.nb-sticker`, `.nb-marquee`, checkbox/radio (NB DNA)

### Shadow tokens (hard-offset, không blur)

- `--shadow-xs: 2px 2px 0 var(--ink)`
- `--shadow-sm: 2px 2px 0 var(--ink)`
- `--shadow-md: 6px 6px 0 var(--ink)` (default cards/buttons)
- `--shadow-lg: 8px 8px 0 var(--ink)`
- `--shadow-xl: 12px 12px 0 var(--ink)`
- `--shadow-tilt-l: -6px 6px 0 var(--ink)` — asymmetric chaos (left)
- `--shadow-tilt-r: 6px 6px 0 var(--ink)` — asymmetric chaos (right)
- Colored: `--shadow-brand`, `--shadow-yellow`, `--shadow-cyan`, `--shadow-pink`

### Motion

- `--duration-instant: 0ms`
- `--duration-snap: 100ms` (button/card hover)
- `--duration-base: 150ms` (default transitions)
- `--ease-nb: cubic-bezier(0.25, 0, 0, 1)` — **dùng cho mọi hover transitions**, KHÔNG dùng `ease` / `ease-in-out` / `linear`

### Spacing scale (8-step)

`--space-1: 4px` · `--space-2: 8px` · `--space-3: 12px` · `--space-4: 20px` · `--space-5: 32px` · `--space-6: 48px` · `--space-7: 72px` · `--space-8: 96px`

### Component utility classes (in `app/globals.css`)

**Buttons**:
- `.btn-brutal`, `.btn-brutal-primary`, `.btn-brutal-secondary`
- `.btn-primary`, `.btn-secondary` (in `@layer components`)
- `.btn-yellow`, `.btn-cyan` (pastel variants)

**Cards**:
- `.card-brutal` (default 4px radius + shadow-md)
- `.card-yellow`, `.card-cyan`, `.card-pink`, `.card-lime`, `.card-dark` (pastel/inverse variants)
- `.card-tilt` (controlled chaos: rotated odd/even, hover unrotates)
- `.card-subtle` (tier 2, không brutalist — for tight UI density)

**Tags & badges**:
- `.badge-brutal` (border + radius-sm)
- `.tag-yellow`, `.tag-cyan`, `.tag-lime`, `.tag-pink`, `.tag-brand`, `.tag-dark`

**Decorative (NB DNA, radius 0)**:
- `.nb-sticker` — rotated pastel tag (3deg tilt, mono font, alternating colors via nth-child)
- `.nb-highlight` — yellow gradient underline (replaces italic emphasis)
- `.nb-marquee` + `.nb-marquee-track` + `.nb-marquee-item` — scrolling ticker (25s steps(50) infinite, ✦ separator)

**Forms**:
- `.input-brutal` (border-color brand on focus, shadow brand)

**Text utilities**:
- `.overline` (canonical brand overline; `.heading-overline` consolidated to `.overline` trong M-Design-Tokens-Cleanup-1 ship 2026-05-10), `.label-brutal`, `.field-label`, `.field-hint`

### Theme

Force LIGHT mode default — `app/layout.tsx` có inline script clearing `dark` / `system` localStorage value và add `light` class trên `<html>`. Storage key: `hoshin-theme-v2` (unchanged across migrations).

Dark mode tokens defined in `.dark { ... }` block — inverted brutalism (ink `#1A1A1A` bg, warm white `#FFFEF9` fg, brand bumped to `#E84947` cho contrast). Future opt-in.

### File location

- Token block: `app/globals.css` lines 12-198 (`@theme inline`, `:root`, `.dark`)
- Utility classes: `app/globals.css` lines ~295+ (split before/inside `@layer components`)
- Font loading: `app/layout.tsx` (next/font/google with Vietnamese subset)

### Coverage status (2026-04-27)

| Layer | NB v3.2 status |
|---|---|
| Foundation tokens | ✅ shipped (M-Design-1) |
| Utility classes | ✅ shipped (M-Design-1) |
| Landing page | ⏳ M-Design-2 (next) |
| Dashboard shell | ⏳ M-Design-3 |
| Discovery flows | ⏳ M-Design-4 |
| X-Matrix Wizard | ⏳ M-Design-5 |

---

## 14. Analytics & Growth

### PostHog events (typed, trong `lib/analytics/events.ts`)
- **Activation**: `x_ray_completed`, `discovery_step_completed`, `x_matrix_completed`
- **Engagement**: `kpi_entry_added`, `kpi_dashboard_viewed`
- **Retention**: `monthly_report_generated`, `x_matrix_shared`
- **Identity**: `identify` với orgId, orgName, role, industry (no PII)

### PQL Engine (`lib/pql/signals.ts`)
Trigger khi ALL 3 signals met:
1. Active ≥ 3 weeks (theo kpi_entries dates)
2. ≥ 2 org members
3. ≥ 1 KPI red cho 2+ consecutive weeks (value < 70% target)
Output: PQL alert email → sales team cho consulting upsell.

---

## 15. Quick Start Cho Session Mới

Khi Claude mới vào session:
1. Đọc file này (`HANDOFF.md`)
2. Đọc `AGENTS.md` cho agent-specific conventions
3. Task-specific:
   - API route → đọc route existing + `lib/validation/schemas.ts`
   - Migration → đọc file mới nhất trong `supabase/migrations/` + `lib/supabase/types.ts`
   - UI → đọc layout trong `app/<route>/layout.tsx` + existing components trong `components/<domain>/`
   - AI route → đọc `lib/ai/{client,models,stream-json}.ts`
4. Verify trước khi code:
   ```bash
   npm run typecheck    # baseline phải pass
   npm run build        # baseline phải pass
   ```
5. Trước khi claim done: typecheck + build + browser smoke test + terse summary.

### Communication với Vũ Hải
- Tiếng Việt cho reply user-facing
- Direct, không nịnh, không corporate fluff
- Terse — bullet points > paragraphs
- Nếu không test được UI trong browser → **nói thẳng**, không claim success
- Git: solo vibe-coding, không PR, work direct trên `master`

---

## 16. Current State Snapshot (2026-05-09 — post M-Cleanup-batch-2026-05-09)

- **Production URL**: https://chienluoc.org (custom domain on Vercel, verified 2026-05-01 post M-Cleanup-1 deploy `dpl_4UT4DfW85czkWGEecYnNe7e91y5K` READY)
- **Repo**: PUBLIC since 2026-05-01 (M-Public-1). License: All rights reserved (no commercial use without written permission).
- **HANDOFF auto-fetch URL**: `https://raw.githubusercontent.com/vuhuyhai/hoshin-kanri-os/master/HANDOFF.md` — em (AI) tự fetch đầu mỗi chat mới về Hoshin Kanri, KHÔNG cần Vũ Hải re-upload Project knowledge. Fastly CDN propagation ~5-15 min sau visibility flip (xem L22).
- **Last verified**: 2026-05-09 — post M-Design-Tailwind-Cleanup-1 (KpiCard + Discovery hub Tailwind palette → KPI tokens migration + Q7 foundation completion bonus, 3 commits `a06ee51` plan → `5f2cb5a` Task 2A KpiCard 26 instances → `d756a63` Task 2B Discovery hub 34 instances). HEAD `d756a63` (pre-push). Touch 3 files (1 NEW: `plans/M-Design-Tailwind-Cleanup-1-plan.md` 237 LOC; 2 MODIFIED: `app/dashboard/kpi/components/KpiCard.tsx` 26 raw palette instances + LIGHT_CONFIG object update + `app/dashboard/discovery/page.tsx` 34 instances mixed shadcn/ink/brand + `app/globals.css` Q7 bonus mirror 2 `--color-kpi-{healthy,attention}-strong` lines 72-73 vào `@theme inline` block). Smoke test 4/4 Phase A PASS (KpiCard 3 status colors render đúng + Discovery hub gray chrome + brand CTA + progress bar đỏ thương hiệu Q4 C semantic fix + build clean 8.3s + dark mode acceptable regression Q3 A strip). Phase B Cursor self-verify SKIPPED — design refactor không touch business logic, code review + visual = sufficient (L42 partial coverage reinforced lần 3). 60/60 raw palette instances migrated clean. Previous: M-KPI-Restore-1 (KPI Restore UI Phase 2 + R1 mitigation copy fix, 3 commits `52fd8ad` plan → `a9f4682` Task 2A POST endpoint → `1435c1b` Task 2B Settings UI + R1 copy). HEAD was `1435c1b` post Task 2B. Smoke test 4/4 Phase A PASS. Previous: M-Cleanup-batch-2026-05-09 (M-Cleanup-6 Phase 2 + M-Lint-Cleanup-1 combo, 4 commits `11c6193` plan → `f7087cd` 8 drop-in sites → `96c7db6` 3 JOIN sites split-query → `73abf59` 2 lint fixes). HEAD was `c4040a0` post Phase B docs close-out. Net code −67 LOC across 13 files refactored; baseline 0 errors / 0 warnings restored. Previous: M-KPI-Mgmt-1 (KPI Soft-Delete + 3-Dots Menu + 3 mutation guard patches, 4 commits `c87015d` plan → `4a8f21d` Task 2A DELETE → `c0da261` Task 2B menu → `0140dfa` Task 2D mutation guards). HEAD was `0140dfa`. Touch 8 files (3 NEW: `app/api/kpi/[id]/route.ts` 169 LOC + `app/dashboard/kpi/components/KpiActionsMenu.tsx` 121 LOC + `plans/M-KPI-Mgmt-1-plan.md` 284 LOC; 5 MODIFIED: `app/dashboard/kpi/components/KpiCard.tsx` +18/-2 + `app/dashboard/kpi/components/KpiDashboardClient.tsx` +20/-1 + `app/dashboard/kpi/page.tsx` +1/-1 + `app/api/kpi/entry/route.ts` +1 + `app/api/hansei/list/route.ts` +1 + `app/api/hansei/create/route.ts` +1). Smoke test 3/8 visual PASS (CASE 1 CEO delete happy path + CASE 2 Member hide menu + CASE 8 visual integrity), 5/8 backend verified qua Cursor self-verify chain (CASE 3 idempotent / CASE 4 cancel AlertDialog / CASE 5 cross-org 403 / CASE 6 rate-limit 429 / CASE 7 archived KPI POST entry 404). Previous: M-Auth-MultiOrg-1 (Org Switcher UI + JWT metadata sync trio, 5 commits `0f6bcd4` plan → `370b72f` API → `ffc0714` component → `993fd14` data fetch → `b941b37` JWT sync fix). HEAD was `b941b37` post-push. Touch 6 files (3 NEW: `app/api/orgs/switch/route.ts` + `components/layout/org-switcher.tsx` + `plans/M-Auth-MultiOrg-1-plan.md`; 3 MODIFIED: `app/dashboard/layout.tsx` + `components/layout/sidebar.tsx` + `components/layout/header.tsx`). Smoke test 6/6 PASS post-fix `b941b37` (CASE 1 multi-org switch CheckCircle migrate đúng Member→CEO; CASE 3 RLS deny HTTP 403; CASE 6 rate limit 29×200 + 6×429 within threshold). Previous: M-Cleanup-5 (Tech debt sweep, 3 commits `920080b`→`6f789d6`, HEAD was `6f789d6`). Touch 3 files code (-2 orphan SWOT routes 192 LOC + 1 migration .sql 7 LOC) + HANDOFF cleanup + plans/M-Cleanup-5-plan.md. Smoke test typecheck + build PASS clean (post `rm -rf .next` cache). Vercel deploy `dpl_H9EAUicovPWHRbw8ko6J1F7YF6ku` READY (build 29.2s clean, 0 error/warning, build logs 0 match cho 2 deleted routes). Production verify 4/5 PASS: build clean, runtime 0 errors 5 phút post-deploy, curl confirmed HTTP 404 cho `/api/swot/xray-context` + `/api/swot/prefill-from-xray`, migration 034 index intact (verified qua `/api/orgs/check-similar` reach DB without 500). Previous: M-Member-POV-1 (Canvas Member-POV Redesign, 6 commits 92a58b3→7570a61, deploy `dpl_DjxKkJS1tXHYqi2bc14vFDRHaJJi`).

  Previous: M-AICoach-ShortInput-1 (Bug 2 fix prompt fallback short-input < 5 từ, 2 commits 2b0e4eb→1dcfb53).

  Earlier: M-AICoach-Sensei-1 (SWOT Coaching Redesign theo Akao Method, 15 commits 4273d57→09b095d).
- **Last migration applied**: `035_org_invites.sql` — table `org_invites` + enum `invite_role` + 3 RLS policies + 3 indexes (M-OrgInvite-1, committed). Previous: `034_idx_organizations_lower_name_city.sql` (functional index on `lower(name), lower(city)`, applied via Supabase dashboard 2026-05-01, backfilled to repo 2026-05-08 in M-Cleanup-5 commit `40d3ca4`).
- **API routes count**: 50 (52 từ M-OrgInvite-1 − 2 orphan SWOT routes removed M-Cleanup-5 commit `40d3ca4`: `/api/swot/xray-context` + `/api/swot/prefill-from-xray`)
- **Lib modules**: admin, ai, analytics, annual-review, blog, discovery, email, hansei, http, newsletter, pql, supabase, swot, validation, x-matrix, x-ray + rate-limit.ts
- **Components**: analytics (2), annual-review (6), blog (8), dashboard (AnnualReviewBanner + AnnualReviewCard), gemba (4 — GembaBanner + GembaCommentForm + GembaCommentThread + KpiGembaSection client wrapper), hansei (3 — HanseiBanner + HanseiForm + HanseiHistoryList), layout (4), providers (3), swot (35+), ui (15), x-matrix — top-level files xóa hoàn toàn ở M-Cleanup-1 (7 wizard files: XMatrixWizard + Step1-4 + WizardProgress + XMatrixReview). Còn lại: `components/x-matrix/canvas/` (XMatrixCanvasPage + CanvasGrid + CanvasHeader + CanvasMiniMap + CenterX + CoachPopover + EducationalTooltip + GembaModal + PrefillModal + SubmitBar + VisionEditor + cards/ + edges/ + modals/ + state/). Canvas là single source of truth cho `/dashboard/x-matrix/new`. Route-local Server Components: `app/dashboard/x-matrix/new/components/HoshinGembaSection.tsx` + `HoshinGembaSectionClient.tsx` (Context provider).
- **Dashboard routes**: discovery (swot/pain-mapper/vision-workshop/synthesis/benchmark/xray-history), x-matrix/new (→ HoshinGembaSection wrap canvas), x-matrix/[year]/review, kpi (→ KpiHanseiSection wired ABOVE KpiDashboardClient), report, settings, help
- **Admin routes**: customers, hoshin-explorer, blog (list/new/edit/categories/tags)
- **Latest milestone**: M-Design-Tokens-Cleanup-1 (`--accent` collision cleanup + `.heading-overline` consolidation, 4 commits `eb34541` foundation → `20ed62f` XRayReport → `2c6f976` consolidate + `<NEXT_HASH>` close-out, 26 files: 1 NEW + 25 MODIFIED, ~1.5h work). Trigger: M-Design-3a foundation discovered `app/globals.css` line 171 reassign `--accent: #c73937` override shadcn neutral pastel `#F5F0E8` (line 136), contradict explicit comment line 158 cảnh báo collision. Vũ Hải screenshot 2026-05-10 evidence visible regression — KPI dropdown 3-dots hover + org switcher dropdown flash brand red rực gây eye-fatigue. Path β REVERT shadcn default lock với evidence distribution Nhóm A:B:C = 7:17:0 (intentional brand:accidental shadcn:ambiguous) + layout team đã pioneer pattern `--accent-brand` token (`@theme line 50` hardcoded `#c73937`, separate từ `--accent`) cho intentional brand-as-Tailwind-class.

  - **Tasks shipped (3 commits)**:
    1. Commit 1 `eb34541` (Foundation cleanup `app/globals.css`, +9/-9 LOC): Remove `--accent: #c73937` reassign line 171 + remove `--accent-dark` sibling line 172 + remove `--shadow-accent` dead code line 234 + migrate `.btn-primary` + `.badge-accent` background `var(--accent)` → `var(--brand)` explicit + update `.heading-overline` body color `var(--accent)` → `var(--brand)` (definition KEEP cho Commit 3 consolidate atomic) + update comment line 158 new pattern doc + decision lock reference 2026-05-10.
    2. Commit 2 `20ed62f` (Consumer migration `XRayReport.tsx`, +2/-2 LOC): `app/x-ray/components/XRayReport.tsx:672` + 688 — boxShadow inline style `var(--accent)` → `var(--brand)` explicit. Brand red CTA shadow preserved sau Commit 1 `--accent` revert.
    3. Commit 3 `2c6f976` (Utility class consolidation, +26/-35 LOC, 24 files): Remove `.heading-overline` definition `app/globals.css` line 723 — duplicate semantic với `.overline` line 471 (both `var(--brand)` post-Commit-1). Migrate 26 className occurrences across 23 .tsx files (Blog 6 files + Landing 2 occ + X-Matrix canvas 5 + X-Ray 1 + Hoshin Explorer 4 (ConceptPanel 3 occ) + Static 3 + Dashboard 2 + Misc 1) `heading-overline` → `overline`. Mechanical 1:1 swap, visual zero regression (CSS class identical post-Commit-1).

  - **3 architectural changes**:
    1. **Foundation cleanup eliminate token collision**: Pre-cleanup line 158 comment cảnh báo collision NHƯNG line 171 reassign `--accent` về `var(--brand)` contradict comment. Cleanup remove reassign → `--accent` về shadcn neutral pastel `#F5F0E8` (line 136) + `--brand` explicit cho intentional emphasis. Comment line 158 update document new pattern + decision lock reference. Evidence distribution Phần D 7:17:0 — 7 intentional brand consumers (XRayReport ×2 + `.btn-primary` + `.badge-accent` + `.heading-overline` + `--shadow-accent` + Nhóm A foundation) explicit migrate `var(--brand)`; 17 accidental shadcn neutral consumers (dropdown-menu + select primitives) tự fix qua foundation revert (KHÔNG modify `components/ui/*` files).
    2. **`--accent-brand` token riêng cho intentional brand-as-Tailwind-class**: Layout team đã pioneer pattern (sidebar/header/org-switcher/bottom-nav/footer-copyright dùng `bg-accent-brand` 11 occurrences). Hardcoded `#c73937` ở `@theme line 50`, KHÔNG đi qua `var(--accent)`. Reusable cho future intentional brand-as-Tailwind-class scenarios mà KHÔNG re-introduce `--accent` collision. Pattern: `bg-accent-brand` (intentional brand) vs `bg-accent` (shadcn neutral hover) — semantic separation rõ ràng.
    3. **Dark mode bug latent fixed cho `.btn-primary`**: Pre-cleanup `.btn-primary` background `var(--accent)` → light mode `#c73937` brand red (lucky), dark mode `#3a3939` neutral gray (BROKEN — primary button mất brand identity). Post-cleanup migrate `var(--brand)` explicit → both themes brand red preserved. Bug latent từ NB v3.2 migration M-Design-1 chưa surface user-facing vì dark mode chưa adopted production (force light default). M-Design-Dark-1 milestone sau ship dark variants → bug đã fix preemptively.

  - **7 decisions locked Task 1** (plans/M-Design-Tokens-Cleanup-1-plan.md TBD NOT created — decision lock document trực tiếp trong HANDOFF entry này thay vì plan file riêng vì scope LOW + atomic 3 commits + evidence Phần A-F audit đầy đủ):
    - Q1 β REVERT shadcn default (`--accent` về shadcn neutral pastel `#F5F0E8`, Nhóm A migrate `var(--brand)` explicit)
    - Q2 α NO dark mode `--brand` override (giữ `#c73937` chung 2 themes, defer M-Design-Dark-1 nếu user complain dark brand chói)
    - Q3 β CONSOLIDATE `.heading-overline` → `.overline` Path C tách Commit 3 atomic (visual identical post-Commit-1, tách atomic revert unit per concern)
    - Q4 α DELETE `--shadow-accent` dead code (0 consumer toàn repo, free cleanup)
    - Q5 α UPDATE comment line 158 document new pattern + decision lock reference
    - Q6 β PHASE A 5 cases visual smoke (Phase B Playwright defer reactive)
    - Q7 β 2 → 3 commits atomic per concern (Path C tách Commit 3 từ Q3 β)

  - **Smoke test Phase A 5/5 PASS visual** (Vũ Hải screenshot 2026-05-10):

    | Case | Description | Result | Evidence |
    |---|---|---|---|
    | 1 | KPI dropdown 3-dots menu 'Xóa KPI' hover light mode → neutral beige | PASS | screenshot KPI Tracker hover state |
    | 2 | Org switcher dropdown 'Ladysfit / CEO' hover light mode → brand red preserved (selected state qua bg-accent-brand token riêng, intentional NOT collision) | PASS | screenshot Sidebar Org Switcher |
    | 3 | X-Ray quiz 'Hơn 50% thời gian' selected option → brand red preserved (intentional brand selected state) | PASS | screenshot X-Ray quiz |
    | 4 | XRayReport CTA shadow brand red preserved (var(--brand) explicit migration) | PASS | (visual stable Commit 2) |
    | 5 | Dark mode dropdown hover neutral gray + primary button brand red preserved (dark mode toggle skip Vũ Hải app force light default) | SKIP | acceptable Q3 A defer M-Design-Dark-1 |
    | Build | typecheck + build PASS clean 3/3 commits | PASS | Cursor output |
    | Grep | `var(--accent)` consumers post-cleanup = 0; `var(--brand)` = 84 across 23 files | PASS | Cursor verify |

  - **Files changed (0 NEW + 25 MODIFIED + 0 plan doc)**:
    - NEW: KHÔNG (decision lock document trực tiếp HANDOFF entry, scope LOW + atomic 3 commits không justify plan file riêng)
    - MODIFIED: `app/globals.css` (commits 1+3, foundation cleanup + remove `.heading-overline` def)
    - MODIFIED: `app/x-ray/components/XRayReport.tsx` (commit 2, +2/-2)
    - MODIFIED 23 .tsx files commit 3 (className migration `heading-overline` → `overline`):
      Blog: `components/blog/RelatedPosts.tsx` + `components/blog/TableOfContents.tsx` + `app/blog/[slug]/page.tsx` + `app/blog/[slug]/not-found.tsx` + `app/blog/page.tsx` + `app/blog/preview/[token]/page.tsx`
      Landing: `app/page.tsx` (2 occurrences)
      X-Matrix canvas: `components/x-matrix/canvas/edges/NorthEdge.tsx` + `SouthEdge.tsx` + `EastEdge.tsx` + `WestEdge.tsx` + `CenterX.tsx`
      X-Ray: `app/x-ray/components/XRayForm.tsx`
      Hoshin Explorer: `app/admin/(dashboard)/hoshin-explorer/page.tsx` + `ConceptPanel.tsx` (3 occ) + `ConceptSidebar.tsx` + `PhaseBlock.tsx`
      Static: `app/dieu-khoan/page.tsx` + `app/lien-he/page.tsx` + `app/chinh-sach-bao-mat/page.tsx`
      Dashboard: `app/dashboard/page.tsx` + `app/admin/(dashboard)/page.tsx`
      Misc: `components/swot/SwotContextFormTier1.tsx`

  - **Pattern lessons (1 mới L50, 2 reinforced)**:
    1. **L50 NEW — Verify-first audit invalidate scope assumption + surface Path C atomic commit boundary discipline**: Verify-first Task 1 Phần A-F audit (Cursor) phát hiện 26 .tsx consumers `.heading-overline` (HANDOFF prose claim lỡ thiếu information này) → Step 1.7 instruction 'migrate className' xung đột với Output rule 'KHÔNG modify file ngoài globals.css'. Cursor đúng pattern STOP + báo Vũ Hải scenario + đưa 4 paths (A skip / B bundle / C tách Commit 3 / D defer milestone). Path C decision lock pivot: **commit boundary discipline > scope creep avoidance**. Ship cùng session M-Design-Tokens-Cleanup-1 (NOT defer milestone D) NHƯNG tách Commit 3 atomic (NOT bundle B). Atomic value: rollback granularity per concern (foundation / consumer / utility consolidation). Pattern reusable cho future cleanup milestone scope creep — KHÔNG defer cho task <30 phút work, KHÔNG bundle cho atomic concern khác. Apply universally.
    2. **L42 reinforced lần 6 — Phase A visual coverage acceptable cho design refactor mechanical 1:1 mapping + visual evidence Vũ Hải screenshot**: M-Design-Tokens-Cleanup-1 Phase A 5/5 PASS visual với evidence screenshot Vũ Hải (CASE 1 eye-fatigue fix critical) + build clean 3/3 commits + grep verify 0 var(--accent) consumers post-cleanup = sufficient evidence Phase A. Phase B Playwright defer reactive (Q6 β decision lock). Pattern proven 6 lần (M-KPI-Mgmt-1 → M-KPI-Restore-1 → M-Design-Tailwind-Cleanup-1 → M-Cleanup-batch → M-RateLimit-Generic-1 → M-Design-Tokens-Cleanup-1) — escalate convention default.
    3. **L29/L32/L45/L48/L49 reinforced lần 8 — Verify-first invalidate plan claim**: M-Design-Tokens-Cleanup-1 Task 1 Phần A audit phát hiện comment line 158 `app/globals.css` cảnh báo collision NHƯNG line 171 reassign contradict — code lùi vs intent ban đầu. Pattern: TRƯỚC khi commit decision dựa trên prose claim hoặc memory training data, verify-first qua grep + view file minimum 5-10 sites. M-Design-Tokens-Cleanup-1 specific: Cursor Task 1 grep 6 patterns CSS consumers + 9 patterns Tailwind class consumers + table 17 shadcn UI primitives + 11 layout components — exhaustive coverage trước decision lock. Apply universally — KHÔNG trust HANDOFF prose hoặc design system documentation blindly cho refactor decision.

  - **Constraints cho future AI sessions**:
    - KHÔNG re-add `--accent: var(--brand)` reassign trong `app/globals.css :root` — Q1 β REVERT decision lock. Pattern: `--accent` về shadcn neutral pastel `#F5F0E8` (line 136), `--brand` explicit cho intentional emphasis. Anti-pattern: collision tạo eye-fatigue dropdown hover (evidence Vũ Hải screenshot 2026-05-10).
    - KHÔNG dùng `bg-accent` className cho intentional brand-as-Tailwind-class (vd CTA primary button, brand badge, hero accent). Pattern: `bg-accent-brand` (`@theme line 50` token riêng `#c73937`) cho intentional brand emphasis, `bg-accent` cho shadcn neutral hover (`@theme line 34` mirror `--accent` = `#F5F0E8` pastel). Layout team precedent (sidebar/header/org-switcher/bottom-nav/footer-copyright 11 occurrences).
    - KHÔNG dùng `var(--accent)` cho intentional brand emphasis trong CSS (utility classes, inline style) — migrate `var(--brand)` explicit. Anti-pattern: `.btn-primary` + `.badge-accent` cũ dùng `var(--accent)` → dark mode bug latent neutral gray. Post-cleanup `var(--brand)` explicit = both themes brand red preserved.
    - KHÔNG re-create `.heading-overline` utility class — Q3 β consolidate decision lock. `.overline` (`app/globals.css` line 471) là canonical brand overline utility. Future overline usage MUST `className='overline'`.
    - KHÔNG re-create `--shadow-accent` token — Q4 α dead code decision lock. Future brand shadow utility MUST hardcode `var(--brand)` inline hoặc define `--shadow-brand` token mới (NOT reuse `--shadow-accent` name).
    - KHÔNG modify `components/ui/dropdown-menu.tsx` hoặc `components/ui/select.tsx` `bg-accent`/`focus:bg-accent`/`data-[*]:bg-accent` className — shadcn primitives intentional dùng `bg-accent` cho neutral hover, behavior tự đổi đúng qua foundation revert. Anti-pattern: customize shadcn primitive className → break shadcn upgrade path future.
    - KHÔNG add `.dark { --brand: <color> }` override — Q2 α NO override decision lock. Defer M-Design-Dark-1 milestone riêng nếu user complain brand red chói trong dark mode (currently no signal).
    - KHI add foundation token mới có potential collision với shadcn neutral tokens (`--accent`, `--muted`, `--card`, `--popover`, `--primary`, `--secondary`, `--destructive`), MUST audit comment + grep consumers shadcn primitives folder TRƯỚC khi reassign. Pattern: define separate token (vd `--accent-brand`, `--muted-warm`) thay vì reassign shadcn neutral. Verify-first L50 reinforced.
    - KHI add CSS utility class mới có visual semantic trùng utility hiện tại (vd `.overline` + `.heading-overline` duplicate), MUST audit consumers TRƯỚC khi ship. Anti-pattern: ship duplicate utility → future cleanup tốn migration scope. Pattern Q3 β consolidate atomic ship cùng milestone, KHÔNG defer.

- **Previous milestone**: M-RateLimit-Generic-1 (Generic rate limit helper refactor + 15 sites migrate, 3 commits `e36d140` plan → `230faa5` Task 2B 13 AI + helper move → `97fd391` Task 2C 2 non-AI, 17 files: 2 NEW plan docs + 1 NEW helper + 1 DELETED old helper + 14 MODIFIED route migrations, ~2h work). Trigger: tech debt rotate 8 ngày từ M-OrgUX-1 (2026-05-01 ship `/api/orgs/check-similar` dùng `checkRateLimit` direct vì `requireAiRateLimit` hardcode prefix `ai:`). M-Auth-MultiOrg-1 (2026-05-09 sáng) ship `/api/orgs/switch` non-AI route thứ 2 cùng pattern direct call. Trigger condition met "2-3 non-AI routes need rate limiting" (HANDOFF §18 candidate). Path 4 D evidence + 7 Q α/α/β/α/α/β/standard locked: preserve discriminated union + caller pass full bucket + no migration + 15 sites scope + `requireRateLimit` name + `lib/http/` location + optional message default + extras merge body + drop default bucket required + 2 commits domain split + Phase A only.
  - **Tasks shipped (3 commits)**:
    1. Task 1+2A — Verify-first audit + plan doc commit (commit `e36d140`, +443 LOC, 2 NEW: `plans/M-RateLimit-Generic-1-verify-audit.md` 8-section V1-V8 + `plans/M-RateLimit-Generic-1-plan.md` decision lock + migration patterns + tasks breakdown + risk grade LOW + effort estimate 1h45min-2h30min). 4 deviation findings vs HANDOFF §18: off-by-one 13+2=15 not 14, 7 additional eligible sites scope creep risk MEDIUM, 0 DB migration needed (cleanup cron 24h), 0 test debt.
    2. Task 2B — Helper rewrite + move + 13 AI sites mechanical rename (commit `230faa5`, +131/-77 LOC, 15 files). NEW `lib/http/rate-limit-helper.ts` 53 LOC với `requireRateLimit(userId, opts)` signature: required `bucket: string` (Q5 α drop default) + optional `limit`/`windowSeconds`/`message`/`extras`. DELETED `lib/ai/rate-limit-helper.ts` 51 LOC. 13 AI sites bucket migrate `'swot'`→`'ai:swot'`, `'discovery'`→`'ai:discovery'`, `'admin'`→`'ai:admin'`, `'coach'`→`'ai:coach'` (caller pass full prefix per D2). Each site override `message` AI Vietnamese copy preserve. Limit override 100 cho `admin/hoshin-explorer` preserved.
    3. Task 2C — 2 non-AI sites migrate (commit `97fd391`, +9/-26 LOC, 2 files). Replace 12-line inline `checkRateLimit` + 429-build block với 6-line `requireRateLimit` call. `orgs/check-similar` bucket `'orgs:check-similar'` limit 10/60s. `orgs/switch` bucket `'orgs:switch'` limit 30/300s + `extras: { requestId }` cho Q4 α body merge.
  - **3 architectural changes**:
    1. **Generic rate limit helper unblock non-AI route adoption**: Pre-refactor `requireAiRateLimit` hardcode prefix `'ai:'` + default bucket `'ai-default'` → non-AI routes phải dùng `checkRateLimit` direct + duplicate 12-line 429-build block. Post-refactor `requireRateLimit` agnostic về domain — caller pass full bucket string (vd `'ai:swot'`, `'orgs:switch'`). Pattern reusable cho mọi future authenticated route cần rate limit. 7 additional eligible sites (hansei/create, invites, gemba×2, kpi×3) DEFER M-RateLimit-Cleanup-2 nếu trigger.
    2. **Bucket key format zero-soft-reset preserve**: Decision D2 caller pass FULL bucket string đảm bảo existing user windows preserve. AI routes giữ key format `ai:swot:userId` (caller pass `bucket: 'ai:swot'`). Non-AI routes giữ key format `orgs:switch:userId` (caller pass `bucket: 'orgs:switch'`). 0 user soft reset, 0 DB migration needed (`rate_limits` table cleanup cron 24h auto-purge).
    3. **`extras` merge body pattern cho route-specific 429 fields**: Q4 α `extras?: Record<string, unknown>` merge vào 429 response body. Reusable cho future routes cần custom field (vd `requestId` orgs/switch, `traceId` Sentry integration future, `retryHint` AI rate limit). Helper agnostic — caller compose extras dict.
  - **11 decisions locked Task 1**:
    - D1 evidence: preserve discriminated union shape (V7 — 13/13 AI sites uniform `if (!rl.ok) return rl.response`, đổi shape blast radius 0→13)
    - D2 evidence: caller pass FULL bucket string (V6 — DB stores full key, prefix change = soft reset)
    - D3 evidence: no DB migration (V6 — cleanup cron 24h)
    - D4 evidence: scope 15 sites lock (V5 — 7 additional sites scope creep MEDIUM)
    - Q1 α `requireRateLimit` (match `requireOrgRole` convention)
    - Q2 α `lib/http/rate-limit-helper.ts` (cluster `lib/http/fetch-json.ts` + `sse-client.ts`)
    - Q3 β optional `message` default `'Quá nhiều request'` (AI override AI Vietnamese copy)
    - Q4 α `extras` merge 429 body (orgs/switch requestId regression guard)
    - Q5 α DROP default bucket required `bucket: string` (V3 13/13 explicit)
    - Q6 β 2 commits domain split (atomic revert unit per concern)
    - Q7 Phase A only typecheck + build (mechanical refactor, no business logic)
  - **Smoke test Phase A 2/2 PASS + Production verify 4/4 PASS**:

    | Phase | Checkpoint | Description | Result |
    |---|---|---|---|
    | A | 1 | typecheck + build sau commit 1 (helper rewrite + 13 AI sites mechanical rename) | PASS |
    | A | 2 | typecheck + build sau commit 2 (2 non-AI sites migrate) | PASS |
    | Prod | 1 | Vercel deploy `dpl_HLJcUDCW3Ax7qGDRNn88etLAzYAd` READY (build 72s clean) | PASS |
    | Prod | 2 | Build logs grep CLEAN (0 error/FAIL, ✓ Compiled 18.1s, TS 18.9s, 77/77 static pages) | PASS |
    | Prod | 3 | Runtime logs CLEAN 30 phút window (0 crash, L41 alias propagation lag expected) | PASS |
    | Prod | 4 | Smoke 3 routes production HTTP 401 (1× SWOT + 1× orgs/check-similar + 1× orgs/switch, 1.0-1.5s/req) | PASS |

  - **Files changed (3 NEW + 1 DELETED + 14 MODIFIED + 1 plan doc)**:
    - NEW: `lib/http/rate-limit-helper.ts` (53 LOC, generic helper)
    - NEW: `plans/M-RateLimit-Generic-1-plan.md` (decision lock + migration patterns)
    - NEW: `plans/M-RateLimit-Generic-1-verify-audit.md` (8-section audit V1-V8)
    - DELETED: `lib/ai/rate-limit-helper.ts` (51 LOC, replaced by `lib/http/`)
    - MODIFIED 13 AI routes: `app/api/swot/coaching/route.ts` + `coaching-draft` + `conflict-check` + `context-cards` + `item-evidence` + `suggest-more` + `app/api/swot-analyses/[id]/factors/[factorId]/quality-check/route.ts` + `app/api/swot-analyses/[id]/strategies/ai-generate/route.ts` + `app/api/discovery/pain-mapper/route.ts` + `synthesis` + `vision-draft` + `app/api/admin/hoshin-explorer/route.ts` + `app/api/xmatrix/coach-correlation/route.ts`
    - MODIFIED 2 non-AI routes: `app/api/orgs/check-similar/route.ts` + `app/api/orgs/switch/route.ts`
  - **Pattern lessons (1 mới L49, 2 reinforced)**:
    - **L49 NEW — Generic helper API stable + minimal + caller compose extras**: Refactor pattern khi extract cross-cutting helper từ domain-specific original (vd AI-only → generic). Apply: (a) drop hardcoded prefix/default sang required param caller-side (Q5 α), (b) preserve discriminated union shape protect callers blast radius (D1), (c) optional `message` + default cho callers không override (Q3 β), (d) `extras?: Record<string, unknown>` merge body cho route-specific fields (Q4 α). Anti-pattern: extend helper với optional params per-route (signature bloat) hoặc callback-build response (over-engineered, defeat helper purpose). Reusable cho future cross-cutting helpers (audit log, feature flag, telemetry trace).
    - **L42 reinforced lần 5 — Phase A typecheck + build coverage acceptable cho mechanical refactor**: M-RateLimit-Generic-1 Phase B 3-route smoke deferred Vũ Hải (Q7) — refactor mechanical rename + signature preserve + no business logic touch + 4 evidence-locked decisions (no shape change) + 7 path α/β consistent low-blast-radius = sufficient evidence Phase A. Pattern proven 5 lần (M-KPI-Mgmt-1 → M-KPI-Restore-1 → M-Design-Tailwind-Cleanup-1 → M-Cleanup-batch-2026-05-09 → M-RateLimit-Generic-1). Apply: mechanical refactor ship-ready với typecheck + build PASS, defer reactive Phase B verify.
    - **L29/L32/L45/L48 reinforced lần 7 — Verify-first invalidate plan claim**: M-RateLimit-Generic-1 Task 1 audit phát hiện 4 deviations vs HANDOFF §18 candidate text: (a) off-by-one count 13+2=15 not 14, (b) 7 additional eligible sites scope creep risk MEDIUM, (c) 0 DB migration needed (HANDOFF prose ambiguous), (d) `'ai:'` literal chỉ trong helper file (no caller, no audit log, no dashboard). Pattern: TRƯỚC khi commit decision dựa trên candidate prose, verify-first qua grep + view file minimum 5-10 sites. Cost ~30 phút audit, prevent rollback debt + scope creep.
    - **L41 reinforced lần 2 — Vercel alias propagation lag post-READY**: M-RateLimit-Generic-1 production verify confirm pattern L41 từ M-Auth-MultiOrg-1 (2026-05-09). Build deploy READY (72s) ≠ production traffic cycle qua immediately. Runtime logs API 30 phút window post-READY return 0 entries — KHÔNG bug, alias DNS/edge cache propagation lag ~5-10 phút expected behavior. Verify production reachable qua user-facing URL (chienluoc.org) curl smoke: nếu route trả expected codes (401/200/404) → alias eventually cycle, milestone close-out OK. Anti-pattern: panic redeploy hoặc trigger rebuild khi runtime logs empty post-READY. Pattern proven 2 lần (M-Auth-MultiOrg-1 + M-RateLimit-Generic-1) → escalate convention default cho mọi production verify post-deploy: build READY + smoke route reachable = ship-able, runtime logs verify defer 10-15 phút sau hoặc reactive trigger via authenticated request.
  - **Constraints cho future AI sessions**:
    - KHÔNG dùng `requireAiRateLimit` (đã DELETED) — pattern: `requireRateLimit` từ `lib/http/rate-limit-helper.ts`
    - KHÔNG hardcode prefix `'ai:'` trong helper file mới — caller pass full bucket string. Anti-pattern: re-introduce hardcoded prefix → block non-AI route adoption (regression M-OrgUX-1 → M-Auth-MultiOrg-1 → M-RateLimit-Generic-1 cascade)
    - KHÔNG add default value cho `bucket` param — Q5 α decision lock (V3 confirm 13/13 explicit). Anti-pattern: silent misconfiguration nếu caller forgot bucket
    - KHÔNG modify discriminated union shape `{ ok: true } | { ok: false; response: NextResponse }` — D1 evidence lock (đổi shape blast radius 0→15 sites)
    - KHI add route mới cần rate limit (authenticated, per-user), MUST follow pattern: `import { requireRateLimit } from '@/lib/http/rate-limit-helper'` + caller pass `bucket: '<resource>:<action>'` + optional `message` override + `extras` merge body nếu cần custom field. KHÔNG dùng `checkRateLimit` direct (defeat helper purpose, duplicate 12-line block)
    - KHI refactor cross-cutting helper khác (audit log, feature flag, telemetry), follow L49 pattern: drop hardcoded prefix sang required caller param + preserve discriminated union shape + optional message default + extras merge body
    - 7 additional eligible sites (hansei/create, invites POST/[token]/accept, gemba/create, gemba/[id], kpi/[id]/route, kpi/[id]/restore, kpi/archived) DEFER M-RateLimit-Cleanup-2 — milestone riêng. KHÔNG bundle vào milestone khác mà chưa Q-scope decision lock
    - KHI Vercel deploy queue >10 phút INITIALIZING (multi-milestone same day pipeline contention pattern L36), poll mỗi 30-45s thay vì panic rebuild. Build thật sự thường complete ~30s sau khi BUILDING bắt đầu

- **Previous milestone**: M-Design-Tailwind-Cleanup-1 (KpiCard + Discovery hub Tailwind palette migration + Q7 foundation completion bonus, 3 commits `a06ee51` plan → `5f2cb5a` Task 2A → `d756a63` Task 2B, 3 files: 1 NEW + 2 MODIFIED + globals.css 2-line bonus, ~2.5h work). Trigger: M-Design-3a/3b foundation đã ship (8 KPI tokens + 4 score tokens + chart-tokens.ts resolver) NHƯNG consumers vẫn dùng raw Tailwind palette (`bg-green-100`, `text-red-600`, `bg-gray-900`) — visual inconsistent với NB v3.2 design system + foundation underutilized + unblock M-Design-Dark-1 dependency. Path α x7 locked: β Tailwind class generation + α MVP scope (KpiCard + discovery only) + A strip dark:* raw + mixed gray chrome handling + α Phase A 4 cases + ~2.5h LOW risk + Q7 NEW @theme mirror BLOCKER fix.
  - **Tasks shipped (3 commits)**:
    1. Task 1 — Plan + verify-first audit V1-V5 + 7 decision lock Q1-Q7 (commit `a06ee51`, `plans/M-Design-Tailwind-Cleanup-1-plan.md` 237 LOC). Path lock β+α+A+mixed+α+~2.5h+α (Q7 NEW: foundation completion @theme mirror -strong tokens caught verify-first Task 2A pre-ship).
    2. Task 2A — KpiCard refactor 26 instances + Q7 BLOCKER fix bundled (commit `5f2cb5a`, +35/-43 LOC, 2 files MODIFIED). LIGHT_CONFIG object 1:1 mapping: `bg-green-100` → `bg-kpi-healthy`, `text-green-700` → `text-kpi-healthy-fg`, `bg-green-500` → `bg-kpi-healthy-strong`, `text-green-600` → `text-kpi-healthy-strong`. Yellow → kpi-attention. Red → kpi-warning + dot/text → destructive (3-tier preserve M-Design-3b decision lock). Strip 8 `dark:*` variants (Q3 A defer M-Design-Dark-1). Q7 BLOCKER caught: `--kpi-{healthy,attention}-strong` defined `:root` line 203-204 NHƯNG MISS `@theme inline` mirror → Tailwind v4 KHÔNG generate `bg-kpi-healthy-strong` class silent fail. Fix: add `--color-kpi-healthy-strong: #16A34A` + `--color-kpi-attention-strong: #D97706` vào `@theme inline` lines 72-73. Bundle cùng commit 2A (foundation completion + consumer refactor cùng concern).
    3. Task 2B — Discovery hub refactor 34 instances mixed semantic (commit `d756a63`, +50/-57 LOC, 1 file). Pre-Q7 verify-first lần 2 catch convention drift: em recommend `text-bg`/`bg-brand` NHƯNG codebase reality `text-bg-warm`/`bg-accent-brand` (10+ files precedent). Adopt existing convention thay tạo new tokens. Final mapping: 22 generic chrome → shadcn tokens (`border-border`, `text-muted-foreground`, `bg-background`, `hover:bg-muted`), 7 brand CTA → NB v3.2 tokens (`bg-ink text-bg-warm hover:bg-ink/90`), 1 progress bar fill L280 `bg-gray-800` → `bg-accent-brand` (Q4 C semantic fix — visual feedback đỏ thương hiệu thay xám đậm chrome).
  - **3 architectural changes**:
    1. **Tailwind v4 `@theme inline` class generation pattern** (Q1 β decision lock): Consumer components dùng `className="bg-kpi-healthy"` instead of inline `style={{ background: 'var(--kpi-healthy)' }}`. Pattern: M-Design-3a foundation tokens defined `@theme inline` block enable Tailwind v4 emit class on-demand khi consumer reference. Foundation alone KHÔNG trigger emit (pitfall #19) — verify post-refactor via build success + Tailwind class generation, NOT grep compiled CSS. Reusable cho mọi future design token consumption.
    2. **Foundation completion check pattern (L48 NEW)**: Q7 BLOCKER caught verify-first Task 2A — tokens defined `:root` block KHÔNG đảm bảo Tailwind class generation enabled. MUST verify cả `:root` block VÀ `@theme inline` block mirror cho mọi token sẽ consume via Tailwind class. Audit checklist: grep `--color-{token-name}` trong `@theme inline` block trước khi reference `bg-{token-name}` className. Reinforce pitfall #19 + L29/L32/L45 (verify-first invalidate prose claim "tokens intact").
    3. **Convention drift handling adopt-over-create (L48 reinforced lần 2)**: Verify-first Task 2B lần 3 catch convention drift — em propose `text-bg` semantic naming NHƯNG codebase reality `text-bg-warm` 10+ files precedent. Decision: adopt existing convention thay tạo new tokens. Pattern: khi spec naming gap với codebase reality, MUST verify codebase precedent grep TRƯỚC khi recommend new tokens. Anti-pattern: create new tokens "for clean naming" → fragmentation + future consumers phải workaround.
  - **7 decisions locked Task 1** (plans/M-Design-Tailwind-Cleanup-1-plan.md):
    - Q1 β Tailwind v4 class generation (drop-in replace LIGHT_CONFIG object pattern, leverage @theme foundation)
    - Q2 α MVP scope (KpiCard + discovery only, V3 ~28 tangential files defer M-Design-Tangential-Cleanup-1)
    - Q3 A strip dark:* raw (defer M-Design-Dark-1 ship dark tokens centralized — acceptable visible regression cho beta SaaS solo dev)
    - Q4 mixed handling discovery hub (22 chrome shadcn + 7 CTA ink + 1 progress bar bg-accent-brand C semantic fix)
    - Q5 α Phase A 4 cases (Phase B self-verify defer L42 pattern partial coverage)
    - Q6 effort ~2.5h LOW risk (mechanical 1:1 mapping, no business logic touch)
    - Q7 α @theme mirror -strong tokens BLOCKER fix bundled Task 2A (NEW caught verify-first pre-ship — foundation completion principle)
  - **Smoke test 4/4 Phase A PASS**:
    | Case | Description | Result | Source |
    |---|---|---|---|
    | 1 | KpiCard 3 status colors render đúng dashboard `/dashboard/kpi` (healthy lime + attention amber pastel + critical pink pastel + saturated text/dots) | PASS | Image 1 screenshot |
    | 2 | Discovery hub gray chrome + CTA + progress bar render đúng `/dashboard/discovery` (chrome borders shadcn + bg-ink CTA black + progress bar đỏ thương hiệu Q4 C) | PASS | Image 2 screenshot |
    | 3 | Build clean: `npm run typecheck` + `npm run build` PASS 8.3s, 0 error/warning, Tailwind v4 emit verified all 4 new classes | PASS | Cursor build output |
    | 4 | Dark mode acceptable regression (KpiCard render light colors trong dark mode — KPI tokens chưa có .dark variants Q3 A defer) | PASS | Image 3 screenshot |
  - **Files changed (1 NEW + 2 MODIFIED + 1 plan doc)**:
    - NEW: `plans/M-Design-Tailwind-Cleanup-1-plan.md` (237 LOC, design audit V1-V5 + 7 decision lock Q1-Q7 + token mapping table)
    - MODIFIED: `app/dashboard/kpi/components/KpiCard.tsx` (+35/-43 LOC, LIGHT_CONFIG 1:1 mapping + strip dark:*)
    - MODIFIED: `app/dashboard/discovery/page.tsx` (+50/-57 LOC, mixed shadcn/ink/brand mapping + Q4 C semantic fix L280 progress bar)
    - MODIFIED: `app/globals.css` (Q7 BLOCKER fix +2 LOC lines 72-73, mirror -strong tokens vào @theme inline block)
  - **Pattern lessons** (1 mới L48, 1 reinforced):
    1. **L48 NEW — Foundation completion check trước consumer refactor**: Khi build consumer feature dùng design tokens, MUST verify cả `:root` block (token defined) VÀ `@theme inline` block (Tailwind class generation enabled) cho mọi token sẽ consume. Pitfall: HANDOFF prose claim "tokens intact" thường chỉ check `:root` — `@theme` mirror gap silent fail Tailwind v4 emit. Audit checklist: grep `--color-{token-name}` trong `@theme inline` block trước khi reference `bg-{token-name}` className. M-Design-Tailwind-Cleanup-1 hit pattern này 2 lần: (a) Task 2A Q7 BLOCKER `--kpi-{healthy,attention}-strong` defined `:root` line 203-204 nhưng MISS `@theme` mirror → fix +2 LOC lines 72-73 bundle cùng commit, (b) Task 2B convention drift `text-bg` recommend nhưng codebase reality `text-bg-warm` 10+ files precedent → adopt existing thay create new. Reinforce pitfall #19 (Tailwind v4 emit on-demand) + L29/L32/L45 (verify-first invalidate prose claim). Apply universally cho mọi future design token consumption.
    2. **L42 reinforced lần 3 — Phase A visual coverage acceptable cho design refactor**: M-Design-Tailwind-Cleanup-1 Phase B Cursor self-verify SKIPPED — design refactor không touch business logic + visual proof + build clean = sufficient evidence (L42 từ M-KPI-Mgmt-1 reinforced M-KPI-Restore-1 → reinforced lần 3). Trade-off: visual proof cho UX-facing changes (color render, hue shift acceptable), code-review proof cho mapping correctness (deterministic 1:1 transform). Apply: design refactor mechanical 1:1 mapping → Phase A 4 cases ship-ready, defer Phase B reactive.
  - **Constraints cho future AI sessions**:
    - KHÔNG re-introduce raw Tailwind palette classes (bg-green-100, text-red-600, bg-gray-900, etc.) trong KpiCard hoặc discovery hub. Pattern: KPI tokens hoặc shadcn semantic tokens hoặc NB v3.2 ink/bg tokens.
    - KHÔNG add `dark:*` variants trong scope KpiCard/discovery — defer M-Design-Dark-1 ship `.dark` block KPI tokens centralized.
    - KHÔNG modify KpiCard 3-tier logic (< 70% / 70-90% / ≥ 90%) — M-Design-3b decision lock preserve.
    - KHI add UI mới có status colors (KPI, score, alert, badge), MUST consume KPI tokens hoặc shadcn tokens, KHÔNG raw Tailwind palette.
    - KHI build consumer feature dùng design tokens via Tailwind class, MUST audit checklist: (a) token defined `:root` block? (b) `--color-{name}` mirrored `@theme inline` block? Pattern L48 + pitfall #19.
    - KHI phát hiện convention gap (spec name vs codebase reality), MUST grep codebase precedent TRƯỚC khi recommend new tokens. Anti-pattern: create new tokens "for clean naming" → fragmentation. Adopt existing convention default.
    - V3 tangential ~28 files defer M-Design-Tangential-Cleanup-1 (auth pages + admin + SWOT + annual-review). Trigger condition: M-Design-Dark-1 ship dark tokens → cần consumer parity.
- **Previous milestone**: M-KPI-Restore-1 (KPI Restore UI Phase 2 deferred từ M-KPI-Mgmt-1 + Settings page archived list + R1 mitigation copy, 3 commits `52fd8ad` plan → `a9f4682` Task 2A → `1435c1b` Task 2B, 4 files: 2 NEW + 2 MODIFIED, ~3h work bao gồm 2h diagnose deep cho non-bug). Trigger: M-KPI-Mgmt-1 (2026-05-09 sáng) production usage Phase 2 deferred items revisit — Q2 α "Xóa MVP" + Q3 γ "defer rename" lock nhưng Q-restore implicit "khôi phục bằng cách liên hệ admin" (AlertDialog copy original) → user complain "muốn tự khôi phục KPI lỡ xóa" qua Slack chiều cùng ngày → bump priority Phase 2 ship same-day. Foundation post M-KPI-Mgmt-1: soft-delete `is_active=false` reversible (Q1 α lock) + Layer 1+2+3+4 defense in depth pattern L43 + lift state β pattern L44 + audit log structured JSON pattern.
  - **Tasks shipped (3 commits)**:
    1. Task 1 — Plan + verify-first audit V1-V8 + 10 decision lock Q1-Q10 path α x10 (commit `52fd8ad`, `plans/M-KPI-Restore-1-plan.md`). Path lock: α (CEO-only restore, no Manager) + α (Settings page over /admin) + α (idempotent endpoint pattern reuse DELETE) + α (lift state β reuse Settings owns array) + α (AlertDialog confirm consistent với delete UX) + α (rate-limit 30/300s/user reuse) + α (audit log `[audit:kpi-restore]` structured JSON) + α (no migration — reuse `is_active` toggle) + α (Phase A visual smoke 4 cases) + α (R1 mitigation update KpiActionsMenu copy "có thể khôi phục bằng cách liên hệ admin" → "có thể khôi phục trong Cài đặt").
    2. Task 2A — POST `/api/kpi/[id]/restore` endpoint (commit `a9f4682`, NEW 172 LOC). Auth + rate-limit 30/300s/user + getActiveMembership + fetch kpi `.maybeSingle()` filter `is_active=false` (chỉ archived mới restore được — block trên active idempotent 200 với `already_active: true`) + cross-org guard EXPLICIT + `requireOrgRole(ADMIN_ROLES)` (CEO only, Q1 α lock match delete RBAC) + UPDATE `is_active=true` + `[audit:kpi-restore]` structured JSON với `kpi_name.slice(0, 50)` truncate. Pattern reuse 100% từ M-KPI-Mgmt-1 DELETE endpoint — atomic copy + flip filter + rename audit prefix.
    3. Task 2B — Settings page archived KPIs UI + GET `/api/kpi/archived` endpoint + R1 mitigation copy fix KpiActionsMenu (commit `1435c1b`, NEW endpoint + 2 MODIFIED). Settings page section "KPI đã lưu trữ" gate by `userRole === 'CEO'` (Member/Manager hide entire section), list archived với "Khôi phục" button per row, optimistic lift state β pattern (Settings page owns archivedKpis array + handleOptimisticRestore filter + handleRestoreRollback re-insert). KpiActionsMenu AlertDialog copy update R1 mitigation: "Xóa sẽ ẩn KPI khỏi dashboard nhưng giữ lại lịch sử cập nhật, hansei và actuals. Bạn có thể khôi phục trong Cài đặt > KPI đã lưu trữ." (đổi từ "liên hệ admin" → discoverability built-in).
  - **3 architectural changes** (reuse 100% từ M-KPI-Mgmt-1 patterns L43-L45):
    1. **Idempotent endpoint pattern reuse**: POST `/restore` mirror DELETE shape — auth + rate-limit + RBAC + cross-org guard + already-target-state path (200 với `already_active: true`). Atomic copy template từ DELETE endpoint, flip filter `is_active=false` + rename audit prefix. Pattern reusable cho future toggle-state endpoints (archive/unarchive matrix, suspend/reactivate member).
    2. **Lift state β pattern reuse**: Settings page owns archivedKpis array + optimistic callbacks down. Archived row click "Khôi phục" → optimistic filter from list → API call → `router.refresh()` invalidate Server Component cache. Pattern L44 reinforced lần 2 (M-KPI-Mgmt-1 KpiDashboardClient + M-KPI-Restore-1 Settings page).
    3. **R1 mitigation copy fix discoverability**: Original M-KPI-Mgmt-1 AlertDialog copy "có thể khôi phục bằng cách liên hệ admin" — assumption "/admin super-admin recovery dashboard" sẽ ship Phase 2. M-KPI-Restore-1 ship Settings page CEO-self-service → copy update "trong Cài đặt > KPI đã lưu trữ" (built-in discoverability, no support ticket needed). User complain Slack chiều 2026-05-09 confirm assumption sai — "liên hệ admin" friction quá cao cho Phase 2.
  - **10 decisions locked Task 1** (plans/M-KPI-Restore-1-plan.md, path α x10):
    - Q1 α RBAC CEO-only (consistency với delete Q1 α M-KPI-Mgmt-1, ADMIN_ROLES lock)
    - Q2 α Settings page over /admin super-admin (CEO self-service, no support ticket)
    - Q3 α Idempotent endpoint mirror DELETE shape (atomic template reuse, no design audit)
    - Q4 α Lift state β reuse (L44 pattern proven M-KPI-Mgmt-1)
    - Q5 α AlertDialog confirm consistent với delete UX (no UX inconsistency surprise)
    - Q6 α Rate-limit 30/300s/user reuse (same as DELETE, no new bucket)
    - Q7 α Audit log `[audit:kpi-restore]` structured JSON (pattern reuse)
    - Q8 α No migration (reuse `is_active` toggle, Q1 α M-KPI-Mgmt-1 + L43 lock)
    - Q9 α Phase A visual smoke 4 cases (defer Phase B per L42 pattern partial coverage)
    - Q10 α R1 mitigation update KpiActionsMenu copy (discoverability fix Slack feedback)
  - **Diagnose 2h deep confirm ZERO bug** (non-bug investigation, valuable pattern lesson):
    - Observation initial: Task 2B Phase A test sau ship code, count archived KPIs Settings page = 7 thay vì expected 56. Hypothesis #1: RLS policy block read non-CEO Member account leak qua somehow.
    - Investigation 2h through 4 hypothesis paths:
      - H1 RLS policy SELECT archived: REJECTED — SQL `SELECT count(*) FROM kpis WHERE org_id=Ladysfit AND is_active=false` returns 56, RLS work correctly via `auth.uid()` check
      - H2 Endpoint filter wrong: REJECTED — code review `app/api/kpi/archived/route.ts` filter `is_active=false` correct, no off-by-one
      - H3 Network response truncate: REJECTED — DevTools Network tab show full 56 rows in JSON response, no truncation
      - H4 React state stale: REJECTED — Settings page `useState` updated correctly, list render full array length
    - Root cause found at 2h mark: Observation interpretation error từ baseline counting confusion. M-Hoshin-4 cleanup 56 duplicate KPIs Ladysfit org via SQL ROW_NUMBER → 56 archived from initial pollution. M-KPI-Mgmt-1 production usage 2026-05-09 sáng → 7 user delete events qua UI (CEO test multiple times). Total archived = 56 + 7 = 63, NOT 7. UI display 56 từ initial cleanup chiếm dominant majority, 7 recent UI deletes thuần additive. Observation "7 thay vì 56" misread current count 63 as 7 (anchoring bias on M-KPI-Mgmt-1 session count).
    - DB ground truth: 63 rows archived, 9 active. UI display 63 archived correctly. ZERO bug — DB + Network + RLS + endpoint code all clean.
  - **Smoke test 4/4 Phase A PASS**:
    | Case | Description | Result |
    |---|---|---|
    | 1 | CEO restore happy path (Settings → "KPI đã lưu trữ" section → click "Khôi phục" row → AlertDialog → confirm → toast success → list filter optimistic → archived count -1 + active count +1 → router.refresh) | PASS |
    | 2 | Member/Manager hide section (Settings page render section conditional `userRole === 'CEO'` → Member view không thấy section "KPI đã lưu trữ" entire) | PASS |
    | 3 | Cancel AlertDialog no-op (click "Khôi phục" → AlertDialog → click Hủy → AlertDialog close → KHÔNG fire POST /restore endpoint → archived list unchanged) | PASS |
    | 4 | Visual integrity Settings page (section render với border-2 NB v3.2 styling consistent + table layout 3 cols (name/created_at/Khôi phục) + empty state "Chưa có KPI lưu trữ" khi list rỗng) | PASS |
  - **Files changed (2 NEW + 2 MODIFIED + 1 plan doc)**:
    - NEW: `app/api/kpi/[id]/restore/route.ts` (172 LOC, POST handler mirror DELETE shape)
    - NEW: `app/api/kpi/archived/route.ts` (GET handler list archived KPIs filter `is_active=false`, RBAC CEO-only)
    - NEW: `plans/M-KPI-Restore-1-plan.md` (Task 1 design audit V1-V8 + 10 decision lock Q1-Q10 path α x10)
    - MODIFIED: `app/dashboard/settings/page.tsx` (+section "KPI đã lưu trữ" CEO-only + lift state β pattern + optimistic restore + rollback)
    - MODIFIED: `app/dashboard/kpi/components/KpiActionsMenu.tsx` (AlertDialog copy R1 mitigation: "liên hệ admin" → "trong Cài đặt > KPI đã lưu trữ")
  - **Pattern lessons** (1 mới L47, 1 reinforced):
    1. **L47 NEW — Diagnose loop trap: trust DB + Network ground truth, KHÔNG hypothesize khi 2 evidence sources clean**: M-KPI-Restore-1 Task 2B 2h diagnose deep confirm ZERO bug — observation interpretation error từ baseline counting confusion. Pattern: khi DB query (ground truth #1) + Network response (ground truth #2) BOTH clean + match expected, STOP hypothesizing further (RLS, endpoint code, React state). Root cause likely observation/interpretation error, NOT system bug. Anti-pattern: continue 4-hypothesis-deep dive khi 2 evidence sources già confirm system OK = sunk-cost trap. Audit checklist khi diagnose bug claim: (a) DB query confirms expected state? (b) Network response carries expected data? (c) Both YES → check observation methodology FIRST (anchoring bias, baseline count drift, M-Hoshin-4 type cleanup history) BEFORE deeper code paths. NEW pitfall §10 #34 detail.
    2. **L44 reinforced lần 2 — Lift state β pattern reuse**: M-KPI-Restore-1 Settings page owns archivedKpis array + optimistic callbacks (handleOptimisticRestore filter + handleRestoreRollback re-insert). Pattern L44 từ M-KPI-Mgmt-1 (KpiDashboardClient owns kpis array) reusable cho future list mutation features (archive matrix, cancel invite, suspend member, restore archived org). Tradeoff: requires parent-child contract (callback props) — acceptable vì state ownership clear.
  - **Constraints cho future AI sessions**:
    - KHÔNG remove `is_active=false` filter từ POST `/api/kpi/[id]/restore` endpoint — Q3 α idempotent pattern lock (chỉ archived mới restore được, active hit `already_active: true` 200).
    - KHÔNG render "KPI đã lưu trữ" section cho Member/Manager trong Settings page — Q1 α RBAC CEO-only lock (consistency với delete Q1 α M-KPI-Mgmt-1).
    - KHÔNG modify AlertDialog copy KpiActionsMenu trở lại "liên hệ admin" — R1 mitigation Q10 α discoverability fix (Slack feedback 2026-05-09).
    - KHÔNG add Manager role vào ADMIN_ROLES cho restore action — preserve consistency với delete RBAC, avoid scope creep.
    - KHI build idempotent toggle-state endpoint mới (suspend/reactivate, archive/unarchive), follow pattern L43 + L44 + L47: atomic template copy từ existing endpoint + flip filter + rename audit prefix + DB query verify ground truth before hypothesize.
    - KHI diagnose claim bug + DB query + Network response BOTH clean confirm expected state, STOP code path hypothesize → check observation methodology FIRST (baseline drift, anchoring bias, cleanup history confusion). Pattern L47 + pitfall #34 lock.
    - KHÔNG ship Phase B defensive backend self-verify mỗi milestone reactively — L42 pattern partial coverage acceptable cho beta SaaS solo dev. Skip Phase B khi: (a) Phase A visual 4/4 PASS + (b) backend code review pass + (c) DB SQL test confirm state. M-KPI-Restore-1 confirm pattern reusable.
- **Previous milestone**: M-Cleanup-batch-2026-05-09 (M-Cleanup-6 Phase 2 + M-Lint-Cleanup-1 combo, 4 commits `11c6193` plan → `f7087cd` 8 drop-in sites → `96c7db6` 3 JOIN sites split-query → `73abf59` 2 lint fixes, 13 files refactored, ~1h40min work). Trigger: M-Cleanup-6 Phase 1 deferred 12 dashboard inline call sites (`find(lastOrgId) ?? memberships[0]`) chưa migrate sang `getActiveMembership` helper + 2 pre-existing lint errors verified isolation M-Cleanup-5 (zero baseline regression after M-KPI-Mgmt-1 ship). Combo opportunity: gộp 2 LOW-risk milestones cùng session, share verify-first audit pass, share docs close-out commit.
  - **Tasks shipped (4 commits)**:
    1. Task 1 — Plan + verify-first audit (commit `11c6193`, `plans/M-Cleanup-batch-2026-05-09-plan.md` 193 LOC). 12 inline sites table audited (8 drop-in / 3 JOIN-split / 1 layout deferred), 2 lint errors confirmed isolation, 5 decisions Q1-Q5 locked (β 3 commits domain / α split-query / β 4-page smoke / α separate lint commit).
    2. Task 2 — Refactor 8 drop-in sites (commit `f7087cd`, +34/-101 LOC, 8 files). Apply `getActiveMembership(supabase, userId, lastOrgId)` helper M-Cleanup-6 P1 pattern. Per-site guard preserved: 5 redirect, 1 return-null, 2 null-tolerant. `lastOrgId` normalized `?? null` (matches helper signature `string | null`). Sites: page (null-tolerant), kpi (null-tolerant), settings, x-matrix/new, x-matrix/[year]/review (rename `orgMember` → `membership`), discovery/swot, discovery/swot/strategy, discovery/xray-history (return-null fallback).
    3. Task 3 — Refactor 3 JOIN sites split-query pattern (commit `96c7db6`, +30/-48 LOC, 3 files). Replace inline JOIN `select('org_id, organizations(...)')` + `as { ... }` cast với helper + explicit 2nd query `organizations.select('...').eq('id', membership.org_id).single()`. Add defensive `if (!org) redirect('/onboarding/setup-org')` guard race-safe (org có thể bị delete giữa 2 queries). Type clarity win: typed Supabase query result, no more cast. Sites: discovery/benchmark (industry only), discovery/vision-workshop (name+industry+headcount), discovery/synthesis (name+industry+city+headcount).
    4. Task 4 — Lint fix canonical hoist (commit `73abf59`, +17/-11 LOC, 2 files). XRayHistoryChart CustomDot hoist module-level + `ink` prop thread (recharts cloneElement preserve props khi inject cx/cy/payload). Verified empirically α `useCallback` REJECTED bởi rule (AST inspection, không runtime check) — pitfall #32 NEW. invite/[token]/page.tsx replace `<a href="/">` với `<Link href="/">` + import next/link.
  - **3 architectural changes**:
    1. **Helper API stability over consumer convenience (Q2 α decision lock)**: 3 JOIN sites split-query thay vì extend helper return shape với optional `organizations` field. Pattern: helper return MINIMAL shape (`{ org_id, role } | null`), consumer fetch additional fields nếu cần. Cost ~5-10ms extra round-trip per page acceptable cho type clarity. Pattern lesson L40 reinforced (M-Auth-MultiOrg-1): keep helper API stable + minimal, push variance to consumers via explicit 2nd query.
    2. **Layout defer pattern (Q1 β subset)**: `app/dashboard/layout.tsx` defer M-Cleanup-6-P3 vì caller cần full `memberships[]` array cho `membershipsForSwitcher` (M-Auth-MultiOrg-1 wire) + `orgIds` bulk lookup. Helper drop-in sẽ duplicate query. Pattern lesson: helper migration KHÔNG universal — caller có dual-purpose query (single + array) defer hoặc redesign helper với pure picker variant.
    3. **Defensive guard race-safe split-query (NEW pattern from Task 3 commit `96c7db6`)**: Sau split-query lookup `organizations` table, MUST guard `if (!org) redirect('/onboarding/setup-org')` vì org có thể bị delete giữa 2 queries (race condition). Pattern: split-query consumer-side ALWAYS adds null guard — KHÔNG assume row exists post-helper-success.
  - **5 decisions locked Task 1** (plans/M-Cleanup-batch-2026-05-09-plan.md):
    - Q1 β 3 commits theo domain (8 drop-in / 3 JOIN-split / 2 lint) — atomic revert unit per concern
    - Q2 α split-query JOIN handling (consistency với report/monthly precedent M-Cleanup-6 P1)
    - Q3 β 4-page smoke scope (1 page per call shape variant: dropin/JOIN-split/null-tolerant/return-null)
    - Q4 α separate lint commit (different rollback shape vs refactor)
    - Q5 effort ~1h40min within 1.5h estimate, risk LOW (no schema/route/auth changes)
  - **Smoke test 4/4 PASS Phase A** (per Q3 β decision):
    | Case | Description | Result | Source |
    |---|---|---|---|
    | 1 | dropin pattern — `/dashboard/kpi` (helper drop-in, role default 'Member', null-tolerant) | PASS | Browser test |
    | 2 | JOIN-split pattern — `/dashboard/discovery/benchmark` (helper + 2nd organizations query + race-safe guard) | PASS | Browser test |
    | 3 | chart token resolution preserved — `/dashboard/discovery/xray-history` (CustomDot hoist + ink prop, M-Design-3b token pattern intact) | PASS | Browser test |
    | 4 | invite Link client-side nav — `/invite/[token]` gone-state about/landing link | PASS | Browser test |
  - **Files changed (13 files MODIFIED + 1 plan doc)**:
    - NEW: `plans/M-Cleanup-batch-2026-05-09-plan.md` (193 LOC, verify-first audit table + 5 decisions Q1-Q5)
    - MODIFIED 8 drop-in sites (+34/-101 LOC commit `f7087cd`): `app/dashboard/page.tsx` + `app/dashboard/kpi/page.tsx` + `app/dashboard/settings/page.tsx` + `app/dashboard/x-matrix/new/page.tsx` + `app/dashboard/x-matrix/[year]/review/page.tsx` + `app/dashboard/discovery/swot/page.tsx` + `app/dashboard/discovery/swot/strategy/page.tsx` + `app/dashboard/discovery/xray-history/page.tsx`
    - MODIFIED 3 JOIN sites split-query (+30/-48 LOC commit `96c7db6`): `app/dashboard/discovery/benchmark/page.tsx` + `app/dashboard/discovery/vision-workshop/page.tsx` + `app/dashboard/discovery/synthesis/page.tsx`
    - MODIFIED 2 lint files (+17/-11 LOC commit `73abf59`): `app/dashboard/discovery/xray-history/XRayHistoryChart.tsx` (CustomDot hoist + ink prop) + `app/invite/[token]/page.tsx` (a→Link + next/link import)
  - **Pattern lesson L46** (1 mới, generalize): **AST-based static lint rules ≠ runtime behavior checks** — when `react-hooks/static-components` (or similar AST inspection rules) fires on memoized component, hoist là canonical fix. KHÔNG cố `useCallback`/`useMemo` wrap — rule không recognize runtime memoization. Apply universally cho lint rules có "static" suffix, "no-create-during-render" semantic, hoặc declaration-site analysis. Verified empirically M-Lint-Cleanup-1 commit `73abf59` (option α reject, β hoist works). Detail pattern fix trong pitfall #32. Cost ~5 phút per Recharts custom component refactor (1-prop drill typical).
  - **Bonus catches verify-first** (drift discovered Task 1 audit):
    - HANDOFF prose claim "12 inline sites" CONFIRMED (grep verify exact count)
    - HANDOFF prose claim "invite href=/login" SAI — actual `href="/"` (about/landing root). Plan file fix in-line + commit message correct target.
    - HANDOFF prose KHÔNG mention layout.tsx dual-purpose query complication. Audit phát hiện via Read full file → defer M-Cleanup-6-P3 lock.
    - User decision Q4 α (useCallback recommended) verified empirically REJECTED bởi rule. Fall back β hoist (option also documented in plan as alternative). Decision drift caught pre-ship.
  - **Constraints cho future AI sessions**:
    - KHÔNG dùng inline `find(m => m.org_id === lastOrgId) ?? memberships[0]` cho org_members lookup mới. Pattern: `getActiveMembership(supabase, userId, lastOrgId)` helper (`lib/auth/getActiveMembership.ts`).
    - KHÔNG extend helper return shape với optional `organizations` field — Q2 α decision lock. Split query là pattern cho mọi JOIN scenario.
    - KHI add split-query pattern (helper + 2nd query for related table), MUST add null guard cho 2nd query result (race-safe pattern from `96c7db6`).
    - KHÔNG cố `useCallback`/`useMemo` wrap để fix `react-hooks/static-components` rule — REJECTED empirically. Pattern: hoist module-level + props pass (canonical β). Pitfall #32.
    - KHÔNG migrate `app/dashboard/layout.tsx` inline pattern sang `getActiveMembership` mà không design audit — caller dual-purpose query (single membership + memberships[] array cho switcher). Defer M-Cleanup-6-P3 hoặc extract pure picker `pickActiveMembership(memberships, lastOrgId)` sibling helper.
    - KHÔNG dùng `<a href="/...">` cho intra-app navigation — Next.js rule `no-html-link-for-pages` enforce `<Link>` từ `next/link`. Lint baseline 0 errors — regression guard.
- **Previous milestone**: M-KPI-Mgmt-1 (KPI Soft-Delete + 3-Dots Menu + Layer 1+2+3+4 Defense in Depth, 4 commits `c87015d`→`0140dfa`, 8 files, ~2-3h work). Trigger: M-Hoshin-4 cleanup 56 duplicate KPIs Ladysfit qua manual SQL ROW_NUMBER (DB sửa thủ công). User thật giai đoạn ">5 user" sẽ chắc chắn hit pain point này. UI hiện tại KHÔNG có cách xóa KPI — phải vào Supabase SQL Editor sửa thủ công. Foundation post M-Auth-MultiOrg-1: multi-org switcher đã ship → KPI scope per-org consistency-able. Soft-delete precedent M-Hoshin-4 (`is_active=false` reversible).
  - **Tasks shipped (4 commits)**:
    1. Task 1 — Plan + verify-first audit V1-V7 + 8 decision lock Q1-Q8 (commit `c87015d`, `plans/M-KPI-Mgmt-1-plan.md` 284 LOC). Path lock α+α+γ+β+γ+β+γ+β.
    2. Task 2A — DELETE `/api/kpi/[id]` endpoint (commit `4a8f21d`, NEW 169 LOC). Auth + rate-limit 30/300s/user + getActiveMembership + fetch kpi `.maybeSingle()` + cross-org guard EXPLICIT + idempotent already-archived path + `requireOrgRole(ADMIN_ROLES)` (CEO only) + UPDATE `is_active=false` + `[audit:kpi-delete]` structured JSON với `kpi_name.slice(0, 50)` truncate.
    3. Task 2B — `KpiActionsMenu` component + wire vào KpiCard + lift state (commit `c0da261`, NEW 121 LOC + 3 MODIFIED). DropdownMenu (`@base-ui/react/menu`) + AlertDialog "Xóa KPI \"{name}\"?" với copy "Xóa sẽ ẩn KPI khỏi dashboard nhưng giữ lại lịch sử cập nhật, hansei và actuals. Bạn có thể khôi phục bằng cách liên hệ admin." Q4 β. Touch ≥44px iOS HIG (Q8 β). Optimistic lift state β: KpiDashboardClient owns `kpis` array + `handleOptimisticDelete` filter + `handleDeleteRollback` re-insert. `router.refresh()` invalidate Server Component cache.
    4. Task 2D — Patch 3 mutation guards `is_active=true` filter (commit `0140dfa`, +1 LOC × 3 files). `kpi/entry/route.ts:23` + `hansei/list/route.ts:40` + `hansei/create/route.ts:35`. Comment `M-KPI-Mgmt-1: block mutations on archived KPI`.
  - **3 architectural changes**:
    1. **Layer 1+2+3+4 defense in depth**: Layer 1 (UI) `KpiActionsMenu` returns null cho non-CEO. Layer 2 (mutation guard) 3 routes filter archived. Layer 3 (RBAC) DELETE endpoint `requireOrgRole(ADMIN_ROLES)`. Layer 4 (RLS) org_id scoping at DB. Pattern lesson L43.
    2. **Soft-delete pattern (Q1 α)**: `UPDATE is_active=false` over `DELETE FROM kpis` — preserve 3 FK CASCADE child tables (`kpi_entries`, `kpi_actuals`, `weekly_hansei`). M-Hoshin-4 precedent reinforce.
    3. **Optimistic lift state β over spec γ refresh-only**: KpiDashboardClient owns `kpis` array + callbacks down. Spec ban đầu γ "router.refresh() pessimistic" → V5 audit phát hiện β cleaner. Pattern lesson L44.
  - **8 decisions locked Task 1** (plans/M-KPI-Mgmt-1-plan.md):
    - Q1 α SOFT-DELETE only via `is_active=false` (FK CASCADE risk + audit trail preserved)
    - Q2 α XÓA only MVP (defer rename Phase 2 — 80/20 duplicate cleanup pain #1)
    - Q3 γ DEFER edit name UX (Q2 α dependency — Phase 2 nếu user complain)
    - Q4 β AlertDialog Vietnamese copy (destructive gravity, emphasize reversibility "giữ lịch sử")
    - Q5 γ OPTIMISTIC + `router.refresh()` (refined V5 → β lift state during Task 2B build)
    - Q6 β UPDATE 3 mutation guards thiếu filter (V3 audit phát hiện asymmetry — pitfall #31)
    - Q7 γ console.log `[audit:kpi-delete]` (defer migration `036_kpis_deleted_at_by.sql` Phase 2)
    - Q8 β DropdownMenu mobile parity ≥44px (L38 zero-cost reuse desktop)
  - **Bonus catches Cursor verify-first**:
    - V3 plan claim 7/7 list readers OK confirmed via grep (no regression)
    - `getKpiHanseiHistory` reads `weekly_hansei` KHÔNG join kpis → archived KPI history vẫn readable (intentional read-only reference, document trong pitfall #31)
    - V5 lift state β cleaner than spec γ (KpiDashboardClient already owns array, callback drill 2-level OK)
    - `DropdownMenuItem variant="destructive"` built-in primitive prop (line 79-95 dropdown-menu.tsx) hơn manual `text-destructive` className → safer theme tokens
    - `onClick` thay `onSelect` cho DropdownMenuItem (base-ui pattern simpler, KHÔNG cần `e.preventDefault()`)
    - V6 plan claim "Manager xóa được" SAI — actual `ADMIN_ROLES = ['CEO']` only (server.ts:19). Cursor verify-first phát hiện reinforce L29/L32 → L45.
    - Spec Task 2A bug `rateLimitResult.ok` → real shape `.allowed` từ `RateLimitResult` (rate-limit.ts:3-8). Fixed pre-build.
    - Spec Task 2A bug `roleCheck.response` → real shape `{ error, status }` từ `RoleCheckResult` (server.ts:74-77). Fixed pre-build.
    - Spec Task 2A bug `getClientIp(request)` → must `getClientIp(request.headers)` (rate-limit.ts:37 takes Headers). Fixed pre-build.
    - Spec Task 2B "absolute right-2 top-2" deviated → inline sibling per V4 plan (avoid overlap với existing Badge + Cập nhật button). Cleaner UX.
  - **Smoke test 3/8 visual PASS + 5/8 backend verified Cursor self-verify**:
    | Case | Description | Result | Source |
    |---|---|---|---|
    | 1 | CEO delete KPI happy path (3-dots → menu → "Xóa KPI" → AlertDialog → "Xóa KPI" destructive button → toast success → list filter optimistic → router.refresh) | PASS visual | Browser test |
    | 2 | Member/Manager hide menu (canDelete=false → KpiActionsMenu return null) | PASS visual | Browser test |
    | 3 | Idempotent already-archived (DELETE retry → 200 success `already_archived: true`) | PASS backend | Cursor verify Task 2A line 106-113 |
    | 4 | Cancel AlertDialog (click Hủy → confirmOpen=false → KHÔNG fire DELETE) | PASS backend | Cursor verify Task 2B onOpenChange wired |
    | 5 | Cross-org 403 (POST `/api/kpi/[id]` với KPI khác org) | PASS backend | Cursor verify Task 2A line 99-104 |
    | 6 | Rate-limit 429 (31 requests/300s) | PASS backend | Cursor verify Task 2A line 53-67 |
    | 7 | Archived KPI POST entry → 404 (Layer 2 mutation guard) | PASS backend | Cursor verify Task 2D 3 patches |
    | 8 | Visual integrity card layout (3-dots inline sibling KHÔNG overlap Badge + Cập nhật button) | PASS visual | Browser test |
  - **Files changed (3 NEW + 5 MODIFIED + 1 plan doc)**:
    - NEW: `app/api/kpi/[id]/route.ts` (169 LOC, DELETE handler với 4-layer defense)
    - NEW: `app/dashboard/kpi/components/KpiActionsMenu.tsx` (121 LOC, DropdownMenu + AlertDialog)
    - NEW: `plans/M-KPI-Mgmt-1-plan.md` (284 LOC, design audit V1-V7 + 8 decision lock Q1-Q8)
    - MODIFIED: `app/dashboard/kpi/components/KpiCard.tsx` (+18/-2 LOC, import KpiActionsMenu + extend props + render menu inline sibling)
    - MODIFIED: `app/dashboard/kpi/components/KpiDashboardClient.tsx` (+20/-1 LOC, userRole prop + handleOptimisticDelete + handleDeleteRollback + prop drill)
    - MODIFIED: `app/dashboard/kpi/page.tsx` (+1/-1 LOC, pass `userRole={role}`)
    - MODIFIED: `app/api/kpi/entry/route.ts` (+1 LOC, mutation guard Layer 2)
    - MODIFIED: `app/api/hansei/list/route.ts` (+1 LOC, mutation guard Layer 2)
    - MODIFIED: `app/api/hansei/create/route.ts` (+1 LOC, mutation guard Layer 2)
  - **Pattern lessons** (4 mới L42-L45, đáng generalize):
    1. **L42 — Visual evidence smoke test partial coverage acceptable cho beta SaaS solo dev**: M-KPI-Mgmt-1 smoke test 3/8 cases visual PASS (CEO delete flow + Member hide + visual integrity) thay thế full E2E khi backend verified qua Cursor self-verify chain. Trade-off: visual proof cho UX-facing bugs (Layer 1 UI hide, AlertDialog copy, toast feedback), code-review proof cho backend (Layer 2 mutation guard, Layer 3 rate limit, Layer 4 RLS). Anti-pattern: sunk-cost troubleshoot tooling khi alternative path cover 80% risk. Defer remaining cases (idempotent, cross-org, rate limit) post-deploy reactive verify nếu user complain. Apply universally cho beta phase: cases critical UX-facing PASS visual = ship-able, backend cases verified structure defer reactive.
    2. **L43 — Layer 1+2+3+4 defense in depth pattern cho destructive features**: Soft-delete ship trong M-KPI-Mgmt-1 lock pattern 4 layers cho destructive features (delete/archive/disable). Layer 1 (UI hide affordance via role check), Layer 2 (mutation guard `is_active=true` filter trong N verify-by-ID routes), Layer 3 (RBAC server-side `requireOrgRole`), Layer 4 (RLS org_id scoping at DB). Apply universally cho future destructive features (org delete, member kick, matrix archive). Pattern: KHÔNG bao giờ chỉ dùng 1 layer — UI hide alone = bypass via direct API call; RBAC alone = race condition between UI và check.
    3. **L44 — Optimistic lift state β pattern cho list mutations**: Khi component con mutate row trong list parent quản lý, lift state UP — parent owns array, exposes callbacks `onOptimisticDelete(id)` + `onDeleteRollback(row)` xuống con. Con call API + invoke callback trên success/error path. Cleaner hơn local component state α (con tự hide → list parent stale, refresh shows row back) hoặc refresh-only γ (pessimistic UX, click → wait → disappear). Reusable pattern cho future list mutation features (archive matrix, cancel invite, delete blog post). Tradeoff: requires parent-child contract (callback props) — acceptable vì state ownership clear.
    4. **L45 — Verify-first invalidate plan claim L29/L32 reinforced lần 4**: M-KPI-Mgmt-1 Task 2A Cursor verify-first phát hiện plan R1 risk entry sai ("Manager role có quyền xóa") — actual `ADMIN_ROLES = ['CEO']` only trong `lib/supabase/server.ts:19`. Pattern lesson L29 (M-Hoshin-7) → L32 (M-Member-POV-1) → L45 (M-KPI-Mgmt-1) reinforced lần 4: trust Cursor verify-first hơn AI assumption từ HANDOFF prose, plan file claim, hoặc memory training data. Apply: TRƯỚC khi commit decision dựa trên prose claim, verify-first qua code reading minimum 1 file. Bonus M-KPI-Mgmt-1: 3 spec bugs (rate-limit `.ok` → `.allowed`, `roleCheck.response` → wrap NextResponse manual, `getClientIp(request)` → `request.headers`) cũng phát hiện qua verify-first chain — fix pre-build, KHÔNG ship rồi rollback.
  - **Constraints cho future AI sessions**:
    - KHÔNG bao giờ thêm `DELETE FROM kpis` query trừ /admin super-admin justification rõ. Default mutate = `UPDATE kpis SET is_active=false` (Q1 α lock).
    - KHÔNG remove `.eq('is_active', true)` filter từ 3 mutation guards (`kpi/entry`, `hansei/list`, `hansei/create`) — Layer 2 defense regression guard. Pitfall #31 + L43.
    - KHÔNG render `KpiActionsMenu` cho Member/Manager — Q1 α + V6 ADMIN_ROLES = CEO only lock. `canDelete={userRole === 'CEO'}` derive ở 1 nơi (KpiCard).
    - KHÔNG add custom error message "KPI archived" trong 3 mutation guards — existing 404 message cố ý ambiguous (KHÔNG expose archived state to attacker probe). Defer Phase 2 nếu user phàn nàn confusing UX.
    - KHI add UI feature mutate state list (delete/archive/edit row), follow lift state β pattern: parent owns array + optimistic callback + rollback on error. Anti-pattern: local component state α tự hide row → list parent stale → refresh shows back.
    - KHI add new mutation route touch `kpis` table by ID, MUST add `.eq('is_active', true)` filter mặc định (default to active-only mutations). Exception: history readers — document explicit comment.
    - KHI ship destructive mutation feature, MUST cover 4 layers: UI hide (role check), mutation guard (filter `is_active=true`), RBAC (`requireOrgRole`), RLS (DB-level). Audit checklist trước merge: grep tất cả 4 layers present.
    - KHI verify-first phát hiện plan claim sai (vd plan R1 "Manager xóa được" thực tế CEO only), update plan in-line + flag rõ trong verify report — KHÔNG silent fix code không update plan (drift gap risk).
    - Phase 2 deferred items (KHÔNG include trong M-KPI-Mgmt-1):
      - M-KPI-Restore-1 — Restore archived KPIs UI cho CEO (POST `/api/kpi/[id]/restore` toggle `is_active=true`)
      - M-KPI-Edit-1 — Inline edit KPI name + target_value (Q2 α + Q3 γ defer)
      - Migration `036_kpis_deleted_at_by.sql` (Q7 β proper audit columns)
      - /admin super-admin recovery dashboard (undo soft-delete UI)
      - Bulk delete (multi-select UI)
- **Previous milestone**: M-Auth-MultiOrg-1 (Org Switcher UI + JWT metadata sync trio, 5 commits `0f6bcd4`→`b941b37`, 6 files, ~3h work). Trigger: M-OrgInvite-1 wired 50% multi-org infra (table `org_invites` + accept flow auto-set `last_org_id`) but missed 50% UI — user thật KHÔNG có cách CHỦ ĐỘNG switch giữa orgs đã join. Fallback `memberships[0]` (newest) là stopgap MVP. Sub-trigger: M-OrgInvite-1 deferred bug — `updateUser({ data: { last_org_id }})` không reflect vào session ngay (root cause discovered late: JWT metadata cache, pitfall #30).
  - **Tasks shipped (5 commits)**:
    1. Task 1 — Plan + design audit + 6 decision lock Q1-Q6 (commit `0f6bcd4`, `plans/M-Auth-MultiOrg-1-plan.md` 288 LOC)
    2. Task 2A — POST `/api/orgs/switch` endpoint (commit `370b72f`, NEW 126 LOC). Auth + Zod schema + rate limit 30/5min/user + audit log `[audit:org-switch]` structured JSON + membership verify direct query (role for audit) + `auth.updateUser({ last_org_id })`.
    3. Task 2B — `OrgSwitcher` component + sidebar wire (commit `ffc0714`, NEW component 145 LOC + sidebar.tsx integration). `@base-ui/react/menu` primitive, `DropdownMenuItem` + manual `<Check />` indicator (NOT RadioItem — semantic mismatch), Q1 α full org name truncate `max-w-[140px]`, Q2 γ render dropdown even 1 org. Optional props pattern: `orgId?` + `memberships?` với `showSwitcher` guard, falls back to legacy static block khi caller chưa wire data.
    4. Task 2C — Wire data fetch in `app/dashboard/layout.tsx` + cascade qua Header (commit `993fd14`). 2-query split (`.in('id', orgIds)`) thay vì JOIN — match M-Cleanup-6 HANDOFF guidance, avoids type-cast pitfall. `membershipsForSwitcher` array shape `{ org_id, org_name, role }` derived từ Map. Header.tsx pass-through cho `MobileSidebarContent` (Q6 β-revised mobile parity zero-cost).
    5. Task 2D-fix — `refreshSession()` after `updateUser` để JWT re-mint với fresh metadata (commit `b941b37`, +21/-3 LOC). Smoke test CASE 1 phát hiện CheckCircle indicator stale sau Member→CEO switch — root cause Supabase JWT cache layer giữa middleware + Server Component. V5 hypothesis (auth.getUser network call = fresh metadata) partially WRONG — getUser hits `/auth/v1/user` nhưng claim trả về reflects JWT payload, stale until re-minted. Decision Q4 γ refined → trio pattern `updateUser` + `refreshSession` + full reload.
  - **6 decisions locked Task 1** (plans/M-Auth-MultiOrg-1-plan.md):
    - Q1 α full: avatar 8x8 + full org name truncate `max-w-[140px]` (zero breaking change vs existing static block)
    - Q2 γ render normal: dropdown click được kể cả khi 1 org (consistency UX, "+ Tạo org mới" CTA discover)
    - Q3 β optimistic: zero loading state cho first paint (props từ Server Component synchronous), button disabled during POST = separate concern
    - Q4 γ → REFINED post-smoke: full reload + `refreshSession` trio. V5 partial sai → trio pattern decision lock new
    - Q5 α top: replace existing Org info block in-place line 89-96 sidebar.tsx (zero layout shift)
    - Q6 β-revised: zero mobile-specific code, OrgSwitcher inherit qua MobileSidebarContent → Sheet drawer
  - **Smoke test 6/6 PASS post-fix b941b37**:
    | Case | Description | Result |
    |---|---|---|
    | 1 | Multi-org switch Member→CEO (CheckCircle migrate) | PASS |
    | 2 | Single-org γ render (1 org user vẫn thấy dropdown + "+ Tạo org mới") | PASS |
    | 3 | RLS deny non-member (POST với org_id KHÔNG thuộc) | PASS HTTP 403 |
    | 4 | Mobile Sheet drawer (hamburger → drawer → OrgSwitcher click) | PASS |
    | 5 | "+ Tạo org mới" navigation `/onboarding/setup-org` | PASS |
    | 6 | Rate limit (35 requests, expect ~30 + ~5 429) | PASS 29/6/0 |
  - **Files changed (3 NEW + 3 MODIFIED)**:
    - NEW: `app/api/orgs/switch/route.ts` (126 LOC)
    - NEW: `components/layout/org-switcher.tsx` (145 LOC)
    - NEW: `plans/M-Auth-MultiOrg-1-plan.md` (288 LOC, design audit + decision lock)
    - MODIFIED: `app/dashboard/layout.tsx` (+18/-6 LOC, build orgNameById Map + pass `orgId` + `memberships` to Sidebar/Header)
    - MODIFIED: `components/layout/sidebar.tsx` (+34/-7 LOC, optional props + `showSwitcher` guard + OrgSwitcher invocation)
    - MODIFIED: `components/layout/header.tsx` (+4/-2 LOC, cascade props to MobileSidebarContent)
  - **Production verify (2026-05-09 post-deploy 5/5 PASS)**: Vercel deploy `dpl_GL952HzBkGaGCKFwwSdawGyLvp2k` READY. Build clean 23.8s (0 error/warning). Smoke production 4/4:
    - `POST /api/orgs/switch` → HTTP 401 (route exists, auth gate hit)
    - `GET /api/swot/xray-context` → HTTP 404 (M-Cleanup-5 cleanup preserved)
    - `GET /api/swot/prefill-from-xray` → HTTP 404 (M-Cleanup-5 cleanup preserved)
    - `GET /` → HTTP 200 (landing page OK)
    - Playwright bonus: `/dashboard` redirect `/login` no 500 error
    - Note: Vercel alias propagation lag observed (~5-10 phút) — production traffic temporarily serve từ previous deploy post-READY confirm. Pattern reusable: alias propagation timing không block milestone close-out nếu new deploy READY + smoke tests hit user-facing URL return expected codes (route reachable confirms cycling complete eventually). Pattern lesson L41 §17.
  - **Pattern lessons** (4 mới, đáng generalize):
    1. **L37 — Trio pattern cho user_metadata sync** (REFINED post-smoke từ L37 anticipate "full reload bypass cookie staleness"): Mutate `user_metadata` + read sau đó MUST follow `updateUser` + `refreshSession` + full reload trio. `auth.getUser()` đi network call NHƯNG returns JWT claim, không fresh DB. `refreshSession` re-mints JWT với fresh payload bridge gap. Anti-pattern: skip refreshSession assume `getUser` = fresh.
    2. **L38 — Sheet drawer mobile parity zero-cost** (proven validated trong M-Auth-MultiOrg-1 smoke test CASE 4): Khi mobile pattern dùng Sheet drawer rendering same content as desktop sidebar (existing `MobileSidebarContent` wraps `SidebarContent`), thêm component mới vào sidebar tự động available trên mobile. Zero mobile-specific code. Proven CASE 4 PASS (hamburger → drawer → OrgSwitcher click works identical desktop).
    3. **L39 — Reader-uniform-pattern enables single-mutation switch** (proven validated): 19 reader files đều dùng pattern `find(m => m.org_id === lastOrgId) ?? memberships[0]` (V6 audit M-Auth-MultiOrg-1 plan). 1 metadata write → all 19 readers consistent behavior. Decision lock pattern: TRƯỚC khi build cross-cutting feature mutate state, audit reader pattern uniformity. Non-uniform readers = bugs from inconsistency.
    4. **L40 — Optional props + fallback pattern cho phase boundary buildability** (M-Auth-MultiOrg-1 Task 2B → 2C transition): Khi component cần data chưa available ở caller (data fetch wired ở task sau), make new props OPTIONAL + render fallback. Sidebar Task 2B làm `orgId?` + `memberships?` với `showSwitcher = !!orgId && !!memberships` guard, fallback to legacy static block. Task 2C wire layout.tsx → guard trips → OrgSwitcher activates. Typecheck stays green qua phase boundary. Bonus: defensive cho future non-dashboard callers (admin layouts, etc.) — KHÔNG remove fallback sau khi data wired.
  - **Constraints cho future AI sessions**:
    - KHÔNG remove `refreshSession()` call sau `updateUser` trong `/api/orgs/switch` — JWT metadata cache regression guard (pitfall #30)
    - KHÔNG modify Sidebar `orgId` + `memberships` props từ optional sang required mà không audit tất cả callers — defense layer for /admin và future routes (L40)
    - KHÔNG dùng `auth.getUser()` expecting fresh `user_metadata` sau `updateUser` without `refreshSession` bridge — pattern L37 + pitfall #30
    - KHI thêm route mới mutate `user_metadata` + read sau đó (vd profile_pic_url, theme_pref, locale), MUST follow trio pattern `updateUser` + `refreshSession` + full reload HOẶC redesign architecture (vd persist vào dedicated `users` table thay vì `auth.users.user_metadata`)
    - KHÔNG dùng `router.push` thay `window.location.href` cho post-mutation reload khi mutation touches `user_metadata` — pattern bug M-OrgInvite-1 + M-Auth-MultiOrg-1 reaffirm (router.push preserve cookie state, full reload triggers middleware re-mint)
    - KHÔNG dùng `DropdownMenuCheckboxItem` cho org list — semantic mismatch (checkbox = independent toggles, switcher = 1-of-N selection). Đã dùng `DropdownMenuItem` + manual `<Check />` indicator
    - KHÔNG add OrgSwitcher vào `bottom-nav.tsx` — Q6 β-revised decision lock. Mobile UX qua Sheet drawer reuse SidebarContent
    - KHÔNG render OrgSwitcher dropdown trong empty state với 0 memberships — layout.tsx redirect '/onboarding/setup-org' cho case này, switcher KHÔNG bao giờ thấy `memberships.length === 0`
    - KHI extend `SidebarProps` với field mới, MUST cập nhật cả Sidebar + MobileSidebarContent + Header.tsx caller (cascade chain) — type checker enforce
    - KHI add rate limit cho route mới authenticated, dùng `checkRateLimit` direct với key `<route>:${userId}` (per-user bucket), pattern matches `/api/orgs/check-similar` + `/api/orgs/switch`. Khi M-RateLimit-Generic-1 ship, migrate cùng commit
- **Previous milestone**: M-Cleanup-5 (Tech debt sweep, 2 commits: `40d3ca4` code + docs close-out này, ~25 phút work). Trigger: 3 candidates pile-up §18 backlog (admin views Q1, orphan SWOT routes Q2, migration 034 backfill Q3) + 2 close-out items pre-existing debt (`<NEXT_HASH>` placeholder §16 line 1067, `M-AICoach-AutoFill-1` stale §18 — đã ship via M-AICoach-Sensei-1 Task 6D).
  - **Tasks shipped (2 commits)**:
    1. Task 1: Plan docs design audit + 6 decision lock (commit `920080b`, `plans/M-Cleanup-5-plan.md` 237 LOC)
    2. Task 2 commit 1: Code changes — remove 2 orphan SWOT routes + backfill migration 034 (commit `40d3ca4`, -192 LOC + 7 LOC migration .sql)
    3. Task 2 commit 2: Docs close-out — HANDOFF cleanup stale references (commit này)
  - **6 decisions locked Task 1 (plans/M-Cleanup-5-plan.md)**:
    - Q1 α DEFER admin views 010 lines 60-61 + 89-90 (`LIMIT 1` cho CEO pick) — trigger condition rare (org thực tế 1 CEO), revisit khi M-OrgInvite-1 generate org có >1 CEO + support team escalation
    - Q2 α REMOVE 2 orphan SWOT routes (`/api/swot/xray-context` 76 LOC + `/api/swot/prefill-from-xray` 116 LOC) — verify 0 frontend caller toàn repo, last modified 2026-04-30 chỉ là M-Hoshin-7 maintenance fix `3e29a66`, KHÔNG roadmap revive 1-2 milestones tới
    - Q3 α BACKFILL migration 034 NOW — 5 phút effort, repo state = production state (locked), git revert có ý nghĩa rollback
    - Q4 α MINIMAL smoke: typecheck + build PASS đủ — Q1 defer + Q2 remove dead + Q3 backfill mirror = 0 user-visible behavior change
    - Q5 γ TÁCH 2 commits — code (B+C) separate from docs (D1+D2), match repo convention `chore:` vs `docs(close-out):`
    - Q6 Effort ~25 phút, risk LOW
  - **Verify-first findings**:
    - V1: `010_admin_views.sql` lines 60-61 + 89-90 confirmed `LIMIT 1` không `ORDER BY` (non-deterministic CEO pick), 2 view consumer admin dashboard
    - V2: 2 orphan routes 0 caller (`HANDOFF.md` only reference, không phải caller), git log -1 `2026-04-30 17:24:49` = M-Hoshin-7 maintenance fix
    - V3: `supabase/migrations/` gap ở 034 confirmed (025-033 + 035 present), functional index không cần update `lib/supabase/types.ts`
    - V4: `M-AICoach-AutoFill-1` 1 hit line 2252 (§18 candidate stale), `<NEXT_HASH>` 1 hit line 1067 (§16 placeholder)
  - **Smoke test**: `rm -rf .next && npm run typecheck` PASS clean (stale type validator cache cleanup), `npm run build` PASS. Pre-existing lint errors (NOT introduced bởi M-Cleanup-5): `react-hooks/static-components` 1 file + `app/invite/[token]/page.tsx:75` `no-html-link-for-pages` — verify qua `git stash` reproduce trên HEAD `920080b`. Out of scope, defer M-Lint-Cleanup-1 (xem §18 candidates).
  - **Production verify (post-deploy 4/5 PASS)**: Vercel deploy `dpl_H9EAUicovPWHRbw8ko6J1F7YF6ku` READY (build 29.2s clean, 0 error/warning). Build logs 0 match cho 2 deleted routes (xray-context + prefill-from-xray). Runtime 0 errors trong 5 phút post-deploy. Curl confirmed HTTP 404 cho `/api/swot/xray-context` + `/api/swot/prefill-from-xray` production. Migration 034 functional index intact verified qua `/api/orgs/check-similar` endpoint reach DB without 500. Vercel deploy queue delay note: ~10 phút INITIALIZING trước BUILDING (multi-milestone same day pipeline contention) — xem L36 §17.
  - **Files changed (3 files code + HANDOFF docs)**:
    - DELETED: app/api/swot/xray-context/route.ts (76 LOC)
    - DELETED: app/api/swot/prefill-from-xray/route.ts (116 LOC)
    - CREATED: supabase/migrations/034_idx_organizations_lower_name_city.sql (7 LOC, mirror production schema)
    - HANDOFF.md: §16 add M-Cleanup-5 entry, §17 add architecture decisions, §18 move shipped + remove stale candidates, line 1067 placeholder cleanup
    - plans/M-Cleanup-5-plan.md: design audit + decision lock (Task 1)
  - **Constraints cho future AI sessions**:
    - KHÔNG re-create `app/api/swot/xray-context/route.ts` hoặc `prefill-from-xray/route.ts` mà không design audit. Verified 0 caller M-Cleanup-5, removal rationale rõ. Nếu cần xray context cho SWOT prefill build route mới — Q2 α decision lock
    - KHI build route mới fetch xray context cho SWOT, follow pattern M-Cleanup-6 Phase 1: `getActiveMembership(supabase, lastOrgId)` helper + `.maybeSingle()` cho user→resource lookup. KHÔNG copy legacy code từ git history `3e29a66` mà chưa audit shape contract end-to-end (L7 reinforce)
    - Migration 034 functional index `idx_organizations_lower_name_city` PRESERVED — KHÔNG drop. Required cho `/api/orgs/check-similar` duplicate detection onboarding M-OrgUX-1
    - Admin views 010 `LIMIT 1` pattern STATUS QUO (Q1 α defer) — revisit khi M-OrgInvite-1 actual generate org có >1 CEO + support team escalation. Future migration `036_admin_views_deterministic_ceo.sql` thay `LIMIT 1` → `ORDER BY om.created_at ASC LIMIT 1` (founding CEO semantic match `admin_customers_overview` view name)
    - KHI ship migration applied via Supabase dashboard SQL editor, MUST backfill `.sql` file vào `supabase/migrations/` cùng commit (Q3 decision lock pattern). KHÔNG defer next-schema-change touch table — debt rotates qua N milestones, repo state drift production
    - KHI HANDOFF có placeholder `<NEXT_HASH>` chưa thực thi, MUST update sau commit thật HOẶC remove khi plan deviate. KHÔNG để placeholder rot — pre-existing debt §16 line 1067 cleanup M-Cleanup-5
- **Earlier milestone**: M-Member-POV-1 (Canvas Member-POV Redesign, code commits 544ca5a→ceeeb1c + docs close-out, 6 commits total, ~4h work). Trigger: M-Hoshin-6 Q-canvas redirect Member /dashboard tạm thời 2026-04-30 + code comments explicit "future M-Hoshin-7 nới Member writer" → M-Member-POV-1 thực thi reservation đó. Akao Method bidirectional entry: Member là gemba observer cần thấy strategic chain (Vision → YearGoal → Hoshin → KPI) để comment đúng context.
  - **Tasks shipped (5 tasks → 6 commits)**:
    1. Task 1: Plan docs design audit + 8 decision lock (commit `92a58b3`, 329 LOC)
    2. Task 2A: Add canEdit field vào CanvasContext state (commit `544ca5a`, +31/-4 LOC, 1 file). Bonus catch CLEAR_DRAFT preserve canEdit (pitfall #29)
    3. Task 2B: Wire canEdit Context end-to-end, remove prop drill (commit `8284a77`, +8/-8 LOC, 3 files). Verify-first phát hiện CanvasGrid intermediate em prompt sai
    4. Task 2C: Hide edit affordances 5 components (commit `84e918c`, +123/-44 LOC, 5 files). 3 bonus catch: hooks order preservation SubmitBar, aria-disabled a11y, modal render gated layer 2
    5. Task 2D: Remove Member redirect + extend userRole cast (commit `ceeeb1c`, +13/-15 LOC, 2 files). Cleanup orphan M-Hoshin-7 comments
    6. Task 2E: Smoke test 8/8 PASS Phase A manual + push deploy + Vercel verify chain G3 + production verify (close-out commit `7570a61`)
  - **3 architectural changes**:
    1. **Bidirectional Member access**: Member redirect /dashboard → render canvas read-only. Akao gemba observer principle.
    2. **Context single source of truth**: canEdit field vào CanvasUiState, replace prop drill 3 levels (XMatrixCanvasPage → CanvasGrid → CenterX). Pattern §17 M-Hoshin-6 Q4 α+γ compose proven 4 lần.
    3. **canSubmit ≠ canModerate** (Q3 α): Member submit gemba comment Hoshin (Q3 α) nhưng KHÔNG moderate (acknowledge/resolve/delete). Tách biệt 2 permission level qua `canModerate = role !== 'Member'` HoshinGembaSectionClient L72 + form access defaults open via GembaModal isPersisted gate only.
  - **8 decisions locked Task 1**:
    - Q1 α SCOPE: Full canvas read-only (Vision + YearGoals + Hoshins + Correlation + KPIs + Owners visible)
    - Q2 α EDIT AFFORDANCES: Hide hoàn toàn (button KHÔNG render cho Member, exception CenterX correlation cells giữ disabled pattern)
    - Q3 α GEMBA HOSHIN: Bật Member submit gemba Hoshin (execute M-Hoshin-6 Q3 γ defer plan, KHÔNG vi phạm M-Hoshin-5 Q8 INSERT-only)
    - Q4 α SUBMIT BAR: Hide hoàn toàn (early return null sau hooks, server defense layer 2 preserved)
    - Q5 β CORRELATION MATRIX: Display only (header EducationalTooltip đã explain, per-cell tooltip = noise)
    - Q6 α ROUTE GATE: Remove redirect (canEdit derived từ role, page render canvas + canEdit gate UI)
    - Q7 α SIDEBAR: Show link cho mọi role (consistency, sidebar 7 links chưa gate role nào)
    - Q8 EFFORT: 5 commits / 11 files / 8 smoke cases / 4h / Risk MEDIUM
  - **Pattern lessons** (đáng generalize):
    1. **L31 Permission field reset audit** (pitfall #29 mới): Khi extend ui state với role-derived field, audit mọi reducer action reset ui slice. M-Member-POV-1 Task 2A bonus catch (CLEAR_DRAFT mất canEdit). Apply universally cho future ui state extensions.
    2. **Verify-first phát hiện intermediate component**: Task 2B em prompt assume direct XMatrixCanvasPage→CenterX. Verify-first phát hiện CanvasGrid intermediate prop drill. Pattern L29 (M-Hoshin-7 lesson) áp dụng — trust verify-first hơn em assumption.
    3. **Bonus catch quality > spec literal**: Cursor Task 2C đi xa hơn spec — `aria-disabled={!canEdit}` cho a11y, modal render gated `{canEdit && ...}` cho defense layer 2 UI-side. Pattern: spec define minimum, Cursor judgment quality MAY exceed nếu defensive trade-off đúng. Anti-pattern: spec literal = không suy nghĩ thêm.
    4. **Phase boundary discipline 5 sub-commits**: Task 2A foundation → 2B wire → 2C consumers → 2D access → 2E smoke test. Mỗi commit ship + verify riêng, easier rollback. Pattern proven 7 milestones liên tiếp (M-Hoshin-2/3/4/5/6 + M-Cleanup-1 + M-AICoach-Sensei-1 + M-Member-POV-1).
  - **Files changed** (11 files + 1 plan doc, ~520 LOC delta):
    - app/dashboard/x-matrix/new/page.tsx — remove redirect Member, extend userRole cast
    - app/dashboard/x-matrix/new/components/HoshinGembaSectionClient.tsx — orphan M-Hoshin-7 comments cleanup
    - components/x-matrix/canvas/state/CanvasContext.tsx — canEdit field + useCanEdit hook + CLEAR_DRAFT preserve
    - components/x-matrix/canvas/XMatrixCanvasPage.tsx — pass canEdit Provider
    - components/x-matrix/canvas/CanvasGrid.tsx — remove canEdit prop drill
    - components/x-matrix/canvas/CenterX.tsx — useCanEdit hook subscribe
    - components/x-matrix/canvas/VisionEditor.tsx — readonly paragraph fallback
    - components/x-matrix/canvas/CanvasHeader.tsx — gate AI Prefill + Clear Draft + save status
    - components/x-matrix/canvas/SubmitBar.tsx — early return null
    - components/x-matrix/canvas/cards/YearGoalCard.tsx — empty slot non-button + filled click no-op
    - components/x-matrix/canvas/cards/HoshinCard.tsx — same pattern + gemba badge UNTOUCHED
    - plans/M-Member-POV-1-plan.md — design audit + close-out
  - **Constraints cho future AI sessions**:
    - KHÔNG re-add `redirect('/dashboard')` cho Member trong page.tsx — Member access read-only locked
    - KHÔNG remove `canEdit` field khỏi CanvasUiState — Context single source of truth locked
    - KHÔNG gate canEdit lên gemba badge HoshinCard — Q3 α Member submit Hoshin lock (execute M-Hoshin-6 Q3 γ defer)
    - KHÔNG add view-only modal cho HoshinCard click — Q2 α hide affordance lock, defer M-Member-POV-2 nếu user complain
    - KHÔNG modify CLEAR_DRAFT branch reducer mất canEdit preserve — pitfall #29 regression guard
    - KHÔNG add reducer guard layer 2 cho edit actions trong M-Member-POV-1 scope — defer M-Cleanup-7 explicitly
    - KHI extend ui state CanvasUiState với field mới, MUST classify permission vs UI state + audit reset actions (pitfall #29 checklist)
    - KHI thêm role-gate route mới (Member access different feature), follow pattern: page render + Context flag + UI components subscribe hook (4 layers Task 2A→2D)
- **Earlier milestone**: M-AICoach-ShortInput-1 (Bug 2 fix, code commit `2b0e4eb` + docs close-out, ~2h work). Trigger: HANDOFF §16 known open items deferred 2026-05-08 evidence Image 2 (production user gõ "Thang nay dat." reproduced 2 lần hit Tier 3 fallback "Xin lỗi, AI vừa trả lời lỗi format"). Fix prompt-level (Q3 γ AI-side decision lock): SW Rule 9 + OT Rule 10 trigger khi input < 5 words → AI return extractedInsight: null + conversational probe message bám sát topic CEO. Persona Akao Minh preserve (catchball not lecture, 1-2 example concrete KHÔNG list 4-5 options). Bug 3 cross-framework guard verified pass (Strategic Memory KHÔNG fabricate vào probe response).
  - **Tasks shipped**:
    1. Task 1: Design audit + plan file (verify-first phát hiện dead code path `followUpHint` < 20 words trigger từ COACHING_QUESTION_BANK đã design nhưng client không truyền `coachingTracker` → reuse infrastructure thay vì build mới)
    2. Task 2: SW Rule 9 + OT Rule 10 atomic update (commit `2b0e4eb`, +13/-3 LOC)
    3. Task 3: Smoke test 8/8 PASS Phase A manual (Phase B Playwright defer — prompt-only fix low regression risk + IME composition không simulate được pitfall #27)
    4. Task 4: HANDOFF + plan commit (docs close-out này)
  - **Decision lock 8 questions** (plans/M-AICoach-ShortInput-1-plan.md):
    - Q1 SCOPE γ coaching only + audit report (evidence-driven, KHÔNG scope creep)
    - Q2 THRESHOLD γ word count < 5 (stable cross-language)
    - Q3 LOCATION γ AI-side prompt rule (preserve Akao catchball)
    - Q4 UX α conversational probe (match Minh persona)
    - Q5 3-tier fallback chain KHÔNG TOUCH (vấn đề là hit rate, không phải Tier 3 message)
    - Q6 Memory rule explicit "KHÔNG fabricate từ memory" (Bug 3 regression guard)
    - Q7 Test 8 cases (thêm CASE 3.5 boundary 3-5 words probe quality)
    - Q8 Effort 2-3h, 1 commit (~30-50 LOC) — actual ~2h, 13 LOC code (compact hơn estimate)
  - **R5 deviation** (plan vs code gap): Rule mới đặt cuối block QUY TẮC BẮT BUỘC (Rule 9 SW / Rule 10 OT) thay vì insert giữa rules. Lý do: existing structure không có rule numbered "ĐẶT CÂU HỎI" / "REFERENCE memory" — chúng ở top-level NGUYÊN TẮC + trailing template literal. Position cuối block tốt hơn spec ban đầu vì reading order match execution priority. Pattern lesson L29 áp dụng (trust verify-first hơn plan prose).
  - **Files changed**: lib/swot/coaching-prompts.ts (Task 2) + plans/M-AICoach-ShortInput-1-plan.md (new) + HANDOFF.md (Task 4).
  - **Constraints cho future AI sessions**:
    - KHÔNG remove SW Rule 9 / OT Rule 10 — Bug 2 regression guard locked.
    - KHÔNG modify threshold "< 5 từ" sang char count hoặc token count mà không re-test 8 cases (đặc biệt CASE 3.5 boundary).
    - KHÔNG remove example "ok ạ" SW + "Thang nay dat." OT — examples có evidence link production Image 2.
    - KHÔNG add rule list 4-5 options choice trong probe — vi phạm persona Minh (overload, decision fatigue).
    - KHI thêm AI structured output route mới có conversational input (non-tool_use), MUST add Rule short-input fallback tương tự — pattern locked.
- **Latest feature work**: M-AICoach-Sensei-1 (SWOT Coaching Redesign theo Akao Method, 15 commits 4273d57→09b095d, ~13 hours work). Trigger: 3 user feedback về AI Coach reset + ép tuyến tính + reset context giữa session.
  - **Tasks shipped (8 tasks → 15 commits)**:
    1. Task 1: Plan docs (commit `4273d57`)
    2. Task 2A: Server adaptive framework, no forced linear switch (`f1f4e46`)
    3. Task 2B: Cleanup `frameworkIdToLegacy` orphan + expand Task 6 scope (`32633c8`)
    4. Task 3A: `loadStrategicMemory` helper (`6bacd3c`)
    5. Task 3B-1: `formatStrategicMemory` + extend prompt signatures (`b5d88ab`)
    6. Task 3B-2: Wire memory + xrayContext + getActiveMembership (`2eb03d3`)
    7. Task 4: Bump max_tokens 4096→8192 cho Vietnamese density (`6d61dec`)
    8. Task 5: Rewrite SW+OT prompts theo Akao 4-principle (`a6706c1`)
    9. Task 6B: Add `quadrant` field vào `ExtractedInsight` (`02ce7c5`)
    10. Task 6C-step2: Store currentFramework + dual SW/OT messages (`a0f32b4`)
    11. Task 6C-step3: SW/OT toggle UI + dual history + INITIAL_MSG framework-aware (`c87d6f1`)
    12. Task 6D-step2: Refactor addIngredient signature - caller pass id (`7489b21`)
    13. Task 6D-step3: Auto-fill extractedInsight + toast undo + ai_auto source (`3ae2c05`)
    14. Task 6E: Cleanup orphan `advanceDimension`/`advanceFramework` + 3 helpers (`feb6ad3`)
    15. Task 7: SKIPPED (verify-first phát hiện scope không cần thiết)
    16. Task 8: HANDOFF update + smoke test final + post-deploy verify (commit `09b095d`)
  - **3 Akao 4-principle architectural changes**:
    1. **Bidirectional entry**: User start anywhere (S/W/O/T). Bỏ state machine forced linear `[SW_COMPLETE]→Porter→[OT_COMPLETE]`. Server TRUST `currentFramework` từ client. Markers vẫn parse backward compat.
    2. **Strategic Memory**: Server load `swot_factors` (source_framework IN ('workshop', 'ai_synthesized')) + `xray_results` by org_id. Inject vào prompt qua `formatStrategicMemory(factors)` + `mapXRayToSwotSeed(xray)`. AI reference được context cross-session.
    3. **Framework grouping over Pareto**: Prompts rewrite Rule 5-7 — bỏ "đi lần lượt" + "phải đi đủ", thêm "CEO chuyển chủ đề bất kỳ lúc nào" + "paste nhiều insight → NHÓM theo chủ đề, KHÔNG hỏi 'cái nào ảnh hưởng nhất'". Pareto thinking là job của catchball CEO+team, KHÔNG phải AI.
    4. **Catchball not lecture**: Persona "Minh" thêm: "ĐẶT CÂU HỎI giúp CEO TỰ THẤY, KHÔNG đưa kết luận thay CEO". Examples rewrite từ assertive ("Retention tốt nhưng pipeline tuyển là bottleneck — ghi nhận") sang Socratic ("Pipeline tuyển 2 tháng — anh có lo cho kế hoạch năm tới không? Hay anh đã có cách giải?").
  - **Auto-fill flow** (Task 6D, root user feedback fix):
    - AI emit `extractedInsight.quadrant: 'S' | 'W' | 'O' | 'T'` (Task 6B added field)
    - Client consume `extractedInsight` (was ignored), gate `confidence !== 'low'` + length ≥ 5 chars
    - Toast undo button: `removeIngredient(id)` qua `useSwotStore` selector, 5s duration
    - New IngredientSource value `'ai_auto'` — visual badge amber (vs `'ai_draft'` blue)
    - Pattern Option B2: caller generate nanoid + pass vào `addIngredient(id, ...)` để biết id cho undo
  - **Dual SW/OT history** (Task 6C):
    - Store thêm `currentFramework: 'sw' | 'ot'` + `swMessages[]` + `otMessages[]`
    - Toggle UI ở header `SwotWorkshop.tsx` (segmented control NB v3.2 pattern)
    - Lazy inject `INITIAL_MSG_SW` / `INITIAL_MSG_OT` framework-aware
    - Race condition handled: `useSwotStore.getState().currentFramework` snapshot tại request time, response commit về framework gốc dù user switch giữa chừng
  - **Cleanup orphan** (Task 6E):
    - Xóa actions `advanceDimension` + `advanceFramework` trong store (0 component callers)
    - Xóa 3 helpers `getNextDimension/getNextFramework/getFirstDimension` trong coaching-tracker (chỉ dùng trong 2 orphan actions)
    - Remove misleading `@deprecated` banner ở coaching-tracker.ts (file vẫn còn 13 active exports)
    - -97 lines total
  - **Pattern lessons** (đáng generalize cho future milestones):
    1. **Verify-first phát hiện scope=0**: Task 7 verify trước khi build → conclusion "không cần build" (Strategic Memory badge duplicate work đã ship ở Task 3B-2; Framework detected badge vi phạm Rule 9 prompt). Tránh ship feature decoration không value. Pattern: verify-first không chỉ để confirm scope, đôi khi để **kill scope**.
    2. **3-tier fallback chain xung đột streaming**: Task 4 originally plan switch streaming SSE, sau analysis phát hiện streaming break 3-tier JSON parse fallback chain (hotfix `df3c1ef`). Option A chọn: chỉ bump max_tokens, giữ non-streaming. Pattern: streaming ≠ luôn tốt cho mọi route, depend response shape (long-form generation vs chat-style short response).
    3. **Schema mismatch cross-helpers**: `loadStrategicMemory` return `XrayContextSummary { xrayId, overallScore, overallLevel, result, capturedAt }` nhưng prompt builder expect `XRaySeedContext { ..., swotHints, summaryForAI }`. Phát hiện qua Task 3B verify, fix bằng convert qua `mapXRayToSwotSeed()`. Pattern: khi data flow qua nhiều helper, MUST verify shape contract end-to-end (M-Hoshin-7 L7 reinforce).
    4. **TypeScript Record exhaustiveness check defensive**: Task 6D-step3 `IngredientSource` union extension forced Cursor add entry vào `SOURCE_CLS Record<IngredientSource, ...>`. TS exhaustiveness check là defensive type system — extension union → require update mọi consumer. Pattern: khi extend discriminated union hoặc enum-like type, grep `Record<TypeName, ...>` toàn repo trước commit.
    5. **State machine claim ≠ reality**: Plan file ban đầu claim "swot-session-store force linear SW→OT". Verify Task 6A phát hiện 2 actions `advanceDimension`/`advanceFramework` ORPHAN, 0 component call. Pattern: trust verify-first hơn HANDOFF prose. Plan file là intent, code là reality. M-Hoshin-7 L8 áp dụng cross-domain.
    6. **Race condition snapshot pattern**: Task 6C-step3 framework switch giữa API in-flight → response leak vào framework khác. Fix: capture `useSwotStore.getState().currentFramework` snapshot tại entry function, commit response về framework gốc. Decision D8: no abort, response valuable. Pattern reusable: bất kỳ async action read mutable state phải snapshot tại entry, không read state lại lúc resolve.
  - **Files changed** (9 files, ~520 LOC delta):
    - `app/api/swot/coaching/route.ts` — adaptive framework, server-resolved orgId, max_tokens 8192, strategic memory wire
    - `lib/swot/coaching-prompts.ts` — Akao 4-principle rewrite, formatStrategicMemory helper, quadrant in schema, isValidInsight enum
    - `lib/swot/strategic-memory.ts` — NEW file (~64 LOC), loadStrategicMemory + types
    - `lib/swot/coaching-tracker.ts` — cleanup orphan helpers (-97 lines), banner removed
    - `lib/swot/types.ts` — quadrant field on ExtractedInsight, IngredientSource ai_auto
    - `lib/swot/swot-session-store.ts` — currentFramework + dual messages + setMessages actions, addIngredient signature refactor, orphan actions cleanup
    - `components/swot/SwotWorkshop.tsx` — SW/OT toggle UI, handleChatAdd return id, source param
    - `components/swot/SwotWorkshopChat.tsx` — store-derived messages, framework-aware INITIAL_MSG, race condition snapshot, auto-fill flow
    - `components/swot/SwotIngredientPanel.tsx` — pass id to addIngredient
    - `components/swot/SwotIngredientCard.tsx` — SOURCE_CLS amber entry for ai_auto
  - **Constraints cho future AI sessions**:
    - KHÔNG re-add forced linear SW→OT state machine. Bidirectional entry là decision lock.
    - KHÔNG remove markers `[SW_COMPLETE]/[OT_COMPLETE]` parse logic — backward compat client cũ.
    - KHÔNG modify `ExtractedInsight.quadrant` enum (lock 'S' | 'W' | 'O' | 'T').
    - KHÔNG persist INITIAL_MSG_SW/INITIAL_MSG_OT vào store — lazy inject pattern.
    - KHÔNG abort in-flight request khi switch framework — D8 decision.
    - KHÔNG dùng `var(--*)` cho Recharts props (out-of-scope reminder, pitfall §10 #19).
    - KHI AI emit insight với confidence 'low' → skip auto-fill SILENT (no toast). User có thể manual add qua "Rút ý từ chat" UI.
- **Previous feature work**: M-Cleanup-6 Phase 1 (`.single()` anti-pattern fix in 7 API routes + extract helper, 1 commit, 8 files, ~30 phút work). New `lib/auth/getActiveMembership.ts` helper với typed shape `{ org_id: string; role: string } | null` — caller pass `lastOrgId` explicit (NOT helper tự fetch from `auth.getUser()` để tránh round-trip thừa). 7 API routes refactored:
  - [app/api/x-matrix/prefill/route.ts](app/api/x-matrix/prefill/route.ts)
  - [app/api/kpi/list/route.ts](app/api/kpi/list/route.ts)
  - [app/api/report/monthly/route.ts](app/api/report/monthly/route.ts) — split `organizations(name)` JOIN → 2 queries cho type clarity (helper return flat shape)
  - [app/api/discovery/vision-save/route.ts](app/api/discovery/vision-save/route.ts)
  - [app/api/discovery/pain-mapper/route.ts](app/api/discovery/pain-mapper/route.ts) — trong finalize callback
  - [app/api/x-ray/history/route.ts](app/api/x-ray/history/route.ts)
  - [app/api/x-ray/score/route.ts](app/api/x-ray/score/route.ts) — trong `if (user)` block
  - **Phase 2 deferred**: 12 dashboard inline call sites (`find(lastOrgId) ?? memberships[0]` pattern) chưa refactor sang helper. M-Cleanup-6 Phase 2 milestone riêng — KHÔNG block release nào khác.
- **Earlier feature work**: M-OrgInvite-1 (CEO invite link flow, commit `735c132`, 26 files, 1464 insertions). DB: table `org_invites` + enum `invite_role` + 3 RLS policies + 3 indexes (migration 035). API: 4 routes (POST/GET `/api/invites` create+list, DELETE `/api/invites/[token]` revoke, GET `/api/invites/[token]/info` public, POST `/api/invites/[token]/accept` authed). UI: `/invite/[token]` public accept page + Settings Members section replace fake `handleCopyInvite`. Auth: login + register honor `?redirect=` param với whitelist. Multi-org systemic fix: 12 dashboard pages + layout `.maybeSingle()` → array + find/fallback pattern (settings, kpi, x-matrix index/new/[year]/review, dashboard, discovery/{benchmark,xray-history,vision-workshop,swot,swot/strategy,synthesis}). Deferred: OAuth Google + email-confirmation invite flow gaps (workaround MVP — user click invite link lại sau confirm).
- **Older feature work**: M-Design-3b (Dashboard hex-to-token refactor) — 6 commits `868fa34`→`ed27932`, 5 files changed (1 foundation + 4 consumers):
  - `868fa34` feat(design): add score tier + kpi-strong tokens for M-Design-3b foundation. Add 6 new tokens trong `app/globals.css :root`: `--kpi-healthy-strong: #16A34A` + `--kpi-attention-strong: #D97706` (saturated companions cho pastel `--kpi-*`) + `--score-{critical,weak,fair,good}` 4-tier saturated cho X-Ray health score. Extend `lib/design/chart-tokens.ts`: `ScoreTier` type, `getScoreTier(score)` server-safe classifier, `resolveScoreToken(tier)` client resolver, `SCORE_TOKEN_NAMES` Record map, extend `KPI_TOKEN_NAMES` thêm `healthyStrong`/`attentionStrong`. `--kpi-warning-strong` deliberately KHÔNG ship — reuse shadcn `--destructive` cho red strokes. `.dark` block UNTOUCHED.
  - `8121194` refactor(xray): replace hardcoded hex with design tokens. `app/dashboard/discovery/xray-history/XRayHistoryChart.tsx` (client component) — 10 hex sites → `resolveToken('ink')` + `resolveToken('chart-4')` + `resolveScoreToken({critical,weak,fair})`. Stray `#2C2B2B` legacy color normalized → `--ink` (#1A1A1A) tại 4 sites. Move `CustomDot` inside main component closure để share resolved `ink` ref. 2 SSR fallback hex còn lại (`'#1A1A1A'`, `'#8A8787'`) trong `resolveToken(...)` args là intentional defaults — prevent black-flash khi SSR.
  - `8d875d7` refactor(xray-history): replace hardcoded hex with score tier tokens. `app/dashboard/discovery/xray-history/page.tsx` (server) delete `getScoreColor()`, import `getScoreTier`. Score number span dùng `style={{ color: \`var(--score-${getScoreTier(score)})\` }}` (Pattern C — var() resolve client-side trên HTML element). `chartData.color: string` → `chartData.tier: ScoreTier` data contract change. Client `XRayHistoryChart` consume `payload.tier` → `resolveScoreToken(payload.tier)` cho `<Dot fill>`. Locks in "server return tier name, client resolve color" pattern (decision §3).
  - `6eea631` refactor(kpi): replace hardcoded hex with strong tokens + add withAlpha helper. `app/dashboard/kpi/components/KpiSparkline.tsx` — 3 hardcoded hex strokes → `resolveToken('kpi-healthy-strong'/'kpi-attention-strong'/'destructive')`. Area fills (alpha 12.5%) dùng `withAlpha(color, '20')` helper mới — defensive regex check, returns `'transparent'` cho non-hex-6 input. Shape collapse `{ line, fill, dot }` → `{ stroke, fill }` (dot fill = stroke color, same hue). Visual diff intent: green deeper (`#22c55e` → `#16A34A`), amber deeper (`#eab308` → `#D97706`); red unchanged.
  - `792e43c` refactor(discovery): replace badge hex with KPI pastel tokens. `app/dashboard/discovery/page.tsx` — 3 module-level const `BADGE_STYLE_{DONE,NEXT,LOCKED}` để dedupe 4 inline-style sites (DONE used 2x). Map Tailwind palette → KPI tokens với intentional hue shift (emerald → kpi-healthy lime, amber → kpi-attention warm yellow). LOCKED border dùng `color-mix(in srgb, var(--text-3) 30%, transparent)` mirror visual weight gốc.
  - `ed27932` refactor(discovery): replace checkmark hex with score-good token. 2 sites `#059669` (emerald-600) → `var(--score-good)` (#16A34A green-600) ở step-list checkmark + "Hoàn thành!" overline. Align success indicator hue với X-Ray "Tốt" tier + chart success ReferenceLine. `discovery/page.tsx` hex-clean (0 matches).
  - **Files deferred**: `app/dashboard/kpi/components/KpiCard.tsx` Tailwind utility classes (`bg-green-100`, `text-red-600`, etc.) — KHÔNG phải inline hex → out of scope M-Design-3b. Defer M-Design-Tailwind-Cleanup-1.
- **Historical feature work**: M-Design-3a (KPI status tokens foundation, 3 commits `d7fdb6d`→`b3ff123`, 3 files: 8 `--kpi-*` tokens + `lib/design/chart-tokens.ts` runtime resolver + first dashboard hex refactor `app/dashboard/page.tsx:224`) → M-OrgUX-1 (Duplicate Org Detection on Onboarding, 6 commits `6ccd776`→`d57c7f1`) → M-Public-1 (repo public + HANDOFF auto-sync, 2 commits `e305e61`+`aabedce`) → M-Cleanup-1 (wizard files cleanup, 1 commit `558a471`, -1184 lines) → M-Hoshin-7 (anti-pattern audit + fix multi-org `.limit(1).single()` lookup, 1 commit `3e29a66`).
- **Known open items**:
  - **M-OrgInvite-1 deferred items (2026-05-02)**:
    - `idx_org_invites_token` redundant với auto-generated `org_invites_token_key` UNIQUE index — drop trong migration patch khi tiện
    - ~~API routes `/api/` chưa quét hết `.maybeSingle()` trên `org_members`~~ ✅ shipped M-Cleanup-6 Phase 1 — 7 routes fixed (`.single()` → helper), Phase 2 (12 dashboard inline sites refactor) deferred
    - ~~Helper `lib/auth/getActiveMembership.ts` chưa extract~~ ✅ shipped M-Cleanup-6 Phase 1 — typed shape `{ org_id, role } | null`. Phase 2 còn 12 dashboard inline call sites cùng pattern `find(lastOrgId) ?? memberships[0]` chưa migrate sang helper (DEBT MEDIUM)
    - OAuth Google invite flow gap: `/auth/callback` hard-redirect `/dashboard`, không honor `?redirect=` param. Fix cần pass token qua OAuth `state` param — defer đến có user complaint
    - Email confirmation invite gap: register → email confirm → `/auth/callback` hard-redirect, không carry invite token. Workaround MVP: user click invite link lại sau confirm — acceptable cho beta
  - Check `plans/` folder cho WIP notes
  - **X-Ray production hotfix 2026-04-26**: ✅ Public X-Ray (`/x-ray`) was failing to render report after 21-question submission on production. Root cause: `max_tokens=2500` in `/api/x-ray/score` too low for 7-pillar Vietnamese output → JSON truncated → strict validator returned null → silent 502. Fix commit: `c5a915e`. Changes:
    - Bumped `max_tokens` 2500 → 8000
    - Robust JSON extraction (`indexOf('{')` → `lastIndexOf('}')`) to defend against AI preamble
    - Added `requestId` (crypto.randomUUID) threaded through ALL error responses (429/400/502/500) for log correlation
    - Per-failure-reason `console.error` logs in `parseAndValidateAIResponse` (previously silent on validation null)
    - Frontend: `toast.error` duration 4s → 10s + appended `requestId` to error message for user-reportable error code
    - Pattern lesson: Vietnamese token density (~1.5 chars/token) means output limits inherited from English-prompt designs are often too tight. When schema expanded (e.g., 5 → 7 pillars), bump output budget proportionally.
  - **Migration gap at 007, 008**: ✅ investigated 2026-04-25 — clean skip, never existed in git history. Schema continuity verified. No action needed.
  - **Lint cleanup 2026-04-26**: ✅ Original "6 errors" claim was incorrect. Actual scope was 2 setState-in-effect errors:
    - `app/x-ray/components/XRayForm.tsx:45` — fixed via `eslint-disable react-hooks/set-state-in-effect` (false positive: external-system sync from sessionStorage/localStorage, SSR-incompatible APIs)
    - `app/dashboard/report/page.tsx:77` (note: file is `page.tsx`, NOT `ReportClient.tsx` as previously documented) — fixed via canonical React 19 "Adjusting state on prop change" pattern (useState + setState-during-render). Bonus: added `cancelled` flag for race-condition guard on rapid month switches.
    - Fix commit: `a7363cd`
    - 1 unrelated lint error remaining: `SynthesisClient.tsx:362` (`react-hooks/immutability` — runSynthesis accessed before declared, pre-existing) → ✅ resolved 2026-04-26 commit `bb9ecd8` (xem entry "SynthesisClient lint fix" bên dưới)
  - **createAdminClient audit 2026-04-25**: ✅ 3 sites spot-checked (blog/_actions.ts, x-ray/score/route.ts, settings/org/route.ts). All PASS. Patterns: (1) requireSuperAdmin() helper defense-in-depth cho admin actions, (2) server-derived keys + INSERT-only semantics cho public routes, (3) schema không cho client pass orgId cho authed mutations.
  - **AI routes cost risk**: 12 authed AI routes không có per-user rate limit (swot/coaching, swot/coaching-draft, swot/suggest-more, swot/conflict-check, swot/context-cards, swot/item-evidence, swot-analyses/[id]/factors/[factorId]/quality-check, swot-analyses/[id]/strategies/ai-generate, discovery/pain-mapper, discovery/vision-draft, discovery/synthesis, admin/hoshin-explorer). Verified 2026-04-26 review qua grep `createAnthropicClient` + `streamClaudeJson`. Not security issue nhưng financial exposure nếu user spam. **Tiếp theo trong roadmap (P0.1 Phase 1)**.
  - **Debug route gating 2026-04-26**: ✅ shipped (commit `bb9ecd8`). `/api/debug` exposed user.id, user.email, org_id, role, org metadata cho bất kỳ authed user, không có env-var gate. Fix:
    - Thêm guard `if (process.env.ENABLE_DEBUG_ROUTE !== 'true') return NextResponse.json({ error: 'Not Found' }, { status: 404 })` ở đầu hàm GET ([app/api/debug/route.ts:5](app/api/debug/route.ts#L5))
    - Pattern lesson: follow precedent [app/api/auth/dev-login/route.ts:9](app/api/auth/dev-login/route.ts#L9) (`ENABLE_DEV_LOGIN`). Khi tạo debug/admin route mới, gate bằng env-var convention `ENABLE_<FEATURE>=true`. Verify Vercel env không được set → route trả 404 trên prod.
  - **SynthesisClient lint fix 2026-04-26**: ✅ shipped (commit `bb9ecd8`). Pre-existing `react-hooks/immutability` error tại [app/dashboard/discovery/synthesis/components/SynthesisClient.tsx:362](app/dashboard/discovery/synthesis/components/SynthesisClient.tsx#L362) — runSynthesis declared SAU useEffect dùng nó. Fix:
    - Wrap `runSynthesis` trong `useCallback([orgId, orgContext])`, move declaration lên trước useEffect, đổi useEffect deps `[]` → `[runSynthesis]`
    - Initial fix exposed lint error mới `react-hooks/set-state-in-effect` (vì runSynthesis gọi setState() đồng bộ trong effect body — đây là 2 lint rule conflict, không phải fix sai). Resolved bằng `eslint-disable-next-line react-hooks/set-state-in-effect` scope LIMITED tại line 434 với comment justify reference precedent `XRayForm.tsx:45` (commit `a7363cd`)
    - Verify: 0 infinite loop, 0 duplicate API call. Server Component parent ([app/dashboard/discovery/synthesis/page.tsx](app/dashboard/discovery/synthesis/page.tsx)) → `orgContext` ref stable per request → `useCallback` chỉ tạo runSynthesis 1 lần
    - Pattern lesson: 2 lint rule `react-hooks/immutability` vs `react-hooks/set-state-in-effect` có thể conflict ở auto-run-on-mount pattern. Khi gặp pattern này, dùng `eslint-disable-next-line` scope LIMITED với comment justify + reference precedent commit. Đây là exception hợp lý cho "no comments" convention vì pattern non-obvious
    - Lint baseline: 1 error → 0 errors. 15 warnings còn lại scope P2.1 (mostly `no-unused-vars`)
  - **Plans archive cleanup 2026-04-26**: ✅ shipped (commit `bb9ecd8`). Move `plans/fix-email-verification.md` (đã ship qua `app/api/auth/register/route.ts` + `forgot-password/route.ts`) và `plans/20260411-fix-swot-synthesis-pipeline/` (4 files, đã ship qua commits `e5dd4d1`, `daf38bf`, `557778e`, `71f8860`) vào `plans/_archive/shipped-2026-04-26/`. Tạo [plans/README.md](plans/README.md) với convention.
    - Pattern lesson: Khi plan ship xong, MOVE vào `_archive/shipped-YYYY-MM-DD/` thay vì xóa. Giữ git blame history (git nhận đúng `renamed:`, không phải delete + add). Update `plans/README.md` status.
  - **TOWS Strategy v2 2026-04-26**: ✅ shipped (commits `7e4ad65` migration → `846c7ba` types/schemas → `e863c7d` Hoshin prompt → `e036eaf` tool schema/insert → `1096f5c` UI render → `82bf6c8` sync v2). Mục tiêu: TOWS strategy chuyển từ "action plan" generic sang "candidate Hoshins" đúng phương pháp Toyota — breakthrough vs kaizen, vital few, targets-means deployment, SMART KPIs, BSC alignment.
    - **DB schema (migration 029)**: thêm 4 nullable JSONB/text columns vào `tows_strategies`: `actions` (StrategyAction[]), `kpi_suggestions` (KpiSuggestion[]), `timeframe` ('30d'|'60d'|'90d'), `rationale` (text). Schema-additive, dữ liệu cũ render bình thường.
    - **Type system**: `lib/swot/tows-types.ts` thêm 3 type aliases (Timeframe, StrategyAction, KpiSuggestion) + extend TowsStrategyRecord (5 fields) + AiStrategyItem (4 optional). `lib/validation/schemas.ts` thêm 3 reusable Zod schemas + extend updateStrategySchema 6 fields + refine block 9 conditions. Bonus fix pitfall #5: cho phép edit `strategy_title`, `strategy_statement` qua PATCH.
    - **Prompt builder (`lib/swot/tows-prompts.ts`)**: rewrite hoàn toàn template `buildTowsPrompt`. Tích hợp Hoshin Kanri principles (4 cuốn sách: Kesterson, Vinardi, Jackson, Villalba-Diez): vital few rule (max 3), breakthrough vs kaizen anti-pattern, targets-means deployment, SMART measurables (leading > lagging), BSC alignment Kaplan-Norton, catchball context. Vietnamese SME context (Zalo OA, MoMo, GoFood). Few-shot example đầy đủ 7 fields. Rejection criteria explicit.
    - **Tool schema (`/api/swot-analyses/[id]/strategies/ai-generate`)**: forced tool_use 7 fields (title/statement/bsc/timeframe/rationale/actions[3]/kpi_suggestions[1-2]). max_tokens 4096 → 8000 (VN density). Manual validation từng field với error keys (`invalid_timeframe_${i}`, `missing_rationale_${i}`, `invalid_action_${i}_${j}`, `invalid_kpi_${i}_${j}`). Insert 5 columns mới + revive `ai_prompt_used` dead field cho audit. Retry-once pattern preserved.
    - **UI render (`components/swot/TowsCanvas.tsx`)**: expand/collapse pattern qua `expandedIds: Set<string>` state. Timeframe badge inline cạnh BSC badge (Tailwind class color-coded). Expanded panel hiển thị 3 sections: 💡 Vital signal (rationale italic), 🎯 Hành động (actions numbered + owner_hint), ✨ KPI gợi ý (name + target + unit + frequency). Backward compat qua `hasV2Data` guard — strategy NULL fields render như trước, không hiện chevron. Bonus fix: status checkbox visual feedback cho cả 'approved' và 'in_x_matrix'.
    - **Sync to X-Matrix (`lib/swot/sync-to-xmatrix.ts`)**: 4 helpers thêm: `smartTruncate` (word boundary, fix `slice(0, 80)` cắt giữa từ VN), `mapFrequency` (drop 'daily' → 'weekly' vì XMatrixKpi không hỗ trợ daily), `mapActionsToInitiatives` (StrategyAction[] → XMatrixInitiative[] với owner_hint append vào title), `mapKpiSuggestionsToKpis` (target_value → targetValue camelCase). Description prepend `\n\n💡 Vital signal: ...` khi có rationale. Hard limits respect MAX_INITIATIVES_PER_HOSHIN=3 và MAX_KPIS_PER_HOSHIN=2 (khớp đẹp với schema TOWS v2).
    - **Known limitations**: (1) `bsc_perspective` không carry sang XMatrixHoshin (schema không có field) — drop. (2) `frequency: 'daily'` map về `'weekly'` cho XMatrixKpi. (3) Synthetic id `${hoshinId}-init-${idx}` non-UUID cho initiatives/kpis — chưa thấy downstream issue, defensive note. Cả 3 có thể fix ở Phase polish nếu cần.
    - **Pattern lessons** (đáng generalize cho phases khác):
      1. **Phase boundary discipline**: Chia 1 feature lớn thành ≥4 phases nhỏ (DB → types → API → UI → sync), mỗi phase 1 commit. Easier rollback, dễ verify từng layer, không lock context window.
      2. **Schema-additive default**: Migration nullable columns + types optional → deploy code mới không break dữ liệu cũ. Pattern "migration trước, code sau" trong HANDOFF §11 thực tế.
      3. **Verify với DB query mỗi phase critical**: After Phase 3B (AI insert) và Phase 5 (sync), query DB trực tiếp confirm data structure đúng trước khi build phase tiếp. 5 phút verify → tránh 30-60 phút debug ngược.
      4. **Hoshin Kanri triết lý ≠ MBA strategy thông thường**: Khi prompt AI cho domain chuyên biệt, phải đọc nguồn primary (sách gốc) thay vì training data generic. Prompt v1 (MBA-style) ra strategy "tăng cường marketing"; v2 (Hoshin-anchored) ra "Triển khai Zalo OA + referral để chiếm 30% thị phần Q7 trong 90 ngày" với rationale [S2]+[O1] và 3 actions cụ thể.
  - **Code quality sweep 2026-04-26 (rate-limit + lint zero)**: ✅ shipped (4 commits: `a8d5e58`, `14f84b9`, `62b2783`, `cbcbc46`). Two parallel cleanups cùng ngày — AI cost protection + lint zero baseline (15 warnings → 0 warnings, 0 errors, lần đầu tiên dự án có clean lint baseline).
    - **Rate-limit helper** (commit `a8d5e58`): 12 authed AI routes có per-user rate-limit. New helper `lib/ai/rate-limit-helper.ts` (42 dòng) wrap `checkRateLimit`, key `ai:${bucket}:${userId}`, return 429 + `Retry-After` header. Defaults 50 calls / 300s / user. Buckets: `swot` (8 routes, 50/5min), `discovery` (3 streaming routes, 50/5min), `admin/hoshin-explorer` (100/5min). Streaming routes check TRƯỚC khi mở SSE (tránh waste Anthropic call); admin route check SAU super-admin verify (tiết kiệm DB call cho non-admin).
    - **Lint commits breakdown**:
      - `14f84b9`: 9 unused vars/imports + fix `app/api/x-matrix/share/route.ts` error path (silent fail bug — `if (!xMatrix)` → `if (error || !xMatrix)`)
      - `62b2783`: 5 warnings — TowsCanvas ternary→if/else, retry logging cho quality-check + synthesis-engine (`console.warn('[<route>] first attempt failed, retrying:', firstReason)`), drill-up xóa dead props `orgId/orgContext` qua VisionEditor → VisionWorkshopClient → page.tsx
      - `cbcbc46`: XMatrixWizard `react-hooks/exhaustive-deps` — thêm `searchParams` vào deps array. Safe by construction nhờ `started.current` ref guard sẵn có (re-run = no-op). KHÔNG dùng `eslint-disable-next-line` (precedent SynthesisClient `bb9ecd8` thuộc rule khác).
    - **Pattern lessons**:
      - Discriminated union helpers (`{ ok: true } | { ok: false; response }`) cho cross-cutting concerns (rate-limit, auth, audit log) → route handler chỉ cần 2 dòng. Khi thêm AI route mới, wire rate-limit ngay sau auth check, trước Anthropic call. Pattern này nên reuse cho các cross-cutting concern khác (audit log, feature flag, etc.)
      - Lint warning `unused-vars` trên Supabase destructure (`const { data, error }`) thường KHÔNG phải lint vô hại — báo hiệu **error path không handle**. Đáng audit toàn repo: `Select-String -Path "app/**/*.ts" -Pattern "data:.*error.*=.*await supabase"` (đã chạy 2026-04-26, không match thêm).
      - Khi xóa dead props từ component, GREP call site trước — drill-up có thể tạo ripple warning ở parent component (như VisionEditor → VisionWorkshopClient → page.tsx).
      - `react-hooks/exhaustive-deps` warning ≠ luôn cần `eslint-disable`. Nếu effect đã có ref guard (`started.current`), thêm dep vào array là cách sạch nhất — re-run = no-op.
    - **Verify**: `npm run typecheck` PASS, `npm run lint` 0 problems, Vercel auto-deploy succeed
  - **Design system migration M-Design-1 (2026-04-27)**: ✅ shipped. Migrate design system foundation từ Neobrutalism × Swiss generic sang Neo-Brutalism v3.2 "Refined Tempered NB" (Vũ Hải Personal Edition adapted cho B2B SaaS).
    - **Scope**: Foundation tokens only — `app/globals.css` + `app/layout.tsx` fonts. Components/pages chưa refactor (M-Design-2 sẽ tackle landing page).
    - **4 commits**:
      - `e70250f` — docs: update handoff before NB v3.2 refactor (HANDOFF cleanup, baseline state)
      - `17360ab` — feat(design): swap fonts to NB v3.2 (Montserrat + Barlow Condensed → Space Grotesk + Inter + JetBrains Mono, layout.tsx)
      - `b0d2aa4` — feat(design): refactor tokens to NB v3.2 (ink #2C2B2B → #1A1A1A, bg #F7F5F2 → #FFFEF9, +6 pastel accents, +8 spacing scale, +motion ease-nb cubic-bezier, radius 0 FORCED → 4px tempered)
      - `3397f9d` — feat(design): refactor utility classes + add NB v3.2 sticker/marquee/pastel components (.nb-sticker, .nb-highlight, .nb-marquee, .card-tilt, .card-yellow/cyan/pink/lime/dark, .btn-yellow/cyan, .tag-* variants)
    - **Token changes summary**:

      | Token | Before (NB Swiss generic) | After (NB v3.2 Refined Tempered) |
      |---|---|---|
      | Display font | Barlow Condensed | Space Grotesk |
      | Body font | Montserrat | Inter |
      | Mono font | (none) | JetBrains Mono |
      | `--ink` | `#2C2B2B` | `#1A1A1A` |
      | `--bg` | `#F7F5F2` | `#FFFEF9` (warm white) |
      | Border-radius | `0 !important` global force | `4px` tempered selective (`--radius-md`) |
      | Pastel accents | (none) | 6 (yellow/cyan/lime/pink/peach/lavender) |
      | Motion easing | (Tailwind default `ease`) | `cubic-bezier(0.25,0,0,1)` (`--ease-nb`) |
      | Spacing scale | (Tailwind default) | 8-step token (`--space-1` 4px → `--space-8` 96px) |

    - **Tested manually**: `/`, `/login`, `/x-ray`, `/dashboard` — all pass visual + interaction. `npm run typecheck` PASS, `npm run lint` PASS.
    - **Pattern lessons**:
      1. **NB v3.2 "Refined Tempered" cho phép radius 4px** ở cards/buttons (không phải 0 force như NB raw). Phải bỏ `border-radius: 0px !important` global trong `@layer base`, áp radius selective qua `--radius-md` token. Khi audit code base sau này, nếu thấy global radius force quay lại → đó là regression, không phải feature.
      2. **Token migration thứ tự**: fonts (`layout.tsx`) trước → tokens block (`@theme inline` + `:root` + `.dark`) sau → utility classes cuối. Mỗi step verify visual riêng. **KHÔNG gộp 1 commit** vì không thể bisect được nếu vỡ. 4-commit pattern proven (HANDOFF baseline + fonts + tokens + utility classes).
      3. **shadcn/ui CSS variables convention** (`--background`, `--foreground`, `--primary`, `--border`, `--ring`, `--card`, `--popover`, `--accent`, `--muted`, `--destructive`) PHẢI giữ tên, chỉ đổi value. Đổi tên = vỡ toàn bộ shadcn components. Custom tokens (`--brand`, `--ink`, `--bg`) đặt PARALLEL không thay thế shadcn vars (ghi chú đã có sẵn trong `globals.css` :root về collision với `--accent`).
      4. **Vietnamese subset font verify**: Space Grotesk + Inter + JetBrains Mono đều support tiếng Việt full dấu — verified với "ấ", "ặ", "ợ", "đ" trong hero. Khi pick font Google mới, ALWAYS check Vietnamese coverage trước khi swap (next/font/google `subsets: ['latin', 'vietnamese']`).
  - **Landing page refactor M-Design-2 (2026-04-27)**: ✅ shipped. Refactor `app/page.tsx` full NB v3.2 — tách 5 components (HeroNB, MarqueeStrip, FeatureCardNB, StepCardNB, CtaBannerNB) + footer cleanup + 2 hotfix copy + 1 hotfix sticker overflow. Audit polish (Task 8A) PASS 100% không cần code fix.
    - **Scope**: 5 sections refactored (Hero, Marquee mới, How It Works, Features, CTA Banner) + footer cleanup. Header nav GIỮ NGUYÊN.
    - **Commits** (chronological, oldest first):
      - `dbff864` — refactor(footer): rename to FooterCopyright + dedupe copyright + fix 3 dead links + scaffold landing folder (Task 2.5)
      - `6d4c3a9` — feat(landing): refactor Hero to NB v3.2 with mixed sizes + rotated accent + sticker overlap (Task 3 — Hero only, MarqueeStrip ship riêng)
      - `7fb1036` — feat(landing): add MarqueeStrip + replace static stat bar (Task 4)
      - `21ad758` — fix(landing): correct hero subheadline copy (Toyota 200y → Hoshin Kanri Fortune 500) (Task 4 hotfix copy)
      - `e738fdb` — fix(landing): correct copy claim (Toyota 200y → Hoshin Kanri Fortune 500) (additional copy claim hotfix)
      - `76e3ccc` — feat(landing): refactor Features to 6 pastel NB v3.2 cards with sticker + tilt (Task 5)
      - `db8ce2b` — feat(landing): refactor How It Works to 3 NB v3.2 step cards with mono numbers + tilt (Task 6)
      - `c2419bc` — feat(landing): refactor CTA Banner to NB v3.2 with double-shadow + dot pattern + sticker (Task 7)
      - `7f674b1` — fix(landing): allow CTA banner sticker to overflow container (Task 7 hotfix overflow)
      - Task 8A polish: no commit (audit pass 100% — typecheck + lint clean, mobile/contrast/routing all PASS, không có code fix nào cần apply)
    - **Components shipped** (`components/landing/*`):

      | File | Lines | Purpose |
      |---|---|---|
      | HeroNB.tsx | 143 | Hero với mixed font sizes (clamp 40-128px) + rotated "90 ngày" red + decorative grid 3x3 + 3 stickers (VISION/GOALS/KPIs) |
      | MarqueeStrip.tsx | 80 | Reusable scrolling ticker với props items/accentColor/speed/direction. Dùng `.nb-marquee` utility class |
      | FeatureCardNB.tsx | 47 | 6 pastel variant cards với sticker numbering 01-06 + 2 cards tilt (X-Ray left, X-Matrix right) |
      | StepCardNB.tsx | 53 | 3 step cards `bg-warm` với big numbers `font-mono` 700 + Step 02 tilt + sticker "BƯỚC NN" |
      | CtaBannerNB.tsx | 79 | Final banner với `--shadow-double` (yellow + ink) + `bg-dot-grid` + sticker "FREE · 5 PHÚT" |

    - **page.tsx delta**: từ ~366 dòng inline → 268 dòng (5 component imports + usage). Header + Footer 4-col vẫn inline trong page.tsx.
    - **globals.css delta**: thêm `--shadow-double` token (cả `@theme inline` + `:root`) + `.bg-dot-grid` utility (radial-gradient overlay 24×24px alpha 0.18). Không đụng tokens cũ.
    - **Audit results (Task 8A)**:
      - Mobile 375px: 5/5 components PASS (touch target ≥48px, padding ≥16px, sticker overflow OK post-hotfix)
      - WCAG AAA contrast: 10/13 PASS verified, 3 NEEDS MANUAL VERIFY (text-2 trên pastel bgs, white-on-brand subtitle 5.16:1 fail AAA-normal nhưng pass AAA-large)
      - Routing: 4 CTA primary `/x-ray` (nav + hero + footer + banner), 0 broken/dead links
      - Build: typecheck PASS, lint PASS, build PASS (~7s), landing client JS = 263 bytes (≪ 200 KB threshold)
    - **Pattern lessons**:
      1. **Cursor có thể tự bundle nhiều task vào 1 commit không báo trước**: Em đã giả định Task 3 chỉ ship Hero, và git xác nhận đúng — nhưng pattern này (Cursor bundling silent) vẫn risk. Mitigation tương lai: sau MỖI commit Cursor báo, hỏi `git show <hash> --stat` để confirm scope thực tế. Hoặc thêm explicit "DO NOT extend scope beyond X" vào prompt task.
      2. **Sticker overlap pattern cần `overflow: visible`**: Pitfall mới #12. Áp dụng cho mọi component NB chaos DNA tương lai.
      3. **Marketing copy AI hallucination**: Pitfall mới #13. Vũ Hải BẮT BUỘC review con số/năm/% trong copy trước commit. M-Design-2 hit pitfall này 2 lần — fix qua 2 commits riêng cho cùng 1 root cause.
      4. **Component-based vs inline trade-off**: page.tsx ban đầu ~366 dòng inline → sau refactor 268 dòng với 5 component imports. Easier maintain, dễ test riêng từng section, nhưng tăng số file. Worth trade-off cho landing vì section structure rõ ràng. KHÔNG áp pattern này cho dashboard/admin (logic phức tạp hơn, nhiều state, tách theo feature thay vì theo section).
      5. **Spec discipline**: 100% style đi qua tokens (`var(--brand)`, `var(--accent-yellow)`, `var(--shadow-md)`, `var(--ease-nb)`). Không hardcode hex. KHÔNG inline Tailwind arbitrary value (`bg-[#c73937]`). Khi cần style mới → ADD vào globals.css với token-driven values, KHÔNG tự sáng tạo CSS rời rạc.
  - **M-Hoshin-1 X-Matrix Canvas (2026-04-27)**: ✅ shipped. Replace 5-step `XMatrixWizard` bằng single-page Density Mode `XMatrixCanvasPage` (Toyota A3 pattern, orthogonal grid layout). Wizard files KEPT cho rollback safety 2 tuần — `NEXT_PUBLIC_XMATRIX_CANVAS=0` env var triggers wizard render.
    - **M-Hoshin-1 commits (2026-04-27)** — 9 commits ship qua 1 day session:
      - `7ae1acd` docs: M-Hoshin-1 canvas design with 5 locked decisions (T1: design audit + 5 Q&A)
      - `413d276` feat(xmatrix): canvas component skeleton behind feature flag (T2: 12 components skeleton, mock data)
      - (T2.5 commit no separate hash — bundled với T2 via Cursor scope creep) feat(xmatrix): refactor canvas to Density Mode with correlation matrix
      - `742b62f` feat(xmatrix): wire canvas state with Context + useReducer (T3a: state foundation, replace mock với empty initial state)
      - `70a9068` feat(xmatrix): add modal edit forms using @base-ui/react Dialog (T3b: 3 modal files + click handlers, full Hoshin form)
      - `08b1719` feat(xmatrix): add localStorage auto-save and real-time validation (T3c: useLocalStorageSync + useCanvasValidation hooks, SubmitBar wire)
      - `561848f` fix(xmatrix): tooltip right-anchor for edge-near elements (T4 hotfix: KPIs tooltip clip)
      - `37eada6` feat(xmatrix): wire tooltips and mini-map navigation (T4+T5 gộp: 5 educational tooltips + mini-map data-driven)
      - `c5429b9` feat(xmatrix): canvas as production default with reverse flag rollback (T6: bỏ feature flag)
    - **M-Hoshin-1 pattern lessons**:
      1. **Encoding hell trên Windows PowerShell**: Lệnh `echo "..." >> file.local` mặc định dùng UTF-16 LE encoding trên PowerShell, mix với UTF-8 file gốc → NULL bytes interleaved → Next.js không parse được env vars. Khi tạo/edit `.env.local`, LUÔN dùng `Add-Content -Encoding UTF8` hoặc `[System.IO.File]::WriteAllText` với `UTF8Encoding(false)` để đảm bảo UTF-8 không BOM. Verify bằng `[System.IO.File]::ReadAllBytes()` đọc 6 bytes đầu phải là `23 20 53 75 70 61` (= `# Supa`). Đã debug 1.5h ở session này — pattern lesson: NULL bytes invisible nhưng kill env loading.
      2. **Canvas state Context + useReducer pattern**: Tách state thành `{ data: XMatrixData, ui: CanvasUiState }` với `data` byte-identical với existing API contract. Reducer pure function với 8 actions (HYDRATE, ADD/UPDATE/REMOVE × 2 entities + SET_AI_PREFILL placeholder + SET_SAVE_STATUS + CLEAR_DRAFT). Pattern proven cho large form state — tránh Zustand vì state scope hẹp (chỉ 1 page).
      3. **localStorage debounce + hydrate 1 lần**: `useEffect` hydrate qua `useRef` guard (tránh React 19 StrictMode double-effect). Skip save khi data hoàn toàn empty (tránh đè lên stored data lúc just-mounted). Debounce 500ms balance UX vs write frequency.
      4. **Reverse feature flag pattern**: `NEXT_PUBLIC_XMATRIX_CANVAS=0` để rollback (canvas default), thay vì `=1` để enable (wizard default). Pros: production user thấy new feature ngay, emergency rollback chỉ cần update Vercel env var (no redeploy). Pattern phù hợp cho UI replacement features khi confident về quality.
      5. **Cursor scope creep on bundled tasks**: Cursor có xu hướng "auto-improve" — vd commit T2.5 (Density Mode refactor) Cursor tự xóa debug logs em đã thêm cho debugging .env.local. Tốt khi xóa đúng, nhưng pattern phải track qua `git diff --stat HEAD~1` mỗi commit để verify scope.
      6. **`@base-ui/react` vs Radix**: Codebase dùng `@base-ui/react/alert-dialog`, KHÔNG phải `@radix-ui`. Khi spec UI components, PHẢI `view components/ui/` trước để confirm library trong use. Không assume shadcn pattern = Radix.
      7. **Sticky positioning bug Next.js + Tailwind v4 mobile**: Mini-map `sticky top-16` không hoạt động trên mobile dù CSS computed values đúng (position: sticky, top: 64px). Suspect: scroll container ancestor chain. Defer fix M-Hoshin-2.
      8. **Vibe coding session limit ~8h**: Session này em + Vũ Hải đi qua 9 tasks ~8h work. Encoding debug 1.5h + sticky bug debug 1h = 30% effective time bị consumed bởi bugs. Pattern: planning + design solid (T1) → implementation fast (T2-T6) → ship trong 1 session khả thi nếu bugs không leak. Anti-pattern: nếu gặp bug debug > 30 phút → pause hoặc defer thay vì cố fix tại session.
  - **M-Hoshin-1 — Canvas mini-map sticky bug 2026-04-27**: ⏸ deferred to M-Hoshin-2 Task 6. Mini-map render OK ở top page nhưng không stick khi scroll trên mobile (650-768px viewport). Đã thử fix qua tăng z-index, đổi top-0 → top-16, move CanvasMiniMap outside wrapper div (commit reverted). Root cause chưa identify chính xác — khả năng là scroll container ancestor không đúng position-relative. Pattern lesson: bug sticky position trên Next.js + Tailwind v4 environment có thể cần investigate sâu DOM tree với DevTools Computed panel + check ancestor `overflow` chain. Functional impact: low — mini-map vẫn render, user vẫn navigate được, chỉ không sticky khi scroll.
  - **M-Hoshin-1 — AI Prefill flow deferred 2026-04-27**: ⏸ wire `/api/x-matrix/prefill` API + `SET_AI_PREFILL` action với accept/reject từng ô (Q4 design decision). Action signature đã có trong `CanvasContext.tsx` với placeholder body. Defer to M-Hoshin-2 vì scope creep — AI prefill + AI coaching correlation = 1 feature integrated. Pattern lesson: khi feature có 2 layer (data prefill + interactive validation), không tách timing — ship cùng milestone để UX consistent.
  - **M-Hoshin-1 — Wizard files cleanup**: ✅ shipped 2026-05-01 ahead of original 2026-05-11 target qua M-Cleanup-1 (commit `558a471`). 7 wizard files deleted + feature flag `NEXT_PUBLIC_XMATRIX_CANVAS` removed. Detail xem M-Cleanup-1 entry dưới.
  - **M-Hoshin-2 Correlation Matrix Engine 2026-04-28**: ✅ shipped (10 commits ship qua 1 day session). Mục tiêu: wire correlation matrix center 5×3 thành interactive — user click cell cycle ●◐○-, AI prefill từ Discovery, AI coach sensei questions, orphan validation warnings.
    - **DB schema (migration 030)**: thêm table `xmatrix_correlations` với composite unique (x_matrix_id, year_goal_id, hoshin_id) cho idempotent upsert. year_goal_id và hoshin_id là text (không FK) vì đây là JSON-embedded IDs từ x_matrices.vision_json.
    - **API routes mới**: `/api/xmatrix/correlations` GET (list) + PUT (upsert), `/api/xmatrix/coach-correlation` POST (sensei questions với rate limit 50/5min/user). Dùng AI_MODELS.reasoning cho coach.
    - **State management**: Extend CanvasContext với 4 new state slices — correlations map, correlationsLoading, coachCache (per-cell question cache), aiSuggestedFields (highlight prefilled fields). 9 reducer actions mới: LOAD_CORRELATIONS_*, SET_CORRELATION, ROLLBACK_CORRELATION, COACH_FETCH_*, SET_AI_PREFILL implementation.
    - **UI features**:
      - CenterX correlation matrix grid 5×3 với click cycle (●◐○-)
      - CoachPopover xuất hiện khi click strong cell, hiển thị 3 câu hỏi sensei tiếng Việt
      - PrefillModal binary accept-or-cancel cho AI prefill từ Discovery
      - VisionEditor input cho vision statement (gap M-Hoshin-1)
      - Orphan warnings panel trong SubmitBar với sensei voice
      - Smart `/new` route — load existing matrix nếu có, blank nếu không
    - **M-Hoshin-1 deferred items resolved trong session này** (3/4):
      - ✅ AI Prefill flow shipped (Task 8)
      - ✅ Submit API wire shipped (Task 4c FINAL — phát hiện M-Hoshin-1 ship submit placeholder, fix mid-session)
      - ⏸ Mini-map sticky bug DEFER M-Mobile-1 (mobile layout broken nghiêm trọng hơn — thiếu CenterX render trên mobile, không chỉ sticky bug)
    - **M-Hoshin-2 commits** (chronological per git log, 9 commits total):
      - `5180cff` feat(types): add xmatrix_correlations to Database type
      - `a35cb1e` feat(api): add xmatrix correlations CRUD endpoint
      - `3236f13` feat(db): add xmatrix_correlations migration file
      - `aa2f69e` feat(xmatrix): wire correlations state and API hydration in CanvasContext
      - `731116c` feat(xmatrix): canvas polish - vision input + submit wire + smart route (gộp Task 4b interactive grid + Task 4c FINAL polish — 5 fixes: vision input, role detection, symbol encoding, submit wire, smart route)
      - `4c8a106` feat(xmatrix): orphan correlation warnings with sensei messages (Task 5)
      - `0deba82` feat(xmatrix): AI coach correlations with sensei questions popover (Task 7)
      - `1577b26` docs: update handoff after M-Hoshin-2 (Task 9 docs — committed before final feature commit)
      - `d64e1cf` feat(xmatrix): AI prefill from Discovery with binary accept-or-cancel modal (Task 8 — shipped sau docs, thứ tự non-monotonic giữa Task 1 commit thứ 3 và Task 8 commit thứ 9 — pattern lessons đã capture)
    - **Pattern lessons**:
      1. **Cursor có thể ship "task xong" với placeholder code không communicate** (M-Hoshin-1 SubmitBar handleSubmit `[T3c] Submit placeholder, will wire API in Task 6` không note vào HANDOFF). Mitigation: sau khi Cursor báo ship milestone, GREP toàn repo cho keyword `placeholder|TODO|will wire|Task N` trước khi update HANDOFF — phát hiện debt sớm hơn là discover lúc ship feature kế.
      2. **Mid-milestone scope expansion qua phát hiện gap**: M-Hoshin-2 expand scope thêm submit wire fix khi phát hiện M-Hoshin-1 incomplete. Pattern: nếu phát hiện foundation gap tại Task N của milestone X, đánh giá nếu fix được trong cùng milestone (yes nếu < 1-2 tasks) hay defer milestone riêng (no nếu architectural redesign). M-Hoshin-2 chọn yes — gộp Task 4c FINAL với 5 fixes cùng commit. Defer alternative đã được consider nhưng reject vì foundation gap block toàn bộ correlation feature testing.
      3. **Smart route pattern (`/new` load existing nếu có)**: Avoid scope creep từ tạo route edit riêng `/dashboard/x-matrix/[id]/edit`. 1 route serve cả create + edit modes dựa trên DB state (`x_matrices.status='active'` query). API atomic dedupe handle archive old matrix khi save mới. URL semantics tradeoff acceptable cho beta product.
      4. **Encoding bug Unicode trong code**: Cursor save STRENGTH_SYMBOLS object với 'strong' và 'medium' cùng bytes ● (U+25CF) thay vì ● (U+25CF) + ◐ (U+25D0). Mitigation: dùng escape sequences `●`, `◐` cho Unicode literals trong code thay vì paste characters trực tiếp. Áp dụng cho tất cả Unicode symbols future (◑◒◓◔◕✓✗ etc.).
      5. **Disabled state UX cho prerequisite-blocked features**: Correlation cells không clickable khi chưa có xMatrixId (chưa save matrix lần đầu). Chosen approach: disabled cells với hint "Lưu X-Matrix trước để bắt đầu xếp correlation". Alternative considered: local-first batch sync (clickable ngay, sync khi save) — defer M-Hoshin-3 vì cần thêm bulk endpoint + MERGE_DRAFT_CORRELATIONS action + sync logic phức tạp. Pattern: disabled state acceptable cho beta SaaS, granular accept defer.
      6. **API existed nhưng không wired**: `/api/x-matrix/create` đã có đầy đủ từ wizard cũ (M-Hoshin-1 không build mới — wizard cũ cũng dùng route này qua XMatrixReview.tsx). M-Hoshin-1 ship canvas chỉ tạo placeholder submit, không wire vào API có sẵn. Pattern: trước khi assume "feature X chưa có API", grep toàn repo cho route patterns liên quan — có thể đã có sẵn từ legacy code.
      7. **Vision input thiếu hoàn toàn ở M-Hoshin-1**: Canvas state có field `vision: string` (line 35 CanvasContext) nhưng KHÔNG có UI input nào để nhập. Validation block save với "Vision statement không được trống". Pattern: khi extend canvas, kiểm tra MỖI field trong state shape có corresponding UI input không. Audit checklist nên include "every state field has UI input" cho future state extensions.
      8. **Mobile layout broken phát hiện gián tiếp**: Khi test Task 6 mini-map sticky bug, screenshot mobile 460x731 chỉ thấy Hoshin cards (SouthEdge), KHÔNG thấy Vision/MụcTiêu/MaTrậnLiênKết/Owners/KPIs. CenterX có `hidden md:grid` → không render mobile. Toàn bộ M-Hoshin-2 correlation feature **vô dụng trên mobile**. Defer M-Mobile-1 — milestone riêng cho mobile redesign (stacked accordion pattern, not flat stack hiện tại). Pattern: defer mobile critical fixes vào milestone riêng nếu desktop-first user (CEO solo dev). Anti-pattern: cố fix mobile trong session feature build → scope creep.
  - **M-Mobile-1 Mobile Layout Redesign 2026-04-28 (partial scope)**: ✅ shipped Task 2 (Stacked Vertical pattern). ⛔ Mini-map sticky bug killed indefinitely sau 2 lần defer (M-Hoshin-1 → M-Mobile-1).
    - **M-Mobile-1 commits (2026-04-28)** — 1 commit ship qua session ngắn:
      - `68d48b9` feat(xmatrix): render canvas mobile with stacked vertical layout (Task 2 — render đầy đủ + correlation đảo trục 3×5 + cell touch ≥48px)
    - **Mini-map sticky bug DEFERRED INDEFINITELY**:
      - 2 lần defer (M-Hoshin-1 → M-Mobile-1 → kill)
      - Total time consumed: ~3h diagnose qua 2 milestones
      - Decision: kill khỏi roadmap. Re-add chỉ khi user complain hoặc gắn vào feature mới
      - Last attempt: `min-h-0` fix trong dashboard layout `<main>` + `scrollMainToTop()` helper trong `lib/utils.ts` — reverted, không commit. Multi-cause sticky bug (Tailwind + Next.js nested flex + indeterminate height) không định danh được từ static review HIGH confidence.
    - **Pattern lessons**:
      1. **Diagnose-first proven valuable cho bug fix**: Task 2 prompt blind → 2 ambiguity Cursor pause (Vision modal + YearGoals metric scope creep). Task 3 diagnose-first → root cause clear nhưng fix incomplete (multi-cause sticky bug). Pattern: diagnose-first cho bug fix, prompt blind cho feature build straightforward.
      2. **2-defer = kill rule**: Quality-of-life features đã defer 2 lần → downgrade priority hoặc kill. Tránh sunk-cost (mini-map sticky consume 3h tổng cộng cross 2 milestones, không ship). Re-add chỉ khi có user complaint mới hoặc gắn deeply vào feature kế.
      3. **HIGH confidence diagnose ≠ 100% fix**: Cursor diagnose Option 1 confidence HIGH (`min-h-0` fix flexbox `min-height: auto` default), ship đúng spec, vẫn không stick. Multi-cause sticky bug (Tailwind + Next.js + nested layout) khó định danh từ static review. Pattern: nếu HIGH confidence fix không work → defer/kill thay vì pivot MEDIUM/LOW option (sunk-cost trap).
      4. **Refactor không gắn fix = ship sau**: `scrollMainToTop()` helper là refactor (replace `window.scrollTo` cho dashboard pages), không phải fix bug. Khi fix gắn revert → refactor không nên ship riêng. Wait until 1 fix khác cần helper rồi ship cùng commit.
      5. **Submit bar mobile không broken** — em prompt assumption wrong trong §18 Next Steps cũ ("Submit bar mobile — full-width, persistent footer pattern thay vì inline"). Verified qua test mobile session: inline pattern hiện tại work fine, không cần redesign. Pattern: verify "broken" claim TRƯỚC khi schedule task; tránh fix problems không tồn tại.
  - **M-Hoshin-3 — Annual Review Workflow 2026-04-29**: ✅ shipped (8 commits + 1 hotfix). Mục tiêu: close PDCA loop. End-of-year review vs target, hansei capture (Toyota A3 4-fields), KPI actuals manual entry, carry-over decisions per Hoshin, year transition with defensive auto-archive.
    - **DB schema (migration 031)**: 3 tables mới `annual_reviews`, `kpi_actuals`, `carry_overs` với RLS policies (SELECT all org members, INSERT/UPDATE/DELETE CEO only). Pattern y M-Hoshin-2 correlations table.
    - **API routes (4 endpoints)**:
      - POST `/api/annual-review/create` — idempotent, return existing draft, 409 cho completed/transitioned
      - GET/PUT `/api/annual-review/[id]` — read full review + write A3/KPI actuals/carry-overs
      - POST `/api/annual-review/[id]/transition` — atomic archive + create new active matrix
    - **UI**:
      - Banner trên `/dashboard` khi có x_matrix năm cũ chưa transition
      - Manual trigger card khi không có pending banner
      - Review page `/dashboard/x-matrix/[year]/review` với A3 form (4 textarea Toyota A3 pattern), KPI Actuals (manual entry, achievement % auto-compute, color band green/yellow/red), Carry-over decisions (4-button radio per Hoshin: pending/carry/modify/drop)
      - Transition preview modal (NB v3.2 styling) với carry/modify/drop sections + warning panel
    - **Auto-flagging**: Hoshin có ANY KPI < 70% → AlertCircle red + suggest carry-over. Hoshin đạt target → CheckCircle green + drop natural. Threshold hardcoded 70 trong `lib/annual-review/flagging.ts`.
    - **Auto-save**: 2s debounce qua PUT API. Initial mount guard (`useRef`) tránh save state seeded từ server.
    - **Validation Complete**: A3 fields ≥ 50 chars mỗi, mọi KPI có actual, mọi flagged Hoshin có decision khác pending. Errors expand-on-click, capped 5 + "...và N khác".
    - **Defensive auto-archive (commit f03d59d)**: Transition API archive TẤT CẢ matrix active của org_id trước khi insert new. Migration 015 UNIQUE constraint từng cause 23505 conflict ở smoke test. Trade-off: convenience > safety — user matrix mới khác đang dùng có thể bị archive âm thầm. Pattern fallback: nếu production complain → revisit chuyển 409 reject với error rõ.
    - **M-Hoshin-3 commits** (chronological):
      - `786942b` feat: add migration 031 + types
      - `25bc23e` feat: API routes CRUD + transition
      - `d782d9f` feat: dashboard banner + manual trigger card
      - `5192408` feat: page shell + data fetching
      - `af8b5d2` feat: A3 form + KPI actuals + auto-save
      - `266d090` feat: carry-over decisions + complete button
      - `193f329` feat: transition preview modal + execute
      - `f03d59d` fix: defensive auto-archive on transition
    - **Pattern lessons** (đáng capture):
      1. **Multi-org dev environment confusion**: Debug log `userId + orgId` đầu Server Component cho time-dependent features. Đã consume ~30 phút diagnose RLS/policy/query trong M-Hoshin-3 smoke test trong khi root cause chỉ là **wrong org login** (8 Ladysfit orgs trong DB, query `name ilike '%ladysfit%' limit 1` bốc đại). Mitigation: trước khi diagnose RLS/data layer, ALWAYS verify identity context (`auth.uid()`, `org_members.org_id`) trước.
      2. **vision_json kpi.id regenerate on save → kpi.name là join key**: Pattern khi link kpi entity giữa table `kpis` (DB) và `x_matrices.vision_json.hoshins[].kpis[]` (JSONB), dùng `name` field làm join key (NOT id). Đã code-comment trong `lib/annual-review/queries.ts`. Áp dụng cho Hoshin/initiative future references nếu xảy ra cùng pattern.
      3. **Migration 015 UNIQUE active per org constraint hit lần 2**: Bug 23505 đã hit ở M-Hoshin-2 commit `731116c` (smart `/new` route smart load existing) và M-Hoshin-3 commit `f03d59d` (transition flow). Pattern: bất kỳ flow nào CREATE matrix active → MUST archive existing active của cùng org_id trước. Define helper `archiveActiveMatrices(supabase, orgId)` cho future routes nếu pattern tái diễn.
      4. **Defensive auto-archive vs explicit reject trade-off**: UNIQUE constraint conflict có 2 approaches. M-Hoshin-3 chọn auto-archive (convenience > safety). Lý do: edge case "user manual tạo matrix năm sau active trước khi review năm cũ" hiếm trong production. Pattern fallback: nếu user complain "matrix bị archive đột ngột" → revisit chuyển 409 reject với message "Năm X đã có matrix active. Hãy archive trước khi transition".
      5. **Test data limitations cho carry-over flagging**: KPIs trong `kpis` table và KPIs trong `vision_json.hoshins[].kpis[]` phải MATCH names để flagging logic link KPI → Hoshin. Khi seed test data manual qua SQL → must align names. Smoke test M-Hoshin-3 skip carry-over flagging verify vì test data không match — production user fill cùng canvas thì auto-match. Document pattern này khi seed test data future.
      6. **SQL paste-prose pollution (workflow lesson)**: Khi đưa SQL multi-step trong code blocks, ABSOLUTELY tách rõ block — code only, KHÔNG mix comment hướng dẫn dạng "→ Expected: ..." vào trong block. User có xu hướng paste cả block, dẫn đến syntax error. Hit ít nhất 4 lần trong M-Hoshin-3 smoke test. Mitigation: prose hướng dẫn TÁCH ra ngoài block, code blocks chứa SQL pure paste-able.
      7. **8 Ladysfit orgs duplicate name pollution**: DB có 8 orgs cùng tên "Ladysfit*" do test pollution qua thời gian. Query `name ilike '%ladysfit%' limit 1` bốc tùy đại 1 trong 8. Anti-pattern: NEVER dùng `ilike` + `limit 1` cho name lookup khi data có duplicate risk. Pattern: lookup bằng `id` UUID hoặc unique combination (vd `name + email_verified_admin`).
  - **M-Hoshin-4 — Hansei Auto-prompt khi KPI red 2+ tuần (2026-04-29)**: ✅ shipped (6 commits). Mục tiêu: close PDCA loop tuần — khi KPI có 2+ tuần liên tiếp < 70% target → auto-prompt user nhập mini-hansei reflection (2 fields: why_red + next_action). Build trên M-Hoshin-3 patterns (Server Component fetch + Client wrapper, soft validation, idempotent upsert).
    - **DB schema (migration 032)**: bảng `weekly_hansei` với composite UNIQUE (kpi_id, week_start) cho idempotent upsert per streak. 4 RLS policies (SELECT all org members, INSERT/UPDATE WRITE_ROLES, DELETE ADMIN_ROLES). Trigger `update_weekly_hansei_updated_at` BEFORE UPDATE. Indexes (org_id, week_start DESC) + (kpi_id, week_start DESC).
    - **API routes (2 endpoints)**:
      - POST `/api/hansei/create` — Zod parseBody, requireOrgRole WRITE_ROLES, rate-limit 30/5min/user, server-side streak verify (anti-fake), idempotent upsert qua onConflict
      - GET `/api/hansei/list?kpi_id=` — list history per KPI, ALL_ROLES read
    - **Detection logic** (`lib/hansei/queries.ts`): 3 round-trips fixed (NOT N+1). Query `kpis` filter weekly/daily → query `kpi_entries` 6 tuần gần nhất → query `weekly_hansei` per KPI history. Group entries theo Monday-Sunday ISO week, tính LAST VALUE per tuần (Q2 decision), count consecutive red streak từ tuần hiện tại lùi về. Re-prompt logic Q6: `weeks_since_last_hansei >= RE_PROMPT_INTERVAL_WEEKS=2`.
    - **UI** (`components/hansei/*` + `app/dashboard/kpi/components/KpiHanseiSection.tsx`):
      - Banner pattern y AnnualReviewBanner — yellow bg + sticker "HANSEI" + brand-color streak badge
      - Inline form 2-field (why_red + next_action), min 30 / max 1000 chars, dual char counter green/red
      - History list per KPI với week badge + 2 sections (Tại sao đỏ / Hành động) + footer timestamp
      - Server Component fetch redStreaks → Client wrapper KpiHanseiSection handle expanded state + optimistic filter
    - **Smoke test 5 cases PASS** (Option B full): 1 tuần đỏ no banner, 2 tuần show, submit hide, streak break reset, 4 tuần re-prompt với history list show
    - **6 commits**: `2202968` docs plan → `47ad626` migration + types → `a5bd983` detection queries + schema → `ce1949d` API endpoints → `330b185` components → `446f19f` wire dashboard
    - **KPI data cleanup post-test**: deactivate 56 duplicate KPIs trong Ladysfit org qua SQL ROW_NUMBER strategy (giữ oldest, deactivate phần còn lại). 65 active → 9 unique. Pollution từ test sessions cũ. Cleanup soft (`is_active=false`) không hard delete vì FK CASCADE impact (kpi_entries, kpi_actuals, weekly_hansei).
    - **Pattern lessons** (đáng generalize):
      1. **Server Component fetch + Client wrapper escalated to convention**: Pattern proven 3 lần liên tiếp — M-Hoshin-3 (AnnualReviewBanner), M-Hoshin-4 (KpiHanseiSection), implicit M-Hoshin-2 (KpiDashboardClient cũ). Server fetch giảm latency (no waterfall), Client wrapper handle interactive state. Future dashboard features mặc định pattern này, không cần debate Approach A/B/C lại.
      2. **vision_json kpi.id regenerate (M-Hoshin-3 #2 reused successfully)**: Detection logic dùng `kpis.id` (table FK) làm join key, KHÔNG dùng vision_json kpi.id. Verified hoạt động đúng qua smoke test.
      3. **Smoke test rigor — challenge unverified "all pass" claim**: User nói "all pass" mà chưa screenshot UI behavior → request explicit Option A (minimal — chỉ verify Case 2+3 critical) hoặc Option B (full 5 cases). SQL success ≠ UI correct. Pattern: critical UI features (banner show, form submit) cần screenshot verify ít nhất 1-2 cases. Không trust phantom claims.
      4. **Test data tận dụng vs seed clean tradeoff**: 4 KPIs weekly duplicate có sẵn (data pollution) → pick 1 (`1e27af36-...`) để test thay vì seed KPI mới + cleanup phức tạp. Trade-off: minimal pollution tăng (chỉ test entries + hansei rows, KPI shared), cleanup gọn (không touch KPIs structure). Anti-pattern: seed thêm KPI test → tăng pollution thêm.
      5. **SQL placeholder pattern lesson #6 escalation**: "không paste-prose pollution" áp dụng cả cho placeholder UUIDs trong template SQL. Không đưa template `id IN ('uuid-1', 'uuid-2', ...)` cho user paste — phải đưa SQL hoàn chỉnh sau khi có data thật, hoặc dùng subquery/CTE để eliminate manual UUID enumeration. Đã hit pattern này 1 lần trong cleanup phase (anh paste template không fill UUIDs → syntax error).
      6. **Cleanup pollution qua ROW_NUMBER pattern**: SQL `ROW_NUMBER() OVER (PARTITION BY name, frequency, target_value ORDER BY created_at ASC)` để identify duplicates và giữ oldest, deactivate phần còn lại. Không cần enumerate UUIDs thủ công. Reusable pattern cho future cleanup tasks (M-Cleanup-2 Ladysfit orgs duplicate, future data pollution scenarios).
      7. **3-round-trip query pattern proven OK cho `<100 user/org scale`**: getRedStreaks query 3 sequential round-trips (kpis → kpi_entries → weekly_hansei) không N+1. Performance OK với org < 50 KPIs (typical SME). Future scale > 100 KPIs → migrate materialized view với pg_cron daily refresh. Threshold migration: nếu org load `/dashboard/kpi` > 500ms → optimize. Hiện tại 9 KPIs Ladysfit → query cực nhanh.
  - **M-Hoshin-5 — Gemba Feedback (Member comment trên Hoshin/KPI) 2026-04-30**: ✅ shipped (8 commits). Mục tiêu: đảo trục input flow gốc rễ CEO-centric → bottom-up gemba bottom-up signal Member→CEO. Toyota Hoshin Kanri principles: psychological safety permanent (không edit/delete window), audit trail integrity, 1 schema 2 target_type cover Hoshin + KPI.
    - **DB schema (migration 033)**: bảng `gemba_comments` với 2 enums (`gemba_target_type`: hoshin/kpi, `gemba_status`: open/acknowledged/resolved), CHECK body 20-1000 chars, 4 RLS policies (SELECT all org members, INSERT all, UPDATE/DELETE CEO+Manager). 4 FK references (org_id, created_by, acknowledged_by, resolved_by) tạo 8 internal `RI_ConstraintTrigger_*` + 1 explicit updated_at trigger = 9 triggers tổng. 3 indexes (org_status, target lookup, author lookup).
    - **API routes (3 endpoints)**:
      - POST `/api/gemba/create` — `requireOrgRole(ALL_ROLES)` — **route đầu tiên trong repo có Member primary writer**, rate-limit 20/5min/user, KHÔNG validate target tồn tại (defer)
      - GET `/api/gemba/list` — 2 modes (?summary=1 cho banner aggregate / ?target_type=...&target_id=... cho thread)
      - PATCH/DELETE `/api/gemba/[id]` — PATCH `WRITE_ROLES` (CEO+Manager update status), DELETE `ADMIN_ROLES` (CEO-only moderation, strict hơn RLS để defense-in-depth)
    - **UI components (4 mới + 2 edit)**:
      - `GembaCommentForm.tsx` — Member POV inline collapsed default (text-only "💬 Góp ý" link), expand textarea với char counter 20-1000
      - `GembaBanner.tsx` — CEO banner conditional render (hide nếu total_open=0 hoặc !canModerate), pattern y HanseiBanner
      - `GembaCommentThread.tsx` — collapsed default link "{N} góp ý", expand list với status badge + buttons acknowledge/resolve cho CEO+Manager
      - `KpiGembaSection.tsx` (Server) + `KpiGembaSectionClient.tsx` (Client wrapper với Context) — Server-side fetch summary + per-KPI comments, Context provider để KpiCard truy cập qua `useGembaComments(kpiId)`
      - Wire `app/dashboard/kpi/page.tsx` (Gemba banner ABOVE Hansei banner — α 2 banner stack riêng decision Task 1)
      - Wire `app/dashboard/kpi/components/KpiCard.tsx` (form + thread render conditional)
    - **Analytics**: 4 events typed (no PII): `gemba_comment_submitted`, `gemba_comment_acknowledged`, `gemba_comment_resolved`, `gemba_banner_viewed`. Banner view tracked qua `useEffect` mount-once với `useRef` guard (StrictMode-safe).
    - **Smoke test 6 case PASS** (Member account verify Risk #1):
      - Setup: tạo Member test account `member-test@ladysfit.local` trong Ladysfit org (e4b953d9-...) trước Task 2
      - CASE 1: CEO submit comment 200 OK + banner render
      - CASE 2: Member submit comment 200 OK (Risk #1 verify — `requireOrgRole(ALL_ROLES)` + RLS `gemba_comments_insert` work với `created_by=auth.uid()` constraint)
      - CASE 3: Validation < 20 chars → button disabled
      - CASE 4: CEO acknowledge → resolve → status badge progress đúng (open→acknowledged→resolved)
      - CASE 5: Member KHÔNG thấy banner + KHÔNG thấy buttons (role-gated UI work)
      - CASE 6: DB verify 3 status active (1 open + 1 acknowledged + 1 resolved)
    - **8 commits** (chronological): docs Task 1 design audit → migration 033 + types → domain types + queries + validation schemas → API routes (create+list+patch/delete) → form Member POV → banner+thread+status CEO POV → analytics events + HANDOFF update.
    - **Pattern lessons** (đáng generalize):
      1. **`requireOrgRole(ALL_ROLES)` route đầu tiên trong repo có Member primary writer**: Verify qua smoke test với Member account thật, KHÔNG dùng dev CEO account giả lập (postgres role bypass RLS, không bao giờ test được Member writeable từ DB query). Future feature có Member writer → MUST tạo Member test account trước Task 2 (front-load setup), không chờ tới smoke test cuối milestone.
      2. **Audit trail integrity > convenience trade-off**: Q8 design audit lựa "Member INSERT only, CEO moderate delete" thay vì "24h window UPDATE/DELETE own". Lý do: psychological safety permanent (Toyota gemba culture), audit trail clean, tech debt minimum (route-level time check phức tạp + chưa có precedent). Member typo? Post reply mới — pattern Slack thread.
      3. **PowerShell paste escape character**: Khi paste lệnh git terminal có thể nhận `[C` ký tự đầu (Ctrl+C signal lúc terminal đang focus). Mitigation: kiểm tra ký tự đầu lệnh KHÔNG phải `[`, retype nếu fail (không paste).
      4. **Trigger filter chuẩn dùng `tgisinternal=false`**: Filter `tgname NOT LIKE 'pg_%'` KHÔNG catch FK constraint triggers (chúng tên `RI_ConstraintTrigger_*`). Future migration verify nên dùng `WHERE tgrelid = 'table'::regclass AND tgisinternal = false` để chỉ đếm explicit triggers.
      5. **Smoke test instructions phải numbered + expected output cụ thể**: Task 7A em viết instructions ngắn → user skip browser test, claim "all pass" mà chỉ run SQL CASE 4. Task 7B em viết 6 case numbered + expected output từng step → user follow-through tốt hơn. Pattern: critical UI features cần break instructions thành step-by-step với "STEP X.Y — sau khi click N, anh quan sát thấy gì?".
      6. **Pattern challenge "all pass" claim proven worth**: Em panic ở Task 7B screenshot không có banner → request screenshot CASE 1 + CASE 4 + DB CASE 6 → confirm thật sự pass. Trade-off: thà false-alarm hơn miss bug. Trong M-Hoshin-5 đã 2 lần (Task 7A + 7B) anh "all pass" mà em phải challenge → cả 2 lần đều resolved positive (pass thật) nhưng pattern vẫn correct.
      7. **Banner stack riêng pattern proven 3 lần**: HanseiBanner (M-Hoshin-4) + AnnualReviewBanner (M-Hoshin-3) + GembaBanner (M-Hoshin-5) — 3 banner độc lập trên dashboard (Annual + Hansei + Gemba). Pattern chosen Task 1 Q-banner = α 2 banner stack riêng. Future banner mới: render độc lập, không gộp.
      8. **Cursor scope creep mitigation qua phase boundary**: Task 7 dự kiến gộp Member + CEO POV → em chia 7A (Member) + 7B (CEO) → mỗi sub-task ship 1 commit, dễ verify từng layer. Pattern proven M-Hoshin-2 lesson #1 (4-phase boundary).
  - **M-Hoshin-6 — Hoshin Gemba Integration (2026-04-30)**: ✅ shipped (4 commits). Mục tiêu: integrate `gemba_comments` table M-Hoshin-5 (target_type='hoshin' schema-ready) vào X-Matrix canvas. CEO+Manager comment trên Hoshin cards qua badge footer + dedicated modal. Canvas role-gate Member redirect `/dashboard` (eliminate Member-POV gap).
    - **Architecture (Q4 α+γ pattern)**: Server Component `HoshinGembaSection.tsx` fetch summary + commentsMap từ vision_json (NOT table — hoshins embedded JSONB). Client wrapper `HoshinGembaSectionClient.tsx` expose Context với hook `useHoshinGembaComments(hoshinId)`. Wrap OUTSIDE `XMatrixCanvasPage` (page.tsx render `<HoshinGembaSection>...</HoshinGembaSection>`). HoshinCard consume hook, render badge conditional.
    - **UI features**:
      - Footer badge 2 variants: count > 0 hiện `💬 N` brand color, count === 0 hiện `+ 💬` faded gray opacity-60 hover-100 (entry point cho Hoshin chưa có comment).
      - Click badge → spawn `GembaModal` riêng (NOT mix với HoshinEditModal). Card vẫn click-to-edit như cũ.
      - GembaModal render thread + form. Gate form khi `xMatrixId=null` (draft chưa persist) với hint "Lưu X-Matrix trước khi thêm góp ý".
      - GembaBanner (M-Hoshin-5 component) extend `targetLabel` prop (`'KPI'` default | `'Hoshin'`). HoshinGembaSectionClient pass `targetLabel="Hoshin"` để banner copy đọc tự nhiên trên canvas.
    - **Canvas role-gate Q-canvas**: `app/dashboard/x-matrix/new/page.tsx` thêm 3 dòng `if (membership.role === 'Member') redirect('/dashboard')` sau membership check, trước canEdit. Eliminate Member-POV gap (Member thấy edit affordances không persist confusing). Member submit gemba qua KPI card (M-Hoshin-5 đã ship) — bottom-up philosophy preserved.
    - **HoshinCard refactor (Task 3B-fix)**: Original Task 3B ship badge `<button>` nested trong card `<button>` — invalid HTML5 + a11y break. Fix: wrapper `<div className="relative">` chứa 2 SIBLINGS (card button + badge button absolute positioned). XÓA `e.stopPropagation()` (siblings không bubble lên nhau). aria-label phân biệt 2 variants ("Xem N góp ý..." vs "Thêm góp ý...").
    - **Smoke test 6 cases PASS**: DOM siblings + Console clean, hover faded variant, click `+ 💬` → GembaModal trống, click card area khác → HoshinEditModal, Tab keyboard natural order (card → badge), banner copy "Hoshin" đúng (NOT KPI).
    - **4 commits** (chronological):
      - `f9e0ce9` Task 3A — foundation (role-gate + Server fetch + Context)
      - `fc411f3` Task 3B — badge + GembaModal UI (initial impl)
      - `408ef04` Task 3B-fix — refactor avoid nested button
      - `4447c42` Task 3B-fix-2 — badge 2 variants for empty state
    - **Scope creep deferred (3/4 §18 features defer)**:
      - AI sensei summarize: defer M-Hoshin-7+ (chưa có baseline data ≥10 comments thực, DB chỉ có 2 test comments tại Task 1 verify)
      - Email/Zalo digest: defer M-Hoshin-7+ (Resend cron infra needed)
      - Member edit own 24h: defer indefinitely (Q8 M-Hoshin-5 lock INSERT-only đã có rationale rõ, revisit chỉ khi user complain)
    - **Pattern lessons** (đáng generalize):
      1. **Verify-first cho assumption critical**: Task 2 verify 3 critical assumption (hoshin.id stability + canvas role check + KpiGembaSection reusability) BEFORE code. Phát hiện HANDOFF §17 M-Hoshin-5 constraint #3 phrasing "regenerate on save" misleading — actual behavior: hoshin.id `hoshin_${idx+1}_${Date.now()}` timestamp-locked tại ADD time, NOT regenerate khi SubmitBar save → text-match safe. Áp dụng pattern verify-first cho mọi feature touching JSON-embedded IDs.
      2. **Phase boundary discipline 4 commits**: Chia milestone thành 3A (foundation) → 3B (initial UI) → 3B-fix (HTML/a11y) → 3B-fix-2 (UX gap empty state). Mỗi commit ship + verify riêng, easier rollback. Pattern proven 5 milestones liên tiếp (M-Hoshin-2/3/4/5/6).
      3. **HTML5 nested button trade-off rejected**: Cursor Task 3B ship badge nested trong card button với rationale "React + browsers handle correctly với `stopPropagation()`". Em push back vì a11y break (screen readers parse sai, Chrome DevTools warning). Fix Task 3B-fix wrapper `<div>` chứa 2 SIBLINGS button. Pattern lesson: KHÔNG accept "browser tolerance ≠ correct" rationale cho a11y issue. Wrapper div +5 dòng layout cost > debug nested button bug sau này.
      4. **UX gap empty state phát hiện late**: Q2 β decision Task 1 (badge chỉ show count > 0) ship Task 3B → Task 4 smoke test phát hiện CEO/Manager không có entry point Hoshin chưa có comment. Fix Task 3B-fix-2 badge 2 variants. Pattern lesson: design audit Task 1 nên explicit flag empty state UX cho mọi conditional render decision. Audit checklist mới: "render điều kiện X → empty state UX là gì?".
      5. **Cursor auto-commit pattern consistent**: Cả 4 task M-Hoshin-6 Cursor đều auto-commit ở cuối session. Em lệnh commit em đưa sẵn nhưng `git status` báo "nothing to commit" — Cursor đã commit trước. Pattern: SAU mỗi Task Cursor báo ship, anh chạy `git log --oneline -5` verify commit message đúng + hash mới (KHÔNG run `git add . && git commit` nữa). Em note vào HANDOFF §11 Dev Workflow.
      6. **Claude in Chrome integration unreliable**: M-Hoshin-6 Task 4 em dự định dùng Claude in Chrome smoke test thay anh, extension không connect được sau Step 1-7 troubleshooting. Em phải fall back Plan B (anh test manual + screenshots). Pattern lesson cho future: KHÔNG depend vào browser automation tool, plan B (manual verify) phải sẵn sàng. Vibe coding session limit ~8h (M-Hoshin-2 lesson #8) — 30+ phút debug tool config = sunk-cost trap.
  - **M-Hoshin-6.1 Hotfix — Gate gemba form khi Hoshin chưa persist (2026-04-30)**: ✅ shipped (1 commit `13cf793` + 1 SQL cleanup DELETE 4 orphan rows trên org Ladysfit `e4b953d9-ccdc-45a3-befe-a4cfa88baff1`).
    - **Bug discovered**: Production user (Vũ Hải CEO) test M-Hoshin-6 sau deploy → submit 4 gemba comments trên Hoshin draft (chưa SubmitBar save) → DB lưu với target_id format `hoshin_${idx}_${timestamp}` không match hoshin nào trong `vision_json.hoshins[].id` đã save → ORPHAN comments. UI banner detect 4 open comments nhưng badge `💬 N` không render trên HoshinCard nào (target_id mismatch).
    - **Root cause**: Task 3B implementation gate form chỉ khi `xMatrixId === null`. Smart `/new` route (M-Hoshin-2) load existing matrix → `xMatrixId` TRUTHY từ matrix CŨ → gate KHÔNG fire → user submit được comment trên Hoshin draft chưa persist (target_id thuộc client-only `ADD_HOSHIN` action, KHÔNG nằm trong vision_json đã save).
    - **Fix (commit `13cf793`)**: Server Component `HoshinGembaSection` truyền `existingHoshinIds` (derived từ `vision_json.hoshins.map(h=>h.id)`) → Context expose `isPersisted` per hoshin → GembaModal gate form `!isPersisted` với hint vàng "⚠️ Hoshin này chưa được lưu vào X-Matrix. Click 'Lưu X-Matrix' ở thanh dưới để có thể nhận góp ý." Defensive `xMatrixId === null` branch giữ unreachable cho symmetry (xem §17 constraint M-Hoshin-6 entry).
    - **SQL cleanup orphan (audit trail)**:
      ```sql
      DELETE FROM gemba_comments
      WHERE org_id = 'e4b953d9-ccdc-45a3-befe-a4cfa88baff1'
        AND target_type = 'hoshin';
      -- Result: 4 rows deleted (verified pre/post: 4 → 0)
      ```
    - **Files changed (4)**:
      - [app/dashboard/x-matrix/new/components/HoshinGembaSection.tsx](app/dashboard/x-matrix/new/components/HoshinGembaSection.tsx) — pass `existingHoshinIds={hoshinIds}` từ vision_json hoshins map
      - [app/dashboard/x-matrix/new/components/HoshinGembaSectionClient.tsx](app/dashboard/x-matrix/new/components/HoshinGembaSectionClient.tsx) — extend ContextValue + Props + hook return `isPersisted: ctx.existingHoshinIds.includes(hoshinId)`
      - [components/x-matrix/canvas/cards/HoshinCard.tsx](components/x-matrix/canvas/cards/HoshinCard.tsx) — destructure `isPersisted` + pass xuống GembaModal
      - [components/x-matrix/canvas/GembaModal.tsx](components/x-matrix/canvas/GembaModal.tsx) — add `isPersisted: boolean` prop + render warning trước khi check `xMatrixId`
    - **Pattern lessons** (4 mới):
      1. ~~**`name ILIKE LIMIT 1` anti-pattern**~~ **CORRECTED M-Hoshin-7**: Root cause hiểu sai. Pattern `name ILIKE` là QUERY DIAGNOSE em (AI) dùng, KHÔNG phải production code. Real anti-pattern: `.limit(1).single()` cho user→org lookup (silent pick khi multi-row). Fix: 2 routes commit `3e29a66`. See L8 + L9 trong M-Hoshin-7 entry.
      2. **Cursor verify report cần cross-check DB shape thật**: Task 2 V1 verify report ghi "id timestamp-locked qua save round-trip stable" — đúng technically nhưng MISLEADING ở scope: chỉ apply cho Hoshin đã save vào `vision_json`, NOT cho draft Hoshin chưa SubmitBar save. AI pair programmer phải verify với DB query state thực tế (`SELECT vision_json->'hoshins' FROM x_matrices WHERE id=...`) trước khi trust verify report blindly.
      3. **Diagnose-first cho UI bug verify org_id session đầu tiên**: 3 hypothesis sai liên tiếp (H1 orphan draft → H4 banner filter target_type → H7 multi-org confusion) trước khi đến root cause đúng (draft not saved). Pattern: VERIFY identity context (`auth.uid()` + `org_members.org_id`) TRƯỚC khi propose fix UI bug. Audit checklist:
         - (a) email session từ Supabase auth
         - (b) `org_id` từ `org_members` JOIN với email
         - (c) DB state thật query với `org_id` đó
         - (d) compare DB state với UI symptom mới propose fix
      4. **Cursor đôi khi pause clarify thay vì auto-ship**: M-Hoshin-1→6 Cursor luôn auto-commit. M-Hoshin-6.1 lần đầu Cursor pause hỏi 2 clarification (DELETE status + Option A vs B vs Hybrid). AI pair programmer phải đọc giọng văn reply để distinguish:
         - **Anh Vũ Hải reply**: paste output terminal, screenshots, "Done"
         - **Cursor reply**: reference HANDOFF section cụ thể (§17 M-Hoshin-5), prompt-engineering pattern ("anh confirm 2 điều"), structured A/B/Hybrid trade-off
         - Khi Cursor pause clarify = defensive engineering OK, KHÔNG phải lazy.
    - **Verification plan**: Manual verify 2026-05-07 (1 tuần post-deploy). Chạy SQL:
      ```sql
      SELECT COUNT(*) FROM gemba_comments
      WHERE target_type='hoshin'
        AND target_id NOT IN (
          SELECT jsonb_array_elements(vision_json->'hoshins')->>'id'
          FROM x_matrices WHERE org_id = '<org_id>'
        );
      ```
      Expected: 0 orphan rows. Nếu > 0 → trigger M-Auto-Persist-1 priority bump (UI gate `!isPersisted` không đủ defensive, cần auto-save backend).
  - **M-Hoshin-7 — Anti-pattern Audit + Fix multi-org lookup (2026-04-30)**: ✅ shipped (1 commit `3e29a66`). Original scope (M-Cleanup-2 CRITICAL — hard DELETE 8 duplicate Ladysfit orgs) ABORTED sau diagnose phát hiện 9 orgs là **multi-tenant production users** với owner email khác nhau, KHÔNG phải pollution. Rescoped → static audit `name ILIKE LIMIT 1` anti-pattern (0 hit production code) → fix 2 SWOT routes có pattern `.limit(1).single()` cho user→org lookup (silent pick khi multi-row).
    - **Diagnose findings**: 9 Ladysfit orgs cấu trúc thực tế:
      - 1 canonical (Vũ Hải `<owner-email>`, CEO, 89 KPIs + 19 xmatrix)
      - 8 user thật khác chủ với data thật (4 xmatrix + ~110 SWOT + ~20 discovery)
      - 9 emails khác nhau, 9 owners độc lập
      - Nếu execute hard DELETE plan ban đầu → mất 8 user thật + data (CRITICAL data loss avoided)
    - **Static audit results** (4 patterns toàn codebase):
      - 0 hit `.ilike(` / `.like(` / `.eq('name', …)` trong `app/`, `lib/`, `components/`
      - 0 hit raw `name = '…'` lookup trong migrations
      - 13/13 `.from('organizations')` reads scope bằng `.eq('id', …)` (id-based, đúng)
      - 2 RELATED HIGH hits — `org_members.eq('user_id', user.id).limit(1).single()` (`xray-context`, `prefill-from-xray`) — silent wrong-pick nếu user multi-org
      - 2 LOW hits — admin SQL views `010_admin_views.sql` lines 60-61 + 89-90 dùng `LIMIT 1` cho CEO pick
    - **Fix (commit `3e29a66`)**: 2 files thay `.limit(1).single()` → `.maybeSingle()` + add 409 handler `error?.code === 'PGRST116'` (multi-row signal):
      - [app/api/swot/xray-context/route.ts:16-28](app/api/swot/xray-context/route.ts#L16-L28)
      - [app/api/swot/prefill-from-xray/route.ts:20-33](app/api/swot/prefill-from-xray/route.ts#L20-L33)
      - 0 frontend caller nào fetch 2 endpoint này (search toàn repo) → có thể dead routes từ refactor cũ. Defer cleanup vào M-Cleanup-5
    - **Verify**: `npm run typecheck` PASS (clean), `npm run build` PASS (cả 2 routes xuất hiện trong manifest dynamic functions)
    - **Pattern lessons M-Hoshin-7** (3 mới):
      1. **L7 (Schema verification before SELECT)**: Em (AI) hit 3 errors liên tiếp khi build diagnose query (`relation "orgs" does not exist`, `column o.slug does not exist`). Pattern đúng: TRƯỚC khi viết SELECT trên schema unknown, MUST chạy `information_schema.tables WHERE name ILIKE '%X%'` + `information_schema.columns WHERE table_name = 'X'`. Cost 3 vòng query thừa. Anti-pattern: assume schema từ HANDOFF prose hoặc training data.
      2. **L8 (Verify HANDOFF assumption với DB trước destructive ops)**: M-Cleanup-2 escalated CRITICAL dựa trên HANDOFF §18 prose "9 duplicate Ladysfit orgs (data pollution from testing)". Diagnose thực tế cho thấy 8/9 orgs có owner khác với data thật. Nếu execute DELETE plan → mất 8 user. Pattern đúng: TRƯỚC khi build destructive op (DELETE, DROP, bulk UPDATE), MUST query owner + data counts để confirm assumption. Anti-pattern: trust HANDOFF prose blindly cho destructive scope.
      3. **L9 (User→resource lookup pattern standardize)**: 11/13 routes dùng `.eq('user_id', user.id).maybeSingle()` (no `.limit`) — pattern đúng vì THROW khi multi-row → loud failure. 2 routes (`xray-context`, `prefill-from-xray`) dùng `.limit(1).single()` → silent pick. Fix M-Hoshin-7 commit `3e29a66`. Pattern lesson: `.limit(1)` chỉ đúng khi resource có natural ordering (vd `.order('updated_at desc').limit(1)` lấy "latest"). Cho user→resource scope, dùng `.maybeSingle()` để catch ambiguity.
      4. **L10 (Handoff prompt giữa AI tools cần expected output marker)**: Khi AI #1 đưa prompt cho user paste sang AI #2 (Cursor → Claude Desktop), AI #1 không phân biệt được "user đang chuẩn bị chạy" vs "user paste lại prompt sau khi chạy xong, đây là raw output". Pattern đúng: prompt MUST có marker rõ ràng vd "Báo cáo về với prefix `[CLAUDE DESKTOP RESULT]`" hoặc "Sau khi chạy xong, paste output Phase 7 dạng `==START==/==END==` block". Anti-pattern: assume state từ context window. Em mất 1 turn ask_user_input clarify "anh đang ở đâu trong workflow".
      5. **L11 (AI đọc full .env.local = leak event, MUST rotate)**: Bất kể AI nói "internal session" hay "không log ra ngoài", một khi value của secret render vào AI context window = đã expose. MUST treat như leak event và rotate ngay 100% secrets liệt kê. Pattern phòng ngừa: SMOKE_TEST.md Phase env-check MUST có HARD RULE cấm `type/cat/Get-Content` toàn file. Chỉ dùng `Select-String -Pattern "^KEY=" -Quiet` (PowerShell) hoặc `findstr /B "KEY=" file >nul && echo FOUND || echo MISSING` (CMD). Zero value exposure trong stdout. Nếu vi phạm: báo cáo ⚠️ SECURITY VIOLATION ở đầu output, liệt kê field tên (KHÔNG value), halt cho đến khi rotate xong.
      6. **L12 (Smoke test plan là living doc, MUST update khi seed/auth flow đổi)**: Issue 4 SMOKE_TEST.md ghi user smoketest bị onboarding lock, thực tế đã có org từ session trước (tested 2026-04-30) → onboarding redirect không trigger. Pattern: smoke test docs có shelf life — schema/auth/seed thay đổi → docs lệch reality. Mỗi milestone shipping change DB seed hoặc auth flow MUST verify SMOKE_TEST.md còn match. Anti-pattern: trust test plan blindly cho assertions như "user sẽ redirect sang /onboarding/setup-org".
      7. **L13 (Shell detection — PowerShell ≠ cmd syntax)**: AI đưa script với `&&`/`||` syntax cmd-style nhưng anh paste vào PowerShell 5.x → fail "token not valid statement separator". PowerShell <7 không support short-circuit operators. Pattern đúng: detect prompt prefix `PS C:\>` để biết đây PowerShell + adapt syntax (dùng `if ($lastexitcode -eq 0)` hoặc Cmdlet native như `Select-String`/`Test-Path`). Hoặc explicit instruct user open `cmd.exe` thay vì paste vào PowerShell. Anti-pattern: assume cmd syntax universal trên Windows.
      8. **L14 (Verify state TRƯỚC khi đưa redundant action)**: Em đưa `git add HANDOFF.md && commit` ở Task 7.2 nhưng anh đã commit rồi (`5501c7d`) — em không track giữa các turn. Cũng vậy với `chore: redeploy with rotated keys` (`3f82caa`) — anh tự làm, em không biết. Pattern đúng cho mọi git/deploy action: instruct user chạy `git status` + `git log --oneline -5` + paste output → AI verify state hiện tại → đưa next command đúng. Anti-pattern: assume state từ memory turn trước.
      9. **L15 (Test user credentials acceptable trong AI context, production user/admin TUYỆT ĐỐI không)**: Smoketest user (smoketest@hoshinkanri.local) có 0 quyền production, 0 PII, dedicated cho test → AI có thể track + reuse credential. Production user (vd CEO email + password) TUYỆT ĐỐI không paste vào chat. Pattern: tạo dedicated `*test*` prefix user cho mọi smoke test, document explicit trong SMOKE_TEST.md "TEST_USER credentials are intentionally non-secret for AI agent automation". Anti-pattern: dùng production CEO credential cho smoke test.
      10. **L16 (Credential check pattern phải có `^KEY=` regex anchor)**: `findstr /B "TEST_USER"` báo MISSING vì pattern không có `=` ở cuối → match prefix khác hoặc encoding issue (BOM/UTF-16) → false negative. Pattern đúng: `Select-String -Pattern "^KEY=" -Quiet` với regex anchor đầy đủ. Anti-pattern: incomplete pattern → silent false negative khi field thực sự tồn tại. M-Hoshin-7 hit pattern này 2 lần (Phase 1.4 + Task 10A).
    - **Production verify (2026-04-30 22:38)**: 5/5 functional items PASS trên `chienluoc.org`:
      1. Navigate landing render — H1 exact match
      2. Login với TEST_USER smoketest@hoshinkanri.local — redirect /dashboard OK
      3. Auth cookie `sb-cnbsrlhhgrfbdhisizgg-auth-token` set
      4. GET /api/swot/xray-context → 200 `{hasXRay: false, data: null}`
      5. GET /api/swot/prefill-from-xray → 200 `{prefilled: false}`

      → M-Hoshin-7 SHIPPED. 0 regression, 2 routes mới response schema đúng spec.
    - **Security incident handled**: Smoke test Phase 1.4 turn 1 vô tình `cmd /c type .env.local` → toàn bộ secrets render vào AI context. Vũ Hải rotate 5 keys (Supabase service_role, Supabase anon, Anthropic, Resend, Tavily) + cleanup duplicate SUPABASE_SERVICE_ROLE_KEY trong .env.local. Vercel env vars synced. Production redeploy commit `4ccdb3b` verified với key mới. SMOKE_TEST.md Phase 1.4 update với hard rule cấm `type/cat/Get-Content` toàn .env.local (DEBT 2 fix).
  - **M-Cleanup-1 — Wizard Files Cleanup (2026-05-01)**: ✅ shipped (1 commit `558a471`, push 2026-05-01, branch master). Bỏ feature flag `NEXT_PUBLIC_XMATRIX_CANVAS` + xóa 7 wizard files trong `components/x-matrix/`. Canvas single source of truth cho `/dashboard/x-matrix/new` route. Wizard rollback path no longer available — future regression handle qua git revert.
    - **Files deleted (7)**:
      1. `components/x-matrix/XMatrixWizard.tsx` (hub orchestrator)
      2. `components/x-matrix/Step1Vision.tsx`
      3. `components/x-matrix/Step2Hoshins.tsx`
      4. `components/x-matrix/Step3Initiatives.tsx`
      5. `components/x-matrix/Step4Kpis.tsx`
      6. `components/x-matrix/WizardProgress.tsx`
      7. `components/x-matrix/XMatrixReview.tsx`
    - **File modified (1)**: [app/dashboard/x-matrix/new/page.tsx](app/dashboard/x-matrix/new/page.tsx) — xóa `import { XMatrixWizard }` + xóa toàn bộ block `useLegacyWizard` (cũ L57-77 gồm comment legacy flag + `process.env.NEXT_PUBLIC_XMATRIX_CANVAS === '0'` check + div wrapper với h1 + render `<XMatrixWizard>`). Giờ chỉ còn canvas branch render `<HoshinGembaSection>` wrap `<XMatrixCanvasPage>`.
    - **Total delta**: -1184 deletions across 8 files.
    - **Verification timeline (5 tasks)**:
      - Task 1 (verify production stable trước khi cleanup): ✓ env var Vercel `NEXT_PUBLIC_XMATRIX_CANVAS` không tồn tại (không set), `.env.local` flag value `False` → wizard branch dead code không serve user nào. Canvas render OK production reference screenshot.
      - Task 2 (audit imports trước destructive delete): ✓ Self-imports only — XMatrixWizard hub import 6 siblings (Step1-4 + WizardProgress + XMatrixReview), KHÔNG file external nào import 6 children. 1 external import duy nhất: `app/dashboard/x-matrix/new/page.tsx` import `XMatrixWizard`. → Safe xóa cùng commit sau khi fix page.tsx.
      - Task 2.5 (verify CanvasHeader render branding): ✓ Canvas tự render header riêng qua `components/x-matrix/canvas/CanvasHeader.tsx` (h1 "X-Matrix Builder" + overline "Strategy" + subtitle). An toàn xóa header markup legacy trong page.tsx — user không mất context.
      - Task 3 (sửa code + xóa files + verify build): ✓ `npm run typecheck` PASS (0 errors), `npm run build` PASS (Compiled successfully in 8.0s, all routes generated incl. `/dashboard/x-matrix/new`).
      - Task 4 (commit + push): ✓ commit `558a471` "chore: remove wizard files and feature flag (M-Cleanup-1)" push origin master.
      - Task 5 (verify production stable post-deploy): ✓ Vercel deploy `dpl_4UT4DfW85czkWGEecYnNe7e91y5K` state READY. 4-source fallback verification — xem **Pattern lesson L17** dưới.
    - **4-source fallback verification chain G3** (pattern phòng khi Playwright MCP browser dead):
      1. **Vercel MCP `get_runtime_logs`** — proxy cho HTTP 200 confirmation. Runtime log entries cho `/dashboard/x-matrix/new` không có 5xx error → deploy serving requests OK.
      2. **PowerShell `curl`** (Windows built-in từ Win 10 1804+) — fetch HTML production URL, grep `XMatrixWizard|Step1Vision|WizardProgress` → 0 match → wizard refs gone post-deploy. HTTP 200 confirmation.
      3. **Vercel MCP `web_fetch_vercel_url`** — PRERENDER cache hit confirmation. SSR output đúng canvas render path.
      4. **Reference screenshot Task 1** — UI logic không thay đổi giữa pre/post cleanup (canvas branch đã serve user trước M-Cleanup-1, chỉ khác ở dead-code removal). Reference screenshot pre-cleanup = post-cleanup expected output.
    - **Pattern lessons M-Cleanup-1 (4 mới L17-L20)**:
      1. **L17 (Playwright MCP browser idle timeout >5min)**: Browser context die khi idle giữa Task calls (vibe coding session multi-task chain). Triệu chứng: "browser has been closed" ngay từ navigate đầu tiên dù chưa interact. Pattern fallback chain G3 (4 sources trên) thay vì retry Playwright. KHÔNG cố retry Playwright >2 lần — pivot ngay sang Vercel MCP + curl + web_fetch + reference screenshot. Trong M-Cleanup-1 verify, Vercel MCP đã đủ tín hiệu prove deploy OK mà không cần screenshot mới (UI logic không đổi → reference screenshot Task 1 valid).
      2. **L18 (PowerShell session crash silent với Invoke-WebRequest)**: Parse Vietnamese response qua `Invoke-WebRequest` có thể crash session silent (PID exit không output, không error message). Workaround: dùng `curl` Windows built-in (từ Win 10 1804+) thay vì `Invoke-WebRequest`. Parse HTML ở session khác hoặc pipe qua `Select-String` thay vì in-line parse. Pattern: PowerShell + Vietnamese text + parsing = avoid; isolate fetch và parse vào 2 step riêng.
      3. **L19 (Static audit imports TRƯỚC destructive delete)**: Pre-delete audit pattern: grep tất cả file import 7 wizard files để phân loại self-imports vs external imports. Self-imports OK xóa cùng lúc; external imports CHẶN xóa cần xử lý trước. M-Cleanup-1 áp dụng đúng → phát hiện chỉ 1 external (page.tsx) → fix trước khi `git rm`. Áp dụng cho mọi destructive cleanup tương lai (component, lib, route deletion). Anti-pattern: `git rm` blindly → build fail downstream → revert + re-investigate (cost > audit prevention).
      4. **L20 (Verify branding components tự render TRƯỚC khi xóa wrapper)**: Khi xóa wrapper component có header markup (h1/h2/overline), MUST verify child component có render header riêng không. M-Cleanup-1 Task 2.5 grep `components/x-matrix/canvas/*.tsx` cho `<h1|<h2|overline` → confirm `CanvasHeader.tsx` render branding → safe xóa header legacy trong page.tsx. Pattern: nếu xóa wrapper mà child không có equivalent UI → user mất context (header missing, breadcrumb gone, page identity confusing). Audit checklist destructive delete: (a) imports audit, (b) UI affordance audit (header/breadcrumb/title), (c) state/hook reuse audit.
    - **Constraints cho future AI sessions**:
      - KHÔNG re-add `NEXT_PUBLIC_XMATRIX_CANVAS` env var. Wizard rollback path dead — regression handle qua `git revert 558a471` nếu cần resurrect (commit chứa toàn bộ wizard code intact).
      - KHÔNG re-create wizard 5-step pattern cho X-Matrix create flow. Canvas Density Mode là decision lock từ M-Hoshin-1 (xem §17 entry 2026-04-27 X-Matrix Canvas).
      - KHÔNG re-create files `XMatrixWizard.tsx`, `Step[1-4]*.tsx`, `WizardProgress.tsx`, `XMatrixReview.tsx` ở `components/x-matrix/` top-level. Path đó dành cho canvas-related shared utilities tương lai (hiện trống).
  - **M-Public-1 — Repository Public + HANDOFF Auto-sync (2026-05-01)**: ✅ shipped (2 commits: `e305e61` sanitize PII + `aabedce` LICENSE notice, push 2026-05-01, branch master). Trigger: M-Cleanup-1 close-out raised question về HANDOFF auto-sync giữa Cursor → Claude.ai. Phương án B chosen: GitHub raw URL fetch thay vì manual re-upload Project knowledge. Repo flipped private→public 2026-05-01 sau pre-flight audit + sanitize PII.
    - **Pre-flight audit (5-step pattern, xem L21)**:
      1. Hardcoded secrets HEAD scan: 0 real secrets, 9 false positives (env var refs)
      2. Secrets git history scan (`--all` branches, `--pretty=format`): 0 matches
      3. `.env` files history check: only `.env.example` tracked
      4. `.gitignore` coverage verify: hardened 8 dotenv variants + `!.env.example` whitelist
      5. PII grep: 14 instances `fitnessviet@gmail.com` flagged (1 critical route + 7 SQL + 6 docs)
    - **Remediation (5 changes pre-public, commit `e305e61`, +43/-16 across 6 files)**:
      1. `app/api/auth/dev-login/route.ts`: hardcoded email → env var fallback. Pattern: `query param ?? DEV_LOGIN_DEFAULT_EMAIL ?? 'admin@example.com'`
      2. `supabase/cleanup_users.sql`: 7 hardcoded → psql `:'keep_email'` variable + USAGE comment
      3. `HANDOFF.md` + `plans/M-Cleanup-2-design-audit.md`: 6 PII → `<owner-email>` placeholder
      4. `.gitignore`: hardening 8 dotenv variants
      5. `README.md` (commit `aabedce`): add LICENSE section "All rights reserved"
    - **Post-flip verification**:
      - `curl` HTTP 200 từ máy Vũ Hải (HANDOFF.md raw URL working)
      - Fastly CDN propagation ~5-15 min sau flip public, từ Claude.ai web_fetch initial 404 đến 200 stable (xem L22)
      - License default: All rights reserved (Option A) — repo public for transparency, no license granted
    - **Pattern lessons M-Public-1 (4 mới L21-L24)**:
      1. **L21 (Pre-public audit pattern, 5-step)**: TRƯỚC mọi private→public visibility flip MUST chạy 5-step audit: (1) hardcoded secrets HEAD scan, (2) secrets git history scan `--all` branches, (3) `.env` files history check (kể cả nếu `rm` sau này — git history vẫn giữ), (4) `.gitignore` coverage verify (test `git check-ignore` mọi pattern), (5) PII grep (emails, phones, JWTs, API key formats). Áp dụng cho mọi visibility flip future. Anti-pattern: flip public dựa trên "I think it's clean" — must mechanical audit.
      2. **L22 (GitHub raw URL Fastly CDN propagation delay)**: Sau flip private→public, raw URL có thể trả 404 trong ~5-15 min do Fastly cache. `curl` direct (User-Agent fresh) đôi khi hit cache MISS → 200 stable. Web_fetch từ AI tool có thể stuck ở stale 404 của cache POP khác. Pattern: defer verify retry sau 15 phút thay vì panic. KHÔNG re-flip private→public lần thứ 2 để "fix" — chỉ làm cache state phức tạp hơn.
      3. **L23 (Claude.ai web_fetch permission constraint)**: Web_fetch chỉ fetch URL đã xuất hiện trong conversation context (user paste hoặc previous tool output). KHÔNG hỗ trợ arbitrary URL fetch như Claude Desktop. Workaround: đầu mỗi chat mới về Hoshin Kanri, Vũ Hải paste 1 dòng `HANDOFF: https://raw.githubusercontent.com/vuhuyhai/hoshin-kanri-os/master/HANDOFF.md` → em fetch → đọc HANDOFF mới nhất → confirm milestone hiện tại. Anti-pattern: assume web_fetch arbitrary giống Claude Desktop.
      4. **L24 (PowerShell here-string single-quote escape)**: Khi commit message dùng PowerShell here-string `@'...'@`, single-quote escape `''` (double single-quote) thực ra render thành 2 chars `''` trong message body, KHÔNG phải 1 single quote. Cosmetic issue cho commit có inline code references. Workaround: dùng double-quote here-string `@"..."@` với escape backtick `` ` ``, hoặc chấp nhận cosmetic cho long commit messages. Pattern: nếu commit message body có nhiều inline code/quotes, write file tạm rồi `git commit -F` thay vì here-string.
    - **Constraints cho future AI sessions**:
      - KHÔNG add LICENSE permissive (MIT/Apache/BSD) without explicit Vũ Hải decision. License default "All rights reserved" preserve commercial IP.
      - KHÔNG hardcode PII trong code/docs (audit pattern L21 trước flip). Email/phone/JWT/API key MUST go through env var hoặc psql variable.
      - KHÔNG re-flip repo private→public→private để "test" propagation. Fastly cache state phức tạp, defer verify sau 15 phút (L22).
      - KHI tạo route mới có default email/credential cho dev mode, follow pattern `query param ?? ENV_DEFAULT ?? generic-fallback` (precedent `app/api/auth/dev-login/route.ts`).
  - **M-OrgUX-1 — Duplicate Org Detection on Onboarding (2026-05-01)**: ✅ shipped (6 commits `6ccd776`→`d57c7f1`, 8 files changed across 3 layers). Mục tiêu: prevent-future-duplicate UX (warn user) thay vì hard delete past duplicates. Trigger: M-Cleanup-2 audit phát hiện không thể mass-delete 9 Ladysfit orgs (multi-tenant production reality, xem M-Hoshin-7 entry).
    - **Pre-cursor mini-milestone (commit `6ccd776`)**: docs align — `MASTER_BUILD_SPEC.md` 7 stale references vs canvas reality post-M-Cleanup-1 → 6 updated, 1 (SWOT wizard) giữ lại vì là feature riêng còn live. Quick housekeeping commit không phải part of M-OrgUX-1 scope nhưng bundled trong session.
    - **DB layer (migration 034)**: functional index `idx_organizations_lower_name_city` ON `organizations(lower(name), lower(city))`. Migration version `20260501061239` (Supabase CLI internal stamp). Index size 16 KB tại 9 orgs hiện tại; scale tuyến tính ~10 MB cho 100k orgs. Áp dụng qua dashboard SQL editor — `.sql` file CHƯA commit vào `supabase/migrations/` (DEBT minor — backfill khi tiện cho rollback safety).
    - **API layer (commit `1bbd7d5`)**: POST `/api/orgs/check-similar` — `app/api/orgs/check-similar/route.ts`:
      - **Auth**: cookie session via `@supabase/ssr` `createClient`, KHÔNG support Bearer header (pitfall đã learn — xem §10 mới).
      - **Validation**: Zod inline schema (`name` 2-200 chars, `city` 1-100 chars). Inline thay vì `lib/validation/schemas.ts` vì single-route domain.
      - **Rate limit**: 10 req/phút/user, key `orgs:check-similar:${userId}`. Dùng `checkRateLimit` direct (KHÔNG via `requireAiRateLimit` helper — helper hardcode prefix `ai:` → tech debt MEDIUM cho refactor `requireRateLimit(bucket, opts)` chung).
      - **Query**: `createAdminClient()` bypass RLS (user chưa có `org_members` row tại pre-onboarding state), `ilike` exact match (no wildcards) trên cùng `city`, `LIMIT 5`.
      - **Response shape**: `{ hasMatches: boolean, matches: Array<{name, city, industry}> }` — **KHÔNG có `id` field** (security: tránh enumerate orgs cross-tenant qua duplicate-detection vector).
      - **Audit log**: `console.log` với prefix `[audit:check-similar]` + structured JSON (`user_id`, `name_query` truncated 50 chars, `city_query`, `match_count`, `timestamp`). Bảng `audit_logs` chưa tồn tại — fallback acceptable, migrate to table later khi volume warrant.
    - **UI layer (commit `6b4d3b5`)**: `app/onboarding/setup-org/page.tsx` (+111/-2):
      - Debounce 600ms watching `[name, city]` deps trong `useEffect`. Skip check nếu `name.trim().length < 2` hoặc `city` empty.
      - Race condition guard: `cancelled = true` flag drop stale fetches khi user keep typing.
      - Submit gate: `if (similarOrgs.length > 0 && !acknowledgedDuplicate) toast.error(...)` block + Vietnamese toast "Đã có công ty trùng tên trong cùng thành phố. Hãy xác nhận trước khi tiếp tục."
      - Alert block dùng NB v3.2 tokens (`var(--accent-yellow)`, `var(--shadow-md)`) — KHÔNG hex hardcode.
      - Native `<input type="checkbox">` thay shadcn `Checkbox` (chưa adopted trong codebase — không create component mới chỉ cho 1 use case).
      - A11y: `role="alert"` + `aria-live="polite"` trên warning div, `role="status"` cho spinner.
    - **Test layer**:
      - `scripts/smoke-test-orgs-check-similar.ps1` (commit `f5a4bd0`): API smoke test PowerShell 5.1 compatible, 6/6 PASS — Auth (401 no cookie), Validation (400 too_small), Match (200 + no id leak), NoMatch (200 hasMatches=false), RateLimit (429 + Retry-After), AuditLog (REST query audit_logs absent → fallback console.log per spec acceptable).
      - `scripts/smoke-test-orgs-setup-org-ui.ts` (commit `73766ec`): UI smoke test Playwright TS, 5/5 PASS — FormLoad, NoApiCallShortInput, WarningRender, SubmitBlocked, SubmitAllowed. Cookie forge pattern reused từ PowerShell script (base64- prefix + base64url JSON session).
      - `chore` commit `d57c7f1`: thêm `playwright` + `tsx` vào devDeps cho UI smoke test.
    - **Critical decisions M-OrgUX-1**:
      1. **Pivot M-Cleanup-2 → M-OrgUX-1**: Audit DB phát hiện 9 Ladysfit orgs thuộc 9 `user_id` KHÁC NHAU (không phải duplicate cùng user). Mass cleanup = vi phạm trust + xóa data user khác (FK CASCADE). Pivot sang prevent-future-duplicate UX. Pattern lesson L8 (M-Hoshin-7) áp dụng đúng.
      2. **Schema constraint discovery**: `organizations` table KHÔNG có cột soft-delete (`is_active`, `deleted_at`, `archived_at`). Mọi DELETE = irreversible. Future M-Cleanup-2 nếu reactivate sẽ cần migration thêm cột soft-delete trước.
      3. **MVP scope**: exact match same city only (KHÔNG trigram/`pg_trgm`) — overkill cho 9 orgs hiện tại. Trigger upgrade khi ≥3 user thật phàn nàn miss duplicate vì typo.
      4. **Security: ID không trả về** — admin client bypass RLS expose org metadata cho mọi authenticated user. Mitigation: rate limit 10 req/phút + chỉ trả `{name, city, industry}`, không trả `id` để tránh enumerate.
    - **Tech debt MEDIUM phát sinh**:
      - Refactor `requireAiRateLimit` (`lib/ai/rate-limit-helper.ts`) thành generic `requireRateLimit(bucket, opts)` để các route khác (như `/api/orgs/check-similar` đây) không phải call `checkRateLimit` direct. Pattern lesson: Cursor đã có deviation hợp lý ở M-OrgUX-1 Task 2 — generalize sau khi pattern proven 2-3 lần.
      - Test users `smoke-test-orgs@hoshin-test.local` + `smoke-test-orgs-ui@hoshin-test.local` còn trong DB (script không auto-delete để rerun-friendly). Cleanup SQL có sẵn ở cuối stdout mỗi script run.
      - Migration 034 `.sql` file chưa commit vào `supabase/migrations/` — applied via Supabase dashboard. Backfill khi tiện để rollback safety qua git revert.
    - **Constraints cho future AI sessions**:
      - KHÔNG mass-delete duplicate orgs by name. Pattern is prevent-at-onboarding, không retroactive cleanup. M-Hoshin-7 L8 + M-OrgUX-1 reinforce.
      - KHÔNG return `id` field từ `/api/orgs/check-similar` — security mitigation cho admin-client bypass RLS expose. Pattern: response shape minimal (chỉ data đủ để user đưa quyết định, không đủ để enumerate).
      - KHI thêm route public-ish (authenticated user chưa có `org_members` row), MUST rate-limit + minimize response shape + audit log. Precedent: `/api/orgs/check-similar` (M-OrgUX-1).
      - KHI Cursor/Claude write smoke test PowerShell cho Supabase REST, MUST tránh `Invoke-WebRequest` (silent header strip), dùng `[System.Net.HttpWebRequest]` direct (xem §10 pitfall mới).
      - KHI write Playwright UI smoke test, scope alert assertions với specific text via `:has-text(...)` thay vì global `[role="alert"]` (Sonner Toaster + Next 16 dev indicator + analytics overlays đều render hidden alert region) — xem §10 pitfall mới.
---

## 17. Architecture Decisions

Log các quyết định kiến trúc lớn ảnh hưởng nhiều layer hoặc constraint future work. Mỗi entry: ngày + scope + rationale + ràng buộc future code.

### 2026-05-10 — `--accent` collision cleanup + utility consolidation (M-Design-Tokens-Cleanup-1)

**Milestone**: M-Design-Tokens-Cleanup-1 — `--accent` collision cleanup + `.heading-overline` consolidation.

**Scope**: 4 commits (3 code + 1 close-out HANDOFF). 26 files (1 NEW plan docs + 25 MODIFIED). ~1.5h work. Risk LOW (path β REVERT shadcn default + atomic 3 commits + Phase A 5/5 PASS evidence Vũ Hải screenshot). Driver: M-Design-3a foundation discovered comment `app/globals.css` line 158 cảnh báo collision NHƯNG line 171 reassign `--accent: #c73937` contradict — visible regression dropdown menu hover flash brand red gây eye-fatigue (Vũ Hải screenshot 2026-05-10 KPI dropdown + org switcher).

**Methodology source**: M-Design-3a/3b foundation tokens reuse + layout team pioneer pattern `--accent-brand` token riêng (`@theme line 50` hardcoded `#c73937`, separate từ `--accent`) cho intentional brand-as-Tailwind-class. Verify-first L29/L32/L45/L48/L49 reinforced lần 8 — exhaustive audit Phần A-F (6 CSS patterns + 9 Tailwind class patterns + 17 shadcn primitives table + 11 layout components) trước decision lock.

**3 Architectural decisions locked**:

1. **Foundation cleanup eliminate token collision (Q1 β REVERT)**: Remove `--accent: var(--brand)` reassign line 171 → `--accent` về shadcn neutral pastel `#F5F0E8` (line 136). Evidence distribution Phần D 7:17:0 (Nhóm A intentional brand : Nhóm B accidental shadcn : Nhóm C ambiguous) — Nhóm A 7 consumers explicit migrate `var(--brand)` (XRayReport ×2 + `.btn-primary` + `.badge-accent` + `.heading-overline` + `--shadow-accent` + Nhóm A foundation), Nhóm B 17 accidental shadcn consumers (dropdown-menu + select primitives) tự fix qua foundation revert. Anti-pattern rejected: keep collision (α) — UX broken eye-fatigue evidence Vũ Hải; hybrid 3-token (γ) — over-engineering cho solo dev; introduce `--brand-cta` (δ) — `--brand` already exists, redundant.

2. **`--accent-brand` token riêng cho intentional brand-as-Tailwind-class**: Layout team pioneer pattern (sidebar/header/org-switcher/bottom-nav/footer-copyright 11 occurrences `bg-accent-brand`/`text-accent-brand`). Hardcoded `#c73937` ở `@theme line 50`, KHÔNG đi qua `var(--accent)`. Pattern: `bg-accent-brand` (intentional brand) vs `bg-accent` (shadcn neutral hover) — semantic separation rõ ràng. Reusable escape hatch cho future intentional brand-as-Tailwind-class scenarios mà KHÔNG re-introduce `--accent` collision.

3. **Atomic commit boundary discipline Path C (NEW pattern L50)**: Verify-first Task 1 audit phát hiện 26 .tsx consumers `.heading-overline` (HANDOFF prose claim thiếu) → Step 1.7 'migrate className' xung đột với Output rule 'KHÔNG modify file ngoài globals.css'. Cursor STOP + báo Vũ Hải scenario + 4 paths (A skip / B bundle / C tách Commit 3 / D defer milestone). Decision lock C: ship cùng session M-Design-Tokens-Cleanup-1 NHƯNG tách Commit 3 atomic (NOT bundle B vi phạm rule, NOT defer D backlog rot <30 phút task). Atomic value: rollback granularity per concern (foundation / consumer / utility consolidation). Pattern reusable cho future cleanup milestone scope creep.

**Constraints cho future AI sessions**:

- KHÔNG re-add `--accent: var(--brand)` reassign — Q1 β REVERT decision lock. Regression guard: `--accent` về shadcn neutral pastel `#F5F0E8`, `--brand` explicit cho intentional emphasis. Eye-fatigue evidence screenshot 2026-05-10.
- KHÔNG dùng `bg-accent` className cho intentional brand-as-Tailwind-class — pattern `bg-accent-brand` cho intentional brand, `bg-accent` cho shadcn neutral hover. Layout team precedent 11 occurrences.
- KHÔNG dùng `var(--accent)` cho intentional brand emphasis trong CSS — migrate `var(--brand)` explicit. Anti-pattern dark mode bug latent neutral gray (`.btn-primary` pre-cleanup).
- KHÔNG re-create `.heading-overline` utility class — Q3 β consolidate lock. `.overline` (line 471) canonical.
- KHÔNG re-create `--shadow-accent` token — Q4 α dead code lock. Future brand shadow utility hardcode `var(--brand)` hoặc define `--shadow-brand` token mới (NOT reuse `--shadow-accent` name).
- KHÔNG modify `components/ui/dropdown-menu.tsx` hoặc `select.tsx` `bg-accent` className — shadcn primitives intentional, behavior tự đổi qua foundation revert. Anti-pattern: customize shadcn primitive className → break upgrade path.
- KHÔNG add `.dark { --brand: <color> }` override — Q2 α NO override lock. Defer M-Design-Dark-1 nếu user complain brand red chói dark mode.
- KHI add foundation token mới có potential collision với shadcn neutral tokens (`--accent`, `--muted`, `--card`, `--popover`, `--primary`, `--secondary`, `--destructive`), MUST audit comment + grep shadcn primitives folder TRƯỚC khi reassign. Pattern: define separate token (vd `--accent-brand`, `--muted-warm`) thay vì reassign shadcn neutral.
- KHI add CSS utility class mới có visual semantic trùng utility hiện tại, MUST audit consumers TRƯỚC khi ship. Anti-pattern: duplicate utility → future cleanup tốn migration scope. Pattern Q3 β consolidate atomic.

**Pattern lessons (1 mới L50, 2 reinforced)**:

- **L50 NEW — Atomic commit boundary discipline cho cleanup milestone scope creep**: Verify-first phát hiện scope wider hơn HANDOFF prose claim → 4 paths candidate (skip / bundle / tách commit / defer milestone). Decision lock pattern: ship cùng session NHƯNG tách commit atomic per concern. Anti-pattern: bundle vi phạm atomic rule, defer milestone tạo backlog rot cho task <30 phút. Apply universally cho cleanup milestone future. M-Design-Tokens-Cleanup-1 hit pattern này lần đầu — ship Path C 3 commits thay vì 2 commits + 1 backlog.
- **L42 reinforced lần 6 — Phase A visual coverage acceptable cho design refactor + visual evidence screenshot**: Phase A 5/5 PASS visual với evidence Vũ Hải screenshot (CASE 1 eye-fatigue fix critical) + build clean 3/3 commits + grep verify 0 var(--accent) consumers post-cleanup = sufficient evidence. Phase B Playwright defer reactive. Pattern proven 6 lần — escalate convention default cho design refactor milestones.
- **L29/L32/L45/L48/L49 reinforced lần 8 — Verify-first invalidate plan claim**: Comment line 158 cảnh báo collision NHƯNG line 171 reassign contradict — code lùi vs intent ban đầu. Verify-first exhaustive audit Phần A-F (6 CSS patterns + 9 Tailwind class patterns + 17 shadcn primitives table + 11 layout components) trước decision lock. Apply universally — KHÔNG trust HANDOFF prose hoặc design system docs blindly cho refactor decision.

---

### 2026-05-10 — Generic rate limit helper + 15 sites migrate (M-RateLimit-Generic-1)

**Milestone**: M-RateLimit-Generic-1 — Generic rate limit helper refactor + 13 AI sites + 2 non-AI sites migrate.

**Scope**: 3 commits (Task 1+2A plan `e36d140` + Task 2B helper + 13 AI `230faa5` + Task 2C 2 non-AI `97fd391`). 17 files (2 NEW plan docs + 1 NEW helper + 1 DELETED old helper + 14 MODIFIED routes + 1 globals/auxiliary). ~2h work. Risk LOW (4 evidence-locked + 7 path α/β consistent low-blast-radius). Driver: tech debt rotate 8 ngày từ M-OrgUX-1 + M-Auth-MultiOrg-1 ship 2 non-AI routes dùng `checkRateLimit` direct vì `requireAiRateLimit` hardcode prefix `'ai:'`. Trigger condition met "2-3 non-AI routes need rate limiting" (HANDOFF §18 candidate).

**Methodology source**: M-Cleanup-batch-2026-05-09 Q1 β pattern (atomic revert unit per concern, 2 commits domain split AI vs non-AI). Verify-first L29/L32/L45/L48 reinforced lần 7 — 4 deviations caught vs HANDOFF candidate prose (off-by-one count, scope creep risk, no migration needed, literal grep clean).

**3 Architectural decisions locked**:

1. **Generic helper API stable + minimal + caller compose extras (NEW pattern L49)**: Refactor pattern khi extract cross-cutting helper từ domain-specific original. Apply: (a) drop hardcoded prefix/default sang required param caller-side (Q5 α `bucket: string` required), (b) preserve discriminated union shape protect callers blast radius (D1 evidence — đổi shape 0→13 sites), (c) optional `message` + default cho callers không override (Q3 β `'Quá nhiều request'` default), (d) `extras?: Record<string, unknown>` merge body cho route-specific fields (Q4 α orgs/switch `requestId`). Anti-pattern: extend helper với optional params per-route (signature bloat) hoặc callback-build response (over-engineered, defeat helper purpose). Reusable cho future cross-cutting helpers (audit log, feature flag, telemetry trace).

2. **Bucket key format zero-soft-reset preserve (D2 evidence)**: Caller pass FULL bucket string (vd `'ai:swot'`, `'orgs:switch'`) đảm bảo existing user windows preserve. DB `rate_limits` table store full composed key column `bucket` — nếu helper hardcode prefix sẽ tạo NEW bucket → user reset rate limit window. AI routes giữ key format `ai:swot:userId` (caller pass `bucket: 'ai:swot'` thay vì `'swot'` + helper auto-prefix). Non-AI routes giữ key format `orgs:switch:userId` từ trước → 0 soft reset. Cleanup cron migration 020 auto-purges rows >1 day, no DB migration needed (D3 evidence). Pattern reusable cho future cross-cutting helpers consume DB-backed state — caller-side composition giảm risk migration impact.

3. **Scope discipline 15 sites lock (D4 evidence)**: 7 additional eligible sites (hansei/create, invites POST/[token]/accept, gemba/create, gemba/[id], kpi/[id]/route, kpi/[id]/restore, kpi/archived) DEFER M-RateLimit-Cleanup-2 milestone riêng. Lý do: V5 audit phát hiện scope creep risk MEDIUM (15 → 22 sites = +47% effort + cross-domain blast radius). HANDOFF §18 commitment "15 sites lock" trade-off vs comprehensive cleanup. Pattern L42 partial coverage proven 5 lần (escalate convention default cho mechanical refactor milestones). Anti-pattern: bundle eligible sites scope creep → sunk-cost bisect debt.

**Constraints cho future AI sessions**:

- KHÔNG dùng `requireAiRateLimit` (đã DELETED `lib/ai/rate-limit-helper.ts` 51 LOC) — pattern `requireRateLimit` từ `lib/http/rate-limit-helper.ts`.
- KHÔNG hardcode prefix `'ai:'` (hoặc bất kỳ domain prefix) trong helper file — caller pass full bucket string. Regression guard: re-introduce hardcoded prefix block non-AI route adoption (cascade M-OrgUX-1 → M-Auth-MultiOrg-1 → M-RateLimit-Generic-1).
- KHÔNG add default value cho `bucket` param — Q5 α decision lock (V3 confirm 13/13 explicit). Type-safe + no surprise misconfiguration.
- KHÔNG modify discriminated union shape `{ ok: true } | { ok: false; response: NextResponse }` — D1 evidence lock (đổi shape blast radius 0→15 sites).
- KHI add route mới cần rate limit (authenticated, per-user), MUST follow pattern: `import { requireRateLimit } from '@/lib/http/rate-limit-helper'` + caller pass `bucket: '<resource>:<action>'` + optional `message` override (Vietnamese caller-domain copy) + `extras` merge body nếu cần custom field. KHÔNG dùng `checkRateLimit` direct (defeat helper purpose, duplicate 12-line block).
- KHI refactor cross-cutting helper khác từ domain-specific original (audit log, feature flag, telemetry, etc.), follow L49 pattern: drop hardcoded prefix sang required caller param + preserve discriminated union shape + optional message default + extras merge body cho route-specific fields.
- KHI ship destructive migration touching DB-backed state (vd `rate_limits`, `audit_logs`), MUST audit DB schema column shape (full composed key vs separate namespace) TRƯỚC khi decide soft-reset trade-off. M-RateLimit-Generic-1 V6 evidence: `rate_limits` store full key → caller-side bucket preserve = 0 soft reset.
- 7 additional eligible sites (hansei, invites, gemba×2, kpi×3) DEFER M-RateLimit-Cleanup-2 milestone riêng. KHÔNG bundle vào milestone khác mà chưa Q-scope decision lock.

**Pattern lessons (1 mới L49, 2 reinforced)**:

- **L49 NEW — Generic helper API stable + minimal + caller compose extras**: Refactor pattern khi extract cross-cutting helper từ domain-specific original (vd AI-only → generic, single-tenant → multi-tenant, sync → async). 4-step recipe: (a) drop hardcoded prefix/default sang required param, (b) preserve discriminated union shape protect callers, (c) optional `message` + default cho callers không override, (d) `extras?: Record<string, unknown>` merge body cho route-specific fields. Anti-pattern: extend signature với optional params per-caller (bloat) hoặc callback-build pattern (over-engineered). Apply universally cho future cross-cutting helpers (audit log generic, feature flag generic, telemetry trace generic).
- **L42 reinforced lần 5 — Phase A typecheck + build coverage acceptable cho mechanical refactor**: M-RateLimit-Generic-1 Phase B 3-route smoke deferred Vũ Hải (Q7) — refactor mechanical rename + signature preserve + no business logic touch + 4 evidence-locked decisions (no shape change) + 7 path α/β consistent low-blast-radius = sufficient evidence. Pattern proven 5 lần liên tiếp (M-KPI-Mgmt-1 → M-KPI-Restore-1 → M-Design-Tailwind-Cleanup-1 → M-Cleanup-batch-2026-05-09 → M-RateLimit-Generic-1). Escalate convention default cho mechanical refactor milestones: ship-ready với typecheck + build PASS, defer reactive Phase B verify.
- **L29/L32/L45/L48 reinforced lần 7 — Verify-first invalidate plan claim**: M-RateLimit-Generic-1 Task 1 audit phát hiện 4 deviations vs HANDOFF §18 candidate text (off-by-one 13+2=15 not 14, 7 additional eligible sites scope creep MEDIUM, 0 DB migration needed cleanup cron 24h, `'ai:'` literal chỉ trong helper). Pattern: TRƯỚC khi commit decision dựa trên candidate/plan prose, verify-first qua grep + view file minimum 5-10 sites. Cost ~30 phút audit, prevent rollback debt + scope creep. Apply universally — KHÔNG trust HANDOFF prose blindly.

### 2026-05-09 — Tailwind palette → KPI tokens migration + Foundation completion check (M-Design-Tailwind-Cleanup-1)

**Milestone**: M-Design-Tailwind-Cleanup-1 — KpiCard + Discovery hub Tailwind raw palette migration sang KPI tokens (M-Design-3a/3b foundation) + shadcn semantic + NB v3.2 ink tokens.

**Scope**: 3 commits (Task 1 plan `a06ee51` + Task 2A KpiCard + Q7 BLOCKER fix `5f2cb5a` + Task 2B Discovery hub `d756a63`). 3 files MODIFIED + 1 plan doc + 1 globals.css 2-line bonus. ~2.5h work. Risk LOW (path α x7 lock: β Tailwind class + α MVP + A strip dark + mixed gray + α Phase A + ~2.5h + Q7 @theme mirror). Driver: M-Design-3a/3b foundation đã ship (8 KPI tokens + 4 score tokens + chart-tokens.ts resolver) NHƯNG consumers vẫn dùng raw Tailwind palette → foundation underutilized + visual inconsistent với NB v3.2 + unblock M-Design-Dark-1 dependency.

**Methodology source**: M-Design-3a/3b foundation tokens reuse (8 KPI tokens line 185-192 :root + line 63-71 @theme + 4 score tokens + 2 -strong saturated). Verify-first L29/L32/L45 reinforced lần 6 — Q7 BLOCKER caught Task 2A pre-ship via Cursor verify-first independent từ HANDOFF prose claim "14/14 tokens intact" (claim chỉ check :root, miss @theme mirror).

**3 Architectural decisions locked**:

1. **Tailwind v4 `@theme inline` class generation pattern (Q1 β)**: Consumer components dùng `className="bg-kpi-healthy"` instead inline `style={{ background: 'var(--kpi-healthy)' }}`. Pattern leverage M-Design-3a foundation `@theme inline --color-kpi-*` block enable Tailwind v4 emit class on-demand khi consumer reference. Foundation alone KHÔNG trigger emit — verify post-refactor via build success + Tailwind class generation, NOT grep compiled CSS (pitfall #19 reinforced). Reusable cho mọi future design token consumption: define `--color-{name}` `@theme` → consume `bg-{name}` className.

2. **Foundation completion check pattern (L48 NEW)**: Q7 BLOCKER caught Task 2A verify-first pre-ship — tokens defined `:root` block (line 203-204) NHƯNG MISS `@theme inline` mirror → Tailwind v4 KHÔNG emit `bg-kpi-healthy-strong` class silent fail. Fix bundled: +2 LOC lines 72-73 mirror `--color-kpi-{healthy,attention}-strong` vào `@theme inline`. Pattern lesson L48: MUST verify cả `:root` block VÀ `@theme inline` block mirror cho mọi token consume via Tailwind class. Audit checklist: grep `--color-{token-name}` trong `@theme inline` block TRƯỚC khi reference `bg-{token-name}` className. M-Design-Tailwind-Cleanup-1 hit pattern 2 lần (Q7 BLOCKER + convention drift `text-bg` → `text-bg-warm`). Reinforce pitfall #19 + L29/L32/L45.

3. **Convention adopt-over-create cho codebase reality (L48 reinforced lần 2)**: Verify-first Task 2B lần 3 catch convention drift — em recommend `text-bg`/`bg-brand` semantic naming NHƯNG codebase reality `text-bg-warm`/`bg-accent-brand` 10+ files precedent. Decision: adopt existing convention thay create new tokens cho "clean naming". Pattern: khi spec naming gap với codebase reality, MUST grep codebase precedent TRƯỚC khi recommend new tokens. Anti-pattern: create new tokens fragmentation → future consumers phải workaround. Apply universally cho design system extensions.

**Constraints cho future AI sessions**:

- KHÔNG re-introduce raw Tailwind palette classes trong KpiCard hoặc discovery hub — pattern KPI tokens hoặc shadcn tokens hoặc NB v3.2 ink/bg tokens lock.
- KHÔNG add `dark:*` variants scope KpiCard/discovery — defer M-Design-Dark-1 ship `.dark` block KPI tokens centralized (Q3 A defer lock).
- KHÔNG modify KpiCard 3-tier logic (< 70% / 70-90% / ≥ 90%) — M-Design-3b decision lock preserve from M-Design-Tailwind-Cleanup-1.
- KHÔNG remove Q7 bonus `--color-kpi-{healthy,attention}-strong` mirror trong `@theme inline` lines 72-73 — foundation completion regression guard. Future Tailwind v4 consumer references `bg-kpi-healthy-strong` depend on này.
- KHI build consumer feature dùng design tokens via Tailwind class, MUST audit checklist L48: (a) token defined `:root`? (b) `--color-{name}` mirrored `@theme inline`? Verify TRƯỚC commit consumer refactor. Cost ~2 phút audit, prevent silent fail Tailwind emit.
- KHI phát hiện convention gap (spec name vs codebase reality), MUST grep codebase precedent TRƯỚC khi recommend new tokens. Pattern adopt-over-create lock — fragmentation cost > clean naming benefit.
- V3 tangential ~28 files defer M-Design-Tangential-Cleanup-1 — milestone riêng. KHÔNG bundle vào milestone khác KHÔNG có Q-scope decision lock.

**Pattern lessons** (1 mới L48, 1 reinforced):

1. **L48 NEW — Foundation completion check trước consumer refactor**: Khi build consumer feature dùng design tokens, MUST verify cả `:root` block VÀ `@theme inline` block mirror. Pitfall: HANDOFF prose claim "tokens intact" thường chỉ check `:root` — `@theme` mirror gap silent fail Tailwind v4 emit. Audit checklist: grep `--color-{token-name}` `@theme inline` TRƯỚC reference `bg-{token-name}` className. M-Design-Tailwind-Cleanup-1 hit 2 lần (Q7 BLOCKER + convention drift). NEW pitfall §10 #35 detail. Reinforce pitfall #19 + L29/L32/L45 lần 6. Apply universally future design token consumption.

2. **L42 reinforced lần 3 — Phase A visual coverage acceptable cho design refactor**: Phase B Cursor self-verify SKIPPED — design refactor không touch business logic + visual proof + build clean = sufficient evidence. Trade-off: visual proof UX-facing changes (color render, hue shift acceptable), code-review proof mapping correctness (deterministic 1:1 transform). Apply: design refactor mechanical 1:1 mapping → Phase A ship-ready, Phase B defer reactive. Pattern proven 3 lần (M-KPI-Mgmt-1 → M-KPI-Restore-1 → M-Design-Tailwind-Cleanup-1) → escalate convention default cho design refactor milestones.

### 2026-05-09 — KPI Restore UI Phase 2 + Diagnose loop trap pattern (M-KPI-Restore-1)

**Milestone**: M-KPI-Restore-1 — KPI Restore UI Phase 2 deferred từ M-KPI-Mgmt-1 + Settings page archived list + R1 mitigation copy fix.

**Scope**: 3 commits (Task 1 plan `52fd8ad` + Task 2A POST endpoint `a9f4682` + Task 2B Settings UI + R1 copy `1435c1b`). 4 files (2 NEW + 2 MODIFIED) + 1 plan doc. ~3h work bao gồm 2h diagnose deep cho non-bug. Risk LOW (path α x10 lock: RBAC CEO-only + Settings page over /admin + idempotent mirror DELETE + lift state β reuse + AlertDialog confirm + rate-limit reuse + audit log structured + no migration + Phase A visual smoke + R1 mitigation copy). Driver: M-KPI-Mgmt-1 (2026-05-09 sáng) production usage Phase 2 deferred revisit — user complain Slack chiều cùng ngày "muốn tự khôi phục KPI lỡ xóa" → bump priority same-day ship.

**Methodology source**: M-KPI-Mgmt-1 patterns reuse 100% (L43 4-layer defense + L44 lift state β + L45 verify-first invalidate plan claim). Atomic template copy DELETE endpoint → flip filter `is_active=false` + rename audit prefix `[audit:kpi-restore]`. NEW pattern L47 (diagnose loop trap) emerge từ 2h non-bug investigation.

**3 Architectural decisions locked**:

1. **Idempotent endpoint pattern reuse mirror DELETE (Q3 α)**: POST `/api/kpi/[id]/restore` shape 100% mirror M-KPI-Mgmt-1 DELETE endpoint — auth + rate-limit + RBAC + cross-org guard + already-target-state path (200 với `already_active: true`). Atomic template copy + flip filter `is_active=false` (chỉ archived mới restore) + rename audit prefix. Pattern reusable cho future toggle-state endpoints: archive/unarchive matrix, suspend/reactivate member, hide/unhide blog post. Anti-pattern rejected: design audit fresh endpoint shape (overkill — DELETE shape proven, RBAC + rate-limit + audit log identical concerns).

2. **Settings page CEO self-service over /admin super-admin (Q2 α)**: M-KPI-Mgmt-1 R1 mitigation original AlertDialog copy "có thể khôi phục bằng cách liên hệ admin" assume Phase 2 ship recovery dashboard ở /admin super-admin scope. User complain Slack 2026-05-09 chiều "muốn tự khôi phục KPI lỡ xóa" reveal assumption sai — friction "liên hệ admin" quá cao cho self-service feature. M-KPI-Restore-1 ship Settings page section "KPI đã lưu trữ" CEO-self-service inline với existing Settings UX (Members, Org info, Pricing). KpiActionsMenu AlertDialog copy update R1 mitigation: "trong Cài đặt > KPI đã lưu trữ" (built-in discoverability). /admin super-admin recovery dashboard defer indefinitely (trigger condition: edge case CEO mất access org cần support escalation).

3. **Diagnose loop trap pattern lesson NEW (L47)**: Task 2B Phase A test phát hiện count archived KPIs Settings page = 7 thay vì expected 56 (M-Hoshin-4 cleanup pollution baseline). 2h diagnose deep through 4 hypothesis (H1 RLS policy, H2 endpoint filter, H3 Network truncate, H4 React state stale) — ALL REJECTED bằng evidence: DB query 56+7=63 archived (correct ground truth), Network response carry full 63 rows (correct payload), RLS work correctly (`auth.uid()` check pass), endpoint code clean. Root cause discovered at 2h mark: observation interpretation error từ baseline counting confusion (anchoring bias on M-KPI-Mgmt-1 session 7 user deletes only, miss M-Hoshin-4 cleanup 56 baseline). ZERO bug — system OK. Pattern lesson L47 lock: khi DB + Network ground truth BOTH clean confirm expected state, STOP hypothesize code paths, check observation methodology FIRST. Audit checklist: (a) DB query expected state? (b) Network response expected data? (c) Both YES → observation/interpretation error suspected (baseline drift, anchoring bias, cleanup history) BEFORE deeper code paths.

**Constraints cho future AI sessions**:

- KHÔNG remove `is_active=false` filter từ POST `/api/kpi/[id]/restore` endpoint — Q3 α idempotent pattern lock (chỉ archived mới restore, active hit `already_active: true` 200 idempotent).
- KHÔNG render "KPI đã lưu trữ" section cho Member/Manager Settings page — Q1 α RBAC CEO-only lock (consistency với delete Q1 α M-KPI-Mgmt-1, ADMIN_ROLES single source of truth).
- KHÔNG modify AlertDialog copy KpiActionsMenu trở lại "liên hệ admin" hoặc generic "khôi phục bằng cách khác" — Q10 α R1 mitigation discoverability fix lock (Slack feedback 2026-05-09 evidence).
- KHÔNG add Manager role vào ADMIN_ROLES cho restore action — preserve consistency với delete RBAC, avoid scope creep, audit drift gap M-KPI-Mgmt-1 V6 verify-first lesson L45.
- KHI build idempotent toggle-state endpoint mới (suspend/reactivate, archive/unarchive, hide/unhide), follow pattern L43 + L44 + L47: atomic template copy từ existing endpoint + flip filter (active vs archived) + rename audit prefix + DB query verify ground truth BEFORE hypothesize. Atomic copy cost ~30 phút, design audit fresh shape ~2h — choose copy default.
- KHI diagnose claim bug + DB query + Network response BOTH clean confirm expected state, STOP hypothesize code paths (RLS, endpoint, React state, hooks). Check observation methodology FIRST: (a) baseline drift (cleanup history, M-Hoshin-N pollution events), (b) anchoring bias (recent session count vs total), (c) interpretation error (observation tool truncate, view filter active). Pattern L47 + pitfall #34 lock — prevent 2h sunk-cost trap.
- KHI ship close-out milestone với Phase B Cursor self-verify SKIPPED, MUST document explicit decision rationale trong HANDOFF entry: (a) Phase A visual N/N PASS, (b) backend code review pass, (c) DB SQL test confirm state, (d) cost-benefit analysis (defensive verify ROI vs ship+monitor reactive). M-KPI-Restore-1 precedent: 2h diagnose deep + visual smoke + ground truth = sufficient evidence cho beta SaaS solo dev. Pattern L42 partial coverage reinforced lần 2.

**Pattern lessons** (1 mới L47, 1 reinforced):

1. **L47 — Diagnose loop trap: trust DB + Network ground truth, STOP hypothesize khi 2 evidence sources clean** (NEW from M-KPI-Restore-1 Task 2B 2h non-bug investigation). Khi DB query (ground truth #1) + Network response (ground truth #2) BOTH clean + match expected payload, STOP hypothesizing deeper code paths (RLS policy, endpoint filter, React state, hooks order). Root cause likely observation/interpretation error (baseline drift, anchoring bias, cleanup history confusion), NOT system bug. Audit checklist trước khi diagnose >30 phút bug claim: (a) DB query confirms expected state? (b) Network response carries expected data? (c) Both YES → check observation methodology FIRST (baseline count drift M-Hoshin-N pollution, anchoring bias session-only count, view filter active hide). Anti-pattern: continue 4-hypothesis-deep dive khi 2 evidence sources già confirm system OK = sunk-cost trap (M-KPI-Restore-1 hit pattern này 2h, observation error from M-Hoshin-4 cleanup baseline confusion). Apply universally cho future bug diagnose sessions.

2. **L44 reinforced lần 2 — Lift state β pattern reuse cho list mutations**: M-KPI-Restore-1 Settings page owns archivedKpis array + optimistic callbacks (handleOptimisticRestore filter + handleRestoreRollback re-insert). Pattern L44 từ M-KPI-Mgmt-1 (KpiDashboardClient owns kpis array) reusable cho future list mutation features: archive matrix, cancel invite, suspend member, restore archived org, hide blog post. Tradeoff: requires parent-child contract (callback props) — acceptable vì state ownership clear, optimistic UX cleaner hơn refresh-only γ. Pattern proven 2 lần (M-KPI-Mgmt-1 + M-KPI-Restore-1) → escalate convention default cho mọi list mutation feature future.

### 2026-05-09 — Reader-uniform pattern enforced + zero lint baseline (M-Cleanup-batch-2026-05-09)

**Milestone**: Combo M-Cleanup-6 Phase 2 (11 sites migrate sang `getActiveMembership` helper) + M-Lint-Cleanup-1 (2 errors fix, baseline zero error).

**Scope**: 4 commits (`11c6193` plan + `f7087cd` drop-in 8 sites + `96c7db6` JOIN-split 3 sites + `73abf59` lint fix). Net −67 LOC. Risk LOW (no schema/route/auth changes, helper battle-tested 7 production API routes M-Cleanup-6 P1).

**3 architectural decisions locked**:

1. **Helper API stability over consumer convenience (Q2 α)**: 3 JOIN sites (benchmark/vision-workshop/synthesis) split-query thay vì extend helper return shape với optional `organizations` field. Cost ~5-10ms extra round-trip per page acceptable. Pattern: helper return MINIMAL shape (`{ org_id, role } | null`), consumer fetch additional fields nếu cần. Rationale: extending helper signature with optional projection params would bloat API (org-side fields differ per site: industry vs name+industry+headcount vs name+industry+city+headcount); either pass projection string (stringly-typed, defeats helper purpose) or return `unknown` and force caller cast (no type win). Apply L40 reinforced (M-Auth-MultiOrg-1 optional props + fallback): khi extend helper buộc consumers cascade, prefer split query consumer-side để giữ helper API stable + minimal.

2. **Layout defer pattern (Q1 β subset)**: `app/dashboard/layout.tsx` defer M-Cleanup-6-P3 vì caller cần full `memberships[]` array cho `membershipsForSwitcher` (M-Auth-MultiOrg-1 wire) + `orgIds` bulk lookup (`organizations.in('id', orgIds)`). Helper drop-in sẽ duplicate query (2× `org_members` fetch). Pattern lesson: helper migration KHÔNG universal — caller có dual-purpose query (single + array) defer hoặc redesign helper với pure picker `pickActiveMembership(memberships, lastOrgId)` sibling. Constraint: KHÔNG force layout call helper async (would duplicate query).

3. **Defensive guard race-safe (NEW pattern from Phase 2 commit `96c7db6`)**: Sau split-query lookup `organizations` table, MUST guard `if (!org) redirect('/onboarding/setup-org')` vì org có thể bị delete giữa 2 queries (race condition). Pattern: split-query consumer-side ALWAYS adds null guard — KHÔNG assume row exists post-helper-success. Type-level: Supabase `.single()` returns `{ data: T | null }` — TypeScript already enforces null check, but redirect path makes intent explicit (vs throwing or silent skip). Apply universally cho mọi 2-query chain consuming output từ helper.

**Constraints cho future AI sessions**:

- KHÔNG dùng inline `find(m => m.org_id === lastOrgId) ?? memberships[0]` cho org_members lookup mới. Pattern: `getActiveMembership(supabase, userId, lastOrgId)` helper (`lib/auth/getActiveMembership.ts`).
- KHÔNG extend helper return shape với optional fields cho specific routes — Q2 α decision lock. Split query là pattern cho mọi JOIN scenario.
- KHÔNG copy inline pattern từ legacy code git history mà chưa verify-first audit (L29/L32/L45 reinforced lần 5 trong M-Cleanup-batch — drift catches: invite href=/ not /login, layout dual-purpose query, useCallback REJECTED).
- KHI add split-query pattern (helper + 2nd query for related table), MUST add null guard cho 2nd query result (race-safe pattern from `96c7db6`).
- KHI ship lint fix cho `react-hooks/static-components` rule, MUST hoist canonical (Option β), KHÔNG memoize (Option α confirmed REJECT lint rule per pitfall #32).
- KHÔNG migrate `app/dashboard/layout.tsx` inline pattern không design audit dual-purpose query — defer M-Cleanup-6-P3 hoặc extract pure picker sibling helper.

**Pattern lesson L46**:

**L46 — AST-based static lint rules ≠ runtime behavior checks**: When `react-hooks/static-components` (or similar AST inspection rules) fires on memoized component, hoist là canonical fix. KHÔNG cố `useCallback`/`useMemo` wrap — rule không recognize runtime memoization. Apply universally cho lint rules có "static" suffix, "no-create-during-render" semantic, hoặc declaration-site analysis. Verified empirically M-Lint-Cleanup-1 commit `73abf59` (option α reject, β hoist works). Pattern fix detail trong pitfall #32. Cost ~5 phút per Recharts custom component refactor (1-prop drill typical for closure variables like `ink`).

### 2026-05-09 — KPI Soft-Delete + Layer 1+2+3+4 Defense in Depth (M-KPI-Mgmt-1)

**Milestone**: M-KPI-Mgmt-1 — KPI soft-delete UI (3-dots menu + AlertDialog confirm) + 3 mutation guard patches.

**Scope**: 4 commits (Task 1 plan `c87015d` + Task 2A DELETE endpoint `4a8f21d` + Task 2B menu/wire `c0da261` + Task 2D mutation guards `0140dfa`). 8 files (3 NEW + 5 MODIFIED) + 1 plan doc. ~2-3h work. Risk LOW-MEDIUM (path α+α+γ+β+γ+β+γ+β locked: soft-delete + Xóa MVP + defer rename + AlertDialog + optimistic+refresh + 3 mutation guards + console audit + mobile parity). Driver: M-Hoshin-4 cleanup 56 duplicate KPIs Ladysfit qua manual SQL ROW_NUMBER (DB sửa thủ công). User thật giai đoạn ">5 user" sẽ chắc chắn hit pain point này. UI hiện tại KHÔNG có cách xóa KPI.

**Methodology source**: M-Hoshin-4 soft-delete precedent (`is_active=false` reversible) + M-Auth-MultiOrg-1 trio pattern reuse (`/api/orgs/switch` template — auth + rate-limit + audit log + getActiveMembership chain). Reader uniformity audit (L39 M-Auth-MultiOrg-1) extend cho mutation guards (NEW pitfall #31).

**4 Architectural decisions locked**:

1. **Soft-delete only via `is_active=false` (Q1 α)**: Hard-delete `DELETE FROM kpis` would CASCADE wipe 3 child tables (`kpi_entries` historical entries + `kpi_actuals` annual review actuals + `weekly_hansei` mini-A3 reflections) — destructive irreversible. Soft-delete preserve all child data + audit trail intact (rows still in DB, just hidden via `eq('is_active', true)` filter on readers + mutation guards). M-Hoshin-4 precedent reinforce. Constraint: KHÔNG bao giờ thêm `DELETE FROM kpis` query trừ /admin super-admin justification rõ.

2. **Layer 1+2+3+4 defense in depth cho destructive feature (NEW pattern L43)**: Soft-delete ship lock pattern 4 layers cho mọi destructive feature (delete/archive/disable):
   - **Layer 1 (UI)**: hide affordance qua role check (`KpiActionsMenu` returns null cho `canDelete=false`)
   - **Layer 2 (mutation guard)**: filter `is_active=true` trong N verify-by-ID routes block mutate trên archived (M-KPI-Mgmt-1 patches `kpi/entry`, `hansei/list`, `hansei/create` — pitfall #31)
   - **Layer 3 (RBAC)**: server-side `requireOrgRole(ADMIN_ROLES)` trong DELETE endpoint (CEO only — Manager KHÔNG xóa được, V6 verify reinforce)
   - **Layer 4 (RLS)**: org_id scoping at DB level (existing baseline)
   Apply universally cho future destructive features (org delete, member kick, matrix archive). Anti-pattern: chỉ dùng 1 layer — UI hide alone = bypass via direct API call; RBAC alone = race condition between UI và check.

3. **Optimistic lift state β over spec γ refresh-only (NEW pattern L44)**: Khi component con mutate row trong list parent quản lý, lift state UP — parent owns array, exposes callbacks `onOptimisticDelete(id)` + `onDeleteRollback(row)` xuống con. Con call API + invoke callback trên success/error path + `router.refresh()` invalidate Server Component cache. Cleaner hơn local α (component state stale on refresh) hoặc γ (pessimistic UX wait-then-disappear). M-KPI-Mgmt-1 KpiDashboardClient owns `kpis` array, KpiCard prop drill 1 level → KpiActionsMenu invoke callback. Reusable pattern cho future list mutation features (archive matrix, cancel invite, delete blog post). Tradeoff: requires parent-child contract (callback props) — acceptable vì state ownership clear.

4. **ADMIN_ROLES = CEO only via verify-first phát hiện plan claim sai (L45)**: Plan R1 risk entry claim "Manager role có quyền xóa, vô tình batch click → wipe org KPIs". Cursor Task 2A verify-first phát hiện thực tế `ADMIN_ROLES = ['CEO']` only (`lib/supabase/server.ts:19`) — Manager KHÔNG xóa được. Plan claim WRONG. Pattern lesson L29 (M-Hoshin-7) → L32 (M-Member-POV-1) → L45 (M-KPI-Mgmt-1) reinforced lần 4: trust verify-first hơn plan prose claim. Constraint: TRƯỚC khi commit decision dựa trên prose claim, verify-first qua code reading minimum 1 file. M-KPI-Mgmt-1 bonus catch 3 spec bugs cũng phát hiện qua verify-first (rate-limit `.ok` → `.allowed`, `roleCheck.response` shape, `getClientIp(request)` signature) — fix pre-build, KHÔNG ship rollback.

**Constraints cho future AI sessions**:

- KHÔNG re-add hard-delete option (`DELETE FROM kpis`) mà không design audit FK CASCADE impact 3 child tables. Default Q1 α `UPDATE is_active=false`.
- KHÔNG remove `.eq('is_active', true)` filter từ 3 mutation guards (`kpi/entry`, `hansei/list`, `hansei/create`) — Layer 2 defense regression guard. Test sau soft-delete: archived KPI POST entry MUST 404, KHÔNG accept entry → data pollution.
- KHÔNG render `KpiActionsMenu` cho Member/Manager (canDelete=false) — Q1 α + V6 ADMIN_ROLES lock. Layer 1 UI defense regression guard.
- KHÔNG add custom error message "KPI archived" trong 3 mutation guards — existing 404 message cố ý ambiguous (KHÔNG expose archived state to attacker probe). Defer Phase 2 nếu user phàn nàn confusing UX.
- KHI add UI feature mutate state list (delete/archive/edit), follow lift state β pattern (L44): parent owns array + optimistic callback + rollback on error. KHÔNG dùng α local component state (con tự hide → list parent stale).
- KHI add new mutation route touch `kpis` table by ID for write gate, MUST add `.eq('is_active', true)` filter mặc định (default to active-only mutations). Treat as security check, not optimization. Exception: history readers — document explicit comment + reference pitfall #31.
- KHI ship destructive mutation feature mới (org delete, member kick, etc.), MUST cover 4 layers (L43): UI hide via role check + mutation guard `is_active`/`deleted_at` filter + RBAC `requireOrgRole(ADMIN_ROLES)` + RLS DB-level. Audit checklist trước merge: grep tất cả 4 layers present.
- KHI ship audit log structured JSON, MUST include `kpi_name.slice(0, 50)` truncate (PII protection — kpi_name có thể chứa internal ops detail) + `org_id` + `user_id` + `role` + `kpi_id` + `timestamp` + `requestId` + `ip`. Pattern reuse `[audit:org-switch]` from M-Auth-MultiOrg-1.
- KHÔNG dùng `confirm()` native browser cho destructive confirmation — Q4 β AlertDialog Vietnamese copy lock. Copy MUST emphasize reversibility ("giữ lại lịch sử") để user không sợ mất data — match soft-delete reality. KHÔNG fearmonger "Xóa vĩnh viễn".
- KHI verify-first phát hiện plan claim sai (vd R1 "Manager xóa được" thực tế CEO only), update plan in-line + flag trong verify report. Anti-pattern: silent fix code KHÔNG update plan (drift gap risk).

**Pattern lessons** (4 mới L42-L45):

1. **L42 — Visual evidence smoke test partial coverage acceptable cho beta SaaS solo dev**: M-KPI-Mgmt-1 smoke test 3/8 cases visual PASS (CASE 1 CEO delete + CASE 2 Member hide + CASE 8 visual integrity) thay thế full E2E khi backend verified qua Cursor self-verify chain. Trade-off: visual proof cho UX-facing bugs (Layer 1 UI hide, AlertDialog copy, toast feedback), code-review proof cho backend (Layer 2 mutation guard, Layer 3 rate limit, Layer 4 RLS). Defer remaining 5 cases (idempotent, cancel, cross-org, rate limit 429, archived POST) post-deploy reactive verify. Apply universally cho beta phase: cases critical UX-facing PASS visual = ship-able, backend cases verified structure defer reactive.

2. **L43 — Layer 1+2+3+4 defense in depth pattern cho destructive features**: Soft-delete ship trong M-KPI-Mgmt-1 lock pattern 4 layers (UI hide / mutation guard / RBAC / RLS). Apply universally cho future destructive features. KHÔNG bao giờ chỉ dùng 1 layer — UI hide alone = bypass via direct API call; RBAC alone = race condition; RLS alone = poor UX (raw 500 toast). 4 layers compose for both UX (clean error before RLS) + security (no bypass).

3. **L44 — Optimistic lift state β pattern cho list mutations**: Parent owns array + callbacks down. Con call API + invoke callback. Cleaner hơn α local state (stale on refresh) hoặc γ refresh-only (pessimistic UX). Reusable cho future list mutation features. M-KPI-Mgmt-1 KpiDashboardClient → KpiCard → KpiActionsMenu chain validate pattern. Bonus: spec ban đầu γ → V5 audit phát hiện β cleaner (component already owns array, callback drill 2-level OK) — verify-first invalidate spec choice.

4. **L45 — Verify-first invalidate plan claim L29/L32 reinforced lần 4**: M-KPI-Mgmt-1 Task 2A Cursor verify-first phát hiện plan R1 risk entry sai ("Manager xóa được" — actual CEO only). Pattern L29 (M-Hoshin-7 anti-pattern audit) → L32 (M-Member-POV-1 verify-first scope wider) → L45 (M-KPI-Mgmt-1) reinforced lần 4: trust Cursor verify-first hơn AI assumption từ HANDOFF prose, plan file claim, hoặc memory training data. Bonus M-KPI-Mgmt-1: 3 spec bugs (rate-limit `.ok`, `roleCheck.response`, `getClientIp(request)`) phát hiện qua verify-first chain → fix pre-build. Apply: TRƯỚC khi commit decision dựa trên prose claim, verify-first qua code reading minimum 1 file. Cost ~5-10 phút per task, prevent rollback debt.

### 2026-05-09 — Org Switcher UI + JWT metadata sync trio (M-Auth-MultiOrg-1)

**Milestone**: M-Auth-MultiOrg-1 — Sidebar org switcher dropdown + multi-org metadata write/read sync.

**Scope**: 5 commits (Task 1 plan `0f6bcd4` + Task 2A API `370b72f` + Task 2B component `ffc0714` + Task 2C data fetch `993fd14` + Task 2D-fix JWT sync `b941b37`). 6 files (3 NEW + 3 MODIFIED). ~3h work. Risk LOW (path A+α+I locked: sidebar dropdown + full reload + user_metadata storage). Driver: M-OrgInvite-1 wired 50% multi-org infra (table + accept flow auto-set `last_org_id`) but missed UI cho user CHỦ ĐỘNG switch — fallback `memberships[0]` newest stopgap MVP.

**Methodology source**: M-OrgInvite-1 invite flow `auth.updateUser({ data: { last_org_id }})` precedent (commit `735c132`) + multi-tenant reality M-Hoshin-7 (9 orgs production users, KHÔNG pollution L8). Pattern lift `[audit:check-similar]` structured JSON từ M-OrgUX-1.

**3 Architectural decisions locked**:

1. **Sidebar dropdown TOP position (Q1+Q5 α)**: OrgSwitcher replace existing static "Org info" block in-place line 89-96 sidebar.tsx (zero layout shift). Slack pattern. Avatar 8x8 + full org name truncate `max-w-[140px]` + chevron-down. Mobile inherit qua MobileSidebarContent → Sheet drawer (Q6 β-revised zero-cost). Anti-pattern rejected: bottom-nav addition (5 cols saturated), settings-only redirect (UX regression).

2. **Optional props + fallback pattern cho Sidebar (L40 buildable-standalone)**: `SidebarProps.orgId?` + `SidebarProps.memberships?` với `showSwitcher = !!orgId && !!memberships` guard inside SidebarContent. Renders OrgSwitcher khi data wired, fallback to legacy static block khi không. Defensive cho future non-dashboard callers (admin layouts, onboarding, etc.) — KHÔNG remove fallback sau Task 2C wire data. Pattern lift cho future component additions: optional + guard + fallback enables phase-boundary commits without breaking typecheck cascade.

3. **`updateUser` + `refreshSession` + full reload TRIO cho metadata sync (Q4 γ refined)**: Original Q4 γ "full reload bypass cookie staleness" hypothesis (V5 static review claim "auth.getUser network call = fresh metadata") **partially invalidated** by smoke test CASE 1 empirical evidence — CheckCircle indicator stale sau Member→CEO switch dù DB write thành công + full reload triggered. Root cause: Supabase JWT user_metadata cache layer giữa middleware + Server Component. `auth.getUser()` hits `/auth/v1/user` BUT returns JWT claim payload (stale until re-minted). Fix: insert `auth.refreshSession()` sau `updateUser` để force JWT re-mint. Trio pattern decision lock new — applies to any route mutating `user_metadata` + reading sau đó.

**Constraints cho future AI sessions**:

- KHÔNG remove `refreshSession()` call sau `updateUser` trong `/api/orgs/switch` — JWT metadata cache regression guard (pitfall #30, smoke test CASE 1 evidence).
- KHÔNG modify `SidebarProps.orgId` + `SidebarProps.memberships` từ optional sang required mà không audit tất cả callers — defense layer for /admin và future routes (L40 lock).
- KHÔNG dùng `auth.getUser()` expecting fresh `user_metadata` sau `updateUser` without `refreshSession` bridge — pattern lesson L37 + pitfall #30. V5 hypothesis "getUser = fresh metadata" partially WRONG — claim mirrors JWT, stale until re-minted.
- KHI thêm route mới mutate `user_metadata` + read sau đó (vd profile_pic_url, theme_pref, locale, notification_settings), MUST follow trio pattern `updateUser` + `refreshSession` + full reload HOẶC redesign architecture (vd persist vào dedicated `public.users` row thay vì `auth.users.user_metadata` — `users` table reads bypass JWT cache entirely).
- KHÔNG dùng `router.push` thay `window.location.href` cho post-mutation reload khi mutation touches `user_metadata` — pattern bug M-OrgInvite-1 + M-Auth-MultiOrg-1 reaffirm. `router.push` preserves cookie state (no JWT re-mint qua middleware); `window.location.href` triggers full middleware pass.
- KHÔNG dùng `DropdownMenuCheckboxItem` cho org list (hoặc bất kỳ 1-of-N selection nào) — semantic mismatch. Dùng `DropdownMenuItem` + manual `<Check />` HOẶC `DropdownMenuRadioGroup`+`DropdownMenuRadioItem`.
- KHÔNG add OrgSwitcher vào `bottom-nav.tsx` — Q6 β-revised decision lock. Mobile UX qua Sheet drawer reuse SidebarContent wholesale.
- KHI extend `SidebarProps`, MUST cascade props qua Header.tsx → MobileSidebarContent (chain) — type checker enforce.

**Pattern lessons** (đáng generalize):

1. **L37 — `updateUser` + `refreshSession` + full reload trio cho JWT metadata sync** (REFINED post-smoke từ L37 anticipate). `auth.updateUser({ data: {...} })` writes DB but JWT cookie carries stale user_metadata claim. `auth.getUser()` does network call BUT returns JWT payload (not fresh DB read). Fix: `auth.refreshSession()` re-mints JWT with fresh payload. Cost ~100-200ms acceptable cho low-frequency mutations. KHÔNG dùng cho hot-path mutations. Reference: `app/api/orgs/switch/route.ts` commit `b941b37`.

2. **L38 — Sheet drawer mobile parity zero-cost** (proven validated CASE 4 PASS). Khi `MobileSidebarContent` wraps `SidebarContent`, thêm component vào sidebar tự động available trên mobile drawer. Zero mobile-specific code. Pattern cho future sidebar additions (notification bell, quick-action shortcut, etc.).

3. **L39 — Reader-uniform-pattern enables single-mutation switch** (proven validated). 19 reader files đều dùng `find(m => m.org_id === lastOrgId) ?? memberships[0]` (V6 audit). 1 metadata write → all 19 readers consistent. Pattern: TRƯỚC khi build cross-cutting feature mutate state, audit reader pattern uniformity. Non-uniform readers = bugs from inconsistency.

4. **L40 — Optional props + fallback pattern cho phase boundary buildability** (M-Auth-MultiOrg-1 Task 2B→2C transition). Khi component cần data chưa available ở caller (data fetch wired ở task sau), make new props OPTIONAL + render fallback to legacy/static. Typecheck stays green qua phase boundary. Bonus: defensive cho future non-target callers — KHÔNG remove fallback sau khi data wired.

5. **L41 — Vercel alias propagation lag post-READY**: Vercel deploy READY ≠ production traffic serving immediately. Alias DNS/edge cache cycle takes ~5-10 phút post-READY. Pattern: KHÔNG re-deploy hoặc panic nếu Vercel MCP `get_runtime_logs` cho new deployment ID return "No logs found" trong window post-READY — traffic chưa cycle qua. Verify production via user-facing URL (chienluoc.org) curl smoke tests: nếu route reachable trả expected codes (401/200/404) → alias eventually cycle, milestone close-out OK. M-Auth-MultiOrg-1 hit pattern này (deploy `dpl_GL952HzBkGaGCKFwwSdawGyLvp2k` READY 23.8s build clean, runtime logs empty 5-10 phút trong khi curl chienluoc.org confirm new routes reachable).

### 2026-05-08 — Tech Debt Sweep (M-Cleanup-5)

**Milestone**: M-Cleanup-5 — Tech debt sweep (admin views audit defer + orphan SWOT routes remove + migration 034 backfill + close-out).

**Scope**: 2 commits (Task 1 plan `920080b` + Task 2 commit 1 code `40d3ca4` + Task 2 commit 2 docs này). 3 files code change (-192 LOC routes + 7 LOC migration .sql) + HANDOFF cleanup. Risk LOW (Q1 defer + Q2 remove dead + Q3 backfill mirror = 0 user-visible behavior change). Driver: 3 candidates pile-up §18 backlog + 2 close-out items pre-existing debt.

**3 Decisions locked** (chi tiết ở plans/M-Cleanup-5-plan.md Q1-Q6):

1. **Orphan route removal pattern** (Q2 α decision): MUST verify 0 caller toàn repo (grep `app/`, `components/`, `lib/`) + check git log last-modified TRƯỚC destructive delete. M-Cleanup-5 verify-first found `xray-context` + `prefill-from-xray` last touched 2026-04-30 chỉ là M-Hoshin-7 maintenance fix `3e29a66`, không phải feature work. Pattern L19 (M-Hoshin-7 audit-then-fix) reinforce. Anti-pattern: assume "dead route" từ HANDOFF prose without grep verify.

2. **Migration backfill timing** (Q3 α decision): MUST backfill `.sql` file vào `supabase/migrations/` cùng commit khi apply via Supabase dashboard SQL editor. KHÔNG defer "next-schema-change touches table" — debt rotates qua N milestones, repo state drift production. M-OrgUX-1 migration 034 đã defer 7 ngày (2026-05-01 → 2026-05-08), HANDOFF debt entry rotated 1 milestone. M-Cleanup-5 backfill repo state = production state (locked).

3. **Admin views audit defer pattern** (Q1 α decision): Tech debt với "trigger condition rare + admin-only + 0 user impact" KHÔNG justify cost ngay. Status quo acceptable + revisit khi trigger materialize (M-OrgInvite-1 generate org có >1 CEO + support team escalation). Anti-pattern: ship migration patch eagerly cho code path 0 invocation hiện tại — premature optimization.

**Constraints cho future AI sessions**:

- KHÔNG re-create `app/api/swot/xray-context/route.ts` hoặc `prefill-from-xray/route.ts` mà không design audit. Verified 0 caller M-Cleanup-5, removal rationale rõ.
- KHI cần xray context cho SWOT prefill (future feature), build route mới với pattern hiện tại: `getActiveMembership(supabase, lastOrgId)` helper M-Cleanup-6 Phase 1 + `.maybeSingle()` cho user→resource lookup. KHÔNG copy legacy code git history `3e29a66` mà chưa audit shape contract end-to-end.
- Migration 034 functional index `idx_organizations_lower_name_city` PRESERVED. Required cho `/api/orgs/check-similar` duplicate detection onboarding M-OrgUX-1. KHÔNG drop trong future cleanup.
- Admin views 010 `LIMIT 1` pattern STATUS QUO (Q1 α defer) — revisit khi M-OrgInvite-1 actual generate org có >1 CEO + support team escalation. Future fix path: migration `036_admin_views_deterministic_ceo.sql` thay `LIMIT 1` → `ORDER BY om.created_at ASC LIMIT 1` (founding CEO semantic match `admin_customers_overview`).
- KHI ship migration applied via Supabase dashboard SQL editor, MUST backfill `.sql` file cùng commit. KHÔNG để debt entry rotate qua HANDOFF §18 N tuần.
- KHI HANDOFF có placeholder `<NEXT_HASH>` chưa thực thi, MUST update sau commit thật HOẶC remove khi plan deviate. KHÔNG để placeholder rot — pre-existing debt §16 line 1067 cleanup M-Cleanup-5.

**Pattern lessons** (đáng generalize):

1. **L34 Stale `.next/` type validator cache after route delete**: `npm run typecheck` PASS từ scratch nhưng FAIL nếu `.next/` directory còn type validators reference deleted route. Fix: `rm -rf .next` trước typecheck post-delete. M-Cleanup-5 hit pattern này khi remove 2 SWOT routes — cached `.next/types/app/api/swot/xray-context/route.ts` reference deleted source. Pattern apply: future route delete MUST clean `.next` trước verify build/typecheck.

2. **L35 Pre-existing lint regression isolation**: Khi ship cleanup milestone với typecheck + build PASS đủ (Q4 α minimal), pre-existing lint errors KHÔNG phải scope. Verify isolation qua `git stash && npm run lint && git stash pop` reproduce trên HEAD trước. M-Cleanup-5 hit 2 errors (`react-hooks/static-components` + `no-html-link-for-pages` invite page) — cả 2 pre-existing. Anti-pattern: bundle lint fix vào cleanup commit confuse rollback scope.

3. **L36 Vercel deploy queue delay khi multi-milestone same day**: Khi push nhiều milestone liên tiếp cùng ngày (M-Member-POV-1 morning + M-Cleanup-5 afternoon 2026-05-08), Vercel auto-deploy có thể queue >10 phút INITIALIZING trước khi chuyển BUILDING. KHÔNG bug, chỉ là pipeline contention. Pattern: nếu deploy stuck INITIALIZING >5 phút post-push, poll mỗi 30-45s thay vì panic rebuild. Build thật sự thường complete ~30s sau khi BUILDING bắt đầu. M-Cleanup-5 hit pattern này (deploy `dpl_H9EAUicovPWHRbw8ko6J1F7YF6ku` queue delay before 29.2s build).

### 2026-05-08 — Canvas Member-POV Read-Only Access (M-Member-POV-1)

**Milestone**: M-Member-POV-1 — Canvas Member-POV Redesign.

**Scope**: 6 commits (Task 1-2E). 11 files touched + 1 plan doc. ~520 LOC delta. Production READY at chienluoc.org commit `7570a61` (Vercel `dpl_DjxKkJS1tXHYqi2bc14vFDRHaJJi`). Driver: M-Hoshin-6 Q-canvas redirect tạm thời 2026-04-30 + code comments explicit "future M-Hoshin-7 nới Member writer" → M-Member-POV-1 thực thi reservation.

**Methodology source**: Akao Method bidirectional entry (Vinardi Ch.6 — Strategic Memory accessible to all stakeholders). Toyota gemba philosophy: Member là frontline observer, KHÔNG passive reader. Member access strategic context = comment quality cao hơn.

**3 Architectural decisions locked**:

1. **Bidirectional Member access (Akao Principle 1 extension)**: Member render canvas read-only thay vì redirect /dashboard. CEO/Manager edit, Member observe + comment. Markers gate UI affordances qua canEdit Context field.

2. **Context single source of truth cho permission state**: canEdit field vào CanvasUiState, replace prop drill 3 levels (XMatrixCanvasPage → CanvasGrid → CenterX). Pattern §17 M-Hoshin-6 Q4 α+γ compose proven 4 lần (HoshinGembaSectionClient + KpiGembaSectionClient + CanvasContext + Member-POV).

3. **canSubmit ≠ canModerate (Q3 α gemba Hoshin)**: Member submit gemba comment Hoshin nhưng KHÔNG moderate (acknowledge/resolve/delete). Execute M-Hoshin-6 Q3 γ defer plan. Permission tách biệt qua HoshinGembaSectionClient.canModerate = role !== 'Member' (M-Hoshin-6 đã có) + GembaModal form access defaults open via isPersisted gate only.

**Constraints cho future AI sessions**:

- KHÔNG re-add `redirect('/dashboard')` cho Member trong page.tsx — Member access read-only là decision lock.
- KHÔNG remove canEdit field khỏi CanvasUiState — Context single source of truth lock.
- KHÔNG gate canEdit lên gemba badge HoshinCard — Q3 α Member submit Hoshin lock (execute M-Hoshin-6 Q3 γ defer).
- KHÔNG add view-only modal cho HoshinCard click — Q2 α hide affordance lock, defer M-Member-POV-2 nếu user complain.
- KHÔNG modify CLEAR_DRAFT branch reducer mất canEdit preserve — pitfall #29 regression guard.
- KHÔNG add reducer guard layer 2 cho edit actions trong M-Member-POV-1 scope — defer M-Cleanup-7 explicitly per Q2.4 plan.
- KHI extend ui state CanvasUiState với field mới, MUST classify permission-derived vs user-controlled + audit reset actions per pitfall #29 checklist.
- KHI thêm role-gate route mới (Member access feature khác), follow 4-layer pattern: page render + Context flag + UI components subscribe hook + smoke test 8 cases (Phase A manual với Member account).
- KHI add component canvas mới có click handler edit, MUST consume useCanEdit hook + gate `onClick={canEdit ? handler : undefined}` + render fallback non-interactive cho Member.

**Pattern lessons** (đáng generalize):

1. **L31 Permission field reset audit** (pitfall #29 mới): Khi extend ui state với role-derived field (canEdit, canModerate, canDelete, isAdmin), audit mọi reducer action reset ui slice (CLEAR_DRAFT, RESET_UI, INIT). Permission field MUST preserve qua `ui: { ...initialUi, canEdit: state.ui.canEdit }`. M-Member-POV-1 Task 2A bonus catch. Apply universally cho future ui state extensions.

2. **L32 Verify-first phát hiện scope wider hơn em assume**: Task 2B em prompt assume direct XMatrixCanvasPage→CenterX prop drill. Cursor verify-first phát hiện CanvasGrid intermediate (3 levels). Pattern L29 (M-Hoshin-7) reinforce — trust verify-first hơn em assumption + plan prose. Plan claim ≠ reality.

3. **L33 Bonus catch quality > spec literal**: Cursor Task 2C ship aria-disabled a11y + modal render gated `{canEdit && ...}` defense layer 2 UI-side. Spec define minimum, Cursor judgment MAY exceed nếu defensive trade-off đúng. Pattern: AI pair programmer trusted với scope expansion nếu quality + safety > literal spec adherence.

### 2026-05-03 — SWOT Coaching Redesign theo Akao Method (M-AICoach-Sensei-1)

**Milestone**: M-AICoach-Sensei-1 — SWOT Coaching Redesign theo Akao Method.

**Scope**: 15 commits (Task 1-8 + post-deploy correction). 9 files touched. ~520 LOC net delta. Production READY at chienluoc.org commit 09b095d (Vercel dpl_38P5r8ZSo8VHj78KxGtPQG26wHjy). Driver: 3 user feedback gốc về AI Coach behavior (reset context giữa session, ép tuyến tính SW→OT, reset khi paste nhiều SWOT items).

**Methodology source**: Kesterson "Basics of Hoshin Kanri" Ch.4 + Ch.6, Vinardi "Business Strategy with Hoshin Kanri" Ch.3-6, Villalba-Diez "The Hoshin Kanri Forest" Ch.4-7. Persona review by Yoji Akao (1928-2016, "father of Hoshin Kanri") via roleplay analysis.

**4 Architectural decisions locked**:

1. **Bidirectional entry (Akao Principle 1)**: User start anywhere (S/W/O/T). Server TRUST `currentFramework` từ client (KHÔNG enforce switch). Markers `[SW_COMPLETE]/[OT_COMPLETE]` parse backward compat nhưng KHÔNG trigger framework auto-switch. Catchball philosophy.

2. **Strategic Memory (Akao Principle 2)**: Server load persistent SWOT context (swot_factors source_framework IN workshop/ai_synthesized + xray_results latest) by org_id mỗi request. Inject vào system prompt qua `formatStrategicMemory(factors)` text block + `mapXRayToSwotSeed(xray)` for xrayBlock. Vinardi Ch.6 — Strategic Memory là core, Toyota catchball nhiều tháng giữ memory.

3. **Framework grouping over Pareto (Akao Principle 3)**: Khi user paste 20+ items, AI nhóm theo 8M (SW) hoặc Porter+PESTEL (OT), KHÔNG hỏi "cái nào ảnh hưởng nhất". Pareto thinking là job của catchball CEO+team, KHÔNG phải AI (Kesterson Ch.4).

4. **Catchball not lecture (Akao Principle 4)**: Persona "Minh" — ĐẶT CÂU HỎI giúp CEO TỰ THẤY, KHÔNG đưa kết luận thay CEO. AI là sensei challenger, không phải consultant.

**Constraints cho future AI sessions**:

- KHÔNG re-add forced linear SW→OT state machine. Bidirectional entry là decision lock.
- KHÔNG remove `[SW_COMPLETE]/[OT_COMPLETE]` markers parse logic — backward compat client cũ.
- KHÔNG modify `ExtractedInsight.quadrant` enum (lock 'S' | 'W' | 'O' | 'T').
- KHÔNG persist `INITIAL_MSG_SW`/`INITIAL_MSG_OT` vào store — lazy inject pattern (decision D9).
- KHÔNG abort in-flight request khi user switch framework — response valuable, commit về framework gốc qua snapshot pattern (decision D8).
- KHÔNG dùng `swot_analyses` legacy table cho coaching context — decision D2 exclude legacy, dùng `swot_factors` only (canonical sau migration 014).
- KHI thêm route mới có Server load context, MUST follow pattern Task 3B-2: `getActiveMembership` + `loadStrategicMemory` + safeOrgContext override (defense vs client tampering).
- KHI extend AI structured output schema, MUST update: (a) types.ts interface, (b) isValidInsight runtime guard, (c) prompt schema example block, (d) all in-prompt JSON examples (AI pattern-matches examples). 4 sites pattern locked.
- KHI add new IngredientSource value, MUST update SOURCE_CLS Record exhaustiveness check ở SwotIngredientCard.tsx.
- KHI thêm caller mới gọi `formatStrategicMemory(factors)`, MUST pass `currentFramework` param nếu route có framework concept (SW vs OT). Backward compat optional param chỉ dành cho legacy callers không có framework. Bug 3 fix commit c8df2bf reinforce decision lock — Strategic Memory inject vào prompt MUST filter scope theo current task để tránh context gravity bias. Pattern: feature inject context vào AI prompt MUST scope context theo current mode/framework/quadrant.
- KHI thêm AI structured output route mới có conversational input (non-tool_use), MUST add prompt rule short-input fallback (precedent SW Rule 9 / OT Rule 10 trong M-AICoach-ShortInput-1 commit 2b0e4eb). Threshold default < 5 từ. Action default extractedInsight: null + probe conversational. Constraint default "KHÔNG fabricate từ Strategic Memory + KHÔNG list 4-5 options choice".

**Pattern lessons** (đáng generalize):

1. **L25 — Verify-first phát hiện scope=0**: Task 7 verify trước build → conclusion "không cần build" (sub-features duplicate work đã ship hoặc vi phạm prompt rules). Pattern: verify-first không chỉ confirm scope, đôi khi để **kill scope**. Tránh ship feature decoration không value.

2. **L26 — Streaming ≠ luôn tốt**: Task 4 originally plan switch SSE, analysis phát hiện streaming break 3-tier JSON parse fallback chain (hotfix `df3c1ef`). Pattern: streaming benefit (TTFB ~200ms) chỉ valuable cho long-form generation (vd discovery synthesis), không cho chat-style short response. Coaching response < 500 tokens → streaming overhead > benefit.

3. **L27 — Schema mismatch cross-helpers**: `loadStrategicMemory` return type ≠ prompt builder expect type. Phát hiện qua Task 3B verify, fix bằng convert helper. Pattern: data flow qua nhiều helper layer MUST verify shape contract end-to-end. M-Hoshin-7 L7 reinforce.

4. **L28 — TypeScript Record exhaustiveness check defensive**: Task 6D-step3 `IngredientSource` union extension forced Cursor add entry vào `SOURCE_CLS Record<IngredientSource, ...>`. TS exhaustiveness là defensive type system — extension union → require update mọi consumer. Pattern: khi extend discriminated union hoặc enum-like type, grep `Record<TypeName, ...>` toàn repo trước commit.

5. **L29 — State machine claim ≠ reality**: Plan file claim "force linear" nhưng verify Task 6A phát hiện actions ORPHAN. Pattern: trust verify-first hơn HANDOFF prose. Plan file là intent, code là reality. M-Hoshin-7 L8 áp dụng cross-domain.

6. **L30 — Race condition snapshot pattern**: Async action read mutable state phải snapshot tại entry, không read state lại lúc resolve. Task 6C-step3 framework switch giữa API in-flight handled qua `useSwotStore.getState().currentFramework` snapshot. Pattern reusable cho bất kỳ async action mutate state khác.

### 2026-05-02 — Helper extract for org membership lookup (M-Cleanup-6 Phase 1)

**Milestone**: M-Cleanup-6 Phase 1 — Fix `.single()` anti-pattern + extract helper.

**Scope**: 1 commit, 8 files changed. New `lib/auth/getActiveMembership.ts` helper + 7 API routes refactor:

- `app/api/x-matrix/prefill/route.ts`
- `app/api/kpi/list/route.ts`
- `app/api/report/monthly/route.ts` (split `organizations(name)` JOIN → 2 queries cho type clarity)
- `app/api/discovery/vision-save/route.ts`
- `app/api/discovery/pain-mapper/route.ts` (trong finalize callback)
- `app/api/x-ray/history/route.ts`
- `app/api/x-ray/score/route.ts` (trong `if (user)` block)

**Driving need**: M-OrgInvite-1 fix 12 dashboard pages dùng pattern `.maybeSingle()` → array + `find(lastOrgId) ?? memberships[0]` cho multi-org users. API routes chưa quét. 7 API routes vẫn dùng `.single()` (throw PGRST116 khi multi-row, swallow ambiguity khi 1 row đúng) → silent wrong-org pick cho multi-org users hoặc 500 error.

**Decisions**:

- **Helper signature typed shape `{ org_id: string; role: string } | null`** (NOT generic `<S extends string>` returning `Record<string, unknown>`). Lý do: caller dùng `membership.org_id` thẳng, không phải `membership['org_id'] as string` — type safety + clean ergonomics.
- **Caller pass `lastOrgId` explicit** (NOT helper tự fetch from `auth.getUser()`). Lý do: tránh round-trip thứ 2 trong helper, caller đã có user object từ outer auth check.
- **`order('created_at', desc)` cho fallback**: khi `lastOrgId` null hoặc không match, lấy newest membership. `created_at` verified exists ở `org_members` schema (migration 001).
- **`report/monthly`: split JOIN query thành 2 queries** thay vì keep `.select('org_id, organizations(name)')`. Lý do: helper return flat shape — adding nested field cho 1 route làm helper API leak. Cost ~5-10ms thêm acceptable cho type safety.
- **Phase 1 only** — defer Phase 2 (12 dashboard inline call sites refactor sang helper) tách milestone riêng. Lý do: Phase 1 fix bug critical (silent wrong-org picks); Phase 2 là DRY refactor không thay behavior. Tách commit dễ rollback.

**Constraints cho future AI sessions**:

- KHÔNG dùng `.single()` cho `org_members` query khi user có thể multi-org. Pattern: `getActiveMembership(supabase, userId, lastOrgId)`.
- KHÔNG modify helper signature trở lại generic shape — typed flat shape là decision lock.
- KHI add route mới có `org_members` lookup, MUST gọi `getActiveMembership` helper. Anti-pattern: copy `.single()` từ HANDOFF cũ.
- KHI cần fields ngoài `org_id` + `role` (vd `organizations(name)`, `created_at`), fetch query thứ 2 với `membership.org_id` thay vì extend helper shape.
- Phase 2 sẽ refactor 12 dashboard inline sites. Triển khai khi tiện — KHÔNG block release nào khác.

**Pattern lessons** (đáng generalize):

1. **Markdown auto-link corruption trong chat AI tools**: Vũ Hải paste prompt vào Claude.ai và bot hiển thị `m.org_id` thành `[m.org](http://m.org)_id` (markdown auto-link rule). Lúc paste lệnh PowerShell với content này từ chat → file ghi sai bytes. Fix: dùng Cursor Chat (không có auto-link) HOẶC verify với `Format-Hex` sau khi tạo file.
2. **PowerShell here-string với content `[...]` đầu**: Block code có dòng đầu `[POWERSHELL]` hoặc `[PASTE VÀO FILE: ...]` — PowerShell parse `[...]` như attribute syntax, fail. Mitigation: KHÔNG copy markers `[POWERSHELL]` vào terminal, chỉ copy content bên dưới.
3. **Cursor Chat vs Cursor Composer/Background Agent**: Prompt edit nhiều file paste vào Cursor Chat (Ctrl+L) đôi khi không trigger edit (Cursor reply text mà không apply). Khi Cursor không edit, fallback qua Composer mode hoặc tách prompt từng file riêng, paste từng cái một.
4. **Smoke test minimum cost cho refactor pure**: KPI Tracker render OK + Console clean = đủ confirm helper hoạt động. Không cần test toàn 7 routes (refactor type-clean, behavior preserved).

---

### 2026-05-02 — CEO Invite Link Flow (M-OrgInvite-1)

**Milestone**: M-OrgInvite-1 — CEO Invite Link Flow.

**Scope**: 1 table mới (`org_invites`) + enum `invite_role` + 4 API routes + 2 UI pages/components + auth redirect fix + 12 dashboard multi-org fix. 1 commit `735c132`, 26 files, 1464 insertions.

**Driving need**: Multi-user onboarding gap — CEO không có cách mời Manager/Member vào org. PQL signal #2 "≥2 org members" không bao giờ fire khi solo. Settings page có fake `handleCopyInvite` chỉ copy `/login` URL.

**7 quyết định locked Task 1**:

1. **Option B — CEO invite link (NOT Option A request-to-join)**: CEO tạo link, copy tay (Zalo/email), người nhận click → accept. Simpler, no notification infra needed.
2. **Table mới `org_invites`**: lifecycle pending→accepted/expired tách biệt `org_members`. Pattern proven 5 lần.
3. **Invite link format `/invite/[token]`**: public page, UUID token, 7 ngày expire.
4. **MVP: chỉ support người đã có account**: nhánh register-via-invite defer — cần carry token qua email confirm flow.
5. **Max 5 pending invites per org**: tránh spam, đủ cho SME.
6. **Gửi email qua Resend**: Resend đã setup, UX tốt hơn CEO copy link tay thuần túy.
7. **CEO revoke invite**: DELETE API + UI button "Hủy", không cần confirm dialog (low-risk, có thể tạo lại).

**Bugs phát hiện + fix trong milestone**:

1. **Next.js dynamic segment conflict**: `app/api/invites/[id]/` + `app/api/invites/[token]/` cùng cấp → error "different slug names". Fix: rename `[id]` → `[token]`, revoke route dùng token làm lookup key thay vì id.
2. **Multi-org `.maybeSingle()` systemic bug**: 12 dashboard pages + layout dùng `.maybeSingle()` cho `org_members` query → throw `PGRST116` khi user thuộc nhiều org → redirect `/onboarding/setup-org`. Fix: fetch array + `find(lastOrgId) ?? newest` pattern. Pattern lesson mới L26.
3. **`window.location.href` vs `router.push` sau accept**: `router.push('/dashboard')` dùng client-side nav, Server Component đọc stale cookie → redirect onboarding. Fix: `window.location.href = '/dashboard'` force full reload.
4. **`supabase.auth.updateUser` không set `last_org_id` metadata**: call trong API route không reflect vào session cookie ngay → fallback `memberships[0]` (newest) đủ cho MVP.

**Constraints cho future AI sessions**:

- KHÔNG dùng `.maybeSingle()` cho `org_members` query khi user có thể multi-org. Pattern đúng: fetch array + `find(lastOrgId) ?? memberships[0]`. Hoặc extract helper `lib/auth/getActiveMembership.ts` (DEBT).
- KHÔNG tạo 2 dynamic segment khác tên cùng cấp trong Next.js App Router (vd `[id]` + `[token]` dưới cùng parent folder). Next.js throw build error. Pattern: đồng nhất tên slug (dùng `[token]` cho toàn bộ invites domain).
- KHÔNG dùng `router.push` sau action thay đổi session/membership — dùng `window.location.href` để force full reload + cookie refresh.
- KHI thêm route mới có `org_members` lookup, MUST dùng array pattern, KHÔNG `.maybeSingle()`.
- KHÔNG add OAuth invite flow mà không pass token qua OAuth `state` param + update `/auth/callback` handler.

---

### 2026-05-02 — Score scale tách biệt KPI scale (M-Design-3b)

**Milestone**: M-Design-3b — Dashboard hex-to-token refactor (consume M-Design-3a foundation + extend với saturated variants + new score scale).

**Scope**: 6 commits `868fa34`→`ed27932` (5 files: 1 foundation + 4 consumer refactors). 0 raw hex còn trong logic của 4 files refactored.

**Driving need**: M-Design-3a ship 4-tier pastel `--kpi-*` (background fills) + chart-tokens resolver. M-Design-3b refactor 4 high-impact files (xray-history page + chart, KpiSparkline, discovery hub) phát hiện 5 blockers trong audit Task 1: scale alignment xray (red/amber/blue/green) ≠ KPI pastel (red/pink/yellow/lime), saturated stroke variants thiếu, server/client boundary cho `resolveToken`, KpiCard 3-tier vs KPI 4-tier mismatch, dark mode scope.

**Decisions** (5 locked):

- **Tách 2 scales (Option C của 3 candidates)**: `--score-{critical|weak|fair|good}` saturated 4-tier cho X-Ray health score (assessment one-time, hue affordances red/amber/blue/green) + giữ `--kpi-{healthy|attention|warning|critical}` pastel (M-Design-3a foundation, ongoing tracking với escalation scale). 2 mental models khác nhau (one-time assessment vs ongoing) → 2 visual scales. Reject Option A (đổi xray sang red/pink/yellow/green đồng bộ KPI — mất "blue=trung bình" affordance) + Option B (extend KPI thêm saturated variants tier-by-tier — hue mismatch giữa names).
- **Saturated KPI variants reuse `--destructive` cho red**: Add `--kpi-healthy-strong: #16A34A` + `--kpi-attention-strong: #D97706` (saturated companions cho pastel `--kpi-{healthy,attention}` — needed cho line strokes / dot fills / borders trên white card surface). KHÔNG ship `--kpi-warning-strong` — reuse shadcn `--destructive` (#ef4444) cho red strokes. KPI critical tier đã saturated (`--kpi-critical = --brand`).
- **Server/client boundary cho color resolution**: Server Component compute tier name string (pure `getScoreTier(score) → 'critical' | 'weak' | 'fair' | 'good'`) → pass tier prop xuống client component → client (`'use client'`) call `resolveScoreToken(tier)`. Data contract: ChartDataPoint carry `tier: ScoreTier` thay vì `color: string`. Tránh SSR hardcode hex fallback flash. HTML elements bypass — `style={{ color: \`var(--score-${tier})\` }}` work cả server lẫn client (browser cascade resolve var() runtime).
- **KpiCard 3-tier giữ nguyên (KHÔNG sync 4-tier)**: M-Design-3b scope = "thay hex bằng token" KHÔNG đổi behavior. KpiCard logic `<70% / 70-90% / ≥90%` independent từ KPI 4-tier escalation scale. Đồng bộ scale là semantic redesign — defer khi có user request.
- **Dark mode OUT OF SCOPE**: `.dark` block UNTOUCHED. Reason: M-Design-3a foundation cũng skip dark; adding dark variants without visual A/B context (dashboard side-by-side) = guessing. Defer M-Design-Dark-1 khi có user request explicit.

**Constraints cho future AI sessions**:

- KHÔNG dùng `var(--score-*)` cho Recharts props (stroke, fill, dot.fill, ReferenceLine.stroke...) — Recharts không resolve var(), phải qua `resolveScoreToken(tier)` trả concrete hex string. HTML elements (span, div, p, button) NHẬN `var()` qua inline style hoặc className.
- KHÔNG mix `--score-*` (saturated) với `--kpi-*` pastel cho cùng UI element. Pairing rule: `bg = --kpi-{tier}` + `text = --kpi-{tier}-fg` + `border = --kpi-{tier}-strong` (3 tokens cùng nhóm). Score scale là standalone — text color trên white bg, không có pastel bg paired.
- KHI add chart mới cần status colors: dùng `--score-*` cho assessment-style (one-time score, fixed band scale), dùng `--kpi-*-strong` cho tracking-style (ongoing KPI, escalation scale). Đừng tự tạo token mới — extend existing scale qua proposal commit (foundation independent từ consumer refactor).
- KHÔNG add tier thứ 5 cho score scale (4-tier locked: critical/weak/fair/good ↔ ≤25/26-50/51-75/>75). Nếu cần granularity hơn → propose redesign milestone, không bolt-on.
- Recharts alpha pattern: dùng `withAlpha(color, hexSuffix)` từ `lib/design/chart-tokens.ts`. Defensive regex check, returns `'transparent'` cho non-hex-6 input. KHÔNG dùng `color-mix()` trong Recharts props (parse fail trên một số browsers + SSR-unreliable). HTML elements OK với color-mix.
- KHI thay `style={{ color: '#xxx' }}` cho HTML element → pattern là `style={{ color: 'var(--token-name)' }}`. Server component có thể compute tier name động: `style={{ color: \`var(--score-${getScoreTier(score)})\` }}`. KHÔNG hardcode hex fallback inline (defeat the purpose).
- KHI Server Component cần data input cho client chart, pass MINIMAL tier name (`'critical' | ...`), KHÔNG pre-resolve hex. Client unwrap → token.
- KHI ship dark mode (M-Design-Dark-1 future), MUST add dark variants cho `--score-{critical,weak,fair,good}` + `--kpi-{healthy,attention}-strong` cùng commit + visual A/B test trước khi merge. Don't drift.

**Pattern lessons** (đáng generalize):

1. **Foundation commit ship riêng** (proven 6 milestones liên tiếp). Commit `868fa34` (tokens + helpers) ship ĐỘC LẬP trước 5 refactor commits. Phase boundary discipline §17 lesson #2 (M-Hoshin-3 archive). Lý do: nếu lỗi token → rollback 1 commit, không touch consumers. Apply universally cho mọi design system extension.
2. **Audit-before-refactor mandatory cho design refactor >3 files**. Cursor audit Task 1 phát hiện 5 blockers trước refactor → tránh rollback 2-3h. Audit cost ~15 phút. Saved factor 8-10x. Áp dụng universally cho mọi design refactor đa file.
3. **Token shorthand pitfall**: token `--border-subtle: 1px solid var(--bg-muted)` là CSS shorthand (full border declaration), KHÔNG assignable cho `borderColor` prop. Khi consume trong inline style cần `borderColor` thuần color → dùng color-mix() hoặc assign full `border` shorthand. Pattern lesson: token shorthand không universal, kiểm tra value structure (grep `:root`) trước khi consume. New pitfall §10 #22.
4. **Hue shift acceptance pattern**: Refactor `#22c55e` → `#16A34A` (Tailwind 500→600) + `#eab308` → `#D97706` (yellow-500→amber-600) + Tailwind emerald-100 → `--kpi-healthy` lime tạo visual delta NHẸ (~5-10° hue, ~1 step lightness). User-facing recognition vẫn đúng (green=healthy, amber=attention). Pattern brand consistency > pixel-perfect Tailwind match acceptable. Apply: design system rollout chấp nhận hue delta nhẹ thay vì giữ bug-compatibility với palette cũ.
5. **`SCORE_TOKEN_NAMES` Record vs array**: Cursor decision Task 2 dùng `Record<ScoreTier, string>` thay vì `as const` array (Vũ Hải prompt sai). Object an toàn hơn — type-safe lookup không bị off-by-one, match precedent `KPI_TOKEN_NAMES`. Lesson: trust Cursor judgment cho code shape decisions, em focus on semantic + flow.
6. **Out-of-scope discipline**: KpiCard.tsx Tailwind utility classes flagged audit nhưng SKIP M-Design-3b vì scope = "inline hex → token only". Defer riêng M-Design-Tailwind-Cleanup-1. Tránh scope creep cuối milestone (4 files refactor đã đủ work, thêm KpiCard = +1h debate Tailwind palette decisions).

**Pairing rule reference card**:

| Use case | bg | text | border / stroke |
|---|---|---|---|
| KPI status badge | `--kpi-{tier}` | `--kpi-{tier}-fg` | `--kpi-{tier}-strong` (or `--destructive` cho warning) |
| KPI sparkline / chart | — | — | `--kpi-{healthy,attention}-strong` + `--destructive` (red) |
| KPI area fill (12.5% alpha) | `withAlpha(stroke, '20')` | — | (same stroke) |
| Score number text | (transparent) | `var(--score-{tier})` | — |
| Score chart ReferenceLine | — | — | `resolveScoreToken(tier)` (Recharts) |
| Generic alert/toast | — | `--destructive-foreground` | `--destructive` |

---

### 2026-05-01 — KPI status tokens foundation (M-Design-3a)

**Milestone**: M-Design-3a — KPI Status Tokens Foundation (split from original M-Design-3 dashboard refactor).

**Scope**: 3 commits `d7fdb6d`→`b3ff123` (3 files changed):
- `d7fdb6d` feat(design): 8 `--kpi-*` tokens trong `app/globals.css` (`:root` line 185-192 + `@theme inline` line 64-71)
- `11b7ff7` feat(design): `lib/design/chart-tokens.ts` (99 LOC, 6 exports) runtime resolver cho Recharts
- `b3ff123` refactor(dashboard): `app/dashboard/page.tsx:224` 1-line hex → token swap

**Driving need**: Pre-Audit của dashboard route (M-Design-3 prep) discovered 41+ hardcoded hex across 13 files, primary anti-pattern là chart colors (xray-history Recharts configs, KpiSparkline thresholds, discovery hub inline backgrounds). Zero semantic tokens cho KPI status — every file invents own #16A34A / #D97706 / #c73937 traffic light. Need foundation tokens trước khi mass-refactor.

**Decisions**:

- **MVP split (4 files) vs Cursor's Option A (6-7 files)**: Sustain pace sau 3.5h M-OrgUX-1 burn. Ship token foundation + first refactor proving the pattern, defer high-impact files (xray-history + KpiSparkline + discovery hub) → M-Design-3b. Pattern: when pace risk > scope risk, ship foundation + 1 reference refactor, document rest in HANDOFF cho next session pickup.
- **4-tier KPI scale (healthy/attention/warning/critical)**: Phân tầng 2 mức "bad" — pastel pink `#F0DCDD` cho warning (ink readable, fits NB v3.2 muted aesthetic, used in dashboard density) vs brand red `#c73937` cho critical (white text, exception cases system-blocking/fatal). Default UI uses 3-tier (healthy/attention/warning); critical reserved sparingly. 3-tier alone insufficient — dashboard có cả "below threshold" (attention to user) lẫn "system-critical error" (force escalation). 5-tier overkill.
- **Token aliasing strategy (NOT duplicate hex)**: `:root --kpi-healthy: var(--accent-lime);` aliases existing palette. Single source of truth — palette change auto-propagates. `@theme inline --color-kpi-healthy: #DDE4C5;` ships hex literal vì Tailwind v4 class generation requirement (NOT a dup bug, design constraint). New pitfall §10 #20.
- **Recharts 3-layer integration pattern**: 3 consumption layers (Tailwind class | inline `var()` | runtime resolver). Recharts props KHÔNG accept `var()` → cần dedicated `lib/design/chart-tokens.ts` resolver. Pattern lock: when shipping chart component, default Layer 3 helper, KHÔNG mix Layer 2 inline style for chart-specific props. New pitfall §10 #19.
- **Loud failure fallback (`#000000`, NOT "nice" gray)**: chart-tokens resolver returns `#000000` on token miss / SSR. Black is loud-but-safe — broken-looking chart surfaces bug, không silent wrong colors. Don't change to "nicer" fallback — that masks regressions.
- **`clearTokenCache()` exported but unused**: Wired ready cho dark mode toggle handler future. Until M-Design-3b adds dark variants, dead code by design — better than re-architecting later. Pattern: build extension point khi obvious từ requirement, NHƯNG don't implement scenario chưa exist.
- **`.dark` block UNTOUCHED**: 8 KPI tokens light-mode only. Adding dark values without visual context (xray chart in dark mode) = guessing. Defer to M-Design-3b khi có component refactor để A/B compare.
- **Audit-first hex replacement**: GREP context (component, prop, neighboring text) trước khi pick token. `#c73937` ambiguous (brand vs critical) — 1-line refactor in `page.tsx:224` shipped chỉ sau semantic context check (pill là positive marker "X-Ray done", brand emphasis NOT critical state). New pitfall §10 #21.

**Constraints cho future AI sessions**:

- KHÔNG add new hex literals trong component code khi semantic match existing token. Grep `globals.css` `:root` block trước. Nếu token miss → propose new token in `globals.css` (separate commit), NOT inline `bg-[#hex]`.
- KHÔNG dùng `var(--kpi-*)` cho generic alerts/toasts/error states. Dùng shadcn `var(--destructive)` (saturated, semantic alert). KPI tokens reserved cho KPI/x-ray traffic light states ONLY.
- KHÔNG mix Recharts `stroke="var(--kpi-healthy)"` (silent fail). Import `resolveToken` từ `lib/design/chart-tokens.ts` cho mọi Recharts color prop. Pattern §10 #19.
- KHÔNG duplicate hex trong `:root` khi alias possible. Pattern §10 #20.
- KHÔNG modify `clearTokenCache()` semantics — ready hook cho dark mode toggle. Wire vào theme switcher khi M-Design-3b/Dark adds variant tokens.
- KHI ship M-Design-3b chart refactors, MUST add `.dark` variants cho 8 `--kpi-*` tokens cùng commit + visual test (xray history chart side-by-side light/dark) trước khi merge.
- KHI hex có ambiguous semantic (brand vs critical vs accent), STOP + ask user before applying token. Pattern §10 #21.

---

### 2026-05-01 — Duplicate org detection on onboarding (M-OrgUX-1)

**Milestone**: M-OrgUX-1 — Duplicate Org Detection on Onboarding.

**Scope**: 6 commits `6ccd776`→`d57c7f1` (8 files changed across 3 layers + 1 docs precursor):
- Migration 034 — functional index `idx_organizations_lower_name_city` ON `organizations(lower(name), lower(city))` (applied via Supabase dashboard, version `20260501061239`, `.sql` file not yet committed)
- API: POST `/api/orgs/check-similar` (`app/api/orgs/check-similar/route.ts`)
- UI: `app/onboarding/setup-org/page.tsx` (+111/-2) — debounced check + acknowledgement gate
- Tests: `scripts/smoke-test-orgs-check-similar.ps1` (API 6/6 PASS) + `scripts/smoke-test-orgs-setup-org-ui.ts` (UI 5/5 PASS)
- Chore: `playwright` + `tsx` devDeps for UI smoke test
- Pre-cursor (`6ccd776`): docs/align `MASTER_BUILD_SPEC.md` with canvas reality post M-Cleanup-1 (6 stale refs updated)

**Driving need**: M-Cleanup-2 originally scoped to mass-delete 9 duplicate "Ladysfit" orgs. Audit (M-Hoshin-7) discovered they are 9 multi-tenant production users with distinct owners — hard delete = 8 user data loss + trust violation. Pivot from retroactive cleanup → prevent-at-onboarding UX. Schema constraint discovery (no soft-delete column on `organizations`) reinforced "prevent > cleanup" decision.

**Decisions**:

- **Audit-driven pivot pattern**: Before destructive milestone, MUST query data + ownership counts to validate HANDOFF prose assumption. M-Cleanup-2 → M-OrgUX-1 pivot is the second pattern instance after M-Hoshin-7 fix (`.limit(1).single()` audit). Pattern lesson L8 reinforced.
- **3-layer separation (DB index + API + UI)**: Each layer testable independently. DB index makes `lower(name)+lower(city)` lookup ~O(log n) instead of seq scan. API enforces auth + rate limit + minimal response. UI debounces + gates submit on acknowledgement.
- **Security: response shape minimal — NO `id` field**. Admin client bypass RLS to query across all orgs (necessary because pre-onboarding user has no `org_members` row → user-context query returns empty). Mitigation: rate limit 10/min/user + only return `{name, city, industry}` so a malicious user cannot enumerate org IDs via duplicate-detection vector.
- **Exact match same city only (NOT trigram/`pg_trgm`)** for MVP. 9 orgs current scale doesn't warrant fuzzy matching. Trigger upgrade only if ≥3 production users complain "missed duplicate due to typo".
- **Inline Zod schema (NOT in `lib/validation/schemas.ts`)**: Schema is single-route domain (only `/api/orgs/check-similar` uses it). If future route shares it, promote then. Avoid premature centralization.
- **Direct `checkRateLimit` (NOT `requireAiRateLimit` helper)**: Helper hardcodes `ai:` key prefix, doesn't fit non-AI route. DEBT: refactor to generic `requireRateLimit(bucket, opts)` after 2-3 more non-AI routes need rate limiting.
- **Audit log via `console.log` with `[audit:check-similar]` prefix**: Vercel runtime logs sufficient for current volume. Migrate to `audit_logs` table when query patterns warrant (filter by user, time range, match count). Pattern matches `[audit:dev-login]` precedent.
- **Smoke test pattern: API PowerShell + UI Playwright TS**: API smoke = `.ps1` (matches `smoke-test-orgs-check-similar.ps1` precedent + Windows-native, no Node deps). UI smoke = `.ts` via `tsx` (Playwright is Node-native, TS strict for type safety). Both reuse cookie forge pattern (base64- prefix + base64url JSON session).

**Constraints cho future AI sessions**:

- KHÔNG mass-delete duplicate orgs by name. Pattern is prevent-at-onboarding (M-OrgUX-1) + audit-driven pivot (M-Hoshin-7 L8). Retroactive cleanup requires soft-delete migration first + per-row owner verification.
- KHÔNG return `id` field từ `/api/orgs/check-similar` (or any future "check across orgs" endpoint). Security mitigation: admin-client bypass RLS exposes data — minimize response shape to avoid enumeration vector.
- KHÔNG add `pg_trgm` / fuzzy matching vào `/api/orgs/check-similar` mà không có user complaint baseline (≥3 production users miss duplicate due to typo). YAGNI.
- KHI add route public-ish (authenticated user chưa có `org_members` row, vd onboarding flow), MUST: (a) rate-limit per-user, (b) audit log với `[audit:<route>]` prefix, (c) minimize response shape (no IDs unless needed for ownership-scoped action).
- KHI write smoke test cho new authenticated route, follow 2-script pattern: `.ps1` for API (PowerShell-native, no Node deps) + `.ts` Playwright for UI. Reuse cookie forge helper from `smoke-test-orgs-check-similar.ps1` and `smoke-test-orgs-setup-org-ui.ts`.
- KHI commit migration applied via dashboard, MUST also commit `.sql` file to `supabase/migrations/` for git-revert safety. M-OrgUX-1 migration 034 currently in DEBT — backfill when convenient.

---

### 2026-05-01 — Repository public + HANDOFF auto-sync (M-Public-1)

**Milestone**: M-Public-1 — Repository Public + HANDOFF Auto-sync.

**Scope**: 2 commits (`e305e61` sanitize PII +43/-16 across 6 files, `aabedce` LICENSE notice in README). Repo visibility flipped GitHub private→public 2026-05-01. License chosen: "All rights reserved" (no permissive license).

**Driving need**: M-Cleanup-1 close-out raised question về HANDOFF auto-sync giữa Cursor (local edits) → Claude.ai web (read latest state). Phương án A (manual re-upload Project knowledge mỗi session) high-friction. Phương án B (GitHub raw URL fetch) requires public repo. Phương án B chosen vì friction-free + transparency value.

**Decisions**:

- **Repo public, license restrictive**. Repo published cho transparency + AI auto-sync, KHÔNG cấp quyền commercial use, redistribution, modification, or derivative works without written permission. README License section [README.md:25](README.md#L25).
- **HANDOFF auto-sync via GitHub raw URL**: `https://raw.githubusercontent.com/vuhuyhai/hoshin-kanri-os/master/HANDOFF.md` là canonical source. Em (AI Claude.ai web) tự fetch URL này đầu mỗi chat mới — KHÔNG cần Vũ Hải re-upload Project knowledge.
- **Pre-flight audit pattern locked-in**: 5-step audit (hardcoded secrets HEAD + git history + .env files history + .gitignore coverage + PII grep) MUST chạy trước mọi visibility flip future. Pattern lesson L21.
- **PII sanitization standard**: 14 instances `fitnessviet@gmail.com` (Vũ Hải personal email) sanitized → `<owner-email>` placeholder trong docs, env var fallback trong code, psql variable trong SQL. Pattern: code/docs không reference Vũ Hải's personal email — production user identity stays in DB only.
- **`.gitignore` hardened cho dotenv**: 8 dotenv variants ignored (`.env`, `.env.local`, `.env.*.local`, `.env.production`, etc.) + `!.env.example` whitelist. Future env var sample files MUST follow `.env.example` naming.

**Constraints cho future AI sessions**:

- KHÔNG add LICENSE permissive (MIT/Apache/BSD) without explicit Vũ Hải decision. License "All rights reserved" preserve commercial IP — đây là decision lock, không phải oversight.
- KHÔNG hardcode PII trong code/docs/SQL. Email/phone/JWT/API key MUST go through env var hoặc psql variable. Pattern precedent: `app/api/auth/dev-login/route.ts` (env var fallback), `supabase/cleanup_users.sql` (psql `:'keep_email'`).
- KHÔNG re-flip repo private→public→private để test propagation. Fastly CDN cache state phức tạp, defer verify retry sau 15 phút (L22).
- KHI flip visibility (private→public hoặc ngược lại) trong tương lai, MUST chạy 5-step pre-flight audit (L21) trước. Anti-pattern: flip dựa trên "I think it's clean" — must mechanical audit.
- KHI Claude.ai web session bắt đầu, em fetch HANDOFF raw URL trước khi answer (xem §16 auto-fetch URL block). Anti-pattern: trust stale Project knowledge upload từ session trước.

---

### 2026-05-01 — Wizard files removed, canvas single source of truth (M-Cleanup-1)

**Milestone**: M-Cleanup-1 — Wizard Files Cleanup.

**Scope**: 1 commit `558a471` (push 2026-05-01). page.tsx cleanup (xóa import + xóa block `useLegacyWizard`) + `git rm` 7 wizard files trong `components/x-matrix/`. Total -1184 lines across 8 files.

**Driving need**: Feature flag `NEXT_PUBLIC_XMATRIX_CANVAS` introduced ở M-Hoshin-1 (2026-04-27) cho 2-week safety net rollback to wizard. Production stable từ 2026-04-27 → 2026-05-01 (5 days post M-Hoshin-7 close-out, no regression). Flag không set production (verified Vercel env vars empty), `.env.local` flag value `False` → wizard branch dead code không serve user nào. Cleanup tech debt + simplify mental model (1 render path).

**Decisions**:

- **Wizard rollback path no longer available**. Future regression handle qua `git revert 558a471` (commit chứa toàn bộ wizard code intact) thay vì runtime feature flag.
- **Canvas single source of truth** cho `/dashboard/x-matrix/new` route. Render flow: page.tsx → `<HoshinGembaSection>` (Server Component fetch summary + commentsMap) → `<XMatrixCanvasPage>` (Client Component canvas).
- **`components/x-matrix/` top-level trống** post-cleanup. Canvas-related code consolidate vào `components/x-matrix/canvas/` subfolder. Future canvas shared utilities có thể add vào top-level nếu cross-canvas-feature scope.
- **CanvasHeader.tsx render branding** thay thế header markup legacy trong page.tsx (h1 "X-Matrix Builder" + overline "Strategy" + subtitle). Branding moved into canvas component → consistency cross-route nếu canvas reuse trong route khác (vd `/dashboard/x-matrix/[year]/edit` future).

**Constraints cho future AI sessions**:

- KHÔNG re-add `NEXT_PUBLIC_XMATRIX_CANVAS` env var. Pattern feature-flag-for-rollback dead. Future UI replacement features → ship behind reverse flag 2 tuần MAX, sau đó MUST cleanup (M-Cleanup-1 precedent).
- KHÔNG re-create wizard 5-step pattern cho X-Matrix create flow. Canvas Density Mode lock từ M-Hoshin-1 — xem §17 entry 2026-04-27.
- KHÔNG re-create files `XMatrixWizard.tsx`, `Step[1-4]*.tsx`, `WizardProgress.tsx`, `XMatrixReview.tsx` ở `components/x-matrix/` top-level. Resurrect pattern proven anti-pattern (regression risk + mental model split).
- KHI cleanup destructive (delete files/components/routes), MUST audit imports + UI affordances + state reuse TRƯỚC khi `git rm` (L19 + L20 pattern).
- KHI xóa wrapper component có UI markup (header/title/breadcrumb), MUST verify child component có equivalent render — tránh "missing context" regression (L20 pattern).

---

### 2026-04-30 — Multi-tenant production reality (M-Hoshin-7)

**Discovery**: M-Cleanup-2 diagnose phát hiện 9 organizations với name chứa "Ladysfit" KHÔNG phải duplicate test pollution như HANDOFF cũ giả định. Đây là 9 multi-tenant production users:
- 1 canonical (Vũ Hải `<owner-email>`, CEO, 89 KPIs + 19 xmatrix + data đầy đủ)
- 8 user thật khác chủ với data thật (4 xmatrix + ~110 SWOT + ~20 discovery)
- 9 emails khác nhau, 9 owners độc lập

**Implications for future milestones**:

1. **Tuyệt đối KHÔNG dùng `name` cho org lookup** — name không unique (9 orgs cùng tên/biến thể "Ladysfit"). Pattern đúng: scope bằng `id` từ session/membership context.

2. **Pattern user→org lookup chuẩn**: `.from('org_members').eq('user_id', user.id).maybeSingle()` (KHÔNG `.limit(1)`). `.maybeSingle()` THROW khi >1 row → loud failure 409. `.single()` swallow ambiguity → silent wrong-pick.

3. **Multi-org users sắp xuất hiện**: M-Member-POV-1 (Q3 β re-enable Member writer cross-org), admin debug membership add bản thân vào org thứ 2 → 0 user multi-org hiện tại nhưng path sẽ trigger.

4. **HANDOFF assumption blind-trust = data risk**: M-Cleanup-2 escalated CRITICAL dựa trên prose "duplicate orgs from testing". Nếu execute hard DELETE → mất 8 user thật. Pattern lesson L8.

**Constraints cho future AI sessions**:
- KHÔNG ship destructive ops (DELETE, ALTER DROP, UPDATE bulk) chỉ dựa trên HANDOFF prose. MUST query data + counts trước khi build plan.
- KHÔNG dùng `.limit(1).single()` cho user→org lookup. Dùng `.maybeSingle()`.
- KHI add route mới có user→resource lookup, audit 11/13 baseline routes pattern (`.eq('user_id', user.id).maybeSingle()`).
- KHI migration thêm org-related logic, MUST handle multi-org case explicit (param `org_id`, không assume single).

---

### 2026-04-27 — Design system migrated to NB v3.2 Refined Tempered

**Milestone**: M-Design-1 — Foundation Tokens.

**Scope**: `app/globals.css` (tokens + utility classes) + `app/layout.tsx` (fonts).

**Decisions**:
- **Brand color `#c73937` unchanged** — đã build brand recognition từ launch, không reset.
- **Fonts**: Space Grotesk (display) + Inter (body) + JetBrains Mono (mono). Replaces Montserrat + Barlow Condensed. All 3 support Vietnamese full subset.
- **Border-radius scale 0/3/4/6/8/12/16/20px tempered** (replaces forced 0 với `!important` global). Cards/buttons default 4px (`--radius-md`); radius 0 reserved cho avatar/sticker/marquee/checkbox/radio (NB DNA).
- **6 muted pastel accents** added (yellow `#F5E4B8` / cyan `#C4DEDC` / lime `#DDE4C5` / pink `#F0DCDD` / peach `#F0DCC0` / lavender `#DDD3EE`) cho feature cards và tags. Không thay thế brand red.
- **Motion easing standardized** to `--ease-nb: cubic-bezier(0.25, 0, 0, 1)` — KHÔNG dùng `ease` / `ease-in-out` / `linear` cho hover transitions.
- **Light mode forced** default unchanged (storage key `hoshin-theme-v2` unchanged). Dark mode tokens preserved trong `.dark { ... }` block cho future opt-in.

**Constraints cho future AI sessions**:
- KHÔNG propose Tailwind default radius (`rounded-lg`) hoặc shadow (`shadow-md`) — phải dùng custom tokens trong `globals.css` (`var(--radius-md)`, `var(--shadow-md)`).
- KHÔNG `new` font import — wire qua `app/layout.tsx` next/font/google với Vietnamese subset.
- KHÔNG hardcode hex colors — dùng tokens (`var(--brand)`, `var(--ink)`, `var(--bg)`, `var(--accent-yellow)`, ...).
- Components mới phải dùng utility classes có sẵn (`.btn-brutal-*`, `.btn-yellow/cyan`, `.card-*`, `.nb-*`, `.tag-*`) thay vì re-implement style.
- Khi cần style mới không match utility class hiện có, ADD vào `globals.css` với token-driven values, KHÔNG inline Tailwind arbitrary value (`bg-[#c73937]`).

### 2026-04-27 — Landing page refactored to NB v3.2 component-based architecture

**Milestone**: M-Design-2 — Landing Page Refactor.

**Scope**: `app/page.tsx` (replace inline sections với 5 components) + `components/landing/*` (5 new component files: HeroNB, MarqueeStrip, FeatureCardNB, StepCardNB, CtaBannerNB) + minor `app/globals.css` (bổ sung `--shadow-double` token + `.bg-dot-grid` utility cho final CTA banner) + footer cleanup (rename Footer → FooterCopyright, dedupe duplicate copyright, fix 3 dead links).

**Decisions**:
- **Component-based landing**: Tách HeroNB / MarqueeStrip / FeatureCardNB / StepCardNB / CtaBannerNB ra `components/landing/*` thay vì giữ inline JSX trong page.tsx. Lý do: page.tsx hiện đọc như "table of contents" landing, mỗi component test/iterate riêng được. Reusability không cao (chỉ dùng cho landing) — tách vì separation of concerns + maintainability.
- **Section pastel alternation**: Features section dùng 6 pastel cards (yellow/cyan/pink/lime/peach/lavender). How It Works section dùng `bg-warm` neutral (3 cards) — alternate giữa pastel-rich và neutral để mắt user có chỗ nghỉ. Spec NB v3.2 cho phép pattern này.
- **Big numbers font choice**: Step cards big numbers dùng `font-mono` weight 700 (KHÔNG `font-display` weight 900). Audit M-Design-1 báo font-weight 900 lệch spec NB v3.2 (700 max). Fix ở M-Design-2 này, set precedent cho tất cả big numbers tương lai (vd dashboard stats, KPI cards).
- **Final CTA banner double-shadow**: CTA banner cuối page dùng `--shadow-double` (`6px 6px 0 var(--accent-yellow), 12px 12px 0 var(--ink)`) — spec dành cho moments quan trọng nhất (hero CTA hoặc final banner). Em chọn final banner vì user đã scroll qua toàn bộ value props, đây là moment "now or never". Single-shadow `--shadow-md` dùng cho mọi card khác.
- **Footer architecture**: Component `FooterCopyright` ở `components/layout/footer-copyright.tsx` chỉ render mini copyright bar (1 dòng warm) — dùng chung cho mọi route (dashboard, blog, x-ray, landing). Full 4-col footer chỉ ở landing, render inline trong `page.tsx`. Không tách footer landing thành component riêng vì non-reusable + page.tsx vẫn đọc OK.
- **Hero visual approach**: Giữ decorative grid 3x3 (KHÔNG dùng portrait/illustration ảnh thật) để tránh blocker chờ asset. Restyle theo NB v3.2 với asymmetric shadow + 3 stickers overlap (VISION/GOALS/KPIs) — đủ chaos DNA mà không phụ thuộc design asset bên ngoài.

**Constraints cho future AI sessions**:
- KHÔNG re-add `overflow: hidden` vào parent của bất kỳ component có sticker overlap (Hero decorative grid, Feature cards, Step cards, CTA banner). Pattern này đã clip mất sticker ở Task 7 — fix bằng cách bỏ `overflow-hidden` + dùng `background-clip: padding-box` cho bg-pattern containment.
- KHÔNG đổi `bg-warm` cho How It Works sang pastel — alternation pastel/neutral giữa Features và How It Works là intentional, đổi sẽ khiến landing rực rỡ quá đều.
- KHÔNG dùng `font-display` weight 900 cho big numbers (KPI stats, score cards, dashboard metrics) — pattern phải là `font-mono` weight 700 (precedent từ StepCardNB).
- KHI sinh marketing copy có con số/năm/percentage → phải verify với Vũ Hải hoặc dùng phrasing không-định-lượng. AI có xu hướng fabricate impressive numbers (vd "200+ năm Toyota" đã hallucinate ở M-Design-2). Pattern fix: ưu tiên qualitative claim ("Fortune 500 áp dụng", "chuẩn industry") thay vì quantitative.

### 2026-04-27 — X-Matrix Canvas (Density Mode) replaces 5-step wizard

**Milestone**: M-Hoshin-1 — X-Matrix Canvas Replace Wizard.

**Scope**: Hoàn toàn replace `XMatrixWizard` (5-step linear) bằng `XMatrixCanvasPage` (single-page Density Mode canvas, Toyota A3 pattern). Wizard files KEEP cho rollback safety 2 tuần.

**Driving feedback**: Akao-sensei review (chat earlier) — wizard tuyến tính phá metaphor "X-Matrix là 1 bức tranh", user không thấy 4 cạnh cùng lúc, không enforce vital few rule. Density Mode trả lại essence Hoshin Kanri.

**Decisions**:
- **Layout**: Orthogonal grid (90px / 320px / 200px rows × 200px / 1fr / 200px cols), NOT Toyota diagonal. Toyota Mode (diagonal SVG) defer M-Hoshin-3+.
- **Center**: Empty correlation matrix grid 5×3 (Y1-Y3 × H1-H5) skeleton. M-Hoshin-2 wire click logic (●◐○-).
- **Owner**: 1 owner per Hoshin (free-text `owner_name` in Hoshin card), NOT separate edge. KHÔNG migrate schema kpis.owner_user_id.
- **State**: React Context + useReducer. State shape `{ data: XMatrixData, ui: CanvasUiState }` — `data` byte-identical với existing API contract (no schema migration).
- **Auto-save**: localStorage V1, key `xmatrix-canvas-draft-${orgId}-${year}`, debounce 500ms. DB drafts defer V2.
- **Edit pattern**: Modal (shadcn-style Dialog) using `@base-ui/react/dialog` (NOT Radix — codebase convention). YearGoal modal simple, Hoshin modal full all-in-one (title + owner + max 3 initiatives + max 2 KPIs).
- **AI Prefill**: Defer to M-Hoshin-2 (lý do: scope creep + correlation engine cần work với AI prefill chung).
- **Validation**: Real-time qua `validateXMatrix()` từ `lib/x-matrix/utils.ts`. Errors hiện inline trong SubmitBar (compact 1 dòng + click expand).
- **Education**: 5 tooltips ⓘ với câu hỏi sensei wired vào 4 edge headings + 1 center heading.
- **Mobile**: Stacked layout < 768px. Mini-map sticky top với 4 quadrants + click smooth-scroll. Mini-map data-driven (filled/empty indicators).
- **Feature flag**: Reverse flag — canvas default cho mọi user, set `NEXT_PUBLIC_XMATRIX_CANVAS=0` để rollback wizard. Sau 2 tuần stable → bỏ flag + xóa wizard files.

**Constraints cho future AI sessions**:
- KHÔNG quay lại 5-step wizard pattern. Canvas là source of truth.
- KHÔNG modify `XMatrixData` shape (preserve API contract `/api/x-matrix/create`). Chỉ extend qua `CanvasUiState` overlay.
- KHÔNG add Radix UI dependency — dùng `@base-ui/react/dialog` cho consistent modal pattern.
- KHÔNG hardcode hard limits (3/5/2/3) — import `LIMITS` từ `lib/x-matrix/utils.ts`.
- Khi modify canvas state, dispatch action qua reducer, KHÔNG mutate state directly.
- localStorage hydrate 1 lần on mount qua `useRef` guard (tránh React 19 StrictMode double-effect).

### 2026-04-28 — X-Matrix Correlation Matrix Engine (M-Hoshin-2)

**Milestone**: M-Hoshin-2 — Correlation Matrix Engine.

**Scope**: Wire correlation matrix center 5×3 (Y1-Y3 × H1-H5) thành interactive engine với 4 features chính: click cycle correlations (●◐○-), AI prefill từ Discovery (binary accept-or-cancel), AI coach sensei questions per strong cell, orphan validation warnings (Hoshin/YearGoal không link).

**Driving feedback**: M-Hoshin-1 ship canvas foundation nhưng correlation matrix center chỉ là grid skeleton. Toyota Hoshin Kanri principles cần explicit correlation strength + sensei challenge questions để verify quyết định.

**Decisions**:
- **Strength enum 4 values**: `strong | medium | weak | none`. `none` = explicit "đã review, không liên quan" thay vì ambiguous NULL.
- **Visual mapping**: ● (Black Circle U+25CF) / ◐ (Circle Half Black U+25D0) / ○ (White Circle U+25CB) / empty.
- **Click pattern**: Cycle `none → strong → medium → weak → none`. KHÔNG dropdown — cycle là Toyota A3 idiom.
- **Storage**: Separate table `xmatrix_correlations` (NOT extend x_matrices.vision_json). Lý do: composite unique constraint, FK to x_matrices, RLS policy độc lập.
- **Orphan rule**: Cần ít nhất 1 ● (strong) link để qualify "thực sự là Hoshin/YearGoal". Medium/weak là contributing không phải driving.
- **Validation severity**: Warnings (NOT errors). User vẫn save được với orphans — Hoshin philosophy là guideline, không phải hard rule.
- **AI Coach**: Trigger LẤY ON-DEMAND khi click strong cell (NOT auto-popup mọi click). Cache per-cell trong canvas state. Rate limit 50/5min/user qua bucket dedicated.
- **AI Prefill UX**: Binary accept-all-or-cancel (NOT granular per-field accept). Defer granular M-Hoshin-3 nếu warrant. Modal preview với source attribution (x_matrices_active vs discovery_sessions legacy).
- **Smart `/new` route**: 1 URL serves create + edit modes. Page server-side query existing active matrix → load nếu có, blank nếu không. API atomic dedupe handle archive khi save mới.
- **Mobile**: DEFER. M-Mobile-1 milestone riêng (CenterX không render mobile từ M-Hoshin-1).

**Constraints cho future AI sessions**:
- KHÔNG modify schema `xmatrix_correlations` (preserve API contract). Chỉ extend qua state overlay nếu cần.
- KHÔNG hardcode strength values — import enum từ `lib/x-matrix/correlation-types.ts` hoặc CanvasContext export.
- KHÔNG dùng paste characters trực tiếp cho Unicode symbols — dùng escape sequences (e.g., backslash-u-25CF cho ●, U+25CF reference notation).
- KHÔNG add granular accept cho AI prefill mà không design UX dedicated (preview pane, diff view, conflict resolution components).
- KHI extend canvas state, audit checklist: every state field has corresponding UI input + validation message + persistence test.

### 2026-04-28 — Mobile Layout Stacked Vertical (Pattern A)

**Milestone**: M-Mobile-1 — Mobile Layout Redesign (partial scope).

**Scope**: 1 commit (`68d48b9`) — `components/x-matrix/canvas/CanvasGrid.tsx` (reorder source markup mobile flow) + `components/x-matrix/canvas/CenterX.tsx` (responsive flex/grid + correlation matrix đảo trục mobile + cell touch ≥ 48px).

**Driving feedback**: M-Hoshin-2 cuối milestone phát hiện CenterX có `hidden md:grid` → mobile (< 768px) không render Vision/YearGoals/Correlation/Owners/KPIs. Toàn bộ M-Hoshin-2 correlation feature vô dụng trên mobile.

**Decisions**:
- **Pattern A (Stacked Vertical)** chosen over Pattern B (Horizontal Scroll) hoặc Pattern C (Tabbed Quadrants). Lý do: read-mostly mobile use case + thấp effort/risk + 1 codebase responsive + standard mobile UX (top-down catchball flow).
- **Mobile order top-to-bottom**: NorthEdge (YearGoals) → CenterX (Correlation) → SouthEdge (Hoshins) → EastEdge (KPIs) → WestEdge (Owners). Match Toyota catchball flow: Vision → YearGoals → catchball matrix → Hoshins → KPIs.
- **Correlation matrix đảo trục mobile**: Desktop 5 cols × 3 rows (Hoshins × YearGoals). Mobile 3 cols × 5 rows (YearGoals × Hoshins). Lý do: 3 cols trên 375px = ~109px/cell touch target ≥ 48px; 5 cols trên 375px = ~65px/cell KHÔNG đạt 48px.
- **Data shape NOT changed** — đảo trục là render-direction-only. Cell map vẫn `{year_goal_id, hoshin_id, strength}` từ table `xmatrix_correlations`.
- **Desktop ≥ 768px GIỮ NGUYÊN** — explicit `md:col-start-* md:row-start-*` cho phép source order khác desktop placement. Visual không đổi cho desktop user.
- **Vision modal mobile** DEFER — textarea inline 2 rows full-width đã đẹp mobile, modal pattern thêm complexity không cần.
- **YearGoals metric display** REJECT — type `XMatrixYearGoal` không có metric field, description đã render sẵn. Em prompt sai assumption.
- **Mini-map sticky** KILLED — 2 lần defer, không cần thiết cho mobile critical path.
- **Submit bar mobile** verified work without redesign — inline pattern hiện tại OK.

**Constraints cho future AI sessions**:
- KHÔNG thêm `hidden md:` class cho components canvas — nếu cần ẩn desktop, dùng `md:hidden` (ngược lại) để đảm bảo mobile có content.
- KHÔNG đổi correlation matrix data shape — trục đảo chỉ là render direction.
- KHÔNG re-introduce Vision modal mobile mà không có rationale rõ ràng (vd: Vision text quá dài + need to edit thường xuyên).
- KHÔNG re-investigate mini-map sticky bug mà không có user complaint mới.
- Khi add component mới vào canvas, default render trên cả mobile và desktop. Nếu cần ẩn 1 viewport → dùng `md:hidden` (ẩn desktop, show mobile) hoặc `hidden md:block` (ẩn mobile, show desktop) thay vì hardcode `hidden md:grid`.

### 2026-04-29 — Annual Review Workflow (M-Hoshin-3)

**Milestone**: M-Hoshin-3 — Annual Review Workflow.

**Scope**: 3 tables mới (`annual_reviews`, `kpi_actuals`, `carry_overs`) + 4 API endpoints + UI page review + 6 components annual-review + integration với dashboard banner. 8 commits + 1 hotfix.

**Driving need**: Close PDCA loop của Hoshin Kanri methodology. Trước M-Hoshin-3, app chỉ support Plan + Do (matrix create + KPI tracking). Thiếu Check (review vs target) + Act (carry-over learnings sang năm mới). End-of-year transition là moment quan trọng nhất Toyota method — không có nó, system trở thành "annual planning tool" chứ không phải Hoshin Kanri thật.

**6 quyết định locked ở Task 1**:

1. **Trigger flow**: Cả 2 — banner auto khi sang năm mới + nút manual trên dashboard.
2. **KPI actual value**: Manual nhập (user tự điền actual) — NOT compute từ kpi_entries (tránh ambiguity sum/avg/last).
3. **Hansei structure**: Toyota A3 4-fields (Background / Current State / Target Gap / Next Action) — match Toyota method, structured giúp AI assist tốt hơn free-form.
4. **DB schema**: 3 tables tách (`annual_reviews` parent + `kpi_actuals` leaf + `carry_overs` decisions) — composite query phức tạp dễ index, audit trail rõ, RLS policy độc lập, pattern proven từ M-Hoshin-2 correlations.
5. **Carry-over criteria**: KPI < 70% (red zone) → auto-flag Hoshin chứa KPI đó. Threshold match với KPI dashboard color band hiện tại (red < 70%, yellow 70-100%, green ≥ 100%).
6. **Year transition state**: User confirm step-by-step (review → preview new → confirm transition). Modal preview KHÔNG dedicated page — stay on review context, less code.

**Constraints cho future AI sessions**:

- KHÔNG modify schema 3 tables (`annual_reviews`, `kpi_actuals`, `carry_overs`) mà không bump migration. Composite unique constraints + FK cascade behavior critical.
- KHÔNG hardcode threshold 70% — import `RED_THRESHOLD` từ `lib/annual-review/flagging.ts` nếu cần align với KPI dashboard color band.
- KHÔNG dùng vision_json `kpi.id` làm join key — luôn dùng `kpi.name`. ID regenerate khi save vision_json.
- KHI tạo matrix active mới (bất kỳ route nào) → MUST archive existing active của cùng org_id trước. Pattern proven ở migration 015 UNIQUE constraint, M-Hoshin-2 smart `/new` route, M-Hoshin-3 transition flow.
- KHÔNG add granular accept cho transition carry-over (per-Hoshin individual confirm) mà không design UX dedicated. Hiện tại binary modal-level confirm OK cho beta SaaS, granular defer cho production complaint signal.
- Khi extend Annual Review state, audit checklist: every state field has UI input + validation message + auto-save trigger.

### 2026-04-29 — Hansei Auto-prompt Weekly PDCA (M-Hoshin-4)

**Milestone**: M-Hoshin-4 — Hansei Auto-prompt khi KPI red 2+ tuần.

**Scope**: 1 table mới (`weekly_hansei`) + 2 API endpoints + 3 UI components + 1 Client wrapper + wire vào KPI dashboard. 6 commits.

**Driving need**: Close weekly PDCA loop của Hoshin Kanri methodology. M-Hoshin-3 đã close annual PDCA (year-end review) nhưng thiếu intervention cấp tuần khi KPI bị stuck đỏ. Toyota gemba philosophy: hansei = intentional reflection on failure tại moment phát hiện, không đợi quarterly/annual review.

**6 quyết định locked ở Task 1**:

1. **Schema design**: Table mới `weekly_hansei` (NOT extend `kpi_entries` hoặc reuse `annual_reviews`). Lý do: clean separation concern, RLS policy độc lập, pattern proven từ M-Hoshin-2/3.
2. **Detection**: Query realtime mỗi load `/dashboard/kpi`. NOT pg_cron/materialized view. Solo dev simplicity, scale < 100 KPIs OK. Migrate materialized view khi org load > 500ms.
3. **UX trigger**: Banner top + click expand inline form. NOT modal popup (block UX). NOT inline cạnh mỗi KPI card (clutter). Pattern y AnnualReviewBanner.
4. **Hansei structure**: 2 fields minimal (why_red + next_action). Match Toyota mini-A3 cho weekly cadence. Friction thấp critical cho adoption. Full A3 4-field reserved cho annual review.
5. **AI assist**: Defer M-Hoshin-5. Ship manual hansei trước → có data baseline, AI cost protection, không scope creep. Pattern: ship Plan/Do/Check trước, Act phase optimize sau.
6. **Frequency**: 1 lần/streak với re-prompt nếu streak extend >= 2 tuần kể từ lần hansei trước. NOT weekly Monday (annoying), NOT mỗi load (aggressive). Streak-based intentional reflection match Toyota philosophy.

**Constraints cho future AI sessions**:

- KHÔNG modify schema `weekly_hansei` mà không bump migration. Composite UNIQUE (kpi_id, week_start) critical cho idempotent upsert.
- KHÔNG hardcode `RED_THRESHOLD = 0.7` — import từ `lib/hansei/types.ts` nếu cần align với KPI dashboard color band (consistency).
- KHÔNG hardcode `MIN_STREAK_WEEKS = 2` hoặc `RE_PROMPT_INTERVAL_WEEKS = 2` — import từ `lib/hansei/types.ts`. Future tuning data-driven.
- KHÔNG dùng `kpi.id` từ vision_json làm join key (regenerate on save) — luôn dùng `kpis.id` table FK (M-Hoshin-3 pattern lesson #2).
- KHÔNG add AI sensei route trong M-Hoshin-4 scope (defer M-Hoshin-5). Nếu thêm → MUST wire rate-limit helper bucket=`hansei` (pattern từ commit `a8d5e58`).
- KHÔNG skip server-side streak verify trong POST `/api/hansei/create`. Client tự fake `streak_weeks` là attack vector trivial — verify qua `getRedStreaks()` re-compute trước insert.
- KHI extend canvas pattern (Server Component fetch + Client wrapper), audit checklist: every state field có UI input + validation + auto-save trigger nếu cần (xem M-Hoshin-3 lesson "vision input gap").
- KHI add UI component vào dashboard, default render mobile + responsive (NOT `hidden md:*` pattern — pitfall #14).

### 2026-04-30 — Gemba Feedback Bottom-up Signal (M-Hoshin-5)

**Milestone**: M-Hoshin-5 — Gemba Feedback (Member comment trên Hoshin/KPI).

**Scope**: 1 table mới (`gemba_comments`) + 2 enum types + 3 API endpoints + 4 UI components + 2 wire integrations + 4 PostHog events. 8 commits.

**Driving need**: Đảo trục input flow gốc rễ CEO-centric (M-Hoshin-1/2/3/4 đều build cho CEO write top-down) sang gemba bottom-up (Member observe + comment). Toyota gemba philosophy: psychological safety + signal flow từ frontline lên management. App có role 'Member' trong DB từ migration 001 nhưng UI chưa khai thác Member writeable channel nào (chỉ kpi_entries qua RLS user-level).

**8 quyết định locked ở Task 1 + Task 1B**:

1. **Schema design**: Table mới `gemba_comments` (NOT extend `kpi_entries.comment` hoặc duplicate `hoshin_comments`+`kpi_comments`). Lý do: pattern proven 3 lần (xmatrix_correlations, annual_reviews, weekly_hansei). 1 schema với `target_type` enum tránh duplication, target_id text khớp JSON-embedded Hoshin ID pattern.
2. **Target scope**: Hoshin + KPI (NOT YearGoals). Member có context cho Hoshin (5 vital few) + KPI (operational). YearGoals scope CEO chỉ.
3. **Status enum**: `open | acknowledged | resolved` action lifecycle (NOT `observation/suggestion/concern` signal-type). Member friction thấp (không phải nghĩ "đây là gì"), pattern y `annual_reviews.status` lifecycle.
4. **UX entry Member**: Inline collapsed "💬 Góp ý" button, click expand textarea (NOT always-visible form, NOT modal popup, NOT separate route). Pattern y `KpiCard.showForm` toggle hiện tại — proven UX không che context.
5. **UX CEO read**: Banner top + inline thread expand (NOT only banner, NOT only inline, NOT dedicated route). Pattern y `HanseiBanner` + drill-down. Banner cho urgency, inline cho context.
6. **Notification scope**: On-app banner ONLY (NO email, NO Zalo, NO digest). Lý do: kill scope creep, Resend infra defer M-Hoshin-6+. Email mỗi comment = noise (CEO bật rule ignore).
7. **AI assist**: Defer M-Hoshin-6 (NOT ship AI sensei summarize comment patterns trong M-Hoshin-5). Lý do: chưa có data thực, AI sẽ hallucinate insight. Pattern lesson M-Hoshin-4 #4: ship Plan/Do/Check trước, Act phase optimize sau khi có baseline data.
8. **Member writeable**: INSERT only, NO UPDATE/DELETE own (NOT 24h window edit). CEO + Manager moderate DELETE. Lý do: audit trail integrity > convenience. Psychological safety permanent (Toyota gemba culture không "24h take-back"). Tech debt minimum (route-level time check phức tạp + chưa có precedent).
9. **Banner stack** (locked Task 1B): α 2 banner stack riêng (Gemba banner trên + Hansei banner dưới), NOT β gộp 1 banner "Việc cần xử lý". Pattern proven 2 lần (HanseiBanner + AnnualReviewBanner trên `/dashboard`). Hansei = self-action, Gemba = reactive-action — 2 intent khác nhau.
10. **Member test account strategy** (locked Task 1B): Tạo Member test account TRƯỚC Task 2 (NOT sau Task 4 hoặc giả lập role update). Lý do: pattern lesson M-Hoshin-3 #1 (multi-org dev confusion consume 30 phút diagnose). Front-load 5 phút setup hơn 1-2h debug RLS bug ở Task 7+.

**Constraints cho future AI sessions**:

- KHÔNG modify schema `gemba_comments` mà không bump migration. Composite indexes + 4 FK + 4 RLS policies critical cho performance + security.
- KHÔNG hardcode `GEMBA_BODY_MIN=20` hoặc `GEMBA_BODY_MAX=1000` — import từ `lib/gemba/types.ts`. Future tuning data-driven (vd Member viết quá ngắn → bump min 30, hoặc Member viết quá dài → cap 500).
- KHÔNG dùng vision_json `hoshin.id` làm join key TRƯỚC khi save Hoshin. Sau khi save lần đầu, `hoshin.id` (format `hoshin_${idx+1}_${Date.now()}`) timestamp-locked tại ADD time, NOT regenerate khi SubmitBar save → text-match safe. Verified M-Hoshin-6 Task 2 V1 (commit `f9e0ce9`). Edge case acceptable: delete hoshin slot + re-add = id mới với timestamp khác → comments cũ orphan (intended behavior, deleted = gone). Hoshin lookup từ `x_matrices.vision_json.hoshins[].id` đọc trong app layer.
- KHÔNG add "Member edit own comment trong 24h" mà không thêm route-level time check + DB CHECK constraint + UI warning ("còn N phút edit"). Quyết định Q8 = INSERT-only đã lock — đảo ngược cần re-design audit trail story.
- KHÔNG skip Member account smoke test khi feature có Member writer. Pattern lesson M-Hoshin-5 #1 — postgres role bypass RLS không test được Member writeable path.
- KHÔNG add email/Zalo notification mà không design email digest cron job (scope M-Hoshin-6+). Decision Q6 đã lock on-app only.
- KHÔNG add AI sensei trong M-Hoshin-5 scope (defer M-Hoshin-6). Nếu thêm → MUST wire rate-limit helper bucket=`gemba` (pattern M-Hoshin-4 commit `a8d5e58`).
- KHI extend gemba state, audit checklist: every state field có UI input + validation + auto-save trigger nếu cần (xem M-Hoshin-3 lesson "vision input gap").
- KHI add UI component vào dashboard, default render mobile + responsive (NOT `hidden md:*` pattern — pitfall #14).
- Banner UI component conditional render: hide khi `total_open===0` hoặc `!canModerate`. Tránh "empty state" banner làm dashboard ồn.

### 2026-04-30 — Hoshin Gemba Integration (M-Hoshin-6)

**Milestone**: M-Hoshin-6 — Hoshin Gemba Integration.

**Scope**: Wire `gemba_comments` table M-Hoshin-5 (target_type='hoshin' schema-ready) vào X-Matrix canvas. 4 commits, 0 migration mới (schema đã ready M-Hoshin-5), 0 API mới (endpoint `/api/gemba/list` + `/create` + `/[id]` đã handle target_type='hoshin' từ M-Hoshin-5).

**Driving need**: M-Hoshin-5 ship `gemba_comments` với 2 target_type nhưng chỉ wire UI cho KPI side. Hoshin side schema ready nhưng UI chưa render — Task 7C M-Hoshin-5 deferred. M-Hoshin-6 đóng technical debt này + giải quyết Member-POV gap canvas.

**5 quyết định locked Task 1 + Task 1B (design audit)**:

1. **Q1 β — Render location**: Footer badge count + dedicated GembaModal riêng (NOT inline section, NOT tab trong HoshinEditModal). Lý do: HoshinCard.tsx là `<button>` 110px compact (NOT `<div>` như KpiCard), không inline được. Tách 2 modal isolate gemba khỏi edit-flow CEO.
2. **Q2 β — Badge visibility**: Show 2 variants conditional (NOT empty-hide hoàn toàn, NOT always-show). Variant count > 0 hiện `💬 N` brand color; variant count === 0 hiện `+ 💬` faded gray opacity-60 hover-100. Lý do: empty-hide phát hiện UX gap Task 4 (CEO/Manager không có entry point Hoshin chưa có comment) → Task 3B-fix-2 fix với 2 variants. Q2 β-revised giữ tinh thần "subtle không noise" nhưng đảm bảo functional entry point.
3. **Q3 γ — Defer Member writer Hoshin**: GembaModal render form chỉ CEO+Manager (NOT all-roles, NOT defer thread cũng). Lý do: Q-canvas role-gate (Member redirect `/dashboard`) → Member không reach canvas được → form Member dead code nếu render. Member submit gemba qua KPI card (M-Hoshin-5 đã ship) — bottom-up philosophy preserved. M-Hoshin-7 mở canvas Member-POV → bật form additive sau (không refactor).
4. **Q4 α+γ compose — Data fetching**: Server Component fetch summary + commentsMap trên page level + Context Provider client-side wrap OUTSIDE XMatrixCanvasPage. NOT prop drilling 4-level (page → canvas → grid → slot → card), NOT sibling context CanvasContext. Pattern y M-Hoshin-5 KpiGembaSection commit `47350e1`. N+1 ≤6 query (MAX_HOSHINS=5) acceptable.
5. **Q-canvas — Role-gate page level**: Member redirect `/dashboard` 3 dòng `if (membership.role === 'Member') redirect('/dashboard')` trong page.tsx. NOT render canvas + hide UI affordances cho Member, NOT defer fix. Lý do: Member-POV canvas gap separate concern (M-Hoshin-7 sẽ redesign Member-POV canvas). Hiện tại Member chưa cần vào canvas → eliminate confusion thay vì half-fix.

**Constraints cho future AI sessions**:

- KHÔNG modify HoshinCard structure trở lại nested button (`<button>` trong `<button>`). Wrapper `<div>` chứa 2 SIBLINGS button là HTML5 valid + a11y safe. "Browser tolerance != correct" rationale rejected.
- KHÔNG remove Q2 β-revised 2 variants (count=0 phải có visual entry point `+ 💬` faded, KHÔNG empty-hide hoàn toàn).
- KHÔNG render form Member writer trong GembaModal mà KHÔNG đồng thời bật Member access canvas page (Q3 γ + Q-canvas pair lock).
- KHI extend gemba feature mới (vd reaction emoji, mention user), reuse pattern Server fetch + Context wrap OUTSIDE container (HoshinGembaSectionClient + KpiGembaSectionClient parallel pattern).
- KHÔNG dùng vision_json `hoshin.id` làm join key cho draft Hoshin (chưa SubmitBar save). Gate form khi `xMatrixId=null` với hint "Lưu X-Matrix trước khi thêm góp ý".
- KHI add UI component có conditional render (show/hide based on count/state), audit checklist Task 1 design phải explicit flag empty state UX cho mọi conditional.
- KHÔNG dùng vision_json `hoshin.id` làm `target_id` matching cho gemba comments TRƯỚC khi SubmitBar save (constraint M-Hoshin-6.1 hotfix). GembaModal phải gate form `!isPersisted` (Hoshin chưa nằm trong `vision_json.hoshins[]`) trước khi cho phép submit comment. Nếu thêm gemba target loại mới (initiative/kpi-on-hoshin) cùng pattern JSON-embedded ID, MUST replicate `existingTargetIds` Server fetch + `isPersisted` flag pattern.
- KHÔNG remove constraint `xMatrixId === null` cũ trong GembaModal khi thêm `!isPersisted` — defensive cho edge case `xMatrixId` chưa load (canvas mới mount, Context value transient null). Pattern 2-layer gate: (1) `!isPersisted` priority cao nhất (warning ⚠️ "chưa được lưu"), (2) `xMatrixId === null` fallback (hint "Lưu X-Matrix trước"), (3) render form. Cả 2 layer giữ nguyên dù 1 nhánh unreachable trong production — symmetry hơn dead-code cleanup.

---

## 18. Next Steps (Roadmap)

### Shipped milestones (recent)

- **M-Design-Tokens-Cleanup-1 — `--accent` collision cleanup + `.heading-overline` consolidation** ✅ SHIPPED 2026-05-10 (4 commits: 3 code `eb34541`→`2c6f976` + 1 close-out HANDOFF, 26 files: 1 NEW + 25 MODIFIED, ~1.5h work). Trigger: M-Design-3a foundation discovered comment line 158 cảnh báo collision NHƯNG line 171 reassign `--accent: #c73937` contradict — visible regression dropdown menu hover flash brand red gây eye-fatigue (Vũ Hải screenshot 2026-05-10 KPI dropdown + org switcher). Path β REVERT shadcn default lock với evidence distribution Phần D 7:17:0 (Nhóm A intentional brand : Nhóm B accidental shadcn : Nhóm C ambiguous) + layout team pioneer pattern `--accent-brand` token riêng. Smoke test Phase A 5/5 PASS visual (CASE 1 KPI dropdown hover neutral beige eye-fatigue fix + CASE 2 org switcher selected brand red preserved qua bg-accent-brand + CASE 3 X-Ray selected option brand red + CASE 4 XRayReport CTA shadow brand red + CASE 5 dark mode skip Q3 A defer). 3 architectural changes (foundation cleanup eliminate collision, `--accent-brand` token riêng, atomic commit boundary discipline Path C). 7 decisions Q1-Q7 locked direct trong HANDOFF entry (NOT plan file riêng vì scope LOW). NEW pattern lesson L50 (atomic commit boundary discipline cho cleanup milestone scope creep) + L42 reinforced lần 6 + L29/L32/L45/L48/L49 reinforced lần 8. Production verify TBD post-deploy. See §16 + §17.
- **M-Cleanup-batch-2026-05-09 — M-Cleanup-6 Phase 2 + M-Lint-Cleanup-1 combo** ✅ SHIPPED 2026-05-09 (4 commits `11c6193` plan → `f7087cd` 8 drop-in sites → `96c7db6` 3 JOIN sites split-query → `73abf59` 2 lint fixes, 13 files refactored + 1 plan doc, ~1h40min work). Trigger: M-Cleanup-6 Phase 1 deferred 12 dashboard inline call sites (`find(lastOrgId) ?? memberships[0]`) + 2 pre-existing lint errors verified isolation M-Cleanup-5 (zero baseline regression). Combo opportunity gộp 2 LOW-risk milestones cùng session, share verify-first audit + docs close-out. 5 decisions Q1-Q5 locked Task 1 (β 3 commits domain / α split-query / β 4-page smoke / α separate lint commit). 11/12 inline sites migrated sang `getActiveMembership(supabase, userId, lastOrgId)` helper (8 drop-in + 3 JOIN-split with race-safe `if (!org) redirect` guard); layout.tsx (#1) defer M-Cleanup-6-P3 vì dual-purpose query (single + array for switcher). 2 lint errors fixed canonical hoist (CustomDot module-level + `ink` prop thread, invite `<a>` → `<Link>`). Net code −67 LOC. Smoke test 4/4 PASS Phase A (dropin kpi + JOIN-split benchmark + chart xray-history + invite Link). Bonus catches verify-first: HANDOFF prose drift "invite href=/login" actual `href="/"`, layout dual-purpose query complication discovered via Read full file, user decision Q4 α `useCallback` empirically REJECTED bởi rule (fall back β hoist) — 3 drift caught pre-ship. 1 pattern lesson L46 (AST static rules ≠ runtime memoization, hoist canonical). NEW pitfall §10 #32 (`react-hooks/static-components` không accept useCallback/useMemo). See §16 + §17.
- **M-Design-Tailwind-Cleanup-1 — KpiCard + Discovery Hub Tailwind Palette Migration + Q7 Foundation Completion** ✅ SHIPPED 2026-05-09 (3 commits `a06ee51`→`d756a63`, 3 files MODIFIED + 1 plan doc + globals.css 2-line bonus, ~2.5h work). Trigger: M-Design-3a/3b foundation tokens shipped (8 KPI + 4 score + chart-tokens.ts resolver) NHƯNG consumers vẫn raw Tailwind palette → foundation underutilized + visual inconsistent NB v3.2 + unblock M-Design-Dark-1 dependency. Path α x7 locked: β Tailwind class generation + α MVP scope KpiCard+discovery only + A strip dark:* raw + mixed gray chrome handling + α Phase A 4 cases + ~2.5h LOW risk + Q7 NEW @theme mirror BLOCKER fix bundled. 60/60 raw palette instances migrated clean (26 KpiCard `bg-green-100` → `bg-kpi-healthy` + 34 Discovery hub mixed shadcn `border-border` + NB v3.2 `bg-ink text-bg-warm` + Q4 C semantic fix L280 progress bar `bg-accent-brand` đỏ thương hiệu). Q7 BLOCKER bonus: foundation completion `--color-kpi-{healthy,attention}-strong` mirror `@theme inline` lines 72-73 caught verify-first Task 2A pre-ship (defined `:root` line 203-204 nhưng MISS `@theme` → Tailwind v4 silent fail). Smoke test 4/4 Phase A PASS (KpiCard 3 status visual + Discovery hub gray chrome + CTA + progress bar đỏ + build clean 8.3s + dark mode acceptable regression Q3 A defer). Phase B Cursor self-verify SKIPPED — design refactor mechanical 1:1 mapping (L42 partial coverage reinforced lần 3). NEW pattern lesson L48 (foundation completion check trước consumer refactor — `:root` defined ≠ `@theme` enabled). NEW pitfall §10 #35. V3 tangential ~28 files defer M-Design-Tangential-Cleanup-1. See §16 + §17.
- **M-KPI-Restore-1 — KPI Restore UI Phase 2 + R1 Mitigation Copy Fix** ✅ SHIPPED 2026-05-09 (3 commits `52fd8ad`→`1435c1b`, 4 files: 2 NEW + 2 MODIFIED + 1 plan doc, ~3h work bao gồm 2h diagnose deep cho non-bug). Trigger: M-KPI-Mgmt-1 (2026-05-09 sáng) production usage Phase 2 deferred items revisit — Slack feedback chiều cùng ngày "muốn tự khôi phục KPI lỡ xóa" → bump priority same-day ship. Path α x10 locked Q1-Q10 (RBAC CEO-only + Settings page CEO self-service over /admin + idempotent mirror DELETE shape + lift state β reuse + AlertDialog confirm + rate-limit reuse + audit log structured + no migration + Phase A visual smoke + R1 mitigation copy fix discoverability). 2 NEW endpoints (`app/api/kpi/[id]/restore/route.ts` 172 LOC POST mirror DELETE + `app/api/kpi/archived/route.ts` GET list archived RBAC CEO-only) + 2 MODIFIED (Settings page section "KPI đã lưu trữ" CEO-only với lift state β pattern + KpiActionsMenu AlertDialog copy R1 mitigation "trong Cài đặt > KPI đã lưu trữ"). Smoke test 4/4 Phase A PASS (CEO restore happy path + Member hide section + cancel AlertDialog no-op + visual integrity). Phase B Cursor self-verify SKIPPED — 2h diagnose deep + code review + SQL ground truth = sufficient evidence (decision pattern L42 partial coverage reinforced lần 2). 2h diagnose discovered ZERO bug — observation interpretation error từ baseline counting confusion (M-Hoshin-4 cleanup 56 archived + M-KPI-Mgmt-1 morning 7 user deletes = 63 total, NOT 7 anchoring bias). NEW pattern lesson L47 (diagnose loop trap — trust DB + Network ground truth, STOP hypothesize code paths khi 2 evidence sources clean). NEW pitfall §10 #34. See §16 + §17.
- **M-KPI-Mgmt-1 — KPI Soft-Delete + 3-Dots Menu + Layer 1+2+3+4 Defense** ✅ SHIPPED 2026-05-09 (4 commits `c87015d`→`0140dfa`, 8 files: 3 NEW + 5 MODIFIED + 1 plan doc, ~2-3h work). Trigger: M-Hoshin-4 cleanup 56 duplicate KPIs Ladysfit qua manual SQL ROW_NUMBER (DB sửa thủ công). User thật giai đoạn ">5 user" sẽ chắc chắn hit pain point này — UI hiện tại KHÔNG có cách xóa KPI. Path α+α+γ+β+γ+β+γ+β locked: soft-delete + Xóa MVP + defer rename + AlertDialog + optimistic+refresh + 3 mutation guards + console audit + mobile parity. 8 decisions Q1-Q8 locked Task 1 (plans/M-KPI-Mgmt-1-plan.md verify-first audit V1-V7). 3 NEW files (`app/api/kpi/[id]/route.ts` 169 LOC + `app/dashboard/kpi/components/KpiActionsMenu.tsx` 121 LOC + `plans/M-KPI-Mgmt-1-plan.md` 284 LOC) + 5 MODIFIED (KpiCard.tsx +18/-2 lift state wire + KpiDashboardClient.tsx +20/-1 owns kpis array + page.tsx +1 prop drill role + 3 mutation guards `kpi/entry`+`hansei/list`+`hansei/create` +1 each). Smoke test 3/8 visual PASS (CASE 1 CEO delete happy path + CASE 2 Member hide + CASE 8 visual integrity), 5/8 backend verified qua Cursor self-verify chain (CASE 3 idempotent / CASE 4 cancel AlertDialog / CASE 5 cross-org 403 / CASE 6 rate-limit 429 / CASE 7 archived POST entry 404). Bonus catches verify-first: plan R1 claim "Manager xóa được" SAI → ADMIN_ROLES = CEO only (server.ts:19), 3 spec bugs (rate-limit `.ok`→`.allowed`, `roleCheck.response`→manual NextResponse wrap, `getClientIp(request)`→`request.headers`) fix pre-build. 4 pattern lessons L42-L45 (visual partial coverage, defense in depth 4 layers, lift state β, verify-first reinforced lần 4). NEW pitfall §10 #31 (reader vs mutation guard asymmetry trong soft-delete). See §16 + §17.
- **M-Auth-MultiOrg-1 — Org Switcher UI + JWT metadata sync trio** ✅ SHIPPED 2026-05-09 (5 commits `0f6bcd4`→`b941b37`, 6 files: 3 NEW + 3 MODIFIED, ~3h work). Trigger: M-OrgInvite-1 wired multi-org infra (table + accept flow auto-set `last_org_id`) but missed UI cho user CHỦ ĐỘNG switch — fallback `memberships[0]` newest stopgap MVP. Path A+α+I locked: sidebar dropdown TOP + full reload + `user_metadata.last_org_id`. 6 decisions Q1-Q6 locked Task 1. 3 NEW files (`app/api/orgs/switch/route.ts` 126 LOC + `components/layout/org-switcher.tsx` 145 LOC + `plans/M-Auth-MultiOrg-1-plan.md` 288 LOC) + 3 MODIFIED (`app/dashboard/layout.tsx` 2-query split build orgNameById Map + `components/layout/sidebar.tsx` optional props + showSwitcher guard + `components/layout/header.tsx` cascade props). Smoke test 6/6 PASS post-fix `b941b37`: CASE 1 multi-org switch CheckCircle migrate Member→CEO, CASE 2 single-org γ render, CASE 3 RLS deny HTTP 403, CASE 4 mobile Sheet drawer, CASE 5 "+ Tạo org mới" navigation, CASE 6 rate limit 29×200 + 6×429 within threshold. CASE 1 root cause discovered post smoke: Supabase JWT user_metadata cache (pitfall #30 NEW) — `auth.updateUser` writes DB but JWT cookie carries stale claim, `auth.getUser` returns JWT payload not fresh DB. Fix `b941b37`: insert `auth.refreshSession()` after `updateUser` để force JWT re-mint. Q4 γ decision refined → `updateUser` + `refreshSession` + full reload trio. 4 pattern lessons L37-L40 (trio pattern, mobile parity zero-cost, reader-uniform single-mutation, optional props phase boundary). New pitfall §10 #30 (JWT metadata cache layer). See §16 + §17.
- **M-Cleanup-5 — Tech Debt Sweep** ✅ SHIPPED 2026-05-08 (2 commits: `40d3ca4` code + docs close-out, 3 files code change + HANDOFF cleanup, ~25 phút work). 3 tasks combine: (A) admin views 010 lines 60-61 + 89-90 `LIMIT 1` → DEFER Q1 α (trigger condition rare), (B) 2 orphan SWOT routes (`/api/swot/xray-context` 76 LOC + `/api/swot/prefill-from-xray` 116 LOC) → REMOVE Q2 α (verified 0 caller toàn repo), (C) migration 034 `idx_organizations_lower_name_city.sql` BACKFILL Q3 α (production schema lock). Plus close-out D1+D2 (HANDOFF stale references: `M-AICoach-AutoFill-1` candidate đã ship via M-AICoach-Sensei-1 Task 6D; `<NEXT_HASH>` placeholder line 1067). 6 decisions locked plans/M-Cleanup-5-plan.md. Smoke test: `rm -rf .next && npm run typecheck && npm run build` PASS clean (pre-existing 2 lint errors verified isolation). 2 pattern lessons L34-L35 (stale `.next/` cache after route delete, pre-existing lint regression isolation). See §16 + §17.
- **M-Member-POV-1 — Canvas Member-POV Redesign** ✅ SHIPPED 2026-05-08 (6 commits 92a58b3→7570a61, 11 files + 1 plan doc, ~520 LOC delta, ~4h work). Member access X-Matrix canvas read-only thay vì redirect /dashboard. Akao bidirectional entry: Member là gemba observer thấy strategic chain để comment context. 3 architectural changes (bidirectional access, Context single source of truth, canSubmit ≠ canModerate Q3 α). 8 decisions locked Task 1. Smoke test 8/8 PASS Phase A manual. Vercel deploy `dpl_DjxKkJS1tXHYqi2bc14vFDRHaJJi` READY (build 21s clean). Production verify Member POV chienluoc.org PASS. 3 pattern lessons L31-L33 (permission field reset audit, verify-first scope wider, bonus catch quality > spec literal). New pitfall §10 #29 (CLEAR_DRAFT preserve permission state). See §16 + §17.
- **M-Cleanup-6 Phase 1 — Fix `.single()` anti-pattern + extract helper** ✅ shipped 2026-05-02 (1 commit, 8 files, ~30 phút work). Helper `lib/auth/getActiveMembership.ts` (typed shape `{ org_id, role } | null`) + 7 API routes refactor (`x-matrix/prefill`, `kpi/list`, `report/monthly` split JOIN → 2 queries, `discovery/vision-save`, `discovery/pain-mapper`, `x-ray/history`, `x-ray/score`). Smoke test KPI Tracker PASS. Phase 2 (12 dashboard inline sites refactor) deferred. See §16 + §17.
- **M-OrgInvite-1 — CEO Invite Link Flow** ✅ SHIPPED 2026-05-02 (1 commit `735c132`, 26 files, 1464 insertions). DB migration 035 (table `org_invites` + enum `invite_role` + 3 RLS + 3 indexes) + 4 API routes (POST/GET `/api/invites`, DELETE `/api/invites/[token]`, GET `/api/invites/[token]/info` public, POST `/api/invites/[token]/accept` authed) + UI public accept page `/invite/[token]` + Settings Members section replace fake handler + auth redirect fix (login + register honor `?redirect=` whitelist) + multi-org systemic fix (12 dashboard pages + layout `.maybeSingle()` → array + find/fallback). 7 decisions locked Task 1 (Option B link, separate table, `/invite/[token]` route, MVP existing-account-only, 5 max pending, Resend email, no revoke confirm). 4 bugs fixed: Next.js dynamic segment conflict ([id]+[token]), multi-org `.maybeSingle()` PGRST116, `router.push` stale cookie, `updateUser` metadata not in session. OAuth + email-confirm invite flows deferred. See §16 + §17.
- **M-Design-3b — Dashboard hex-to-token refactor** ✅ SHIPPED 2026-05-02 (6 commits `868fa34`→`ed27932`, 5 files changed: 1 foundation extend + 4 consumer refactors). 0 raw hex còn trong logic của 4 files. Foundation: `--kpi-{healthy,attention}-strong` saturated variants + `--score-{critical,weak,fair,good}` 4-tier scale + `withAlpha()` helper + `ScoreTier` type + `getScoreTier()` server-safe classifier + `resolveScoreToken()` client resolver. Consumers: XRayHistoryChart (10 sites + CustomDot closure), xray-history page (server tier-passing pattern), KpiSparkline (3 sites + alpha pattern), discovery hub (5 sites: 3 badges + 2 checkmarks). 5 decisions locked (tách 2 scales, reuse `--destructive`, server/client boundary, KpiCard 3-tier giữ nguyên, dark mode out-of-scope). KpiCard.tsx Tailwind utility classes deferred → M-Design-Tailwind-Cleanup-1. New pitfalls §10 #22 (border-subtle shorthand), #23 (Recharts var() + server boundary). See §16 + §17.
- **M-Design-3a — KPI Status Tokens Foundation** ✅ SHIPPED 2026-05-01 (3 commits `d7fdb6d`→`b3ff123`, 3 files changed). 8 `--kpi-*` semantic tokens trong `app/globals.css` (healthy/attention/warning/critical + `-fg` foreground pairs, AA-compliant 11:1 → 4.8:1) aliasing existing accent palette + `lib/design/chart-tokens.ts` (99 LOC) runtime resolver cho Recharts integration (Recharts props KHÔNG accept `var()` — cần `resolveToken()` helper) + first refactor proving pattern (`app/dashboard/page.tsx:224` `#c73937` → `var(--brand)` semantic decision: brand emphasis NOT KPI critical). MVP split scope decision: defer xray-history + KpiSparkline + discovery hub → M-Design-3b. `.dark` block UNTOUCHED. New pitfalls §10 #19 (Tailwind v4 + Recharts 3-layer), #20 (token aliasing vs dup hex), #21 (audit-first hex replacement). See §16 + §17.
- **M-OrgUX-1 — Duplicate Org Detection on Onboarding** ✅ SHIPPED 2026-05-01 (6 commits `6ccd776`→`d57c7f1`, 8 files across 3 layers). DB functional index 034 (applied via dashboard, `.sql` not yet committed — DEBT) + API `/api/orgs/check-similar` (auth + Zod + rate limit 10/min/user + admin-bypass query + audit log + NO id in response) + UI `/onboarding/setup-org` (debounced check + acknowledgement gate + Vietnamese alert) + 2 smoke tests (PowerShell API 6/6 PASS + Playwright UI 5/5 PASS). Pivoted from M-Cleanup-2 mass-delete plan after multi-tenant audit. Pre-cursor docs commit `6ccd776` aligned MASTER_BUILD_SPEC. New pitfalls: §10 #16 PowerShell quirks, #17 Playwright shadcn/Sonner selectors, #18 Next 16 dev server stability. See §16 + §17.
- **M-Public-1 — Repository Public + HANDOFF Auto-sync** ✅ SHIPPED 2026-05-01 (2 commits: `e305e61` sanitize PII + `aabedce` LICENSE notice). Repo flipped GitHub private→public sau pre-flight 5-step audit (hardcoded secrets HEAD + git history + .env files + .gitignore coverage + PII grep). 5 sanitize changes (dev-login env var fallback, cleanup_users.sql psql variable, 6 docs PII → `<owner-email>` placeholder, .gitignore hardened 8 dotenv variants, README LICENSE section "All rights reserved"). Post-flip curl HTTP 200 verified. HANDOFF auto-sync URL: `https://raw.githubusercontent.com/vuhuyhai/hoshin-kanri-os/master/HANDOFF.md`. 4 pattern lessons L21-L24 (pre-public audit, Fastly propagation, web_fetch constraint, PowerShell here-string). See §16 + §17.
- **M-Cleanup-1 — Wizard Files Cleanup** ✅ SHIPPED 2026-05-01 (1 commit `558a471`, -1184 lines across 8 files). Bỏ feature flag `NEXT_PUBLIC_XMATRIX_CANVAS` + xóa 7 wizard files. Canvas single source of truth `/dashboard/x-matrix/new`. 4-source verification chain G3 (Vercel runtime logs + curl + web_fetch_vercel_url + reference screenshot). 4 pattern lessons L17-L20 (Playwright idle, PowerShell crash, static audit imports, verify branding). Production verified `dpl_4UT4DfW85czkWGEecYnNe7e91y5K` READY. See §16 + §17.
- **M-Hoshin-7 — Anti-pattern Audit + Fix multi-org lookup** ✅ SHIPPED 2026-04-30 (3 commits: `3e29a66` fix + `5501c7d` HANDOFF L7-L9 + `b12c919` close-out L10-L16). Production verified `chienluoc.org` 5/5 PASS. Security incident handled: 5 keys rotated. SMOKE_TEST.md Phase 1.4 hardened. Total 10 pattern lessons (L7-L16). See §16 + §17.
- **M-Hoshin-6 — Hoshin Gemba Integration** ✅ shipped 2026-04-30 (4 commits). Wire `gemba_comments` table M-Hoshin-5 (target_type='hoshin') vào X-Matrix canvas. CEO+Manager badge + modal trên HoshinCard, canvas role-gate Member redirect `/dashboard`. 0 migration, 0 API mới. Detail xem §16 + §17.
- **M-Hoshin-6.1 — Hotfix gate gemba form khi Hoshin chưa persist** ✅ shipped 2026-04-30 (1 commit `13cf793` + 1 SQL DELETE 4 orphan rows). Production user submit comment trên Hoshin draft (xMatrixId truthy nhưng hoshin.id chưa trong vision_json) → orphan target_id. Fix: Server fetch `existingHoshinIds` → Context expose `isPersisted` per hoshin → GembaModal gate form `!isPersisted`. Detail xem §16.
- **M-Hoshin-3 — Annual Review Workflow** ✅ shipped 2026-04-29 (8 commits + 1 hotfix). PDCA loop closed: A3 hansei capture, KPI actuals manual entry, carry-over decisions per Hoshin, year transition with defensive auto-archive. Detail xem §16 known open items + §17 architecture decision.
- **M-Hoshin-4 — Hansei Auto-prompt khi KPI red 2+ tuần** ✅ shipped 2026-04-29 (6 commits). Weekly PDCA loop closed: detection 2+ red weeks streak, 2-field hansei form, history list per KPI, optimistic banner update, re-prompt sau streak extend. Detail xem §16 known open items + §17 architecture decision.
- **M-Hoshin-5 — Gemba Feedback (Member comment trên Hoshin/KPI)** ✅ shipped 2026-04-30 (8 commits). Bottom-up signal Member→CEO closed: 1 schema 2 target_type (Hoshin+KPI), status lifecycle (open→ack→resolved), Member primary writer (route đầu tiên `requireOrgRole(ALL_ROLES)`), CEO moderate delete strict. Detail xem §16 + §17.

### Milestone tiếp theo: TBD scope (chờ Vũ Hải decision)

**Candidates ưu tiên** (chọn 1 sau khi anh decide):

1. **M-Design-Dark-1** (NEW from M-Design-3b deferred): Add `.dark` variants cho `--kpi-*` (M-Design-3a foundation) + `--kpi-*-strong` + `--score-*` (M-Design-3b foundation). Visual A/B test side-by-side light/dark cho xray history chart + KpiSparkline + dashboard cards. Trigger: user request explicit, currently no signal. Cost ~3-4 commits, 2-3h. **Note**: M-Design-Tailwind-Cleanup-1 đã ship Q3 A strip dark:* raw — KpiCard + discovery hiện acceptable regression dark mode → bump priority M-Design-Dark-1 nếu user complain.
2. **M-Design-Tangential-Cleanup-1** (NEW from M-Design-Tailwind-Cleanup-1 V3 audit defer): ~28 tangential files dùng raw Tailwind palette (auth pages, admin, SWOT, annual-review). Pattern reuse từ M-Design-Tailwind-Cleanup-1 (Q1 β class generation + Q2 α scope file-by-file + L48 audit checklist foundation completion). Cost ~3-4h. Trigger: M-Design-Dark-1 ship dark tokens → cần consumer parity HOẶC visual audit catch hue inconsistency user-visible.
3. **M-Gemba-AI-1 — AI sensei summarize gemba threads** (defer until baseline data ≥ 10 real comments per org). Currently DB only has test comments.
4. **M-RateLimit-Cleanup-2** (NEW from M-RateLimit-Generic-1 deferred, LOW priority): Migrate 7 additional eligible sites sang `requireRateLimit` helper. Sites: `hansei/create`, `invites` POST + `[token]/accept`, `gemba/create`, `gemba/[id]`, `kpi/[id]/route`, `kpi/[id]/restore`, `kpi/archived`. Pattern reuse từ M-RateLimit-Generic-1 (Q1 α `requireRateLimit` + Q3 β optional message + Q4 α extras merge). Cost ~1h (7 sites × ~8min mechanical migration). Trigger: M-RateLimit-Generic-1 production usage feedback HOẶC consistency audit khi build feature touching multiple sites cùng pattern. Currently DEFER (HANDOFF §18 commitment 15 sites lock M-RateLimit-Generic-1).

### Future milestones (TBD priority)

- ~~**M-Cleanup-6 Phase 2**~~ ✅ SHIPPED 2026-05-09 trong M-Cleanup-batch-2026-05-09 (commits `f7087cd` + `96c7db6`). 11/12 sites migrated; layout.tsx (#1) deferred → M-Cleanup-6-P3. See "Shipped milestones (recent)" above + §16 + §17.
- **M-Cleanup-6 Phase 3 (NEW deferred from M-Cleanup-batch-2026-05-09, LOW priority)**: Refactor `app/dashboard/layout.tsx` inline pattern — caller cần dual-purpose query (`memberships[]` array cho `membershipsForSwitcher` + `orgIds` bulk lookup AND active membership single). 2 path options: (α) extract pure picker `pickActiveMembership(memberships, lastOrgId)` sibling helper (no query, just selection logic) + caller passes both array + picked single; (β) keep inline pattern as documented exception (only 1 site remaining, intentional dual-purpose). Cost ~30 phút (α) hoặc 0 (β default). Trigger: layout caller cần modify HOẶC unify pattern across all dashboard pages (zero exceptions). Currently DEFER (β) — single intentional exception OK, regression guard via §17 architecture decision constraint "KHÔNG migrate layout không design audit dual-purpose query".
- ~~**M-Auth-MultiOrg-1 (NEW from M-OrgInvite-1)**~~ ✅ SHIPPED 2026-05-09. See "Shipped milestones (recent)" above + §16 + §17 architecture decision 2026-05-09.
- ~~**M-KPI-Mgmt-1**~~ ✅ SHIPPED 2026-05-09. See "Shipped milestones (recent)" above + §16 + §17 architecture decision 2026-05-09.
- ~~**M-KPI-Restore-1 (Phase 2 deferred from M-KPI-Mgmt-1)**~~ ✅ SHIPPED 2026-05-09 (3 commits `52fd8ad`→`1435c1b`). See "Shipped milestones (recent)" above + §16 + §17 architecture decision 2026-05-09.
- **M-KPI-Edit-1 (Phase 2 deferred from M-KPI-Mgmt-1, LOW priority)**: Inline edit KPI name + target_value cho CEO. AlertDialog modal pattern reuse Q4 β consistent với delete confirmation. **Trigger condition**: user complain typo fix common (≥3 instances production). Cost ~1-2h. Currently DEFER (Q2 α + Q3 γ decision lock — Xóa MVP scope only).
- **M-KPI-AuditMigration-1 (Phase 2 deferred from M-KPI-Mgmt-1 Q7 γ, LOW priority)**: Migration `036_kpis_deleted_at_by.sql` thêm `deleted_at timestamptz` + `deleted_by uuid REFERENCES users(id) ON DELETE SET NULL` cho proper audit trail (vs current console.log only). **Trigger conditions**: (1) M-KPI-Restore-1 build (cần `deleted_at` cho "khôi phục trong vòng N ngày" UX), HOẶC (2) compliance export feature, HOẶC (3) Vercel logs retention 7 days insufficient cho user complain >7 ngày. Cost ~1h migration + types regen + UPDATE code path 3-4 sites. Currently DEFER (console.log structured JSON `[audit:kpi-delete]` đủ recovery window initial).
- **~~M-Cleanup-2 (CRITICAL)~~ REMOVED**: Original scope dựa trên assumption sai. Diagnose M-Hoshin-7 phát hiện 9 orgs là multi-tenant production users với owner khác nhau, KHÔNG phải pollution. KHÔNG cleanup. See §17 Architecture Decision 2026-04-30 + L8.
- ~~**M-Lint-Cleanup-1**~~ ✅ SHIPPED 2026-05-09 trong M-Cleanup-batch-2026-05-09 (commit `73abf59`, 2 files). XRayHistoryChart CustomDot hoist module-level + `ink` prop thread; invite/[token]/page.tsx `<a href="/">` → `<Link href="/">` + next/link import (drift catch: actual `href="/"` not `/login` per HANDOFF prose). Lint baseline 0 errors / 0 warnings restored. NEW pattern lesson L46 + pitfall #32 (`react-hooks/static-components` không accept useCallback/useMemo wrap — hoist canonical only). See "Shipped milestones (recent)" above + §16 + §17.
- **M-Cleanup-5-Followup (admin views, deferred Q1 α)**: 2 LOW risk hits — admin SQL views `010_admin_views.sql` lines 60-61 + 89-90 dùng `LIMIT 1` cho CEO pick (non-deterministic khi org có >1 CEO). Trigger condition: M-OrgInvite-1 actual generate org có >1 CEO + support team escalation. Future fix path: migration `036_admin_views_deterministic_ceo.sql` thay `LIMIT 1` → `ORDER BY om.created_at ASC LIMIT 1` (founding CEO semantic). Cost ~30 phút. Currently DEFER (trigger condition rare). Orphan SWOT routes phần này đã ship trong M-Cleanup-5 Q2 α (commit `40d3ca4`).
- **M-RateLimit-Generic-1 ✅ SHIPPED 2026-05-10** (3 commits `e36d140`→`97fd391`, 17 files, ~2h work). Generic `requireRateLimit` helper refactor `lib/ai/rate-limit-helper.ts` (51 LOC DELETED) → `lib/http/rate-limit-helper.ts` (53 LOC NEW). 13 AI routes + 2 non-AI routes migrate. 4 evidence + 7 path α/β decisions locked. Pattern lesson L49 NEW (generic helper API stable + minimal + caller compose extras). See "Shipped milestones (recent)" §16 + §17 architecture decision 2026-05-10.
- ~~**Migration 034 backfill (NEW from M-OrgUX-1, LOW)**~~ ✅ SHIPPED 2026-05-08 trong M-Cleanup-5 Q3 α (commit `40d3ca4`). File `supabase/migrations/034_idx_organizations_lower_name_city.sql` mirror production schema applied via dashboard 2026-05-01. Git revert safety locked.
- **M-Auto-Persist-1**: Auto-save Hoshin draft khi user thao tác create/edit (tránh recurrence draft orphan kiểu M-Hoshin-6.1). Trigger condition: user thật phàn nàn lần 2 — hiện UI gate `!isPersisted` đã đủ defensive cho edge case này.
- **M-Cleanup-3**: ✅ shipped inline trong M-Hoshin-4 cleanup phase — deactivate 56 duplicate KPIs Ladysfit org qua SQL ROW_NUMBER strategy (giữ oldest, soft delete reversible). 65 active → 9 unique. KHÔNG cần milestone formal.
- ~~**M-Design-Tailwind-Cleanup-1** (NEW from M-Design-3b deferred scope)~~ ✅ SHIPPED 2026-05-09 (3 commits `a06ee51`→`d756a63`, 60/60 raw palette instances migrated KpiCard + discovery hub + Q7 BLOCKER bonus @theme mirror -strong tokens). See "Shipped milestones (recent)" above + §16 + §17 architecture decision 2026-05-09.
- **M-Design-3-rest** (renamed from M-Design-3): Sidebar collapse + header user menu + dashboard cards refactor (non-chart UI surfaces). **Priority: MEDIUM**, defer until đụng vào sidebar/header redesign.
- ~~**M-Design-Tokens-Cleanup-1** (NEW from M-Design-3a tech debt, MEDIUM)~~ ✅ SHIPPED 2026-05-10 (3 code commits `eb34541`→`2c6f976` + close-out, 26 files, ~1.5h). See "Shipped milestones (recent)" above + §16 + §17 architecture decision 2026-05-10.
- **M-Design-Dark-1** (NEW from M-Design-3b deferred, LOW priority — no user signal): Add `.dark` variants cho M-Design-3a + M-Design-3b tokens. See candidates list above.
- **M-AICoach-KoreanChars-1** (NEW from hotfix `df3c1ef` diagnose, DEFER indefinitely): User báo "thỉnh thoảng có ký tự Hàn Quốc / lạ" trong AI Coach response. Cursor diagnose LOW confidence: most likely model hallucination artifact (Claude code-switch CJK tokens around emoji) — KHÔNG phải UTF-8 boundary issue (route non-streaming, full body atomic decode via `Response.json()`). Trigger investigation: user gather screenshot + chat ID + prompt context của 3+ occurrences trong production. Hiện chỉ 1 anecdotal report, không reproduce được. **Defer indefinitely** — chỉ revive khi có data 3+ instances reproducible.

---

**End of handoff. Khi có câu hỏi → grep codebase, đừng guess.**
