# M-RateLimit-Generic-1 — Plan + Decision Lock

**Date**: 2026-05-10
**Branch**: master (HEAD post-65323ce)
**Trigger**: Tech debt rotate 8 ngày từ M-OrgUX-1 (2026-05-01) + M-Auth-MultiOrg-1 (2026-05-09 sáng) ship non-AI route thứ 2 dùng `checkRateLimit` direct. Trigger condition met "2-3 non-AI routes need rate limiting" (HANDOFF §18 candidate).

## Verify-first audit reference

See `plans/M-RateLimit-Generic-1-verify-audit.md` for 8-section audit V1-V8.

**Key findings**:
- Off-by-one: actual 13 AI + 2 non-AI = 15 sites (HANDOFF §18 ghi 14)
- 4 decisions evidence-locked (D1-D4)
- 0 DB migration needed (rate_limits table cleanup cron 24h)
- 0 test debt (no test suite)
- 7 additional eligible sites DEFER milestone riêng

## 11 Decisions Lock

### Evidence-locked (D1-D4)

| ID | Decision | Evidence source |
|---|---|---|
| D1 | Preserve discriminated union shape | V7 — 13/13 AI sites uniform `if (!rl.ok) return rl.response` |
| D2 | Caller pass FULL bucket string | V6 — DB stores full key, prefix change = soft reset |
| D3 | No DB migration | V6 — cleanup cron 24h auto-purge old rows |
| D4 | Scope 15 sites lock | V5 — 7 additional eligible sites scope creep risk MEDIUM |

### Path α/β questions (Q1-Q7)

| ID | Path | Rationale |
|---|---|---|
| Q1 | α `requireRateLimit` | Match `requireOrgRole`, `requireSuperAdmin` verb-prefix convention |
| Q2 | α `lib/http/rate-limit-helper.ts` | Cluster với `lib/http/fetch-json.ts` + `sse-client.ts` |
| Q3 | β Optional message + default | AI routes override exact copy preserve, non-AI default reasonable |
| Q4 | α `extras` merge vào 429 body | orgs/switch requestId regression guard |
| Q5 | α DROP default bucket | V3 confirm 13/13 explicit, type-safe |
| Q6 | β 2 commits domain split | Atomic revert unit per concern (M-Cleanup-batch-2026-05-09 Q1 β pattern) |
| Q7 | Phase A typecheck + build + Phase B 3-route smoke | L42 partial coverage cho mechanical refactor |

## Helper signature (final)

```typescript
// lib/http/rate-limit-helper.ts
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export type RateLimitResult =
  | { ok: true }
  | { ok: false; response: NextResponse }

export type RateLimitOptions = {
  bucket: string
  limit?: number
  windowSeconds?: number
  message?: string
  extras?: Record<string, unknown>
}

const DEFAULT_LIMIT = 50
const DEFAULT_WINDOW_SECONDS = 300
const DEFAULT_MESSAGE = 'Quá nhiều request'

export async function requireRateLimit(
  userId: string,
  options: RateLimitOptions,
): Promise<RateLimitResult>
```

## Caller migration patterns

### AI route (13 sites)

```typescript
// Before
const rl = await requireAiRateLimit(user.id, { bucket: 'swot', limit: 50 })
if (!rl.ok) return rl.response

// After
const rl = await requireRateLimit(user.id, {
  bucket: 'ai:swot',
  limit: 50,
  message: 'Bạn đang gọi AI quá nhanh. Vui lòng đợi vài phút rồi thử lại.',
})
if (!rl.ok) return rl.response
```

### Non-AI route (2 sites)

```typescript
// Before — 12-line inline block
const rl = await checkRateLimit({
  key: `orgs:switch:${user.id}`,
  limit: RATE_LIMIT,
  windowSeconds: RATE_WINDOW_SECONDS,
})
if (!rl.allowed) {
  const retryAfter = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000))
  return NextResponse.json(
    { error: 'Quá nhiều request', retryAfter, requestId },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}

// After — 6 lines
const rl = await requireRateLimit(user.id, {
  bucket: 'orgs:switch',
  limit: 30,
  windowSeconds: 300,
  extras: { requestId },
})
if (!rl.ok) return rl.response
```

## Tasks

1. **Task 2A** — Plan doc commit (this file)
2. **Task 2B** — Commit 1: helper rewrite + move + 13 AI sites mechanical rename
3. **Task 2C** — Commit 2: 2 non-AI sites migrate (delete 12-line inline + use helper)
4. **Task 3** — Smoke Phase A typecheck + build PASS
5. **Task 4** — HANDOFF close-out + push origin master + Vercel verify

## Risk grade

LOW. 4 evidence-locked + 7 path α/β consistent low-blast-radius. Mechanical rename + no shape change + no DB migration.

## Effort estimate

~1h45min - 2h30min total:
- Task 2A: 5 min (plan doc)
- Task 2B: 45-60 min (helper + 13 AI rename)
- Task 2C: 20-30 min (2 non-AI migrate)
- Task 3: 5-10 min (typecheck + build)
- Task 4: 15-20 min (HANDOFF + push + Vercel verify)
