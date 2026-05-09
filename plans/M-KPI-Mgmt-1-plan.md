# M-KPI-Mgmt-1 — KPI Soft-Delete + 3-Dots Menu

> **Status**: Task 1 (verify-first audit + decision lock) — KHÔNG code change.
> **Author**: claude.ai (Cursor execution sau khi Vũ Hải approve).
> **Scope MVP**: 3-dots menu trên KpiCard với action "Xóa" → soft-delete (`is_active=false`) + AlertDialog confirm + reader-uniformity patch 3 mutation guards.
> **Path lock**: α + α + γ + β + γ + β + γ + β.

---

## 1. Trigger + context

- M-Hoshin-4 cleanup 56 duplicate KPIs Ladysfit qua SQL ROW_NUMBER (manual DB sửa). User thật giai đoạn ">5 user" sẽ chắc chắn hit pain point này. UI hiện tại KHÔNG có cách xóa KPI — phải vào Supabase SQL Editor sửa thủ công.
- Foundation post M-Auth-MultiOrg-1: multi-org switcher đã ship, KPI scope per-org. Mọi DELETE phải scope theo `kpi.org_id === activeMembership.org_id`.
- Soft-delete precedent: M-Hoshin-4 dùng `is_active=false` (HANDOFF §16 entry 2026-04-29 KPI cleanup pollution).
- Reader uniformity (L39 M-Auth-MultiOrg-1): TRƯỚC build cross-cutting feature mutate state, audit reader uniformity. M-KPI-Mgmt-1 cũng cross-cutting: toggle `is_active=false` phải audit MỌI KPI reader filter `is_active=true` consistently — bao gồm mutation guards.

---

## 2. Verify-first audit (V1–V7)

### V1 — Schema audit `kpis`

