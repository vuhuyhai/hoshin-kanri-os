# HANDOFF — Hoshin Kanri OS

> **Mục đích**: Tài liệu này là "one-shot context pack" để bất kỳ Claude session mới nào hiểu đầy đủ về kiến trúc, code conventions, pitfalls đã gặp và trạng thái hiện tại của repo. Đọc file này trước khi code.
>
> **Last verified**: 2026-04-27
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

**Latest migration**: `029_tows_strategies_v2_fields.sql` (27 migration files: 001-006 + 009-029). Gap at 007/008 confirmed clean — never existed in git history (all 126 commits, all branches). Schema continuity verified between 006 → 009. No drift between migrations and types.ts.

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

## 7. API Routes Map (39 routes)

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
POST /api/x-matrix/create            Envelope Zod + validateXMatrix()
POST /api/x-matrix/prefill           AI wizard prefill (reasoning)
GET  /api/x-matrix/share?slug=xxx    Public read
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

## 16. Current State Snapshot (2026-04-27)

- **Last migration applied**: `029_tows_strategies_v2_fields.sql`
- **API routes count**: 39
- **Lib modules**: admin, ai, analytics, blog, discovery, email, http, newsletter, pql, supabase, swot, validation, x-matrix, x-ray + rate-limit.ts
- **Components**: analytics (2), blog (8), layout (4), providers (3), swot (35+), ui (15), x-matrix (7)
- **Dashboard routes**: discovery (swot/pain-mapper/vision-workshop/synthesis/benchmark/xray-history), x-matrix/new, kpi, report, settings, help
- **Admin routes**: customers, hoshin-explorer, blog (list/new/edit/categories/tags)
- **Latest feature work**: Design system migration M-Design-1 (NB v3.2 Foundation Tokens)
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

---

## 17. Architecture Decisions

Log các quyết định kiến trúc lớn ảnh hưởng nhiều layer hoặc constraint future work. Mỗi entry: ngày + scope + rationale + ràng buộc future code.

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

---

## 18. Next Steps (Roadmap)

### Milestone tiếp theo: M-Design-2 — Landing Page Refactor

**Mục tiêu**: Refactor `app/page.tsx` full Neo-Brutalism v3.2 — apply tokens và utility classes vừa shipped ở M-Design-1 vào landing page hero, sections, footer.

**Tasks dự kiến**:
1. **Audit landing hiện tại** — list sections, copy, components đang dùng. Identify components nào cần rewrite vs giữ nguyên.
2. **Refactor hero** — mixed font sizes (clamp 56px → 128px responsive), accent word rotated (`.nb-sticker` overlap), asymmetric shadow (`--shadow-tilt-l/r`). Test scale từ 375px → 1920px.
3. **Trust-building section** — pastel feature cards (`.card-yellow`, `.card-cyan`, `.card-pink`, `.card-lime`) với `.card-tilt` variants. 4-6 cards, mỗi card 1 value prop.
4. **Marquee section** — scrolling client logos hoặc social proof (`.nb-marquee` + `.nb-marquee-track` + `.nb-marquee-item`). Source: list 10-20 SME khách hàng pilot (cần Vũ Hải confirm danh sách).
5. **Mobile responsive 375px** — verify tilted cards không break layout, marquee không cause horizontal scroll, hero typography scale gracefully.
6. **Contrast WCAG AAA check** — pastel bg (`--accent-yellow #F5E4B8`, `--accent-cyan #C4DEDC`, `--accent-pink #F0DCDD`) với text `--ink #1A1A1A`. Verify ≥7:1 ratio cho body text, ≥4.5:1 cho large text.

**Blockers**: none.

**Dependency on M-Design-1**: ✅ shipped (foundation tokens ready, utility classes available).

### Future milestones (TBD priority)

- **M-Design-3**: Dashboard refactor (sidebar/header/cards) NB v3.2.
- **M-Design-4**: Discovery flows (X-Ray, SWOT, Pain Mapper, Vision Workshop) NB v3.2.
- **M-Design-5**: X-Matrix Wizard NB v3.2.
- **P0.1 Phase 1 (orthogonal)**: Per-user rate-limit cho 12 authed AI routes (đã ship một phần ở 2026-04-26 commit `a8d5e58` — wrapping helper + 12 route wirings done. Verify 100% coverage và monitor 429 rate trên prod).

---

**End of handoff. Khi có câu hỏi → grep codebase, đừng guess.**
