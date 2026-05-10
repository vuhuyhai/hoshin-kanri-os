# M-RateLimit-Generic-1 — Verify-First Audit

**Audit date:** 2026-05-10
**Branch:** `master` (HEAD `65323ce`)
**Mode:** READ-ONLY. No code modified, no commits.
**Purpose:** Ground-truth findings to inform design audit Q1–Q? in Claude.ai web session.

---

## V1 — Current implementation: `lib/ai/rate-limit-helper.ts`

**Finding (raw):** File is **51 LOC**, single function export.

```ts
// Imports
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

// Public types (exported)
export type AiRateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse }

export type AiRateLimitOptions = {
  limit?: number
  windowSeconds?: number
  bucket?: string
}

// Constants (module-private)
const DEFAULT_LIMIT = 50
const DEFAULT_WINDOW_SECONDS = 300
const DEFAULT_BUCKET = 'ai-default'

// Signature
export async function requireAiRateLimit(
  userId: string,
  options: AiRateLimitOptions = {},
): Promise<AiRateLimitResult>
```

- **Generics:** none.
- **Defaults:** `limit=50`, `windowSeconds=300`, `bucket='ai-default'`.
- **Key format constructed inside helper:** `` `ai:${bucket}:${userId}` `` (template literal, line 27 — the ONLY place the `ai:` prefix appears in app code).
- **Other exports beyond `requireAiRateLimit`:** `AiRateLimitResult`, `AiRateLimitOptions` types only. No other functions/constants exported.
- **Vietnamese error string baked in (line 41):** `"Bạn đang gọi AI quá nhanh. Vui lòng đợi vài phút rồi thử lại."` ← AI-specific copy. Generic refactor needs to address: keep generic copy + override slot, or make message a required arg.

**Risk flag:** LOW (small surface, single responsibility).

**Decision impact:** Q (rename helper) + Q (default bucket name strategy: `'ai-default'` becomes nonsense for non-AI; need decision: required `bucket` param with NO default, OR keep optional with rename of constant) + Q (error-message generalization).

---

## V2 — Base helper signature: `lib/rate-limit.ts`

**Finding (raw):** File is **43 LOC**. Three exports.

```ts
export type RateLimitResult = {
  allowed: boolean
  count: number
  limit: number
  resetAt: Date
}

export async function checkRateLimit(params: {
  key: string         // FULL key string — caller is responsible for prefixing
  limit: number
  windowSeconds: number
}): Promise<RateLimitResult>

export function getClientIp(headers: Headers): string
```

- **Return shape:** `{ allowed, count, limit, resetAt }` — note it's `count` + `limit` separately, **not** `remaining`. Audit checklist's hint "(`{ allowed, remaining, resetAt, ... }` hay khác?)" was a guess; reality has `count` + `limit`. Caller derives `remaining = limit - count` if needed.
- **Key parameter format:** opaque string. Helper does NOT enforce any prefix scheme. Bucket separation is purely by caller convention.
- **Fail-open behavior (lines 27–32):** on RPC error, returns `{ allowed: true, count: 0, ... }`. Comment marks this as intentional — do NOT "fix" in refactor.

**Risk flag:** LOW.

**Decision impact:** Q (return shape of generic `requireRateLimit` — preserve `AiRateLimitResult` discriminated union shape, or expose richer shape with `remaining`/`resetAt`?) + Q (keep fail-open semantics in wrapper — yes, automatic since wrapper delegates to `checkRateLimit`).

---

## V3 — Grep call sites for `requireAiRateLimit`

**Finding (raw):** **13 AI routes** call `requireAiRateLimit` (audit checklist said "expect 12" — actual count is **13**, off-by-one in the checklist). **0 non-AI routes** use the helper. Helper file itself is the 14th match (definition).

