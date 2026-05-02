# HANDOFF — Hoshin Kanri OS

> **Mục đích**: Tài liệu này là "one-shot context pack" để bất kỳ Claude session mới nào hiểu đầy đủ về kiến trúc, code conventions, pitfalls đã gặp và trạng thái hiện tại của repo. Đọc file này trước khi code.
>
> **Last verified**: 2026-05-02 — post M-Design-3b (Dashboard hex-to-token refactor: score-tier + kpi-strong tokens foundation + 4 files refactored to consume them, 6 commits 868fa34→ed27932, HEAD ed27932). Preceded by M-Design-3a (KPI status tokens foundation + chart-tokens runtime resolver + first dashboard hex refactor, 3 commits d7fdb6d→b3ff123).
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
- `.overline`, `.label-brutal`, `.heading-overline`, `.field-label`, `.field-hint`

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

## 16. Current State Snapshot (2026-05-02 — post M-Design-3b)

- **Production URL**: https://chienluoc.org (custom domain on Vercel, verified 2026-05-01 post M-Cleanup-1 deploy `dpl_4UT4DfW85czkWGEecYnNe7e91y5K` READY)
- **Repo**: PUBLIC since 2026-05-01 (M-Public-1). License: All rights reserved (no commercial use without written permission).
- **HANDOFF auto-fetch URL**: `https://raw.githubusercontent.com/vuhuyhai/hoshin-kanri-os/master/HANDOFF.md` — em (AI) tự fetch đầu mỗi chat mới về Hoshin Kanri, KHÔNG cần Vũ Hải re-upload Project knowledge. Fastly CDN propagation ~5-15 min sau visibility flip (xem L22).
- **Last verified**: 2026-05-02 — post M-Design-3b (Dashboard hex-to-token refactor: 6 commits `868fa34`→`ed27932`, HEAD `ed27932`, 4 files refactored, 0 raw hex còn trong logic). Foundation extended (`--score-{critical,weak,fair,good}` saturated 4-tier + `--kpi-{healthy,attention}-strong` saturated variants + `withAlpha()` helper) + 4 consumer refactors (xray-history page + chart, KpiSparkline, discovery hub badges + checkmarks). Preceded by M-Design-3a (KPI tokens foundation, 3 commits `d7fdb6d`→`b3ff123`).
- **Last migration applied**: `034` — functional index `idx_organizations_lower_name_city` on `lower(name), lower(city)` (Supabase version `20260501061239`, applied via dashboard SQL editor — `.sql` file not yet committed to `supabase/migrations/`). Index size ~16 KB at 9 orgs; scales linearly ~10 MB / 100k orgs.
- **API routes count**: 48 (47 + `/api/orgs/check-similar`)
- **Lib modules**: admin, ai, analytics, annual-review, blog, discovery, email, hansei, http, newsletter, pql, supabase, swot, validation, x-matrix, x-ray + rate-limit.ts
- **Components**: analytics (2), annual-review (6), blog (8), dashboard (AnnualReviewBanner + AnnualReviewCard), gemba (4 — GembaBanner + GembaCommentForm + GembaCommentThread + KpiGembaSection client wrapper), hansei (3 — HanseiBanner + HanseiForm + HanseiHistoryList), layout (4), providers (3), swot (35+), ui (15), x-matrix — top-level files xóa hoàn toàn ở M-Cleanup-1 (7 wizard files: XMatrixWizard + Step1-4 + WizardProgress + XMatrixReview). Còn lại: `components/x-matrix/canvas/` (XMatrixCanvasPage + CanvasGrid + CanvasHeader + CanvasMiniMap + CenterX + CoachPopover + EducationalTooltip + GembaModal + PrefillModal + SubmitBar + VisionEditor + cards/ + edges/ + modals/ + state/). Canvas là single source of truth cho `/dashboard/x-matrix/new`. Route-local Server Components: `app/dashboard/x-matrix/new/components/HoshinGembaSection.tsx` + `HoshinGembaSectionClient.tsx` (Context provider).
- **Dashboard routes**: discovery (swot/pain-mapper/vision-workshop/synthesis/benchmark/xray-history), x-matrix/new (→ HoshinGembaSection wrap canvas), x-matrix/[year]/review, kpi (→ KpiHanseiSection wired ABOVE KpiDashboardClient), report, settings, help
- **Admin routes**: customers, hoshin-explorer, blog (list/new/edit/categories/tags)
- **Latest feature work**: M-Design-3b (Dashboard hex-to-token refactor) — 6 commits `868fa34`→`ed27932`, 5 files changed (1 foundation + 4 consumers):
  - `868fa34` feat(design): add score tier + kpi-strong tokens for M-Design-3b foundation. Add 6 new tokens trong `app/globals.css :root`: `--kpi-healthy-strong: #16A34A` + `--kpi-attention-strong: #D97706` (saturated companions cho pastel `--kpi-*`) + `--score-{critical,weak,fair,good}` 4-tier saturated cho X-Ray health score. Extend `lib/design/chart-tokens.ts`: `ScoreTier` type, `getScoreTier(score)` server-safe classifier, `resolveScoreToken(tier)` client resolver, `SCORE_TOKEN_NAMES` Record map, extend `KPI_TOKEN_NAMES` thêm `healthyStrong`/`attentionStrong`. `--kpi-warning-strong` deliberately KHÔNG ship — reuse shadcn `--destructive` cho red strokes. `.dark` block UNTOUCHED.
  - `8121194` refactor(xray): replace hardcoded hex with design tokens. `app/dashboard/discovery/xray-history/XRayHistoryChart.tsx` (client component) — 10 hex sites → `resolveToken('ink')` + `resolveToken('chart-4')` + `resolveScoreToken({critical,weak,fair})`. Stray `#2C2B2B` legacy color normalized → `--ink` (#1A1A1A) tại 4 sites. Move `CustomDot` inside main component closure để share resolved `ink` ref. 2 SSR fallback hex còn lại (`'#1A1A1A'`, `'#8A8787'`) trong `resolveToken(...)` args là intentional defaults — prevent black-flash khi SSR.
  - `8d875d7` refactor(xray-history): replace hardcoded hex with score tier tokens. `app/dashboard/discovery/xray-history/page.tsx` (server) delete `getScoreColor()`, import `getScoreTier`. Score number span dùng `style={{ color: \`var(--score-${getScoreTier(score)})\` }}` (Pattern C — var() resolve client-side trên HTML element). `chartData.color: string` → `chartData.tier: ScoreTier` data contract change. Client `XRayHistoryChart` consume `payload.tier` → `resolveScoreToken(payload.tier)` cho `<Dot fill>`. Locks in "server return tier name, client resolve color" pattern (decision §3).
  - `6eea631` refactor(kpi): replace hardcoded hex with strong tokens + add withAlpha helper. `app/dashboard/kpi/components/KpiSparkline.tsx` — 3 hardcoded hex strokes → `resolveToken('kpi-healthy-strong'/'kpi-attention-strong'/'destructive')`. Area fills (alpha 12.5%) dùng `withAlpha(color, '20')` helper mới — defensive regex check, returns `'transparent'` cho non-hex-6 input. Shape collapse `{ line, fill, dot }` → `{ stroke, fill }` (dot fill = stroke color, same hue). Visual diff intent: green deeper (`#22c55e` → `#16A34A`), amber deeper (`#eab308` → `#D97706`); red unchanged.
  - `792e43c` refactor(discovery): replace badge hex with KPI pastel tokens. `app/dashboard/discovery/page.tsx` — 3 module-level const `BADGE_STYLE_{DONE,NEXT,LOCKED}` để dedupe 4 inline-style sites (DONE used 2x). Map Tailwind palette → KPI tokens với intentional hue shift (emerald → kpi-healthy lime, amber → kpi-attention warm yellow). LOCKED border dùng `color-mix(in srgb, var(--text-3) 30%, transparent)` mirror visual weight gốc.
  - `ed27932` refactor(discovery): replace checkmark hex with score-good token. 2 sites `#059669` (emerald-600) → `var(--score-good)` (#16A34A green-600) ở step-list checkmark + "Hoàn thành!" overline. Align success indicator hue với X-Ray "Tốt" tier + chart success ReferenceLine. `discovery/page.tsx` hex-clean (0 matches).
  - **Files deferred**: `app/dashboard/kpi/components/KpiCard.tsx` Tailwind utility classes (`bg-green-100`, `text-red-600`, etc.) — KHÔNG phải inline hex → out of scope M-Design-3b. Defer M-Design-Tailwind-Cleanup-1.
- **Previous feature work**: M-Design-3a (KPI status tokens foundation, 3 commits `d7fdb6d`→`b3ff123`, 3 files: 8 `--kpi-*` tokens + `lib/design/chart-tokens.ts` runtime resolver + first dashboard hex refactor `app/dashboard/page.tsx:224`) → M-OrgUX-1 (Duplicate Org Detection on Onboarding, 6 commits `6ccd776`→`d57c7f1`) → M-Public-1 (repo public + HANDOFF auto-sync, 2 commits `e305e61`+`aabedce`) → M-Cleanup-1 (wizard files cleanup, 1 commit `558a471`, -1184 lines) → M-Hoshin-7 (anti-pattern audit + fix multi-org `.limit(1).single()` lookup, 1 commit `3e29a66`).
- **Known open items**:
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

1. **M-OrgInvite-1 — Request-to-join flow** (NEW from M-OrgUX-1): Feature complement của duplicate detection. Khi user thấy warning "đã có công ty tương tự", currently chỉ có path là acknowledge + tạo mới. Add path "Yêu cầu CEO mời tôi vào org đó" — gửi notification CEO target org, CEO approve/reject. Cost ~5-7 commits (DB notifications table + 2 API + UI request modal + email digest).
2. **M-Member-POV-1 — Canvas Member-POV redesign**: Mở Member access canvas + hide edit affordances. Cost ~5-7 commits, 1-2 sessions.
3. **M-Design-Tailwind-Cleanup-1** (NEW from M-Design-3b deferred scope): KpiCard.tsx Tailwind utility classes (`bg-green-100`, `text-red-600`, `border-red-200`, `dark:bg-green-950`, etc.) + tangential utilities trong `discovery/page.tsx` (`border-red-300`, `text-amber-600`, `bg-gray-900`, etc.) không khớp NB palette / KPI tokens. Cần decision: tạo utility classes mới (`.kpi-healthy-bg` etc.) hay convert sang inline style với CSS vars. Cost ~2-3h. **Trigger**: design audit khám phá hue mismatch user-visible HOẶC milestone refactor dashboard sang dark mode (M-Design-Dark-1).
4. **M-Design-Tokens-Cleanup-1** (NEW from M-Design-3a tech debt): `--brand`/`--accent` collision cleanup. `globals.css` line 169 reassigns `--accent: var(--brand)` (#c73937), override shadcn neutral `--accent: #ECEAE6` used cho menu/sidebar hover patterns. Audit components dùng `var(--accent)` to determine if brand-coloring is intentional or accidental. Cost ~1-2 commits + visual regression check.
5. **M-Design-Dark-1** (NEW from M-Design-3b deferred): Add `.dark` variants cho `--kpi-*` (M-Design-3a foundation) + `--kpi-*-strong` + `--score-*` (M-Design-3b foundation). Visual A/B test side-by-side light/dark cho xray history chart + KpiSparkline + dashboard cards. Trigger: user request explicit, currently no signal. Cost ~3-4 commits, 2-3h.
6. **M-Cleanup-5 — Admin views + orphan SWOT routes**: 2 SQL views LIMIT 1 + 2 orphan routes (`/api/swot/xray-context` + `/api/swot/prefill-from-xray` — 0 frontend caller). Cost ~30 phút (verify trigger trước).
7. **M-Gemba-AI-1 — AI sensei summarize gemba threads** (defer until baseline data ≥ 10 real comments per org). Currently DB only has test comments.

**Em recommend M-OrgInvite-1** — UX loop closure cho M-OrgUX-1 (duplicate detection) là gap visible khi user gặp warning. Member-POV-1 valuable second nhưng scope rộng hơn. Tailwind/Tokens cleanup là tech debt, defer until trigger thật. M-Design-Dark-1 không có signal user, defer đến request.

### Future milestones (TBD priority)

- **M-KPI-Mgmt-1**: Soft-delete UI cho KPI individual + restore mechanism. Endpoint `/api/kpi/[id]` DELETE method (soft `is_active=false`), KpiCard 3-dots menu với option "Xóa KPI", confirmation modal "Xóa sẽ ẩn khỏi dashboard nhưng giữ lịch sử. Tiếp tục?", optimistic update + toast. Edge cases: restore archived KPIs UI, allow delete khi có active hansei (soft delete preserve FK refs). Effort estimate ~120 dòng + 1 API + 1 modal + 30 phút smoke test. **Trigger conditions**: (1) user thật (không phải solo dev) cần manage KPIs, hoặc (2) data pollution lặp lại > 50 duplicate KPIs lần thứ 2.
- **~~M-Cleanup-2 (CRITICAL)~~ REMOVED**: Original scope dựa trên assumption sai. Diagnose M-Hoshin-7 phát hiện 9 orgs là multi-tenant production users với owner khác nhau, KHÔNG phải pollution. KHÔNG cleanup. See §17 Architecture Decision 2026-04-30 + L8.
- **M-Cleanup-5 (NEW from M-Hoshin-7)**: 2 LOW risk hits — admin SQL views `010_admin_views.sql` lines 60-61 + 89-90 dùng `LIMIT 1` cho CEO pick. Trigger condition: support team có >1 CEO per org. Currently rare → defer. Plus 2 orphan routes candidate cleanup (`/api/swot/xray-context` + `/api/swot/prefill-from-xray` — 0 frontend caller, có thể dead from refactor). Trigger condition: confirm Vũ Hải 2 routes dead. Cost ~30 phút.
- **M-RateLimit-Generic-1 (NEW from M-OrgUX-1, MEDIUM)**: Refactor `requireAiRateLimit` (`lib/ai/rate-limit-helper.ts`) thành generic `requireRateLimit(bucket, opts)` để route non-AI (vd `/api/orgs/check-similar`) không phải call `checkRateLimit` direct. Trigger condition: 2-3 more non-AI routes need rate limiting (currently just 1 — orgs/check-similar). Cost ~1 commit (move file `lib/ai/` → `lib/http/` + rename + update 13+ call sites). DEBT MEDIUM.
- **Migration 034 backfill (NEW from M-OrgUX-1, LOW)**: Commit `.sql` file cho migration 034 (`idx_organizations_lower_name_city`) vào `supabase/migrations/`. Currently applied via dashboard, not in repo — git revert can't roll back the index. Trigger condition: any future schema change touches `organizations` table → backfill 034 cùng commit. Cost ~5 phút.
- **M-OrgInvite-1 (NEW from M-OrgUX-1)**: Complete UX loop opened by M-OrgUX-1 — request-to-join flow when user lands on duplicate warning. CEO approve/reject path. See candidates list above.
- **M-Auto-Persist-1**: Auto-save Hoshin draft khi user thao tác create/edit (tránh recurrence draft orphan kiểu M-Hoshin-6.1). Trigger condition: user thật phàn nàn lần 2 — hiện UI gate `!isPersisted` đã đủ defensive cho edge case này.
- **M-Cleanup-3**: ✅ shipped inline trong M-Hoshin-4 cleanup phase — deactivate 56 duplicate KPIs Ladysfit org qua SQL ROW_NUMBER strategy (giữ oldest, soft delete reversible). 65 active → 9 unique. KHÔNG cần milestone formal.
- **M-Design-Tailwind-Cleanup-1** (NEW from M-Design-3b deferred scope, TBD priority): KpiCard.tsx + tangential Tailwind utility classes trong discovery/page.tsx không khớp NB palette / KPI tokens. See candidates list above.
- **M-Design-3-rest** (renamed from M-Design-3): Sidebar collapse + header user menu + dashboard cards refactor (non-chart UI surfaces). **Priority: MEDIUM**, defer until đụng vào sidebar/header redesign.
- **M-Design-Tokens-Cleanup-1** (NEW from M-Design-3a tech debt, MEDIUM): `--brand`/`--accent` collision in `globals.css` line 169 may conflict với shadcn neutral hover patterns. See candidates list above.
- **M-Design-Dark-1** (NEW from M-Design-3b deferred, LOW priority — no user signal): Add `.dark` variants cho M-Design-3a + M-Design-3b tokens. See candidates list above.

---

**End of handoff. Khi có câu hỏi → grep codebase, đừng guess.**
