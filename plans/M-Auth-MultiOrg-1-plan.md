# M-Auth-MultiOrg-1 — Org Switcher UI

> **Status**: Task 1 (design audit + decision lock) — KHÔNG code change.
> **Author**: claude.ai web (Cursor execution sau khi Vũ Hải lock decisions).
> **Path lock (anh + Vũ Hải align Hướng 2 brainstorm)**: A + α + I = sidebar dropdown + full reload + user_metadata.last_org_id.

---

## Trigger

§18 candidate `M-Auth-MultiOrg-1` (priority MEDIUM). Trigger condition: M-OrgInvite-1 shipped 2026-05-02 wire 50% infrastructure (table `org_invites`, accept flow auto-set `last_org_id`, multi-org dashboard pattern via `find(lastOrgId) ?? memberships[0]`). Missing 50%: UI cho user CHỦ ĐỘNG switch giữa orgs đã join. Currently fallback `memberships[0]` (newest = stopgap MVP).

Sub-trigger: M-OrgInvite-1 deferred bug — `supabase.auth.updateUser({ data: { last_org_id } })` không reflect vào session cookie ngay. Full reload approach (Q4 γ) bypass bug → addresses deferred item.

---

## Scope (4 modules)

### A. UI Component — Sidebar dropdown
**New file**: [components/layout/OrgSwitcher.tsx](components/layout/OrgSwitcher.tsx)
**Location**: Replace existing "Org info" block ở [components/layout/sidebar.tsx:89-96](components/layout/sidebar.tsx#L89-L96) — same spot, upgrade từ display-only avatar+orgName → interactive DropdownMenu trigger.
**Trigger pattern**: button = avatar (orgInitial) + orgName + chevron-down icon. Match existing visual style (8x8 avatar + accent-brand bg + white border).
**Dropdown content**: list memberships + `<CheckIcon />` indicator cho current org + separator + "+ Tạo org mới" link → `/onboarding/setup-org`.
**Primitive**: `components/ui/dropdown-menu.tsx` (V2 confirmed) — uses `@base-ui/react/menu` (NOT Radix), has Checkbox/Separator items ready.
**Mobile**: rendered cùng SidebarContent qua MobileSidebarContent inside Sheet drawer (Header.tsx line 149-164). Q6 β decision = full Sheet-based drawer is already the pattern → OrgSwitcher tự động available trong sheet, KHÔNG cần thêm gì cho bottom-nav.

### B. API endpoint — POST /api/orgs/switch
**New file**: [app/api/orgs/switch/route.ts](app/api/orgs/switch/route.ts) (~80-100 LOC)
**Body**: `{ org_id: string }` (Zod validate UUID format)
**Auth flow**:
1. `supabase.auth.getUser()` → 401 nếu null
2. `requireOrgRole(supabase, user.id, body.org_id, ALL_ROLES)` từ `lib/supabase/server.ts:133` — verify user là member của target org (V1.5 confirmed helper signature).
3. `supabase.auth.updateUser({ data: { last_org_id: org_id } })` — set metadata.
4. Return `{ success: true, org_id }`. Cookie sync KHÔNG explicit handle (Q4 γ — full reload client-side bypass). Decision rationale Section "Decision lock Q4".
5. Audit log: `console.log('[audit:org-switch]', { user_id, from_org, to_org, ts })`.
**Rate limit**: 30/5min/user qua `lib/rate-limit.ts` `checkRateLimit('org-switch', user.id, { limit: 30, windowMs: 300_000 })`. Pattern reuse từ M-OrgUX-1 `/api/orgs/check-similar`. NOTE: M-RateLimit-Generic-1 (§18) chưa ship — vẫn dùng `checkRateLimit` direct, OK acceptable cho 1 route.

### C. Hook / Helper
**Decision Q3 β-derived**: KHÔNG cần client hook `useCurrentOrg()`. V7 grep confirmed 0 existing hook. Layout.tsx (Server Component) đã fetch memberships + currentOrg → pass props xuống OrgSwitcher (Client Component direct child sidebar). Avoid premature abstraction (`useCurrentOrg` chỉ có 1 caller initially → YAGNI).
**Server-side reuse**: `getActiveMembership` ([lib/auth/getActiveMembership.ts:12-26](lib/auth/getActiveMembership.ts#L12-L26)) KHÔNG cần dùng cho switch API (target org đã có sẵn từ body, không cần "current active" lookup). KHÔNG modify helper.

### D. Data fetching
**Layout.tsx mod**: [app/dashboard/layout.tsx:27-39](app/dashboard/layout.tsx#L27-L39) đã fetch `memberships` array + resolve `membership` (current). Cần fetch THÊM `organizations` rows (id + name) cho ALL membership orgs (currently chỉ fetch 1 org). Cost: 1 extra Supabase query với `.in('id', orgIds)`. Pass xuống Sidebar qua props mới `memberships: Array<{ org_id, role, name }>`.
**Type**: extend SidebarProps add `memberships: Array<{ id: string; name: string; isCurrent: boolean }>` (CenterX-style flat shape). Sidebar pass xuống OrgSwitcher.
**Cache**: Server fetch mỗi request — Next 16 default no cache (memberships có thể mutate qua invite accept). Nếu performance issue → `revalidate: 60s` Phase 2.

---

## Verify-first findings

### V1 — Sidebar + bottom-nav structure

**`components/layout/sidebar.tsx` (219 LOC, client component)**:
- Layout 4 sections: Logo (line 76-86) + Org info (line 89-96) + Nav groups (line 99-170) + User area (line 173-195).
- **"Org info" block (line 89-96)**: existing static display — `<div>` avatar (`orgInitial` first char) + orgName truncate. **THIS IS THE SPOT** OrgSwitcher replaces.
- 3 NAV_GROUPS hardcoded array (line 29-50): Khám phá / Chiến lược / Báo cáo. Help + Settings separate (line 137-169).
- Mobile: `MobileSidebarContent` (line 214-218) wraps same SidebarContent in Sheet (Header.tsx line 149-164). Q6 β decision auto-fits — sheet drawer already replicates desktop sidebar.
- User area (line 172-195): bottom-anchored avatar + name + email + LogOut icon → links `/dashboard/settings`. **NOT** the spot for OrgSwitcher (per Q5 α top decision).

**`components/layout/bottom-nav.tsx` (62 LOC)**:
- 5-icon grid (Khám phá / X-Matrix / KPI / Báo cáo / Cài đặt) — full width của mobile.
- KHÔNG có space cho OrgSwitcher icon (5 cols already saturated).
- Q6 β decision rejects bottom-nav modification → OrgSwitcher chỉ accessible qua hamburger → Sheet drawer (Header.tsx line 73-82 trigger).

### V2 — Dropdown primitive available

**`components/ui/dropdown-menu.tsx` (269 LOC)**:
- Base: `@base-ui/react/menu` (NOT Radix) — match codebase convention M-Hoshin-1 lesson #6.
- Exports: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuPortal`, `DropdownMenuLabel`, `DropdownMenuGroup`, `DropdownMenuSub*`.
- **Decision**: dùng `DropdownMenuItem` với manual `<CheckIcon />` thay vì `DropdownMenuCheckboxItem` (CheckboxItem là toggle UI semantic — switch là 1-of-N selection, không phải toggle). Hoặc `DropdownMenuRadioGroup` + `DropdownMenuRadioItem` (radio semantic match 1-of-N) — **prefer radio variant** cho a11y (proper aria-radio role).
- Existing usage: `Header.tsx:113-145` user menu pattern (Trigger + Content + Item + Separator). Match pattern style: `border-2 border-ink bg-bg-warm shadow-brutal-md` cho NB v3.2 design tokens.

### V3 — last_org_id update precedent

**`app/api/invites/[token]/accept/route.ts:120-123`**:
```ts
// Set last_org_id in user metadata so dashboard layout picks correct org
await supabase.auth.updateUser({
  data: { last_org_id: invite.org_id },
})
```

- Pattern simple: `auth.updateUser({ data })` đặt metadata. KHÔNG có refreshSession/cookie sync.
- **Cookie sync bug**: M-OrgInvite-1 §16 entry mention "`router.push` stale cookie" + "`updateUser` metadata not in session" trong list 4 bugs fixed. Resolved by full page reload client-side (`window.location.href` thay vì `router.push`) — pattern mirrors switch decision Q4 γ.
- KHÔNG có cookie set manual hoặc refreshSession infrastructure → option β (manual cookie set) requires NEW infra → reject Q4 β.

### V4 — getActiveMembership signature

**`lib/auth/getActiveMembership.ts:12-26`**:
```ts
export async function getActiveMembership(
  supabase: SupabaseClient<Database>,
  userId: string,
  lastOrgId: string | null,
): Promise<{ org_id: string; role: string } | null>
```

- Server-only (`SupabaseClient` từ `@supabase/supabase-js`).
- Logic: fetch all memberships of user, return `find(m => m.org_id === lastOrgId) ?? data[0]`.
- Phase 1 rollout: 7 API routes (M-Cleanup-6 §16 entry). Phase 2 (12 dashboard inline sites) deferred.
- **Switch API verdict**: KHÔNG cần dùng — switch route đã có `org_id` từ body, chỉ cần verify membership exists qua `requireOrgRole(supabase, userId, orgId, ALL_ROLES)` thay vì lookup "current active".
- **Layout reuse verdict**: layout.tsx line 36-39 hiện inline pattern (`memberships.find ?? [0]`) — cùng logic helper. Phase 2 migration deferred. Trong M-Auth-MultiOrg-1 KHÔNG migrate (out of scope).

### V5 — Dashboard layout multi-org pattern

**`app/dashboard/layout.tsx` (101 LOC)**:
- Line 22 `auth.getUser()` (network call, fresh metadata) — NOT JWT parse → returns up-to-date `user_metadata.last_org_id`. **CRITICAL for Q4 γ** — full reload triggers fresh fetch → bypass cookie staleness.
- Line 27-32: fetch `org_members` `.eq(user_id).order(created_at desc)`.
- Line 36-39: resolve `membership` qua `find(m => m.org_id === lastOrgId) ?? memberships[0]` — pattern khớp `getActiveMembership` helper.
- Line 41-52: fetch `org` (single org details by `membership.org_id`) + `profile` parallel `Promise.all`.
- Line 54-58: extract `orgName`, `orgIndustry`, `userName`, `userEmail`, `userRole`.
- **ASSUMPTION VERIFIED**: layout đã handle multi-org đúng post M-OrgInvite-1. Switch chỉ cần update `last_org_id` + reload → layout sẽ pick org mới chính xác.
- **Modification needed**: extend layout fetch all orgs cho switcher list. Detail Section "Module D".

### V6 — last_org_id consumers (blast radius)

**Grep 23 files toàn repo**. Categorize:
- **Writer (1 file)**: `app/api/invites/[token]/accept/route.ts:122` — set on invite accept.
- **Reader pattern A — direct metadata read** (2 files): `app/dashboard/layout.tsx:36`, `app/dashboard/settings/page.tsx:20`. Inline `const lastOrgId = user.user_metadata?.last_org_id as string | undefined`.
- **Reader pattern B — getActiveMembership helper** (7 API routes): pain-mapper, x-ray score/history, vision-save, report monthly, x-matrix prefill, kpi list, swot coaching. Helper internally uses `lastOrgId`.
- **Reader pattern C — inline dashboard pages** (9 files): synthesis, swot strategy/index, vision-workshop, xray-history, benchmark, dashboard, x-matrix [year]/review, kpi page, x-matrix new page. M-Cleanup-6 Phase 2 deferred sang helper migration.

**Blast radius switch update**: write 1 metadata field → 19 readers all consume same field via uniform pattern. Single point of mutation, single point of read. **Risk LOW** — uniform pattern means switch behavior consistent across all consumers.

### V7 — Existing org-related hooks

**Grep `useCurrentOrg|useOrganization|useMembership`**: **0 hits**. KHÔNG có client hook nào hiện tại cho org context. Pattern: org info pass via props từ Server Component (layout → Sidebar → children).

**Implication**: 0 reuse opportunity. Decision Module C: skip building hook (YAGNI), props-based fits existing pattern.

---

## Decision lock

### Q1 — Avatar + name display compact strategy

**α full**: avatar (8x8 first char) + full org name truncate `max-width: 140px`.
**β short**: avatar + 2-char initials only (vd "LF" cho "Ladysfit").
**γ icon-only**: chỉ avatar + chevron-down (org name hide).

**Rationale**:
- Existing sidebar Org info block (line 93-95) đã render full orgName truncate — α matches existing UX, KHÔNG breaking visual change cho user single-org.
- β rejects: 2-char initials lose info value (user cần biết org nào đang active, "LF" ambiguous nếu có "LadyFit" + "LongFit").
- γ rejects: hide name = user mỗi lần phải open dropdown để confirm — workflow regression.

**Recommendation**: **α full** — tăng UX, zero breaking change cho single-org user, dropdown giữ chevron affordance signal "có thể click".

### Q2 — Empty state khi user chỉ có 1 org

**α hide**: KHÔNG render OrgSwitcher (early return null nếu `memberships.length === 1`).
**β disable**: render disabled với label "1 org duy nhất" (không clickable).
**γ render normal**: dropdown click được, list 1 item + "+ Tạo org mới" CTA.

**Rationale**:
- Solo dev currently có 1 org (smoketest@hoshinkanri.local). Nếu α → KHÔNG bao giờ thấy switcher trong dev cycle → khó test regression. Visual consistency lose.
- β disabled = anti-pattern (UX dead-end without value-add).
- γ entry point luôn có "+ Tạo org mới" nhỏ — user explore khả năng multi-org organically. Khi join thêm org qua invite, switcher tự động list 2 → seamless transition.

**Recommendation**: **γ render normal** — consistency UX cross-state, "+ Tạo org mới" CTA có giá trị standalone (currently chỉ accessible qua /onboarding/setup-org URL direct, ít user discover).

### Q3 — Loading state khi fetch memberships list

**α skeleton**: shimmer 1-2s placeholder.
**β optimistic**: hiển thị current org name ngay (từ layout props), list orgs lazy load khi click dropdown.
**γ blocking**: spinner cho cả switcher đến khi load xong.

**Rationale**:
- Layout.tsx Server Component đã fetch memberships + current org PRE-render (line 27-32) → props arrive fully populated khi sidebar mount. **NO loading state needed for first paint** — props synchronous.
- Click dropdown → list memberships đã có sẵn từ props → instant open, KHÔNG fetch.
- α skeleton = unnecessary work (no fetch happens client-side).
- γ blocking = blocking what? (no async).
- β optimistic = effectively the implementation (no lazy load needed since props complete).

**Recommendation**: **β optimistic (effectively zero loading state)** — no client fetch, props từ Server Component layout đã full. Switch action → API call has loading state (button disabled during POST) — separate concern from data display.

### Q4 — Cookie sync fix approach (CRITICAL)

**α refreshSession**: gọi `supabase.auth.refreshSession()` sau `updateUser`.
**β manual cookie set**: Server Action set cookie qua `cookies().set('sb-...-auth-token', ...)`.
**γ window reload only**: skip session sync, dựa vào `window.location.href = '/dashboard'` reset cookie từ DB qua `auth.getUser()` next request.

**Rationale**:
- **CRITICAL verify V5**: layout.tsx line 22 `await supabase.auth.getUser()` makes network call to Supabase Auth API → returns FRESH `user_metadata` (NOT JWT parse). Full reload bypass JWT cookie staleness completely.
- α refreshSession: extra API call ~150ms cost, complex error handling (refresh có thể fail). Marginal benefit khi γ giải quyết bằng pattern simpler.
- β manual cookie set: requires Server Action + reverse-engineer Supabase JWT format. NEW infra. Risk MEDIUM (incorrect cookie shape break auth across all routes).
- γ window reload: 1 extra DB query khi reload (acceptable cho action infrequent — user switch org maybe 1-2x/day max).
- M-OrgInvite-1 invite accept route đã proven pattern γ implicitly (`updateUser` rồi client redirect, layout fetch fresh).

**Recommendation**: **γ window reload only** — đơn giản nhất, match pattern proven, KHÔNG introduce new infra. Pattern lesson L37 (anticipated) — "Full reload as cookie sync workaround" proven valid khi `auth.getUser()` is server-side.

**Trade-off accepted**: ~300-500ms reload latency vs. SPA snappy switch. User accept (org switch infrequent action).

### Q5 — Sidebar position UX

**α top**: TRÊN logo + nav links (most prominent, Slack pattern).
**β middle**: GIỮA nav links và bottom user menu.
**γ bottom**: GẦN user menu (compact, NB-style).

**Rationale**:
- Existing sidebar.tsx có "Org info" block (line 89-96) ngay sau Logo (line 76-86) và TRƯỚC nav groups (line 99) — that's already pattern α (top, just below logo).
- **Decision**: REPLACE existing Org info block in-place → α effectively. KHÔNG move to top above logo (logo is brand identity, không nên đẩy xuống).
- β middle: rejects — break visual hierarchy.
- γ bottom: rejects — user menu spot reserved cho user identity (avatar + email + logout). Mixing org switch + user logout confusing.

**Recommendation**: **α top (replace existing Org info block in-place at line 89-96)** — zero layout shift, upgrade display → interactive in same spot.

### Q6 — Mobile pattern (bottom-nav)

**α replicate**: thêm OrgSwitcher item vào bottom-nav (5 → 6 cols).
**β header trigger**: header mobile có icon org → click open sheet/drawer.
**γ settings only mobile**: redirect mobile user to `/settings` để switch.

**Rationale**:
- Existing mobile pattern: hamburger (Header.tsx line 75-82) → Sheet drawer (line 149-164) renders MobileSidebarContent → which renders SAME SidebarContent. **OrgSwitcher tự động available trong Sheet drawer** without ANY extra work cho mobile.
- α replicates: bottom-nav 5 cols saturated (Khám phá/X-Matrix/KPI/Báo cáo/Cài đặt). Adding 6th break grid + smaller tap targets. Rejects.
- β header dedicated icon: redundant when Sheet already exposes OrgSwitcher.
- γ /settings redirect: regression UX — user expect 1-click switch.

**Recommendation**: **β-revised = "via existing Sheet drawer" (zero mobile-specific code)** — leveraging existing MobileSidebarContent renders SidebarContent wholesale. Mobile UX: tap hamburger → see drawer → tap OrgSwitcher → dropdown opens within drawer. KHÔNG cần thêm icon header mobile-specific.

---

## Effort estimate breakdown by task

| Task | Module | Effort | Risk |
|---|---|---|---|
| 2A | Plan + decision sign-off | 0 (this doc) | NONE |
| 2B | Module D — extend layout fetch all orgs + extend SidebarProps type | 15 phút | LOW (additive) |
| 2C | Module A — OrgSwitcher.tsx component (new file) | 45 phút | LOW |
| 2D | Module A — replace sidebar.tsx Org info block (line 89-96) with OrgSwitcher | 10 phút | LOW |
| 2E | Module B — POST /api/orgs/switch route (new file, ~80-100 LOC) | 30 phút | LOW |
| 2F | Wire client switch handler (full reload pattern Q4 γ) | 15 phút | LOW |
| 2G | Smoke test 6 cases (single-org γ render, multi-org switch happy, RLS deny non-member, rate limit, mobile drawer, "+ Tạo org mới" link) | 30 phút | — |
| 2H | HANDOFF + plan close-out + commit | 15 phút | NONE |
| **Total** | **2.5-3h** | | **LOW** |

---

## Risk assessment (file touch list + blast radius)

### Files NEW (3)
- `components/layout/OrgSwitcher.tsx` (~120-150 LOC)
- `app/api/orgs/switch/route.ts` (~80-100 LOC)
- `plans/M-Auth-MultiOrg-1-plan.md` (this doc)

### Files MODIFIED (3)
- `app/dashboard/layout.tsx` — extend fetch, extend SidebarProps spread (~+10 LOC)
- `components/layout/sidebar.tsx` — replace Org info block at line 89-96 with `<OrgSwitcher memberships={...} currentOrgId={...} />` (-7 / +5 LOC), extend SidebarProps interface
- `components/layout/header.tsx` — extend SidebarProps cascading (verify if header passes orgName to MobileSidebarContent — yes line 156)

### Blast radius
- **Auth**: switch route uses `requireOrgRole(supabase, userId, orgId, ALL_ROLES)` — proven helper, 1+ năm production. RLS deny non-member auto-handled.
- **State**: `last_org_id` write affects 19 reader files (V6 categorized). All readers use uniform pattern `find(lastOrgId) ?? [0]` → consistent behavior.
- **Cookie**: NO cookie infrastructure changes (Q4 γ). Full reload triggers `auth.getUser()` server-side fresh fetch.
- **UI**: sidebar layout SAME (replace block in-place). Mobile inherit via Sheet (zero new code).
- **Design tokens**: dropdown styling reuse pattern `border-2 border-ink bg-bg-warm shadow-brutal-md` từ Header.tsx user menu.

### Anti-risk catches
- **PITFALL #29 NOT applicable**: M-Member-POV-1 CLEAR_DRAFT preserve permission state — context reset issue. Org switch via FULL RELOAD = component tree fully unmount/remount → no state preservation concerns.
- **Race condition RBI risk**: user switch org A → in-flight request from org B context returns AFTER reload. Mitigation: full reload aborts all in-flight (browser navigation cancels XHR/fetch). Q4 γ implicitly handles.

---

## Constraints cho future AI sessions

- **KHÔNG thay đổi cookie sync approach** từ Q4 γ (full reload) sang α (refreshSession) hoặc β (manual cookie set) mà KHÔNG re-design audit. Full reload pattern proven trong M-OrgInvite-1 + M-Auth-MultiOrg-1, complexity-cost không justify với frequency switch action thực tế.
- **KHÔNG migrate `app/dashboard/layout.tsx` line 36-39 + `app/dashboard/settings/page.tsx` line 20-23 sang `getActiveMembership` helper** trong M-Auth-MultiOrg-1 scope — đó là M-Cleanup-6 Phase 2 deferred. Mixing scope = harder rollback nếu Q4 γ pattern fail validation.
- **KHÔNG add `useCurrentOrg()` hook** unless ≥3 client components cần consume org context (YAGNI). Currently 0 hits V7 → props pattern fits.
- **KHI extend SidebarProps** với field mới (orgs list trong M-Auth-MultiOrg-1), MUST cập nhật cả `Sidebar` + `MobileSidebarContent` exports + Header.tsx caller (line 156-160) — type checker enforce.
- **KHÔNG render OrgSwitcher dropdown trong empty state** với 0 memberships — layout.tsx line 33 đã `redirect('/onboarding/setup-org')` cho case này, switcher KHÔNG bao giờ thấy `memberships.length === 0`.
- **KHI thêm rate limit cho /api/orgs/switch**, dùng `checkRateLimit` direct (M-RateLimit-Generic-1 chưa ship). KHI M-RateLimit-Generic-1 ship sau, migrate switch route + check-similar route cùng commit.
- **KHÔNG dùng `DropdownMenuCheckboxItem`** cho org list — semantic mismatch (checkbox = independent toggles, switcher = 1-of-N selection). Dùng `DropdownMenuRadioGroup` + `DropdownMenuRadioItem` HOẶC `DropdownMenuItem` với manual `<CheckIcon />` indicator nếu radio overhead too much.
- **KHÔNG add OrgSwitcher vào bottom-nav.tsx** — Q6 β-revised decision lock. Mobile UX qua Sheet drawer reuse SidebarContent pattern.
- **KHÔNG modify auth.users metadata schema** — `last_org_id` là free-form `data` field của Supabase Auth, KHÔNG cần migration. Future field như `pinned_org_ids` cũng vào cùng metadata bag.

---

## Pattern lessons anticipate

### L37 — Full reload as cookie sync workaround pattern
Khi update `auth.users.user_metadata` (vd `last_org_id`), Supabase JWT cookie KHÔNG refresh ngay (only refresh on token expiry or explicit `refreshSession`). Pattern WORKAROUND: trigger `window.location.href = '/path'` post-update → next request `await supabase.auth.getUser()` (network call) returns fresh metadata, bypass JWT cookie staleness. Trade-off: 300-500ms reload latency vs. SPA-snappy. Applicable cho actions infrequent + state mutation orthogonal cho current view (org switch, role escalation, etc.). KHÔNG applicable cho high-frequency UI actions (settings inline edit, etc.).

### L38 — Sheet drawer mobile parity zero-cost pattern (anticipate validate)
Khi mobile pattern dùng Sheet/Drawer rendering same content as desktop sidebar (existing `MobileSidebarContent` wraps `SidebarContent`), thêm component mới vào sidebar tự động available trên mobile. Zero mobile-specific code. Pattern locked M-Auth-MultiOrg-1 Q6 β-revised. Applicable cho future sidebar additions (vd notification bell, quick-action shortcut).

### L39 — Reader-uniform-pattern enables single-mutation switch (anticipate validate)
Khi 19 reader files đều dùng pattern `find(m => m.org_id === lastOrgId) ?? memberships[0]` (uniform per V6 audit), 1 metadata write → all 19 readers consistent behavior. Decision lock pattern: TRƯỚC khi build cross-cutting feature mutate state, audit reader pattern uniformity. Non-uniform readers = bugs from inconsistency. M-Cleanup-6 helper extract retroactively documented this uniformity, M-Auth-MultiOrg-1 leverage.