Source: [supabase/migrations/001_initial_schema.sql:64-77](supabase/migrations/001_initial_schema.sql#L64-L77) + [lib/supabase/types.ts:331-410](lib/supabase/types.ts#L331-L410).

**Columns hiện có** (12):
- `id uuid PK DEFAULT gen_random_uuid()`
- `org_id uuid NOT NULL`
- `x_matrix_id uuid NULL`
- `owner_user_id uuid NULL`
- `name text NOT NULL`
- `unit text NOT NULL`
- `target_value numeric NOT NULL`
- `frequency text NOT NULL CHECK IN ('daily','weekly','monthly')`
- **`is_active boolean NOT NULL DEFAULT true`** ← target column for soft-delete
- `dept_level text CHECK IN ('company','dept')`
- `created_at timestamptz DEFAULT now()`
- `updated_at timestamptz DEFAULT now()` (trigger `trg_kpis_updated_at`)
- **KHÔNG có `deleted_at` / `deleted_by`** — would require migration để add proper audit trail.

**FK FROM `kpis`** (3):
- `org_id → organizations(id) ON DELETE CASCADE`
- `x_matrix_id → x_matrices(id) ON DELETE SET NULL`
- `owner_user_id → users(id) ON DELETE SET NULL`

**FK TO `kpis`** (3 — all CASCADE):
- `kpi_entries.kpi_id → kpis(id) ON DELETE CASCADE` — historical daily/weekly/monthly entries
- `kpi_actuals.kpi_id → kpis(id) ON DELETE CASCADE` — end-of-year actuals tied annual_reviews
- `weekly_hansei.kpi_id → kpis(id) ON DELETE CASCADE` — red-streak reflections (M-Hoshin-4)

**Conclude V1**: hard-delete via `DELETE FROM kpis WHERE id=...` would CASCADE wipe all kpi_entries (mọi history), all kpi_actuals (annual review actuals), all weekly_hansei (mini-A3 reflections). Destructive — Q1 α (soft-delete via `is_active=false`) preserves all child data + audit trail intact.

### V2 — Existing API routes `/api/kpi/*`

Source: [app/api/kpi/](app/api/kpi/) (only 2 routes).

- [app/api/kpi/list/route.ts](app/api/kpi/list/route.ts) GET — filter `.eq('is_active', true)` (line 43) ✅
- [app/api/kpi/entry/route.ts](app/api/kpi/entry/route.ts) POST — verify KPI exists by ID, **NO `is_active` filter** (line 20-23) ❌
- **Missing routes**: DELETE `/api/kpi/[id]`, PATCH `/api/kpi/[id]` (rename), POST `/api/kpi/[id]/restore`.
- **Rate limit**: KHÔNG có rate-limit trên cả 2 KPI routes. Precedent `/api/orgs/switch` dùng `checkRateLimit('orgs:switch:${user.id}', 30/300s)`.

### V3 — Reader uniformity audit (L39 pattern)

Grep `\.from\(['\"]kpis['\"]\)` toàn repo → 14 call sites. Phân loại:

**User-facing list readers (7/7 filter `is_active=true` ✅)**:
1. [app/api/kpi/list/route.ts:43](app/api/kpi/list/route.ts#L43) ✅
2. [app/dashboard/page.tsx:84-87](app/dashboard/page.tsx#L84-L87) (count) ✅
3. [app/dashboard/kpi/components/KpiGembaSection.tsx:30-33](app/dashboard/kpi/components/KpiGembaSection.tsx#L30-L33) ✅
4. [lib/hansei/queries.ts:34-37](lib/hansei/queries.ts#L34-L37) ✅
5. [lib/annual-review/queries.ts:166-170](lib/annual-review/queries.ts#L166-L170) ✅
6. [app/api/report/monthly/route.ts:71-77](app/api/report/monthly/route.ts#L71-L77) ✅
7. [lib/pql/signals.ts:55-58](lib/pql/signals.ts#L55-L58) ✅

**Mutation/verify-by-ID guards (4 sites — 3 cần patch ❌, 1 OK)**:
1. [app/api/kpi/entry/route.ts:20-23](app/api/kpi/entry/route.ts#L20-L23) — verify KPI exists by ID, **THIẾU** `.eq('is_active', true)` ❌ → user còn kpiId trong UI cache có thể POST entry vào KPI đã xóa.
2. [app/api/hansei/list/route.ts:37-40](app/api/hansei/list/route.ts#L37-L40) — verify by ID ❌
3. [app/api/hansei/create/route.ts:32-35](app/api/hansei/create/route.ts#L32-L35) — verify by ID ❌
4. [app/api/annual-review/[id]/route.ts:220-222](app/api/annual-review/[id]/route.ts#L220-L222) — fetch by ID list từ `kpi_actuals.kpi_id` (historical reference) — leave as-is, annual review form cần hiện archived KPIs cho year reflection.

**Pure mutators (write, không phải reader — leave as-is)**:
- [app/api/x-matrix/create/route.ts:67-70](app/api/x-matrix/create/route.ts#L67-L70) — UPDATE `is_active=false` (matrix recreate flow)
- [app/api/x-matrix/create/route.ts:101](app/api/x-matrix/create/route.ts#L101) — INSERT
- [app/api/annual-review/[id]/transition/route.ts:185-188](app/api/annual-review/[id]/transition/route.ts#L185-L188) — UPDATE `is_active=false`
- [app/api/annual-review/[id]/transition/route.ts:219](app/api/annual-review/[id]/transition/route.ts#L219) — INSERT

**Conclude V3**: 7/7 user-facing readers OK. 3 mutation guards thiếu filter → Q6 β: bao gồm 3-line patch trong Task 2D (10 phút mỗi file). Precedent reader-uniformity từ M-Auth-MultiOrg-1 L39.

### V4 — KpiCard.tsx structure audit

Source: [app/dashboard/kpi/components/KpiCard.tsx](app/dashboard/kpi/components/KpiCard.tsx).

- **Wrapper element**: `<div>` (line 89-94) — KHÔNG phải `<button>`. Safe nest dropdown trigger button bên trong. KHÔNG nested-button HTML5 invalidity (pitfall §10).
- **Hooks order** (line 72-73): `useState(showForm)` + `useGembaComments(kpi.id)`. Stable order — thêm hook mới phải insert AFTER `useGembaComments` để giữ hook order, hoặc thêm vào cuối.
- **Header layout** (line 96-131): flex-row `justify-between`. Right side (line 116-130) đã có `<Badge>` + `<Button "Cập nhật">`. 3-dots `<Button variant="ghost" size="sm">` dropdown trigger sit right of "Cập nhật" với `shrink-0`.
- **Existing onClick** (line 124): `setShowForm(true)` — KHÔNG có `e.stopPropagation()`. Card div KHÔNG có click handler global → no event bubble conflict cho dropdown trigger.
- **Conclude V4**: 3-dots menu = sibling button bên trong existing right-side flex container. Pattern wrapper-div KHÔNG cần (header KHÔNG là button). Hook order: `useState(menuOpen)` thêm vào sau `useGembaComments`.

### V5 — shadcn primitives availability

Source: [components/ui/](components/ui/).

Existing primitives (17 files): `IndustryIcon`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `logo`, `radio-group`, `select`, `separator`, `sheet`, `textarea`.

- **DropdownMenu** ✅ — `@/components/ui/dropdown-menu` proven M-Auth-MultiOrg-1 OrgSwitcher precedent. Base `@base-ui/react/menu` (NOT Radix per M-Hoshin-1 lesson #6). Exports `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`.
- **AlertDialog** ✅ — `@/components/ui/alert-dialog` exists. Confirm destructive action.
- **Sheet** ✅ — đã có (mobile drawer reuse nếu cần — Q8 β KHÔNG cần).
- **Conclude V5**: KHÔNG cần thêm primitive. Both DropdownMenu + AlertDialog ready.

### V6 — Multi-org context integration audit

Source: [lib/auth/getActiveMembership.ts:12-26](lib/auth/getActiveMembership.ts#L12-L26).

**Helper signature**: `getActiveMembership(supabase, userId, lastOrgId): Promise<{ org_id: string; role: string } | null>`.

**Existing 8 routes use helper**: `discovery/pain-mapper`, `discovery/vision-save`, `kpi/list`, `report/monthly`, `swot/coaching`, `x-matrix/prefill`, `x-ray/history`, `x-ray/score`.

**Pattern auth chain cho destructive route** (DELETE `/api/kpi/[id]`):
1. `supabase.auth.getUser()` → 401 nếu null.
2. `checkRateLimit({ key: 'kpi:delete:${user.id}', limit: 30, windowSeconds: 300 })` — match `/api/orgs/switch` (M-Auth-MultiOrg-1).
3. `getActiveMembership(supabase, user.id, lastOrgId)` → 403 nếu null.
4. Fetch `kpis.select('id, org_id').eq('id', kpiId).maybeSingle()` → 404 nếu null.
5. Verify `kpi.org_id === membership.org_id` → 403 nếu không match (cross-org leak guard — RLS cũng catch nhưng UI message tốt hơn).
6. `requireOrgRole(supabase, user.id, kpi.org_id, ADMIN_ROLES)` từ `lib/supabase/server.ts` → 403 nếu Member (chỉ CEO + Manager xóa).
7. `supabase.from('kpis').update({ is_active: false }).eq('id', kpiId)`.
8. `console.log('[audit:kpi-delete]', JSON.stringify({ event, user_id, org_id, kpi_id, kpi_name, role, timestamp }))`.
9. Return `{ success: true, kpi_id }`.

**Conclude V6**: dùng `getActiveMembership` + `requireOrgRole` chain. Match `/api/orgs/switch` pattern.

### V7 — Audit trail requirement

- `kpis` có `created_at` + `updated_at` (trigger). KHÔNG có `deleted_at` / `deleted_by`.
- Pattern `[audit:org-switch]` structured JSON từ `/api/orgs/switch` (commit `370b72f`) đã proven trong production verify M-Auth-MultiOrg-1.
- **Conclude V7**: Q7 γ — `[audit:kpi-delete]` console.log structured JSON immediate, defer migration `036_kpis_deleted_at_by.sql` Phase 2 nếu 2nd use case warrant (vd: undo delete UI, admin recovery dashboard). Reason: minimal-scope MVP, Vercel logs giữ ~7 days đủ cho recovery window initial.

---

## 3. Decisions locked (Q1–Q8)

### Q1 — Soft vs hard delete philosophy

**Lock: α (soft-delete only via `is_active=false`)**.

Rationale: V1 confirmed 3 FK CASCADE child tables (`kpi_entries`, `kpi_actuals`, `weekly_hansei`) — hard-delete = wipe all history including annual review actuals + red-streak reflections. M-Hoshin-4 precedent đã dùng `is_active=false`. Reader uniformity 7/7 user-facing đã filter ✅. Audit trail preserved (rows still in DB, just hidden).

**Constraint future AI sessions**: KHÔNG bao giờ thêm `DELETE FROM kpis` query trừ khi /admin super-admin tool có justification rõ. Default = `UPDATE kpis SET is_active=false`.

### Q2 — 3-dots menu actions MVP scope

**Lock: α (chỉ "Xóa" — single action MVP)**.

Rationale: 80/20 — duplicate cleanup là pain point #1 (M-Hoshin-4 56 duplicates Ladysfit). Rename typo cũng useful nhưng SECONDARY — defer Phase 2 nếu user feedback. Scope creep risk LOW khi giới hạn 1 action.

### Q3 — Edit name UX

**Lock: γ (defer to Phase 2 — Q2 α MVP only "Xóa")**.

Rationale: Q2 lock α → KHÔNG cần Q3. Nếu user feedback request rename → Phase 2 dùng AlertDialog modal pattern (β trong Q3 brainstorm) consistent với Q4 confirmation.

### Q4 — Confirmation flow

**Lock: β (shadcn AlertDialog với Vietnamese copy)**.

Rationale: destructive action gravity > native confirm. Copy: title "Xóa KPI?" + body "KPI sẽ ẩn khỏi dashboard nhưng giữ lại lịch sử cập nhật. Bạn có thể khôi phục bằng cách liên hệ admin." + buttons "Hủy" / "Xóa" (destructive variant red). AlertDialog primitive đã có V5 ✅. Native `confirm()` UX poor + không styling control. Inline 2-step (γ) gimmicky.

**Constraint**: copy phải emphasize "giữ lại lịch sử" để user không sợ mất data — match soft-delete reality.

### Q5 — Optimistic update strategy

**Lock: γ (optimistic + `router.refresh()` fallback)**.

Rationale: KPI list page đã dùng client state `kpis` array (KpiTracker component fetch via `/api/kpi/list`). Pattern: filter out KPI client-side ngay khi click → toast "Đã xóa KPI" → POST DELETE → on success: `router.refresh()` re-fetch authoritative state. On error: rollback client state + toast error. Tương tự M-Hoshin-4 HanseiBanner optimistic. KHÔNG full reload (β M-Auth-MultiOrg-1) vì single-row mutation, không cross-org.

### Q6 — FK CASCADE handling + reader uniformity

**Lock: β (update 3 mutation guards thiếu filter)**.

Rationale: V3 audit phát hiện 3 mutation guards (`kpi/entry`, `hansei/list`, `hansei/create`) verify KPI tồn tại theo ID nhưng KHÔNG filter `is_active=true`. Sau soft-delete, attacker (hoặc user vô tình giữ kpiId cũ trong cache) có thể POST entry vào archived KPI → data pollution. Patch: thêm `.eq('is_active', true)` vào select + return 404 "KPI không tồn tại hoặc đã bị xóa" nếu null. 3 file × 1 LOC mỗi file × 10 phút audit-each = 30 phút Task 2D.

`annual_review/[id]/route.ts:220` LEAVE AS-IS — historical kpi_actuals form cần show archived KPIs cho year reflection.

**Constraint future AI sessions**: TRƯỚC khi thêm reader/mutation guard `from('kpis')`, audit `is_active` filter intent. Default = filter unless historical reference (annual review).

### Q7 — Audit trail requirement

**Lock: γ (console.log `[audit:kpi-delete]` structured JSON, defer migration)**.

Rationale: `[audit:org-switch]` pattern proven production (M-Auth-MultiOrg-1). Vercel logs retain ~7 days đủ recovery window initial. Migration `036_kpis_deleted_at_by.sql` cost ~1h (write SQL + apply + types regen) — KHÔNG warrant cho MVP single-feature. Khi 2nd use case xuất hiện (admin recovery dashboard, undo UI, compliance export) → migration Phase 2.

**Constraint**: log phải include `kpi_name` (text snapshot), `org_id`, `user_id`, `role`, `kpi_id`, `timestamp` — đủ trace nếu cần SQL recovery `UPDATE kpis SET is_active=true WHERE id=...`.

### Q8 — Mobile parity scope

**Lock: β (DropdownMenu reuse desktop pattern, touch-tested ≥48px)**.

Rationale: L38 zero-cost mobile parity từ M-Auth-MultiOrg-1 OrgSwitcher — `@base-ui/react/menu` portal + `data-side` already responsive. Trigger button cần `min-h-[44px] min-w-[44px]` cho iOS HIG touch target. DropdownMenuContent auto-position viewport-aware. Sheet drawer (α) overengineering cho 1-action menu. Defer (γ) sai vì KPI Tracker primary use case mobile-first cho Manager check on-the-go.

---

## 4. Risks (R1–R3)

### R1 — Specific risks + mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Mutation guards bypass archived KPI** (V3 — 3 sites: kpi/entry, hansei/list, hansei/create) | HIGH (will hit immediately post-soft-delete) | Data pollution: entry/hansei rows attached to archived KPI invisible UI but in DB | Q6 β — Task 2D patch 3 mutation guards SAME PR Task 2A DELETE endpoint. KHÔNG ship Task 2A standalone. |
| **FK CASCADE pre-existing risk surfaces nếu future hard-delete** | LOW (Q1 α locks soft-delete) | Wipes kpi_entries + kpi_actuals + weekly_hansei | Constraint Q1 — KHÔNG `DELETE FROM kpis` trừ /admin justification. Code review checkpoint. |
| **KpiCard hooks order break** (thêm useState menuOpen) | LOW | React error "Rendered more hooks than during the previous render" | V4 conclude — insert AFTER `useGembaComments(kpi.id)`. PR self-review check hook order. |
| **Rate-limit thiếu trên DELETE → spam mass-delete** | MEDIUM (Manager role có quyền, vô tình batch click) | All KPIs of org wiped in seconds | Task 2A include `checkRateLimit({ key: 'kpi:delete:${user.id}', limit: 30, windowSeconds: 300 })` match `/api/orgs/switch`. |
| **Audit trail loss khi soft-delete sans deleted_at/deleted_by column** | MEDIUM (recovery khó nếu user complain >7 days) | Vercel log expire → SQL recovery requires manual scan | Q7 γ — log `kpi_name` snapshot + `org_id` + `user_id` + `timestamp`. Phase 2 migration nếu 2nd use case warrant. |

### R2 — Effort breakdown task-by-task

| Task | Description | Estimate |
|---|---|---|
| **Task 1** (this) | Plan + decision lock | 30 phút ✓ |
| **Task 2A** | DELETE endpoint `app/api/kpi/[id]/route.ts` (~80 LOC: getUser → rate-limit → membership → fetch kpi → role check → update is_active=false → audit log) | 30 phút |
| **Task 2B** | 3-dots menu component `app/dashboard/kpi/components/KpiCardActions.tsx` (~50 LOC: DropdownMenu + Trigger ghost button + Item "Xóa" destructive style) + KpiCard.tsx header layout integrate | 45 phút |
| **Task 2C** | AlertDialog wire confirmation modal + optimistic state update + `router.refresh()` + toast | 30 phút |
| **Task 2D** | 3 mutation guards patch — `kpi/entry/route.ts`, `hansei/list/route.ts`, `hansei/create/route.ts` thêm `.eq('is_active', true)` vào verify-by-ID select + 404 error message | 30 phút |
| **Task 3** | Smoke test 5-6 cases (CASE 1: CEO xóa KPI happy path / CASE 2: Member RBAC 403 / CASE 3: cross-org RLS 403 / CASE 4: cancel AlertDialog / CASE 5: rate-limit 429 / CASE 6: archived KPI POST entry → 404) | 30 phút |
| **Task 4** | HANDOFF.md update + ACTIVE_CONTEXT.md + plans/_archive move | 20 phút |
| **Total** | | **~3h 35min** |

Slightly above 2-3h estimate (vì Task 2D + smoke 6 cases). OK acceptable.

### R3 — Risk level overall

**Risk level: LOW-MEDIUM**.

Justification:
- Scope nhỏ (2 files mới + 4 files modify + 0 migrations).
- Reader uniformity 7/7 user-facing đã filter ✅ — biggest cross-cutting concern resolved.
- 3 mutation guard patches đơn giản (1 LOC each) nhưng MUST ship cùng Task 2A để tránh data pollution window.
- FK CASCADE preserved by soft-delete strategy — KHÔNG touch child tables.
- Rate-limit + RBAC + audit log all match proven `/api/orgs/switch` pattern.
- Không touch Supabase types, không migration → typecheck/build risk LOW.

---

## 5. Files changed forecast

| Type | Path | LOC est. |
|---|---|---|
| **NEW** | `app/api/kpi/[id]/route.ts` (DELETE) | ~80 |
| **NEW** | `app/dashboard/kpi/components/KpiCardActions.tsx` | ~60 |
| **MOD** | `app/dashboard/kpi/components/KpiCard.tsx` (header layout + state) | ~+15 |
| **MOD** | `app/dashboard/kpi/components/KpiTracker.tsx` (or wherever client state holds kpis array — wire optimistic delete + rollback) | ~+20 |
| **MOD** | `app/api/kpi/entry/route.ts` (verify-by-ID guard add `is_active=true`) | ~+1 |
| **MOD** | `app/api/hansei/list/route.ts` (verify-by-ID guard) | ~+1 |
| **MOD** | `app/api/hansei/create/route.ts` (verify-by-ID guard) | ~+1 |
| **MOD** | `HANDOFF.md` + `ACTIVE_CONTEXT.md` Task 4 | docs |
| **NONE** | Supabase migration | — |
| **NONE** | `lib/supabase/types.ts` | — |
| **NONE** | `lib/validation/schemas.ts` (DELETE uses URL param `[id]` UUID validate inline với `z.string().uuid().safeParse(params.id)`) | — |

**Totals**: 2 new + 5 modified code files + 2 doc files. Net ~178 LOC added.

---

## 6. Effort breakdown

(Already captured in R2 above — total ~3h 35min including Task 1).

---

## 7. Constraints cho future AI sessions

1. **Soft-delete default (Q1 α)**: KHÔNG `DELETE FROM kpis` trừ /admin super-admin justification rõ. Default mutate = `UPDATE kpis SET is_active=false`.
2. **Reader-by-ID guard pattern (Q6 β)**: TRƯỚC khi thêm route fetch KPI by ID for write gate, MUST `.eq('is_active', true)` UNLESS historical reference (annual review form). Treat as security check, not optimization.
3. **Audit log required (Q7 γ)**: mọi destructive mutation KPI MUST `console.log('[audit:kpi-delete]', JSON.stringify({...}))` với snapshot `kpi_name`, `org_id`, `user_id`, `role`, `kpi_id`, `timestamp`. Pattern reuse `[audit:org-switch]`.
4. **Rate-limit destructive routes**: 30/300s/user via `checkRateLimit('kpi:delete:${user.id}')` — match `/api/orgs/switch`. KHÔNG dùng IP-based cho authed routes.
5. **AlertDialog copy (Q4 β)**: destructive confirmation MUST emphasize reversibility ("giữ lại lịch sử") để user trust soft-delete model — KHÔNG fearmonger "Xóa vĩnh viễn".
6. **Phase 2 deferred items** (do not include in M-KPI-Mgmt-1):
   - Rename action (Q2 β/γ + Q3 β modal pattern).
   - Migration `036_kpis_deleted_at_by.sql` (Q7 β proper audit columns).
   - /admin super-admin recovery dashboard (undo soft-delete UI).
   - Bulk delete (multi-select UI).
   - Restore endpoint POST `/api/kpi/[id]/restore`.
7. **Mobile parity (Q8 β)**: trigger button MUST `min-h-[44px] min-w-[44px]` (iOS HIG). KHÔNG override với explicit smaller size cho desktop trừ khi tested mobile retain ≥44px.

---

**Đợi Vũ Hải approve các lock decisions trước khi proceed Task 2A.**
