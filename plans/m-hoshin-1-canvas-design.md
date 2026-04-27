# M-Hoshin-1 — X-Matrix Canvas Refactor Design

**Status:** Decisions locked — ready for implementation
**Author:** Claude (research pass)
**Date:** 2026-04-27
**Goal:** Replace 5-step linear wizard with single-page X-Matrix canvas — 4 orthogonal edges visible simultaneously, auto-save per field, real-time validation.

---

## 1. Current Wizard Audit

### 1.1 Step → component map

| Step | Component | Responsibility |
|---|---|---|
| 1 | [components/x-matrix/Step1Vision.tsx](components/x-matrix/Step1Vision.tsx) | `vision` textarea + dynamic list of `yearGoals[]` (max 3) |
| 2 | [components/x-matrix/Step2Hoshins.tsx](components/x-matrix/Step2Hoshins.tsx) | Hoshin cards (max 5) — title, description, AI/manual/confirmed status, SWOT source badge, suggested KPIs chips |
| 3 | [components/x-matrix/Step3Initiatives.tsx](components/x-matrix/Step3Initiatives.tsx) | Hoshin tab switcher → initiative rows (max 3 per Hoshin), timeframe `30d/60d/90d` toggles |
| 4 | [components/x-matrix/Step4Kpis.tsx](components/x-matrix/Step4Kpis.tsx) | Hoshin tab switcher → KPI cards (max 2 per Hoshin) — name, unit, target, frequency, owner select |
| 5 | [components/x-matrix/XMatrixReview.tsx](components/x-matrix/XMatrixReview.tsx) | Read-only summary + save POST + redirect to `/dashboard` |

Orchestrator: [components/x-matrix/XMatrixWizard.tsx](components/x-matrix/XMatrixWizard.tsx) — owns step state, fires prefill fetch on mount, jumps to Step 2 if `?prefilled=true`.

Progress UI: [components/x-matrix/WizardProgress.tsx](components/x-matrix/WizardProgress.tsx) — 5-icon stepper + horizontal completeness bar.

### 1.2 State shape

