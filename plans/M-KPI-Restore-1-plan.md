# M-KPI-Restore-1 — KPI Restore UI (CEO self-service)

> **Status**: Task 1 (verify-first audit + decision lock) — KHÔNG code change.
> **Author**: claude.ai web (Cursor execution sau khi Vũ Hải approve).
> **Scope MVP**: Settings page section "KPIs đã archived" + POST `/api/kpi/[id]/restore` endpoint + GET `/api/kpi/archived` reader. CEO-only self-service restore (eliminate "liên hệ admin" friction).
> **Path lock proposed**: α + α + α + α + α + α + α + α + α + α (mirror M-KPI-Mgmt-1 conservative defaults).
> **Estimate**: ~1.5-2h, Risk LOW-MEDIUM (pure additive feature, mirror DELETE endpoint shape, soft-delete reverse semantic = pattern-proven).

---

## 1. Trigger + context

- M-KPI-Mgmt-1 SHIPPED 2026-05-09 (commits `c87015d`→`0140dfa`) — soft-delete `is_active=false` UI + 3-layer defense (UI hide + mutation guard + RBAC + RLS). AlertDialog copy line 119 hiện ép user "Bạn có thể khôi phục bằng cách liên hệ admin" — friction cao + Vũ Hải solo dev (KHÔNG có "admin" team thật để liên hệ).
- M-KPI-Mgmt-1 deferred Phase 2: M-KPI-Restore-1 (this milestone) — listed §18 LOW priority với trigger conditions: (1) user complain "lỡ tay xóa KPI", hoặc (2) audit trail show ≥3 archived KPIs unintended.
- **Trigger sớm hơn HANDOFF §18 dự kiến**: pair flow destructive↔reversible round-trip natural (delete UI exists → restore UI complement). Defer chờ user complain = tech debt rotation. Ship cùng pattern còn fresh trong head.
- Soft-delete precedent: M-Hoshin-4 KPI duplicate cleanup + M-KPI-Mgmt-1 KPI delete UI. Reverse direction (`is_active=false` → `is_active=true`) = same pattern, opposite verb.
- Reader uniformity (L39 M-Auth-MultiOrg-1, L43 M-KPI-Mgmt-1): 7 list readers + 3 mutation guards already filter `is_active=true` (M-KPI-Mgmt-1 V3 audit confirmed). Restore = re-flip flag → ALL readers tự re-appear KPI consistently. Zero downstream change.

---

## 2. Verify-first audit (V1–V10)

### V1 — DELETE endpoint shape (mirror cho POST /restore)

Source: [app/api/kpi/[id]/route.ts](app/api/kpi/[id]/route.ts) (169 LOC, M-KPI-Mgmt-1 commit `4a8f21d`).