| #  | File path                                                                     | Bucket arg     | Limit override | Window override | Notes                                       |
|----|-------------------------------------------------------------------------------|----------------|----------------|-----------------|---------------------------------------------|
| 1  | `app/api/swot/coaching/route.ts:55`                                           | `'swot'`       | `50`           | default (300)   | SWOT cluster                                |
| 2  | `app/api/swot/coaching-draft/route.ts:174`                                    | `'swot'`       | `50`           | default         | SWOT cluster                                |
| 3  | `app/api/swot/conflict-check/route.ts:32`                                     | `'swot'`       | `50`           | default         | SWOT cluster                                |
| 4  | `app/api/swot/context-cards/route.ts:82`                                      | `'swot'`       | `50`           | default         | SWOT cluster                                |
| 5  | `app/api/swot/item-evidence/route.ts:81`                                      | `'swot'`       | `50`           | default         | SWOT cluster                                |
| 6  | `app/api/swot/suggest-more/route.ts:73`                                       | `'swot'`       | `50`           | default         | SWOT cluster                                |
| 7  | `app/api/swot-analyses/[id]/factors/[factorId]/quality-check/route.ts:103`    | `'swot'`       | `50`           | default         | SWOT cluster                                |
| 8  | `app/api/swot-analyses/[id]/strategies/ai-generate/route.ts:273`              | `'swot'`       | `50`           | default         | SWOT cluster                                |
| 9  | `app/api/discovery/pain-mapper/route.ts:23`                                   | `'discovery'`  | `50`           | default         | Discovery cluster                           |
| 10 | `app/api/discovery/synthesis/route.ts:202`                                    | `'discovery'`  | `50`           | default         | Discovery cluster                           |
| 11 | `app/api/discovery/vision-draft/route.ts:21`                                  | `'discovery'`  | `50`           | default         | Discovery cluster                           |
| 12 | `app/api/admin/hoshin-explorer/route.ts:37`                                   | `'admin'`      | `100`          | default         | Admin — higher limit                        |
| 13 | `app/api/xmatrix/coach-correlation/route.ts:33`                               | `'coach'`      | `50`           | default         | X-matrix cluster (separate bucket)          |

**Bucket distribution (post-prefix `ai:`):** `ai:swot` (×8), `ai:discovery` (×3), `ai:admin` (×1), `ai:coach` (×1).
**Limit distribution:** 50 (×12), 100 (×1 — admin/hoshin-explorer).
**Window distribution:** all use default 300s.

**Non-AI routes (V5 detail):** `/api/orgs/check-similar` and `/api/orgs/switch` use **`checkRateLimit` direct**, NOT `requireAiRateLimit`. See V5.

**Risk flag:** LOW — pattern is uniform; mechanical rename across 13 sites is safe.

**Decision impact:** Q (do we migrate the 2 non-AI routes in the same commit, making it 15 sites? HANDOFF.md:1307 already promises "Khi M-RateLimit-Generic-1 ship, migrate cùng commit" — locked) + Q (bucket name strategy: keep `'swot'` etc. and let new helper just produce key `<bucket>:<userId>` → loses `ai:` namespace separation that audit logs / dashboards may rely on; or default to passing through `'ai:swot'` as the full bucket).

---

## V4 — `'ai:'` literal occurrence audit

**Finding (raw):** Grep for `'ai:'` and `"ai:"` (single+double quote literal):

```
No matches found
```

The `ai:` prefix appears **only** in one place: `lib/ai/rate-limit-helper.ts:27` inside a template literal `` `ai:${bucket}:${userId}` ``. No caller hardcodes the prefix. No audit-log key, no dashboard reference, no migration script references the literal `ai:` string.

**Risk flag:** LOW. Refactor can change the prefix scheme without grep-collateral elsewhere in the codebase.

**Decision impact:** Q (renaming prefix is purely a DB-bucket-string concern — see V6, not a code-grep concern).

---

## V5 — Non-AI routes current pattern

### `app/api/orgs/check-similar/route.ts` (lines 6, 34–48)

```ts
import { checkRateLimit } from '@/lib/rate-limit'

const RATE_LIMIT = 10
const RATE_WINDOW_SECONDS = 60

const rl = await checkRateLimit({
  key: `orgs:check-similar:${user.id}`,
  limit: RATE_LIMIT,
  windowSeconds: RATE_WINDOW_SECONDS,
})
if (!rl.allowed) {
  const retryAfter = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000))
  return NextResponse.json(
    { error: 'Quá nhiều request', retryAfter },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}
```

- **Key format:** `orgs:check-similar:${user.id}` — **no `rl:` prefix**, no `ai:` prefix, just `<resource>:<action>:<userId>`.
- **Limit:** 10
- **Window:** 60s
- **Error message:** `'Quá nhiều request'` (generic, not AI-specific).

### `app/api/orgs/switch/route.ts` (lines 5, 28–42)

```ts
import { checkRateLimit } from '@/lib/rate-limit'

const RATE_LIMIT = 30
const RATE_WINDOW_SECONDS = 300

const rl = await checkRateLimit({
  key: `orgs:switch:${user.id}`,
  limit: RATE_LIMIT,
  windowSeconds: RATE_WINDOW_SECONDS,
})
if (!rl.allowed) {
  const retryAfter = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000))
  return NextResponse.json(
    { error: 'Quá nhiều request', retryAfter, requestId },  // requestId extra
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}
```

