---
milestone: M-Cleanup-6 Phase 2 + M-Lint-Cleanup-1
date: 2026-05-09
estimate: ~1.5h
risk: LOW
status: planned
---

# M-Cleanup-6-P2 + M-Lint-Cleanup-1 — Combo Plan

Verify-first audit lock cho 2 milestones gộp 1 session.

## Scope

1. **M-Cleanup-6 Phase 2** — refactor inline pattern `find(m => m.org_id === lastOrgId) ?? memberships[0]` ở dashboard pages sang helper `getActiveMembership(supabase, userId, lastOrgId)` ([lib/auth/getActiveMembership.ts:12-26](../lib/auth/getActiveMembership.ts#L12-L26)).
2. **M-Lint-Cleanup-1** — fix 2 pre-existing lint errors (zero-baseline restore).

Estimate: ~1.5h. Risk: LOW (no schema/route changes, pure code dedup + lint fixes).

---

## Verify findings (2026-05-09 grep audit)

### A. Inline call sites — 12 confirmed

`grep "memberships\[0\]" app/dashboard/` returns **12 files** (matches HANDOFF claim).

| # | File | Line | Select shape | JOIN organizations? | Migrate path |
|---|------|------|--------------|---------------------|--------------|
| 1 | [app/dashboard/layout.tsx](../app/dashboard/layout.tsx#L38) | 38 | `select('*')` — needs full array for `membershipsForSwitcher` (line 66) + `orgIds` (line 41) | No (separate `organizations.in()` query at line 44) | **DEFER** — helper would force duplicate query. See "Layout exception" below. |
| 2 | [app/dashboard/page.tsx](../app/dashboard/page.tsx#L45) | 45 | `select('org_id')` | No | Helper drop-in (nullable result OK — page already guards `memberships?.length`) |
| 3 | [app/dashboard/kpi/page.tsx](../app/dashboard/kpi/page.tsx#L24) | 24 | `select('org_id, role')` | No | Helper drop-in (exact shape match) |
| 4 | [app/dashboard/settings/page.tsx](../app/dashboard/settings/page.tsx#L22) | 22 | `select('org_id, role')` | No | Helper drop-in |
| 5 | [app/dashboard/x-matrix/new/page.tsx](../app/dashboard/x-matrix/new/page.tsx#L24) | 24 | `select('org_id, role')` | No | Helper drop-in |
| 6 | [app/dashboard/x-matrix/[year]/review/page.tsx](../app/dashboard/x-matrix/[year]/review/page.tsx#L31) | 31 | `select('org_id, role')` | No | Helper drop-in |
| 7 | [app/dashboard/discovery/swot/page.tsx](../app/dashboard/discovery/swot/page.tsx#L22) | 22 | `select('org_id')` | No | Helper drop-in |
| 8 | [app/dashboard/discovery/swot/strategy/page.tsx](../app/dashboard/discovery/swot/strategy/page.tsx#L22) | 22 | `select('org_id')` | No | Helper drop-in |
| 9 | [app/dashboard/discovery/xray-history/page.tsx](../app/dashboard/discovery/xray-history/page.tsx#L49) | 49 | `select('org_id')` | No | Helper drop-in |
| 10 | [app/dashboard/discovery/benchmark/page.tsx](../app/dashboard/discovery/benchmark/page.tsx#L22) | 22 | `select('org_id, organizations(industry)')` | **YES** | Split: helper + 2nd query `organizations.select('industry').eq('id', membership.org_id).single()` |
| 11 | [app/dashboard/discovery/vision-workshop/page.tsx](../app/dashboard/discovery/vision-workshop/page.tsx#L22) | 22 | `select('org_id, organizations(name, industry, headcount)')` | **YES** | Split — same pattern as #10 |
| 12 | [app/dashboard/discovery/synthesis/page.tsx](../app/dashboard/discovery/synthesis/page.tsx#L22) | 22 | `select('org_id, organizations(name, industry, city, headcount)')` | **YES** | Split — same pattern as #10 |

**Layout exception (site #1)**: `app/dashboard/layout.tsx` keeps the `memberships[]` array because it builds `membershipsForSwitcher` (org switcher dropdown) and an `orgIds[]` for the bulk `organizations.in()` lookup. Replacing the inline pick with `getActiveMembership(...)` would either (a) drop the array & break the switcher, or (b) add a duplicate `org_members` query just to call the helper. **Defer or extract a sibling pure picker helper** — see Q2 below.

**Effective scope**: 11 files refactor (12 sites minus layout) — or 12 if we ship a pure picker helper for layout in same milestone.

### B. Lint errors — 2 confirmed (`npm run lint` output)

| # | File | Line | Rule | Notes |
|---|------|------|------|-------|
| 1 | [app/dashboard/discovery/xray-history/XRayHistoryChart.tsx](../app/dashboard/discovery/xray-history/XRayHistoryChart.tsx#L80) | 33 (decl), 80 (use) | `react-hooks/static-components` | `function CustomDot(...)` declared inside `XRayHistoryChart` body, used as `<Recharts dot={<CustomDot />}>` at line 80. Closes over `scoreCritical`, `scoreFair`, `ink` tokens from parent. Fix: hoist to module scope, accept tokens via props. HANDOFF claim accurate. |
| 2 | [app/invite/[token]/page.tsx](../app/invite/[token]/page.tsx#L75) | 75 | `@next/next/no-html-link-for-pages` | **Drift from HANDOFF**: target is `<a href="/">` (about/landing root), NOT `<a href="/login">`. Fix: replace with `<Link href="/">` + `import Link from 'next/link'` (already imported elsewhere — verify on touch). |

### C. Helper signature confirmed

[lib/auth/getActiveMembership.ts:12-26](../lib/auth/getActiveMembership.ts#L12-L26):

```ts
export async function getActiveMembership(
  supabase: SupabaseClient<Database>,
  userId: string,
  lastOrgId: string | null,
): Promise<{ org_id: string; role: string } | null>
```

- Returns `{ org_id, role }` only — does NOT carry `organizations(...)` JOIN data.
- Returns `null` when user has zero memberships (call sites currently `redirect('/onboarding/setup-org')` on length=0; nullable return slots in cleanly).
- Caller MUST pass `lastOrgId` from `user.user_metadata?.last_org_id` — no internal `auth.getUser()` round-trip.

### D. Precedent for JOIN handling — `app/api/report/monthly/route.ts:59-69`

```ts
const membership = await getActiveMembership(supabase, user.id, lastOrgId)
if (!membership) return NextResponse.json({ error: 'Org not found' }, { status: 404 })

const { data: orgData } = await supabase
  .from('organizations')
  .select('name')
  .eq('id', membership.org_id)
  .single()
```

Pattern = "split queries". This is the only existing precedent for combining the helper with org-side data. M-Cleanup-6 P1 applied this in 7 API routes.

---

## 5 Decisions Q1–Q5

### Q1 — Commit granularity

**Options:**
- α 1 commit gộp 11–12 sites refactor
- β tách 2–3 commits theo domain (settings/kpi/x-matrix vs discovery vs layout)
- γ 1 commit/site (12 commits)

**Lock: β — 3 commits theo domain.**

Rationale:
- α (mega-commit) → khó revert nếu 1 site break smoke; touch 11 files trộn 4 domain.
- γ (12 micro-commits) → noise, không có boundary value (sites trong cùng domain identical pattern).
- β đúng granularity: domain-scoped commits = atomic revert unit, mỗi commit có ≤5 files cùng concern.

**Commit boundary**:
1. `refactor(dashboard): migrate non-JOIN dashboard pages to getActiveMembership helper` — sites #2, #3, #4, #5, #6, #7, #8, #9 (8 files, identical drop-in)
2. `refactor(discovery): split org_members + organizations queries via getActiveMembership` — sites #10, #11, #12 (3 files, split-query pattern)
3. `chore(lint): restore zero-error baseline (CustomDot hoist + invite Link)` — 2 lint files (see Q4)

Layout (#1) deferred to a follow-up unless we ship the pure picker (see Q2 γ).

### Q2 — JOIN handling for sites #10–#12 (benchmark, vision-workshop, synthesis)

**Options:**
- α split 2 queries (helper + separate `organizations.select(...).eq('id', membership.org_id).single()`) — matches `report/monthly` precedent
- β extend helper to optionally JOIN organizations (add overload or 2nd helper variant)

**Lock: α split queries.**

Rationale:
- α follows the only existing precedent (M-Cleanup-6 P1, 7 routes). Consistency > novelty.
- β would bloat helper signature (org-side fields differ per site: industry vs name+industry+headcount vs name+industry+city+headcount). Either pass projection string (stringly-typed, defeats helper purpose) or return `unknown` and force caller cast (no type win). Net: helper becomes less typed, not more useful.
- Cost of α: +1 query per page = ~5–10ms RTT. Acceptable for SSR pages (already 3+ awaits each). No measurable UX regression.

### Q3 — Smoke test scope

**Options:**
- α minimal — `npm run typecheck` + `npm run build` PASS only
- β full — load 3 dashboard pages (`/dashboard`, `/dashboard/kpi`, `/dashboard/x-matrix/new`) + 1 discovery page (`/dashboard/discovery/benchmark` — JOIN site)

**Lock: β full, but scoped to 4 pages (not 11).**

Rationale:
- Refactor is structural (no behavior change), but JOIN-split path (#10–#12) IS new code shape — pure typecheck won't catch a missing `.single()` chain or wrong field access.
- Pick 1 page per pattern variant: `/dashboard` (no role), `/dashboard/kpi` (with role), `/dashboard/x-matrix/new` (with role + redirect), `/dashboard/discovery/benchmark` (split-query JOIN). Sample = 4 pages covers 4 distinct shapes. Other 7 sites identical pattern within shape, low marginal value testing all.
- claude.ai web cannot run browser smoke — execute via Cursor or manual. Plan calls for Vũ Hải to run β; if skipped → α minimum required, ship with NOTE in commit body.

### Q4 — Lint commit boundary

**Options:**
- α ship lint as separate commit at end of milestone (`chore(lint): restore zero baseline`)
- β gộp lint fixes vào refactor commit cuối

**Lock: α separate commit.**

Rationale:
- Lint fixes touch unrelated files (chart component + invite page) — no causal link to dashboard refactor. Mixing = misleading diff.
- α gives Vũ Hải clean revert path for lint (e.g., if `<Link>` change breaks a route case). Refactor and lint have different rollback shapes.
- HANDOFF labels these as 2 separate milestones (M-Cleanup-6 P2 vs M-Lint-Cleanup-1). Honor that boundary in commits.

### Q5 — Effort + risk + test plan summary

**Effort breakdown:**
- Refactor commit 1 (8 files non-JOIN): ~25 min — mechanical replace, identical pattern
- Refactor commit 2 (3 files JOIN split): ~25 min — slightly more thought per site, but precedent exists
- Lint commit 3 (2 files): ~20 min — CustomDot hoist needs token threading; invite Link is 1-line swap
- Smoke test (β scope, 4 pages): ~15 min if dev server already warm, +5 min cold start
- HANDOFF/ACTIVE_CONTEXT update + commit drafting: ~15 min
- **Total: ~1h40min** (within 1.5h estimate; buffer covers unforeseen typecheck red)

**Risk assessment: LOW.**
- No schema changes, no API contract changes, no auth flow changes.
- Helper already battle-tested in 7 production API routes (M-Cleanup-6 P1).
- Behavior preservation: helper logic = inline logic byte-equivalent (verified 2026-05-09).
- Highest-risk site = layout (#1), explicitly deferred.
- Highest-risk sub-pattern = JOIN split (#10–#12), but precedent exists in `report/monthly`.

**Failure modes monitored:**
- TypeScript: helper return type narrows to `{ org_id, role } | null`; sites accessing `.organizations` on the helper result would fail compile (caught by `npm run typecheck`).
- Runtime: `redirect('/onboarding/setup-org')` branches preserved on null/empty membership; no change in redirect flow.
- Smoke: SSR pages must render without crash; 4-page β smoke covers all 4 distinct call shapes.

**Test plan:**
1. After commit 1: `npm run typecheck` + `npm run build` MUST pass.
2. After commit 2: same + load `/dashboard/discovery/benchmark` to verify JOIN split renders org name/industry.
3. After commit 3: `npm run lint` MUST return 0 errors (matches `24eb66d` baseline).
4. Final: load 4 pages from Q3 β scope; verify no console errors, no missing data.

---

## Constraints for future AI sessions

1. **KHÔNG** dùng `.maybeSingle()` cho `org_members` query mới khi user có thể multi-org. User có thể thuộc N orgs → `.maybeSingle()` randomly returns 1, breaks active-org selection. Pattern đúng: `getActiveMembership(supabase, userId, lastOrgId)` helper.
2. **KHÔNG** copy inline pattern `find(lastOrgId) ?? memberships[0]` từ legacy code mà chưa audit shape contract. Phase 2 đã eliminate 11/12 sites — nếu thấy pattern còn lại trong dashboard, verify đó là layout (intentional) hoặc grep `git log` xem đã skip vì lý do gì.
3. **KHÔNG** extend `getActiveMembership` helper signature thêm JOIN/projection params. Q2 lock = split-query pattern. Helper stays typed `{ org_id, role } | null`.
4. **KHÔNG** dùng `redirect('/onboarding/setup-org')` khi helper return null trong API route — đó là server page pattern. API routes return `NextResponse.json({ error }, { status: 404 })` (precedent: `report/monthly:62`).
5. **layout.tsx** giữ inline pattern intentionally. Nếu cần refactor layout sau, extract pure picker `pickActiveMembership(memberships, lastOrgId)` thành sibling helper — KHÔNG force layout call helper async (would duplicate `org_members` query).
6. Lint baseline = 0 errors. Sau M-Lint-Cleanup-1 ship, bất kỳ regression phải fix ngay (precedent `24eb66d`). KHÔNG để lint debt accumulate.

---

## Open questions (decide on execution session)

- [ ] Site #1 (layout): defer hoàn toàn HAY ship pure picker helper trong cùng milestone? Recommend **defer** — split picker = scope creep, layout's inline pattern is correctly localized for its dual-purpose query.
- [ ] CustomDot hoist: thread tokens via props HAY accept theme object? Recommend **props** (3 scalars: `scoreCritical`, `scoreFair`, `ink`) — minimal API surface.