**Pattern reusable cho POST /restore**:
- L22: `requestId = crypto.randomUUID()` cho audit log correlation
- L24-37: Zod params validate (`id` UUID)
- L39-49: `createClient()` + `auth.getUser()` → 401 if null
- L51-69: rate-limit `kpi:delete:${user.id}` 30/300s, `.allowed`/`.resetAt` shape, `Retry-After` header
- L71-79: `getActiveMembership(supabase, user.id, lastOrgId)` → 403 if null
- L81-100: fetch kpi `.maybeSingle()` (NOT `.single()` — pitfall #31), 404 if not found
- L102-107: cross-org guard (kpi.org_id !== membership.org_id → 403)
- L109-116: **idempotent already-archived** — return success early, KHÔNG re-update
- L118-129: `requireOrgRole(supabase, user.id, membership.org_id, ADMIN_ROLES)` → 403
- L131-143: UPDATE `is_active=false` + `updated_at=now()` SCOPE BY org_id (defense)
- L145-162: `console.log('[audit:kpi-delete]', JSON.stringify({...}))` truncate `kpi_name.slice(0, 50)` (PII)
- L164-169: success response `{ success: true, kpi_id, archived: true, requestId }`

**Conclude V1**: POST /restore = direct mirror. Diff: rate-limit key `kpi:restore:${user.id}`, idempotent path = `kpi.is_active === true` already, UPDATE `is_active=true`, audit event `[audit:kpi-restore]`.

### V2 — KpiActionsMenu reuse vs separate

Source: [app/dashboard/kpi/components/KpiActionsMenu.tsx](app/dashboard/kpi/components/KpiActionsMenu.tsx) (121 LOC).

- L44: `if (!canDelete) return null` — Member/Manager hide affordance.
- L101-110: DropdownMenu chỉ có 1 item "Xóa KPI" hiện tại.
- L116-119: AlertDialog copy "Bạn có thể khôi phục bằng cách liên hệ admin" ← **regression risk**: ship M-KPI-Restore-1 phải update copy thành "Bạn có thể khôi phục từ Cài đặt → KPIs đã archived" (sửa link literal).

**Conclude V2**: Restore action KHÔNG nên ở cùng KpiActionsMenu — menu chỉ hiển thị trên KpiCard render từ list ACTIVE (filter `is_active=true`). Archived KPIs invisible từ dashboard. Restore UI buộc ở scope khác — Settings page là natural placement (Q1 α).

### V3 — Settings page structure (Q1 α placement)

Source: [app/dashboard/settings/components/SettingsClient.tsx](app/dashboard/settings/components/SettingsClient.tsx) (482 LOC).

**4 sections hiện tại**:
1. L176-243 — "Thông tin công ty" (org info form, CEO edit)
2. L246-418 — "Thành viên" (members list + invite create/copy/revoke, M-OrgInvite-1)
3. L421-465 — "Dữ liệu & Phiên làm việc" (SWOT reset)
4. L468-478 — "Tài khoản" (logout)

**Insertion point cho "KPIs đã archived"**: giữa section 2 (Members) và section 3 (Data & sessions). Lý do: theo flow administrative — org info → people → data recovery → personal account. CEO-only render via `{isCeo && (...)}` wrap (mirror invite section pattern L289).

**Conclude V3**: Q1 α (Settings page section) — clean separation, low risk, không clutter dashboard CEO. Reuse `isCeo` prop drill (đã có L62 SettingsClientProps).

### V4 — Reader endpoint shape (Q7 α separate vs β extend)

Source: [app/api/kpi/list/route.ts](app/api/kpi/list/route.ts) (108 LOC).

L42-44: hard-coded `.eq('is_active', true)`. Extend với query param `?archived=1` requires:
- Parse `searchParams.get('archived')` + Zod validate
- Conditional `is_active` filter
- Different response shape (archived KPIs KHÔNG cần `entries` history fetch — wasted query)

**Conclude V4**: Q7 α (separate `GET /api/kpi/archived`) — clean route purpose:
- KHÔNG fetch kpi_entries (entries không cần cho list archived UI)
- Response shape minimal: `{ id, name, unit, target_value, frequency, dept_level, updated_at }` (latest mutation timestamp = archive time proxy)
- Same auth + getActiveMembership + RBAC pattern (Q6 α CEO-only đọc archived list — Member KHÔNG cần thấy)
- KHÔNG cần rate-limit (read-only, low frequency, list capped LIMIT)

### V5 — ADMIN_ROLES confirmation

Source: [lib/supabase/server.ts:19](lib/supabase/server.ts#L19).

`export const ADMIN_ROLES: OrgRole[] = ['CEO']` — confirmed CEO-only.

**Conclude V5**: Q6 α CEO-only restore (consistency với DELETE). Manager KHÔNG restore được — preserves L43 M-KPI-Mgmt-1 layer 3 RBAC pattern symmetric.

### V6 — Rate-limit + getClientIp shapes

Source: [lib/rate-limit.ts:3-8, 37](lib/rate-limit.ts#L3-L43).

- `RateLimitResult` = `{ allowed, count, limit, resetAt }` — `.allowed` (NOT `.ok`)
- `getClientIp(headers: Headers)` — takes Headers object (NOT Request)

**Conclude V6**: Spec POST /restore MUST use `request.headers` (NOT `request`) cho `getClientIp` call. Mirror M-KPI-Mgmt-1 verify-first catch (L45) — KHÔNG repeat bug pre-build.

### V7 — UI prop drill chain (NOT touched)

Source: [app/dashboard/kpi/page.tsx:19-20](app/dashboard/kpi/page.tsx#L19-L20) → KpiDashboardClient → KpiCard → KpiActionsMenu.

`role` prop drill chain hiện tại: page.tsx → `userRole={role}` → KpiDashboardClient → KpiCard `userRole` prop → KpiActionsMenu `canDelete={userRole === 'CEO'}`.

**Conclude V7**: Restore UI ở Settings page → chain page.tsx settings → SettingsClient `isCeo` prop. KHÔNG touch dashboard chain. **Zero regression risk** cho M-KPI-Mgmt-1 delete flow.

### V8 — 7 list readers + 3 mutation guards (M-KPI-Mgmt-1 V3 audit reuse)

`grep is_active` toàn repo: 14 files match. Filter `kpis` table specifically (excluding types.ts hand-typed Database):

**7 list readers filter `.eq('is_active', true)`** (cascading "show active only"):
- `app/api/kpi/list/route.ts:43`
- `app/dashboard/page.tsx` (count badge)
- `app/dashboard/kpi/components/KpiGembaSection.tsx` (KPI scope filter)
- `lib/hansei/queries.ts` (getRedStreaks)
- `lib/annual-review/queries.ts` (KPI actual entry candidates)
- `app/api/report/monthly/route.ts` (monthly AI summary)
- `lib/pql/signals.ts` (PQL signal #3 KPI red streak)

**3 mutation guards filter `.eq('is_active', true)`** (M-KPI-Mgmt-1 Task 2D commit `0140dfa`):
- `app/api/kpi/entry/route.ts:23` (block POST entry archived KPI)
- `app/api/hansei/list/route.ts:40` (block list hansei archived KPI)
- `app/api/hansei/create/route.ts:35` (block POST hansei archived KPI)

**1 mutation route by-ID** (DELETE M-KPI-Mgmt-1):
- `app/api/kpi/[id]/route.ts:84-85` (cross-org + KPI exists check)

**1 transition route** (skip — read-only logic):
- `app/api/annual-review/[id]/transition/route.ts` (carry-over flagging M-Hoshin-3, KHÔNG mutate kpis.is_active)

**1 create route**:
- `app/api/x-matrix/create/route.ts` (INSERT new kpis với `is_active=true` default — irrelevant cho restore)

**Conclude V8**: Restore = flip `is_active=true` → ALL 7 list readers tự re-appear KPI + ALL 3 mutation guards re-allow mutate. ZERO additional reader/guard patches needed (unlike M-KPI-Mgmt-1 V3 phát hiện 3 missing guards). Pattern: restore symmetric to delete = leverage M-KPI-Mgmt-1 patches investment.

### V9 — Schema kpis (deleted_at columns)

Source: [supabase/migrations/001_initial_schema.sql:64-77](supabase/migrations/001_initial_schema.sql#L64-L77).

**12 columns confirmed**: `id, org_id, x_matrix_id, owner_user_id, name, unit, target_value, frequency, is_active, dept_level, created_at, updated_at`.

**KHÔNG có** `deleted_at`, `deleted_by`, `archived_at`, `archived_by`.

**Conclude V9**: Q10 grace period UI ("archived X ngày trước", "deleted by user@email") MUST defer M-KPI-AuditMigration-1 (Phase 2). Use `updated_at` proxy chỉ với caveat — `updated_at` cũng thay đổi khi RESTORE (re-flip flag). Trade-off acceptable: list archived UI sort by `updated_at DESC` showing "mutation gần nhất" (NOT "archived time" semantically) — đủ cho MVP recovery use case.

### V10 — getActiveMembership signature

Source: [lib/auth/getActiveMembership.ts](lib/auth/getActiveMembership.ts).

Signature confirmed: `getActiveMembership(supabase, userId, lastOrgId): Promise<{ org_id: string; role: string } | null>`.

**Conclude V10**: Reuse pattern M-KPI-Mgmt-1 — caller pass `lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null`. Helper return null → 403 "Không có tổ chức đang hoạt động".

---

## 3. Decision lock (Q1–Q10)

### Q1 — UI PLACEMENT

- **α**: Settings page section "KPIs đã archived" (CEO-only render)
- β: Dashboard toggle "Show archived" filter (chuyển active/archived view)
- γ: Combo (Settings list + dashboard toggle)

**Recommend α**. Lý do: (1) clean separation, recovery action KHÔNG normalize destructive workflow, (2) low friction CEO chỉ vào khi cần (rare event), (3) zero regression risk dashboard chain (V7), (4) precedent admin-style action (mirror Members section), (5) defer dashboard toggle Phase 2 nếu user phàn nàn UX rare-event "lạc lối".

### Q2 — ENDPOINT SHAPE

- **α**: POST `/api/kpi/[id]/restore` (semantic verb route, mirror DELETE shape)
- β: PATCH `/api/kpi/[id]` body `{ is_active: true }` (REST-canonical update)

**Recommend α**. Lý do: (1) semantic clear ("restore" = action, not data update), (2) mirror DELETE M-KPI-Mgmt-1 shape (rate-limit key, audit event, idempotent path), (3) PATCH /api/kpi/[id] chưa tồn tại (KHÔNG có precedent edit endpoint — M-KPI-Edit-1 defer Phase 2), (4) avoid scope creep (PATCH multi-field + Zod validation = 3-5 fields beyond is_active).

### Q3 — BATCH OPERATION

- **α**: Single only MVP (1 click 1 restore, 1 AlertDialog, 1 API call)
- β: Bulk multi-select (checkboxes + "Khôi phục N KPIs" button)

**Recommend α**. Lý do: (1) defer batch Phase 2 — rare event, single archived list typically <10 items, (2) bulk multi-select adds UI complexity (checkbox state, disable UX, batch API endpoint OR N-times call rate-limit risk), (3) mirror M-KPI-Mgmt-1 Q3 α (Xóa MVP only, defer rename).

### Q4 — RATE LIMIT

- **α**: 30/300s/user mirror DELETE M-KPI-Mgmt-1
- β: Lower 10/300s (restore rare event, lower threshold OK)
- γ: No rate limit (archived list capped, rare event)

**Recommend α**. Lý do: (1) consistency với DELETE pattern, (2) rate-limit key separate `kpi:restore:${user.id}` (NOT shared bucket — separate rate limit budget cho destructive vs reversible), (3) defense vs accidental retry storm UI bug.

### Q5 — AUDIT LOG

- **α**: `[audit:kpi-restore]` structured JSON mirror DELETE shape
- β: Skip audit (read-then-flip, low security risk)

**Recommend α**. Lý do: (1) audit trail integrity — DELETE và RESTORE phải pair-symmetric trong logs (tránh "ghost archives" suspicion), (2) PII protection truncate `kpi_name.slice(0, 50)` mirror DELETE pattern, (3) Vercel logs retention 7 days — đủ cho user complain ">7 ngày" trigger M-KPI-AuditMigration-1 (Phase 2 proper migration).

### Q6 — ROLE GATE

- **α**: CEO only (`requireOrgRole(ADMIN_ROLES)`) mirror DELETE
- β: CEO + Manager (`WRITE_ROLES`)

**Recommend α**. Lý do: (1) consistency với destructive ops (Layer 3 RBAC symmetric), (2) Manager KHÔNG xóa được → KHÔNG cần restore quyền, (3) preserve V5 ADMIN_ROLES = CEO only confirmed, (4) preserve L43 4-layer defense pattern.

### Q7 — LIST READER

- **α**: Tách endpoint riêng GET `/api/kpi/archived` (CEO-only, minimal shape no entries history)
- β: Extend GET `/api/kpi/list` với param `?archived=1`

**Recommend α**. Lý do: (1) clean separation route purpose (V4 conclude), (2) minimal response shape (skip kpi_entries fetch — KHÔNG cần history cho restore decision), (3) RBAC differentiation (active list = ALL_ROLES read, archived list = ADMIN_ROLES CEO only), (4) avoid scope creep mở generic "filter active|archived" → invariant guard regression risk.

### Q8 — CONFIRM DIALOG

- **α**: AlertDialog "Khôi phục KPI \"{name}\"?" Vietnamese mirror delete consistency
- β: Direct restore + toast undo (5s window re-archive)
- γ: No confirm (low friction, restore is "good action")

**Recommend α**. Lý do: (1) consistency UX với delete flow (KHÔNG asymmetric: delete confirm + restore no-confirm = confusing), (2) AlertDialog copy emphasize "KPI sẽ xuất hiện lại trên dashboard" (positive framing, KHÔNG fearmonger), (3) toast undo β requires reverse API DELETE call within 5s — adds round-trip + race condition complexity, (4) γ no-confirm risks accidental restore (CEO click wrong row in list of similar names).

### Q9 — CASCADE BEHAVIOR

- **α**: Automatic — child rows preserved từ soft-delete tự reappear (kpi_entries, kpi_actuals, weekly_hansei)
- β: Hint UI "X entries, Y hansei restored" preview before confirm

**Recommend α**. Lý do: (1) child rows preserved automatically (soft-delete = no FK CASCADE wipe), (2) hint UI β requires fetch counts in archived list endpoint = overhead minor (3 COUNT queries per row × N archived KPIs), (3) defer hint UI Phase 2 nếu user feedback "không biết history còn không" — pre-emptive scope creep.

### Q10 — GRACE PERIOD UI

- **α**: Defer M-KPI-AuditMigration-1 Phase 2 (use `updated_at` proxy sort, KHÔNG show "archived X ngày trước")
- β: Show `updated_at` as "Cập nhật gần nhất {date}" (semantic ambiguous — restore cũng update)
- γ: Block migration first → ship M-KPI-AuditMigration-1 inline (add `archived_at` column proper)

**Recommend α**. Lý do: V9 confirmed kpis table KHÔNG có `archived_at` column. β semantic ambiguous (`updated_at` thay đổi cả khi restore — KHÔNG phải "archive time"). γ scope creep (migration + types regen + 3-4 mutation sites update + RLS audit). Defer M-KPI-AuditMigration-1 Phase 2 với trigger conditions documented HANDOFF §18 (nếu user phàn nàn restore-context lacking timestamp).

---

## 4. Risk audit (R1–R5)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | AlertDialog copy KpiActionsMenu line 119 "liên hệ admin" → drift sau M-KPI-Restore-1 ship | LOW | Task 2B include literal copy update line 119 → "Bạn có thể khôi phục từ Cài đặt → KPIs đã archived" cùng commit. Smoke test verify copy update visible. |
| R2 | Restore endpoint thiếu `is_active=false` filter trong fetch (chỉ check `kpi.id` exists) → ai đó restore active KPI = no-op nhưng wasted update | LOW | Idempotent path Q5: `if (kpi.is_active) return success early` (mirror DELETE L109-116). KHÔNG re-update active KPI. |
| R3 | Cross-org guard regression — restore endpoint quên check `kpi.org_id !== membership.org_id` | MEDIUM | Mirror DELETE pattern strict (V1 L102-107). Smoke test CASE cross-org 403 (1 case explicit). |
| R4 | Archived list endpoint expose KPI metadata cross-org (admin client bypass RLS bug) | MEDIUM | Use `createClient()` SSR (RLS-respecting), KHÔNG `createAdminClient`. RLS policy `kpis_select` filter `org_id IN (user's org_members)` — sanity check migration 001 policy still active. |
| R5 | Cursor implementation skip Q5 audit log → silent restore (no trail) | LOW | Verify-first Task 2A: confirm audit log present in handler before commit. Pattern lesson L45 reinforced lần 5 nếu Cursor miss. |

---

## 5. Task breakdown

### Task 2A — POST `/api/kpi/[id]/restore` endpoint

Effort: ~30-45 phút.

- NEW file `app/api/kpi/[id]/restore/route.ts` (~120 LOC, mirror DELETE shape)
- Auth + Zod params + rate-limit `kpi:restore:${user.id}` 30/300s + getActiveMembership + fetch kpi `.maybeSingle()` + cross-org guard + idempotent already-active path + `requireOrgRole(ADMIN_ROLES)` + UPDATE `is_active=true, updated_at=now()` SCOPE BY org_id + `[audit:kpi-restore]` audit log + success response
- Smoke test cases backend (Cursor self-verify chain): cross-org 403, rate-limit 429, idempotent already-active 200, RBAC Member 403, success path 200

Commit: `feat(kpi): add POST /api/kpi/[id]/restore endpoint with 4-layer defense`

### Task 2B — Settings page archived KPIs section + AlertDialog copy fix

Effort: ~45-60 phút.

- MODIFIED `app/dashboard/settings/page.tsx`: Server fetch archived KPIs cho CEO (call to be wired via SettingsClient prop OR fetch in client via `/api/kpi/archived`)
- NEW `app/api/kpi/archived/route.ts` (~70 LOC): GET endpoint, auth + getActiveMembership + `requireOrgRole(ADMIN_ROLES)` + SELECT `id, name, unit, target_value, frequency, dept_level, updated_at` WHERE `org_id = membership.org_id AND is_active = false` ORDER BY `updated_at DESC` LIMIT 50
- NEW `app/dashboard/settings/components/ArchivedKpisSection.tsx` (~120 LOC): client component, fetch on mount, render list rows với "Khôi phục" button + AlertDialog "Khôi phục KPI \"{name}\"?" + optimistic filter on success + rollback on error + toast feedback (mirror M-KPI-Mgmt-1 lift state pattern L44)
- MODIFIED `app/dashboard/settings/components/SettingsClient.tsx`: insert `<ArchivedKpisSection isCeo={isCeo} />` between Members và Data sections (CEO-only render via `{isCeo && (...)}` wrap)
- MODIFIED `app/dashboard/kpi/components/KpiActionsMenu.tsx` line 119: copy update "liên hệ admin" → "vào Cài đặt → KPIs đã archived" (R1 mitigation)
- Smoke test cases visual: CASE 1 (CEO restore happy path → KPI re-appear dashboard), CASE 2 (Member KHÔNG thấy section trong Settings), CASE 3 (cancel AlertDialog → no-op), CASE 4 (visual integrity Settings layout)

Commit: `feat(settings): add archived KPIs restore section + update delete copy`

### Task 2C — Smoke test full flow + close-out

Effort: ~30 phút.

- Browser test 4 visual cases (Task 2B above) + 5 backend cases verify Cursor self-verify chain (Task 2A above)
- Verify HANDOFF §18 candidates list update (move M-KPI-Restore-1 from "Future milestones" → "Shipped milestones")
- HANDOFF §16 Current State Snapshot update với commit hashes
- HANDOFF §17 Architecture Decisions add entry "M-KPI-Restore-1 — KPI restore self-service" (3 architectural changes: mirror DELETE shape symmetric, Settings page placement, AlertDialog copy update propagation)
- KpiActionsMenu AlertDialog copy regression test (text matches updated literal)

Commit: `docs: close-out M-KPI-Restore-1 (3 commits, 5 files NEW + 4 MODIFIED)`

---

## 6. Files changed estimate

### NEW (3 files)

- `app/api/kpi/[id]/restore/route.ts` (~120 LOC) — POST handler mirror DELETE shape
- `app/api/kpi/archived/route.ts` (~70 LOC) — GET archived list CEO-only
- `app/dashboard/settings/components/ArchivedKpisSection.tsx` (~120 LOC) — client component list + restore action + AlertDialog
- `plans/M-KPI-Restore-1-plan.md` (this file, ~280 LOC) — design audit + decision lock

### MODIFIED (3 files)

- `app/dashboard/settings/components/SettingsClient.tsx` (+3 LOC) — insert `<ArchivedKpisSection />` conditional
- `app/dashboard/settings/page.tsx` (+0 LOC if fetch-on-mount client; +5-10 LOC if Server-fetch + prop drill — defer decision Task 2B)
- `app/dashboard/kpi/components/KpiActionsMenu.tsx` (+1/-1 LOC) — copy update line 119

**Total estimate**: ~310 LOC NEW + ~5-10 LOC modified, 3 commits, ~1.5-2h work.

---

## 7. Constraints cho future AI sessions (post-ship)

- KHÔNG remove "Khôi phục" button from Settings ArchivedKpisSection — eliminate self-service friction lock.
- KHÔNG add "Khôi phục" affordance trong KpiActionsMenu hoặc dashboard inline — Q1 α placement lock (Settings page only).
- KHÔNG render ArchivedKpisSection cho Member/Manager — Q6 α CEO-only render lock + Layer 1 UI defense regression guard.
- KHÔNG remove `[audit:kpi-restore]` audit log — Q5 α audit trail integrity lock (pair-symmetric với delete logs).
- KHÔNG modify rate-limit key `kpi:restore:${userId}` sang shared bucket với `kpi:delete` — separate budgets, prevent cross-action throttle bleed.
- KHÔNG add bulk multi-select trong ArchivedKpisSection — Q3 α single-only lock, defer Phase 2 nếu user complain.
- KHÔNG show `updated_at` as "archived X ngày trước" — Q10 α defer M-KPI-AuditMigration-1 Phase 2 (`updated_at` semantic ambiguous post-restore).
- KHI ship M-KPI-AuditMigration-1 Phase 2 (add `archived_at`, `deleted_by` columns), MUST update Q10 decision + restore endpoint UPDATE clear `archived_at = NULL` post-restore + Settings list show "Archived {date}" semantic correct.
- KHÔNG bypass `requireOrgRole(ADMIN_ROLES)` trong POST /restore — Layer 3 RBAC defense regression guard.