- **Key format:** `orgs:switch:${user.id}` — same `<resource>:<action>:<userId>` shape.
- **Limit:** 30, **Window:** 300s.
- **Error message:** `'Quá nhiều request'` + `requestId` field added to body. Same `Retry-After` header pattern.

### Pattern observations

1. Both non-AI sites duplicate the same ~12-line block (rate-limit + 429-build). This duplication is exactly what the generic helper should eliminate.
2. Both use `<resource>:<action>:<userId>` — implicitly a 3-segment bucket. AI helper uses 3-segment too (`ai:<bucket>:<userId>`). Generic shape `<bucket>:<userId>` (caller picks bucket = `'orgs:switch'` or `'ai:swot'`) would unify.
3. **`requestId` divergence:** orgs/switch adds `requestId` to error body. Generic helper either: (a) ignore (caller composes own response), (b) accept optional `extras` field, (c) return only `{ ok: false }` and let caller build response. Decision needed.
4. **Error copy divergence:** AI says "Bạn đang gọi AI quá nhanh…", non-AI says "Quá nhiều request". Generic helper needs message override slot OR caller builds 429.

**Other `checkRateLimit` direct callers (full list, for context — most are public/IP-keyed, NOT in scope of this refactor):**
- `app/api/blog/[slug]/view/route.ts` — IP-keyed
- `app/api/auth/register/route.ts` — IP-keyed
- `app/api/auth/forgot-password/route.ts` — IP + email dual-key
- `app/api/newsletter/subscribe/route.ts` — IP-keyed
- `app/api/x-ray/score/route.ts` — IP-keyed
- `app/api/hansei/create/route.ts` — userId-keyed (in-scope candidate?)
- `app/api/invites/route.ts` — userId-keyed (in-scope candidate?)
- `app/api/gemba/create/route.ts` — userId-keyed (in-scope candidate?)
- `app/api/gemba/[id]/route.ts` — userId-keyed (in-scope candidate?)
- `app/api/kpi/[id]/route.ts` — userId-keyed (in-scope candidate?)
- `app/api/kpi/[id]/restore/route.ts` — userId-keyed (in-scope candidate?)
- `app/api/kpi/archived/route.ts` — userId-keyed (in-scope candidate?)

**This expands the refactor surface significantly if we want to be thorough.** HANDOFF.md only commits to migrating `orgs/check-similar` + `orgs/switch`. The 7 hansei/invites/gemba/kpi routes weren't enumerated in the original M-RateLimit-Generic-1 ticket — need scope decision.

**Risk flag:** MEDIUM — scope creep risk. 13 AI + 2 promised non-AI = 15 sites; expanding to all userId-keyed = 22 sites.

**Decision impact:** Q (refactor scope: 13, 15, or 22 sites?) + Q (error-message API: required arg vs default+override) + Q (handle `requestId` extras: caller-builds-response is the cleanest answer).

---

## V6 — Backward-compat risk: DB schema `rate_limits`

**Finding (raw):** From `supabase/migrations/017_rate_limits.sql`:

```sql
create table if not exists rate_limits (
  bucket text not null,                  -- ← FULL KEY STRING stored here
  window_start timestamptz not null,
  count int not null default 1,
  primary key (bucket, window_start)
);

create or replace function increment_rate_limit(
  p_bucket text,                          -- ← caller passes full key
  p_window_start timestamptz
) returns int ...
```

And `lib/rate-limit.ts:23` confirms the wire-up:
```ts
await supabase.rpc('increment_rate_limit', {
  p_bucket: key,                          // ← `key` = `ai:swot:user-uuid` etc.
  p_window_start: ...
})
```

**Implications:**
- The DB stores the **full composed key string** (e.g., `ai:swot:550e8400-...`) in column `bucket`. **No separate "namespace" column.**
- If the refactor renames `ai:` → `rl:` (or removes the prefix), every existing user's rate-limit window resets — they get a fresh quota. **No data loss; impact is at most one bonus 50-call window per user.** Cleanup cron (migration 020) auto-purges rows >1 day old anyway.
- **No migration required.** Old `ai:swot:*` rows simply age out within 24h via the existing pg_cron job.
- **No code outside `rate-limit.ts` reads/writes the `rate_limits` table** — only the RPC is exposed (V6 grep confirms: only migrations + lib touch the table name).