**Local React state, NOT Zustand.** Single source of truth lives in [components/x-matrix/XMatrixWizard.tsx:31](components/x-matrix/XMatrixWizard.tsx#L31):

```
const [step, setStep] = useState<WizardStep>(1)
const [data, setData] = useState<XMatrixData>(EMPTY_DATA)
```

`data: XMatrixData` is passed top-down via `data` + `onChange` props to every step. Each step receives the whole object and replaces it on edit (immutable spread). No reducer, no context, no persistence — refresh = data lost (except prefill on mount).

`XMatrixData` defined in [lib/x-matrix/types.ts:50](lib/x-matrix/types.ts#L50):

```ts
interface XMatrixData {
  vision: string
  yearGoals: string[]
  hoshins: XMatrixHoshin[]   // each owns its initiatives[] and kpis[]
}
```

Hoshin owns its children — **the existing nested model already maps cleanly to a canvas where each Hoshin row spans across all 4 edges**.

### 1.3 Validation flow

| Layer | Where | What it enforces |
|---|---|---|
| Step gate (client) | `canNext` ternaries inside each step | Per-step minimums: Step 1 needs vision+1 goal, Step 2 needs ≥1 Hoshin with title, Step 4 needs `hasMinKpis` (any KPI complete) |
| Pre-submit (client) | [components/x-matrix/XMatrixReview.tsx:23](components/x-matrix/XMatrixReview.tsx#L23) calling `validateXMatrix(data)` | Returns full error array, blocks save button + shows error block |
| Envelope (server) | `xMatrixCreateSchema` Zod in [lib/validation/schemas.ts:109](lib/validation/schemas.ts#L109) | `{ data: record, year: int 2020-2100, orgId: string }` — shape only |
| Deep (server) | `validateXMatrix()` in [lib/x-matrix/utils.ts:21](lib/x-matrix/utils.ts#L21) | Vision non-empty, ≥1 year goal, ≥1 Hoshin, every Hoshin has title, ≥1 valid KPI (name+unit+target>0) |

Note: Step 3 (Initiatives) has **no client gate at all** — `onNext` fires unconditionally. `validateXMatrix` doesn't check initiatives either. They're optional today.

### 1.4 API contract

**`POST /api/x-matrix/create`** — [app/api/x-matrix/create/route.ts](app/api/x-matrix/create/route.ts)

Request body:
```
{ data: XMatrixData, year: number, orgId: string }
```

Response (success):
```
{ success: true, xMatrixId: string, kpisCreated: number }
```

Error cases:
- `401` — no authed user
- `403` — caller is not CEO/admin (`requireOrgRole(... ADMIN_ROLES)`)
- `400` — `validateXMatrix` errors (single first error returned)
- `500` — insert error or unhandled throw

Side effects in this order:
1. Archive any existing `active` matrices for the org → status `archived`
2. Deactivate KPIs of those archived matrices → `is_active=false`
3. Insert new `x_matrices` row with `status='active'`, `vision_json=toJson(data)`
4. For each Hoshin × KPI with name+unit+targetValue: insert into `kpis` table
5. `revalidatePath` for `/dashboard`, `/dashboard/x-matrix`, `/dashboard/x-matrix/new`, `/dashboard/kpi`

**Other route in scope:** `GET /api/x-matrix/prefill` — returns `{ data, hasPrefill, completeness }`. Called once on wizard mount. Survives canvas refactor unchanged.

---

## 2. Reusable Components Inventory

| Component | Verdict | Rationale |
|---|---|---|
| [Step1Vision.tsx](components/x-matrix/Step1Vision.tsx) — Textarea + dynamic goal list | 🔄 ADAPT | Lift the vision textarea + yearGoals list into a `<TopEdgeVision />` panel. Drop the `onNext`/`canNext` button + footer. The atoms (Textarea, Input, add/remove logic) keep working. |
| [Step2Hoshins.tsx](components/x-matrix/Step2Hoshins.tsx) — Hoshin cards w/ AI/SWOT badges | 🔄 ADAPT | The Hoshin card UI (status badges, SWOT label, suggested KPI chips, confirm/remove buttons) is the **most valuable salvage**. Repackage as `<HoshinCard />` rendered as a column header in the canvas grid. |
| [Step3Initiatives.tsx](components/x-matrix/Step3Initiatives.tsx) — tabs + initiative rows + 30/60/90 toggles | 🔄 ADAPT | Throw the tab switcher (`activeIdx` state) — canvas shows all Hoshins simultaneously. Keep the initiative row layout (number, input, timeframe pill group, remove ✕) as `<InitiativeRow />` rendered under each Hoshin column. |
| [Step4Kpis.tsx](components/x-matrix/Step4Kpis.tsx) — tabs + KPI cards w/ owner select | 🔄 ADAPT | Same — throw the tabs, keep the inner `<KpiCard />` (name, 3-col grid for unit/target/frequency, owner Select). Render under each Hoshin column on the left edge. |
| [XMatrixReview.tsx](components/x-matrix/XMatrixReview.tsx) — read-only summary + save | 🔄 ADAPT | Strip the read-only summary blocks (the canvas itself IS the review). Keep `handleSave` logic + the error banner block as a sticky **save bar** at canvas bottom. |
| [WizardProgress.tsx](components/x-matrix/WizardProgress.tsx) — 5-step icon trail | ❌ THROW | No steps in canvas mode. Replace with a slim `<CanvasCompletenessBar />` (just the 0–100% bar, no icons). |
| [XMatrixWizard.tsx](components/x-matrix/XMatrixWizard.tsx) — step state + prefill orchestration | 🔄 ADAPT (heavy) | Keep prefill fetch + prefill banner. Drop step state, `goTo`, scroll-to-top. Rename to `<XMatrixCanvas />` or wrap in new orchestrator. |
| `LIMITS` constant ([lib/x-matrix/types.ts:4](lib/x-matrix/types.ts#L4)) | ✅ REUSE | Same business rules — 3 goals / 5 hoshins / 3 inits / 2 KPIs. |
| `validateXMatrix`, `calcCompleteness` ([lib/x-matrix/utils.ts](lib/x-matrix/utils.ts)) | ✅ REUSE as-is | Pure functions over `XMatrixData`. Real-time per-field validation in canvas wraps these — no need to fork. |
| `genHoshinId`, `genInitId`, `genKpiId` | ✅ REUSE | ID generators don't care about UI shape. |
| `XMatrixData` / `XMatrixHoshin` / `XMatrixKpi` / `XMatrixInitiative` types | ✅ REUSE | **Critical for backward compat with API.** Don't fork the type. |
| `OrgMember` type | ✅ REUSE | Owner select still needs members. |
| `WizardStep` type | ❌ THROW | No more steps. |

**SWOT prefill banner** in `XMatrixWizard.tsx:88-101` — keep, render above canvas.

---

## 3. Canvas Data Model

### 3.1 Layout — Density Mode (locked — see §5 Q1, Q2, Q6)

**Toyota A3 density pattern: 3 fixed-height rows × 3 columns, total canvas ≤ 720px on 1080p viewport.** 4 orthogonal edges share the perimeter; the center holds an empty correlation matrix grid (5 Hoshins × 3 Year Goals) which M-Hoshin-2 will wire to logic. Owner is a single field per Hoshin (not per KPI), rendered inside the Hoshin card; the West edge shows an aggregated Owners summary derived from those cards.

```
┌──────────────────────────────────────────────────────────┐  Header  50px
├──────────────────────────────────────────────────────────┤
│                NORTH — Year Goals (3 inline)             │   90px
├─────────┬──────────────────────────────────┬─────────────┤
│  WEST   │   CENTER — Correlation Matrix    │    EAST     │
│ Owners  │   (5×3 empty grid, M-Hoshin-2    │   KPIs      │
│ list    │    wires logic)                  │   list      │  320px
│ (aggr)  │                                  │   (aggr)    │
│ 200px   │              1fr                 │   200px     │
├─────────┴──────────────────────────────────┴─────────────┤
│           SOUTH — Hoshins (5 cards inline, scroll)       │  200px
├──────────────────────────────────────────────────────────┤
│                       Footer (sticky)                    │   50px
└──────────────────────────────────────────────────────────┘
                  Total ≈ 710px on 1080p
```

Grid spec (desktop, `md:` breakpoint and up):
- `grid-template-rows: 90px 320px 200px` (North / Middle / South)
- `grid-template-columns: 200px 1fr 200px` (West / Center / East)
- North and South span all 3 columns (`md:col-span-3`); West/Center/East fill row 2.
- Gap: `gap-3` (12px).

The West (Owners) and East (KPIs) edges are **derived views** — they read from `data.hoshins[].owner_name` and `data.hoshins[].kpis[]` respectively, no independent state. Edits happen inside the Hoshin card on the South row, opened via modal (locked — §5 Q6).

Center correlation matrix renders an empty 5×3 button grid in V1 — cells are `disabled` placeholders with `aria-label="Hn × Ym correlation (M-Hoshin-2)"`. M-Hoshin-2 will wire correlation logic + visual indicators (●/○/blank).

Toyota diagonal mode (45° tilted labels, corner matrices, SVG render) is deferred to M-Hoshin-3+.

### 3.2 State requirements

The canvas must support:

1. **Concurrent fill across 4 edges** — user can edit any cell anytime, not in step order.
2. **Per-cell auto-save** — debounced writes (no Submit button on each cell). Either to DB draft row or `localStorage`.
3. **Real-time validation per field** — show inline errors as user types, not at end-of-form.
4. **Backward compat with `validateXMatrix(data: XMatrixData)`** — server contract unchanged. Canvas state must serialize back to `XMatrixData` for the existing `POST /api/x-matrix/create`.

### 3.3 Proposed shape

Keep `XMatrixData` as the **persisted shape** (API-compatible, byte-for-byte what `vision_json` already stores) with **one additive field**: `owner_name` on `XMatrixHoshin` (locked — §5 Q2). Add a thin UI overlay that tracks per-field state (focus, error, dirty, save status, AI-suggestion marker).

```ts
// Persisted shape (additive change — owner_name is new, optional in V1)
import type { XMatrixHoshin as BaseHoshin, XMatrixData as BaseData } from '@/lib/x-matrix/types'

interface XMatrixHoshin extends BaseHoshin {
  owner_name?: string           // free-text display name; NOT a FK to users.id (V1)
                                // V2 may upgrade to ownerUserId once we want notifications/RLS
}

interface XMatrixData extends Omit<BaseData, 'hoshins'> {
  hoshins: XMatrixHoshin[]
}

// Per-field UI state, addressed by JSON path
type FieldPath = string  // e.g. "vision", "yearGoals.0", "hoshins.2.kpis.0.targetValue", "hoshins.1.owner_name"

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

interface FieldState {
  status: SaveStatus
  error?: string         // localized message from real-time validator
  lastSavedAt?: number   // epoch ms
}

interface CanvasUiState {
  focusedCell: FieldPath | null
  fields: Record<FieldPath, FieldState>
  aiSuggestedFields: Set<FieldPath>   // §5 Q4 — paths still showing AI marker; cleared on accept/edit
  globalSaveStatus: SaveStatus         // aggregate for the sticky footer indicator
  errors: string[]                     // result of validateXMatrix(data) — refreshed on every change
}

interface XMatrixCanvasState {
  data: XMatrixData                    // persisted shape (with owner_name) — POST body unchanged structurally
  ui: CanvasUiState
}
```

Why this works:
- `validateXMatrix(state.data)` keeps working untouched — `owner_name` is optional and the validator never reads it.
- The Zod envelope `xMatrixCreateSchema` accepts `data: z.record(z.string(), z.unknown())`, so additive fields pass through without schema changes.
- `ui.errors` gives the sticky save bar a live indicator.
- `ui.fields[path].error` drives inline cell-level errors (debounce 300ms).
- `ui.aiSuggestedFields` drives the dashed-cyan AI marker (§5 Q4); cleared when the user accepts or edits a cell.
- Auto-save serializes only `state.data` — never the UI overlay — so the prefill API + create API see exactly what they see today.

**Note on AI prefill flow (§5 Q4):** the prefill response no longer flows directly into `state.data`. Instead, on prefill receive: (a) merge into `state.data`, (b) populate `ui.aiSuggestedFields` with every populated path. Click a cell → remove from set (accept). Edit a cell → remove from set (override). "Reject all AI" button → walk the set, clear those paths in `state.data`, empty the set.

**Rejected alternative:** annotating `XMatrixData` itself with per-field metadata. Would bloat `vision_json` and break the prefill/create API shape — the overlay approach keeps persistence clean.

### 3.4 Store mechanism

**`useReducer` + Context.** No Zustand for V1.

- The wizard is already prop-drilled `data` + `onChange` — same pattern, just one level deeper.
- No cross-route state to share, so a store package is overkill.
- Easy to migrate to Zustand later if the Coaching layer needs the same model.

If V2 adds DB drafts with optimistic updates and conflict resolution, reconsider Zustand at that point.

### 3.5 Auto-save target (locked — §5 Q3)

**V1: localStorage.** DB drafts deferred to V2.

- Key: `xmatrix-canvas-draft-${orgId}-${year}`
- Debounce: 500ms after last keystroke
- Payload: `state.data` only (not the UI overlay)
- Lifecycle: cleared on successful POST `/api/x-matrix/create`; also cleared if user clicks "Reject all AI" + then "Discard draft"
- Cross-device recovery: not supported in V1 (acceptable — current wizard already loses state on refresh, so this is strictly an upgrade)

**V2 path (out of scope for M-Hoshin-1):** DB drafts via either a new `x_matrix_drafts` table or by reusing `x_matrices.status='draft'`. Either way needs a PATCH route + cleanup logic + careful interaction with the dedupe block in [app/api/x-matrix/create/route.ts:42-71](app/api/x-matrix/create/route.ts#L42-L71) which today only archives `status='active'` rows.

---

## 4. Migration Strategy

### 4.1 Route placement

**Recommendation: same route `/dashboard/x-matrix/new`, behind a feature flag.**

Why same route:
- The dashboard "Create X-Matrix" CTA already points there. No links to update.
- The SWOT sync deep-link `?prefilled=true` already targets this path.
- Two parallel routes diverge over time and rot.

Feature flag mechanism (lightest option for solo flow): an env var `NEXT_PUBLIC_XMATRIX_CANVAS=1` checked at the top of [app/dashboard/x-matrix/new/page.tsx](app/dashboard/x-matrix/new/page.tsx):

```ts
const useCanvas = process.env.NEXT_PUBLIC_XMATRIX_CANVAS === '1'
return useCanvas
  ? <XMatrixCanvas orgId={...} members={...} />
  : <XMatrixWizard orgId={...} members={...} />
```

Flip on Vercel preview → test in browser → flip prod → delete the wizard files in a follow-up cleanup PR (offer a `/schedule` agent for that 2 weeks later).

Alternative if env-var feels too coarse: a `?canvas=1` query param. Better for side-by-side comparison during testing, worse as a permanent toggle. Pick one — mixing both = noise.

### 4.2 No DB migration needed for V1

Confirmed: M-Hoshin-1 ships with **zero schema changes**.

- `XMatrixData` adds `owner_name` to `XMatrixHoshin` — but this is a TS-level field stored inside the existing `x_matrices.vision_json` JSONB column, not a new SQL column.
- Auto-save target is localStorage (§3.5, §5 Q3) — no draft table needed.
- Existing `x_matrices.status='draft'` is unused in production today (no code writes it), so no rows to migrate.
- The Zod envelope `xMatrixCreateSchema` accepts `data: z.record(z.string(), z.unknown())`, so `owner_name` flows through without schema edits.

The only deploy-time change is the env var `NEXT_PUBLIC_XMATRIX_CANVAS=1`.

### 4.3 Rollback plan

1. Flip env var off (`NEXT_PUBLIC_XMATRIX_CANVAS=0`) → instant fallback to wizard.
2. Wizard files stay untouched during V1 → zero risk surface for the rollback.
3. Cleanup PR (delete wizard files) gated on a 2-week soak with positive signal.

### 4.4 Pre-merge typecheck/build

Per [AGENTS.md](AGENTS.md): `npm run typecheck` + `npm run build` before declaring done. The canvas should drop into the existing route without touching API, types, schemas, or migrations — typecheck risk is minimal as long as we keep `XMatrixData` shape intact.

---

## 5. Decisions Locked (2026-04-27)

### Q1 — Layout: Orthogonal
- 4 cạnh vuông góc (North/South/East/West), KHÔNG diagonal Toyota chéo.
- Toyota Mode (diagonal SVG, corner correlation matrices) defer sang **M-Hoshin-3+**.
- Implication: layout grid CSS đơn giản (CSS Grid 3×3), mobile-friendly, không cần SVG transform layer.

### Q2 — Owner: 1 owner per Hoshin (inside Hoshin card)
- Owner field nằm **INSIDE** Hoshin card, không phải edge riêng.
- Phía **West** canvas hiển thị "Owners summary column" — aggregate tự động từ `data.hoshins[].owner_name`, read-only view.
- KHÔNG migrate schema `kpis.owner_user_id` (giữ nguyên — KPI vẫn có owner riêng cho notification/RLS sau này).
- **Schema change:** thêm field `owner_name?: string` vào `XMatrixHoshin` type. Free-text display name, **không phải FK đến `users` table** trong V1 — tránh complexity user lookup. V2 có thể upgrade thành `ownerUserId` nếu cần notifications.
- Implication: stored inside `vision_json` JSONB, không cần SQL migration.

### Q3 — Auto-save: localStorage V1 + DB drafts V2
- **V1:** localStorage key `xmatrix-canvas-draft-${orgId}-${year}`, debounce 500ms.
- Submit thành công → clear localStorage.
- **V2 (deferred):** DB drafts (table `x_matrix_drafts` HOẶC reuse `x_matrices.status='draft'`).
- Implication: **KHÔNG cần migration cho M-Hoshin-1.**

### Q4 — AI Prefill: highlight + accept/reject từng ô
- AI suggestions fill vào canvas nhưng có visual marker:
  - `border-dashed`
  - color `var(--accent-cyan)`
  - icon ✨
- **Click ô = "accept"** → loại marker, lưu giá trị hiện tại vào `state.data` (đã ở đó), remove path khỏi `aiSuggestedFields`.
- **Edit ô = override** → loại marker, dùng giá trị user, remove path khỏi `aiSuggestedFields`.
- **"Reject all AI" button** trên prefill banner → walk `aiSuggestedFields`, clear those paths trong `state.data`, empty Set.
- State shape thêm: `aiSuggestedFields: Set<FieldPath>` trong `CanvasUiState` (track field path nào đang là AI suggestion). Đã reflect trong §3.3.
- Implication: prefill flow thay đổi — KHÔNG gọi API direct vào `state.data`, cần intermediate merge step populate cả `state.data` + `aiSuggestedFields` cùng lúc.

### Q6 — Density Mode chosen (Toyota A3 pattern, locked 2026-04-27)

- **Layout target:** total canvas height ≤ 720px on 1080p viewport, comfortable on 1080p / tight-but-OK on 720p. Goal is "everything visible without scroll" so the user can see all 4 edges + center matrix at once (Toyota A3 density).
- **Row heights (desktop):** Header 50px / North 90px / Middle 320px / South 200px / Footer 50px ≈ **710px total**.
- **Column widths (desktop):** West 200px / Center 1fr / East 200px. Center is wide because it now holds the correlation matrix grid (5×3 cells), not a motto block.
- **Card heights:** YearGoalCard 60px (1-line title + 1-line desc), HoshinCard 110px (label row + 2-line title + counts row).
- **Center change:** drop the "Mục tiêu lớn → Cách năm nay → Đo bằng gì → Ai chịu" motto block. Replace with empty correlation matrix grid (header row Y1/Y2/Y3 + 5 H-rows × 3 cells = 15 disabled placeholder buttons). M-Hoshin-2 wires correlation logic.
- **Click-card → modal pattern:** every YearGoalCard / HoshinCard is a `<button>` with `onClick`. Task 2.5 stops at `console.log` placeholder; Task 3 (M-Hoshin-1 follow-up) wires the actual modal.
- Implication: shrinking pads + heading sizes is presentation-only; types, props, and persisted shape are unchanged.

### Q5 — Mobile fallback (< 768px): Stack + sticky mini-map
- Layout: 4 cards stacked vertically (Year Goals → Hoshins → KPIs → Owners summary).
- **Sticky mini-map** ở top, height ~80px, hiển thị 4 quadrants thu nhỏ với:
  - Color indicator: filled (`var(--brand)`) vs empty (`var(--text-3)`)
  - Click quadrant → smooth scroll tới card tương ứng (`scrollIntoView({ behavior: 'smooth' })`)
- Breakpoint: `md:` (768px) trở lên dùng full canvas, dưới đó dùng stacked.
- Implication: thêm component `<CanvasMiniMap />` cho mobile, plus 2 layout variants gated bằng Tailwind `md:` classes (no JS-side breakpoint detection needed).
- **Note:** wizard files vẫn xoá được — mobile dùng cùng `<XMatrixCanvas />` component, chỉ khác CSS layout. Một code path duy nhất.

---

## 6. Component Tree (Final Design)

```
<XMatrixCanvasPage>                          (route: /dashboard/x-matrix/new)            [ADAPT — page.tsx swaps wizard → canvas behind env flag]
  ├── <CanvasHeader>                         (year selector, status badge, save indicator)  [NEW]
  ├── <CanvasMiniMap>                        (mobile only, sticky top, click-to-scroll)     [NEW]
  ├── <CanvasGrid>                           (responsive: full 4-edges desktop / stacked mobile)  [NEW]
  │   ├── <NorthEdge> Year Goals             (max 3)                                         [ADAPT — lifts inputs from Step1Vision.tsx]
  │   │   └── <YearGoalCard> × 3                                                             [ADAPT — Step1 goal row repackaged]
  │   ├── <CenterColumn> Hoshins             (max 5 — drives the whole canvas)               [NEW container]
  │   │   └── <HoshinCard> × 5                                                               [ADAPT — Step2 card + new owner_name field]
  │   │       ├── (vision-row level) title + description + AI/SWOT badges                    [REUSE — Step2Hoshins.tsx:97-180 logic]
  │   │       ├── <OwnerNameInput>           (inline text, free-text V1)                    [NEW]
  │   │       ├── <InitiativeRow> × 3                                                        [ADAPT — Step3 row, drop tab switcher]
  │   │       └── <KpiRow> × 2                                                               [ADAPT — Step4 KPI card, drop tab switcher; owner Select removed (moved to Hoshin level)]
  │   ├── <EastEdge> KPI Summary             (aggregate read-only from hoshins[].kpis)       [NEW — derived view, no own state]
  │   ├── <WestEdge> Owners Summary          (aggregate read-only from hoshins[].owner_name) [NEW — derived view, no own state]
  │   ├── <SouthEdge> Initiatives Summary    (aggregate read-only from hoshins[].initiatives, optional in V1) [NEW — may collapse if cards already show inits]
  │   └── <CenterX>                          (Empty correlation matrix 5×3 grid — M-Hoshin-2 wires logic)   [NEW — static skeleton]
  ├── <AIPrefillBanner>                      (only when ui.aiSuggestedFields.size > 0; "Reject all AI" button) [ADAPT — extends existing banner from XMatrixWizard.tsx:88-101]
  └── <SubmitBar>                            (sticky bottom: validateXMatrix(data) summary + Submit button)   [ADAPT — handleSave + error block from XMatrixReview.tsx]
```

**Reuse legend (cross-ref §2):**

| Component | Source | Notes |
|---|---|---|
| `<HoshinCard>` core | Step2Hoshins.tsx | AI/SWOT badge logic, confirm/remove buttons, suggested KPI chips — repackage as standalone card |
| `<InitiativeRow>` | Step3Initiatives.tsx | Number + input + 30/60/90 pill group + ✕ — keep as-is, drop the tab harness |
| `<KpiRow>` | Step4Kpis.tsx | name + 3-col grid (unit/target/frequency) — **remove owner Select** (moved to `<OwnerNameInput>` at Hoshin level per §5 Q2) |
| `<YearGoalCard>` | Step1Vision.tsx | Goal input row + add/remove buttons |
| `<SubmitBar>` | XMatrixReview.tsx | `handleSave` POST logic + error block + `router.refresh()/push('/dashboard')` |
| `<AIPrefillBanner>` | XMatrixWizard.tsx | Existing prefill banner + new "Reject all AI" action wired to `aiSuggestedFields` Set |
| `<XMatrixCanvasPage>` shell | XMatrixWizard.tsx | Prefill `useEffect`, mount-once `started.current` guard, banner visibility timer |
| `<CanvasMiniMap>`, `<CanvasGrid>`, `<CanvasHeader>`, `<CenterX>`, edge summary panels | NEW | No equivalent in current wizard |

**Throw list (deleted in cleanup PR after 2-week soak):**
- `XMatrixWizard.tsx` (logic moved into canvas shell)
- `WizardProgress.tsx` (5-step trail; replaced by completeness bar inside `<SubmitBar>`)
- All `Step1Vision.tsx` / `Step2Hoshins.tsx` / `Step3Initiatives.tsx` / `Step4Kpis.tsx` / `XMatrixReview.tsx` once their salvaged sub-components live under `components/x-matrix/canvas/`
- `WizardStep` type from `lib/x-matrix/types.ts`

---

## Verification done in this pass

- Read all 7 files under [components/x-matrix/](components/x-matrix/).
- Read [lib/x-matrix/types.ts](lib/x-matrix/types.ts) and [lib/x-matrix/utils.ts](lib/x-matrix/utils.ts) end-to-end.
- Read [app/dashboard/x-matrix/new/page.tsx](app/dashboard/x-matrix/new/page.tsx) and [app/api/x-matrix/create/route.ts](app/api/x-matrix/create/route.ts) end-to-end.
- Read x-matrix portion of [lib/validation/schemas.ts](lib/validation/schemas.ts).
- Confirmed no Zustand store or context provider for x-matrix (single `useState` in `XMatrixWizard`).
- Confirmed `validateXMatrix` is the only deep-validation source, used by both client (Review) and server (route).
- No production code modified.