**Acceptable per Vũ Hải's audit framing:** "impact tạm thời, không data loss". Confirmed correct.

**Risk flag:** LOW — accepted impact, no migration needed.

**Decision impact:** Q (key prefix scheme) — preserving `ai:` prefix avoids even the temporary reset; switching to e.g. `rl:` or no-prefix means a one-time soft reset for current users. Recommend: preserve `ai:` for the 13 AI routes (caller passes `bucket: 'ai:swot'`), use `orgs:` for the 2 non-AI routes (matches their existing keys → zero reset for those users).

---

## V7 — TypeScript discriminated union

**Finding (raw):** Return type is:

```ts
export type AiRateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse }
```

Caller pattern (sample from `app/api/swot/coaching/route.ts:55`):
```ts
const rl = await requireAiRateLimit(user.id, { bucket: 'swot', limit: 50 })
if (!rl.ok) return rl.response
```

All 13 AI sites verified to use the **identical** `if (!rl.ok) return rl.response` pattern (see V3 line numbers for spot-check). No site destructures `rl.response` or accesses any other field.

**If generic refactor preserves the discriminated-union return shape:**
- Zero call-site changes needed beyond the import path + function-name swap. Mechanical find-replace works.
- Migrating the 2 non-AI sites means: **delete ~12 lines of inline 429-build** at each site, replace with 2-line helper call. Net code reduction.

**If generic refactor changes the return shape (e.g., to `{ allowed, remaining, resetAt }` raw):**
- All 13 AI sites need rewrite to build their own 429 response → much larger blast radius, defeats the purpose of having a wrapper. **Strongly recommend NOT doing this.**

**Risk flag:** LOW (if shape preserved) / HIGH (if shape changed).

**Decision impact:** Q (preserve discriminated-union shape — recommend YES, lock this early to keep refactor mechanical).

---

## V8 — Test coverage existing

**Finding (raw):**
- Glob `**/*.{test,spec}.{ts,tsx}` returns **only `node_modules/...`** matches. No app-level test files exist.
- Grep `requireAiRateLimit` against `*.{test,spec}.*` glob returned `No files found`.
- `CLAUDE.md` confirms: *"Verification: `npm run typecheck` + `npm run build` + manual browser. **No test suite.**"*

**Implication:** Refactor needs zero test updates. Verification gate = typecheck + build + smoke (manual or via Playwright MCP). No commit-blocking test sync required.

**Risk flag:** LOW (no test debt) / MEDIUM (lack of tests means regression risk relies entirely on smoke — pick 2–3 high-traffic AI routes + both non-AI routes for post-deploy 429-trigger smoke).

**Decision impact:** Q (smoke-test plan): trigger 429 on 1× SWOT route + 1× discovery route + 1× orgs/switch route post-deploy to verify wiring intact end-to-end.

---

## Summary (top 5 lines)

1. **No blockers.** Refactor is mechanical: rename + move file + update 13 AI sites (zero shape change) + migrate 2 non-AI sites (delete inline 429 dup). Lint baseline 0, no test debt, no DB migration.
2. **Off-by-one in original ticket:** actual call sites = **13 AI + 2 non-AI = 15 total**, not 12+2=14. Plan/scope wording should be updated.
3. **Scope-creep risk (MEDIUM):** 7 additional userId-keyed `checkRateLimit` callers (hansei, invites, gemba×2, kpi×3) are NOT in the M-RateLimit-Generic-1 commitment but are eligible candidates. **Decide scope before writing code.** Recommend: stick to the promised 15 (HANDOFF.md:1307 lock) and leave the other 7 as a follow-up debt note.
4. **Locked-by-evidence design decisions:** (a) preserve discriminated-union return shape `{ ok: true } | { ok: false; response }` — flipping it explodes blast radius from 0 → 13 sites; (b) caller passes the full `bucket` string (e.g. `'ai:swot'`, `'orgs:switch'`) — keeps existing user windows for non-AI sites and avoids hardcoded prefix in helper; (c) no DB migration needed, accept 24h soft reset only on routes whose bucket string actually changes.
5. **Recommended next step:** Vũ Hải takes this audit + the 4 locked decisions to Claude.ai web design audit. Open Q's to resolve there: (i) error-message API (required arg vs override slot), (ii) handling `requestId` extras for orgs/switch, (iii) final scope (15 vs 22 sites), (iv) helper file location after move (`lib/http/rate-limit-helper.ts` per HANDOFF.md:2822 hint?), (v) smoke-test target list.
