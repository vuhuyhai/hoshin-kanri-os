# M-Design-Tangential-Cleanup-1 Plan

> **Status**: IN PROGRESS — 7 commits shipped (`85fbcc5` plan, `b0edc91` Commit 1 `.card-subtle`, `0d220cc` Commit 2 lien-he, `0d6a792` Commit 4 `.input-brutal`, `a922ed3` Commit 5 Task 1.5 re-audit, `947a2c4` Commit 6 X-Matrix canvas, `b6846a6` Commit 7 Auth). Branch `master` ahead of `origin/master` by 8 (incl. this doc-only).
> **Author**: claude.ai web (Opus 4.7)
> **Date drafted**: 2026-05-11 (initial), 2026-05-11 (Task 1.5 re-audit corrected), 2026-05-11 (Task 8 X-Ray 0-net-migration discovery).
> **HEAD at audit**: `224e5d5` (Task 1 initial). Current HEAD: `b6846a6`.
> **Pattern reuse**: M-Design-Tailwind-Cleanup-1 (Q1 β / Q2 α / L48 foundation completion / L42 Phase A partial coverage), M-Design-Tokens-Cleanup-1 (L50 atomic commit boundary), M-Design-Dark-1 (L48 foundation parity), M-Design-Dark-1.5 (L57 reversible deprecation).

---

## ⚠️ Task 1.5 — Re-audit corrected (2026-05-11)

### Audit bug surfaced Commit 3 (Task 2B)

**Original Task 1 V3 regex** included `accent-` as utility prefix:
```
\b(bg|text|border|...|accent)-(white|black|gray|...)
```

This caused **false positive matches** against legit token classes: `bg-accent-yellow`, `text-accent-brand`, `border-accent-cyan`, etc. (Tailwind v4 generates these from `--color-accent-*` `@theme inline` mappings — they ARE the tokens.)

**Corrected regex** (drops `accent-` from prefix list):
```
\b(bg|text|border|ring|divide|fill|stroke|placeholder|caret|decoration|outline|from|to|via|shadow)-(white|black|gray|slate|zinc|neutral|stone|red|green|amber|yellow|blue|pink|indigo|purple|orange|emerald|teal|cyan|rose|fuchsia|violet|lime|sky)(-\d+)?(\/\d+)?\b
```

**Pattern L29/L32/L45/L48/L49 reinforced lần 9**: verify-first invalidates prose claim — including my own. Greps stand, prose doesn't.

### Revised V3 — corrected raw palette consumer audit

**Total**: **306 raw palette occurrences across 72 files** (vs original claim 343/85 — 37 occ / 13 files were false positives, ~11% inflation).

**Plus NEW finding**: arbitrary hex Tailwind classes `bg-[#xxxxxx]`, `text-[#xxx]`, `border-[#xxx]`: **32 occurrences across 17 files** (NOT in original Task 1 audit at all — pattern not grepped). Mostly SWOT (26/14 files).

| Bucket | Files | Real raw occ | Arbitrary hex | Notes |
|---|---:|---:|---:|---|
| **Page (`app/page.tsx`)** | 1 | 8 | 0 | All `text-white/N` on `<footer bg-bg-dark>` — Q2 mapping table + Q2-sub-α **keep raw** = 0 changes needed |
| **Landing components (`components/landing/`)** | 0 | **0** | 0 | ✅ All Task 1 "matches" were `bg-accent-yellow/cyan/pink/lime` legit token classes — false positives |
| **Static pages (`dieu-khoan`, `chinh-sach-bao-mat`, `invite/`)** | 0 | **0** | 0 | ✅ Clean — token-only |
| **Misc small (`components/{gemba,hansei,blog,dashboard}/`)** | 0 | **0** | 0 | ✅ All Task 1 hits were false positives |
| **Auth (`app/(auth)/`)** | 4 | 9 | 0 | login(5), register(1), update-password(2), reset-password(1) |
| **X-Matrix canvas (`components/x-matrix/canvas/`)** | 3 | 5 | 0 | CenterX(2), HoshinEditModal(2), SubmitBar(1) — far less than Task 1 claim 13/8 |
| **X-Ray (`app/x-ray/components/`)** | 3 | 10 | 0 | XRayReport(5), QuestionStep(3), EmailCaptureStep(2) |
| **Annual-review (`components/annual-review/`)** | 5 | 17 | 0 | CarryOverDecisions(6), CompleteButton(4), KpiActualsForm(3), TransitionPreviewModal(2), SaveIndicator(2) |
| **Admin (`app/admin/`)** | 7 | 20 | 0 | hoshin-explorer dominant: PhaseBlock(7), ConceptSidebar(4), StepsView(4), ConceptPanel(2). Plus 4 small files |
| **Layout (`components/layout/`)** | 3 | 26 | 0 | sidebar(19 → keep-raw Q2-sub-α dark surface), org-switcher(6 → keep-raw on dark switcher), header(1 → keep-raw on brand surface) → **0 changes net** under decision lock |
| **Dashboard (`app/dashboard/`)** | 14 | 60 | 6 | report/page(20 biggest), help(7), benchmark(6), synthesis(6), xray-history page(4) + [id](1), swot/guide page(4), HoshinCandidates(3), KpiDashboard(2), dashboard/page(2), swot/strategy page(2) + TowsStrategy(1), VisionGuide(1), VisionEditor(1) |
| **SWOT (`components/swot/`)** | 32 | **151** | 26 | SwotContextForm(20 biggest), TowsCanvas(13), SwotIngredientCard(11), SwotFinalizeList(11), SwotIngredientPanel(9), SwotFactorInput(8), SwotWorkshopChat(7), 25 other files. **+ 26 arbitrary hex** (XRayPrefillBanner(8), SwotFrameworkPicker(4), 12 others) |
| **TOTAL (post-shadcn-exclude)** | **72** | **306** | **32** | **= 338 total raw items needing migration scope** |

**SWOT remains dominant**: 151 raw + 26 arbitrary hex = **177 items / 32 files** = **52%** of total work.

### Decision lock keep-raw scope (per Q2 mapping + Q2-sub-α)

| Bucket | Items kept raw | Reason |
|---|---:|---|
| Page (`app/page.tsx`) | 8 | All `text-white/N` on `<footer bg-bg-dark>` — Q2 mapping "keep raw text-white on dark" |
| Layout sidebar | 19 | All `bg-white/N`, `text-white/N`, `border-white/N` on `bg-bg-dark` shell — Q2-sub-α |
| Layout org-switcher | 6 | All white-alpha on dark switcher (per spot-check earlier) — Q2-sub-α extension |
| Layout header | 1 | `text-white` on `bg-accent-brand` button (saturated brand surface) — Q2 extended pattern |
| **Auth dark panel** (login `b6846a6`) | 4 | `bg-white` Google btn (elevated card on warm cream Ambiguous 1 C) + 3× `text-white/N` on `bg-bg-dark` brand panel (Ambiguous 2 A) — audit-fix Task 7 mid-task |
| **X-Ray bucket** (3 files, Task 8) | 10 | 4× `text-white` on saturated brand `bg-accent-brand` (Q2 extended) + 2× `text-white` on `bg-ink` + dynamic score-color (Q2 extended) + 4× `text-white/N` on `var(--bg-dark)` CTA banner (Q2-sub-α) + 1× `bg-white` elevated option pill on warm cream (Ambiguous 1 C) + 1× `border-white` spinner on brand red btn (Q2 extended) — audit-fix Task 8 |
| **TOTAL keep-raw** | **48** | All white-on-saturated-surface intentional contrast (Page + Layout + Auth dark + X-Ray) |

**Net items needing actual migration**: **306 - 48 = 258 raw + 32 arbitrary hex = 290 items / ~65 files**.

### Task 8 X-Ray 0-net-migration discovery (2026-05-11)

X-Ray bucket (`app/x-ray/components/`, 3 files / 10 occ per Task 1.5 audit) → **0 occ migrated** post per-occurrence pattern-match against established keep-raw decision lock:

| # | File:Line | Class | Surface | Precedent |
|---:|---|---|---|---|
| 1 | QuestionStep.tsx:60 | `text-white` | `bg-accent-brand` SELECTED option pill | Q2 ext (Layout header) |
| 2 | QuestionStep.tsx:61 | `bg-white` | UNSELECTED option pill elevated on warm cream | Ambiguous 1 C (Auth Google btn) |
| 3 | QuestionStep.tsx:77 | `text-white` | `bg-ink` SELECTED checkmark circle | Q2-sub-α (dark surface) |
| 4 | EmailCaptureStep.tsx:157 | `text-white` | `bg-accent-brand` SELECTED headcount pill | Q2 ext |
| 5 | EmailCaptureStep.tsx:208 | `border-white` | `.btn-brutal-primary` spinner ring (= bg-accent-brand) | Q2 ext (white-on-brand family) |
| 6 | XRayReport.tsx:400 | `text-white` | `style={background: getScoreColor()}` saturated dynamic | Q2 ext (white-on-saturated-color family) |
| 7-10 | XRayReport.tsx:663, 666, 679, 682 | `text-white`, `text-white/70` ×2 each variant | `style={background: var(--bg-dark)}` CTA banner | Q2-sub-α + Auth Ambiguous 2 A |

**Pattern lesson reinforced**: Task 1.5 keep-raw scope table missed Auth dark panel + X-Ray entirely. Bucket order Task 1.5 line 88 predicted X-Ray = 10 occ migration; actual = 0. Decision lock precedents (Q2-sub-α + Q2 extended saturated-brand + Ambiguous 1 C) apply consistently across all buckets — bucket-level occ counts ≠ migration counts.

**Implication for remaining buckets**: Annual-review / Admin / Dashboard / SWOT raw palette occ counts likely include more keep-raw cases than Task 1.5 forecasted. Audit per-occurrence at task time, not bucket time.

### Lien-he status (already shipped Commit 3, hash `0d220cc`)

- 5 raw `bg-white` on form inputs → migrated to `bg-card` ✓
- Bonus DRY follow-up flagged: lien-he 5 inline form inputs duplicate `.input-brutal` pattern. Should ideally use `.input-brutal` className post-Commit 4 foundation fix. **Defer to post-milestone Next Steps section** (non-blocking).

### Foundation chain (3 commits) — semantic separation done

| Commit | Hash | Concern |
|---|---|---|
| 1 | `b0edc91` | `.card-subtle` `var(--white)` → `var(--card)` |
| 4 | `0d6a792` | `.input-brutal` `var(--white)` → `var(--card)` (parallel) |
| (none) | — | `.badge-accent`/`.badge-ink` use `var(--white)` for TEXT (correct per Tokens-Cleanup-1 §17). Don't touch. |

### Recommended bucket order (Task 1.5 output)

**Smallest-first principle** (build confidence + reversibility — precedent M-Design-Tailwind-Cleanup-1):

| # | Bucket | Real items | Effort | Risk | Rationale |
|---:|---|---:|---|---|---|
| 1 | **Layout** (3 files / 26 occ) | **0 net change** | 15 min audit + 0-line commit OR skip-with-doc | LOW | All keep-raw per decision lock — produces a **documentation-only** commit recording the explicit Q2-sub-α scope decision OR can be skipped entirely |
| 2 | **Page footer (`app/page.tsx`)** (1 file / 8 occ) | **0 change** | 10 min verify | LOW | All keep-raw per Q2 mapping — verify-only, no commit needed (or doc-only) |
| 3 | **X-Matrix canvas** (3 files / 5 occ) | 5 | 15-20 min | LOW | Smallest real-migration bucket |
| 4 | **Auth** (4 files / 9 occ) | 9 | 20-25 min | MEDIUM (user-facing public) | Quick win + Phase A smoke required (Q5 γ) |
| 5 | **X-Ray** (3 files / 10 occ) | 10 | 20-25 min | HIGH (public lead gen, FB ads cold traffic) | Phase A smoke required (Q5 γ) |
| 6 | **Annual-review** (5 files / 17 occ) | 17 | 30-40 min | MEDIUM (internal users) | Cursor self-verify (Q5 γ β-side) |
| 7 | **Admin** (7 files / 20 occ) | 20 | 30-40 min | LOW (super-admin only) | Cursor self-verify (Q5 γ β-side) |
| 8 | **Dashboard** (14 files / 60 occ + 6 hex) | 66 | 60-90 min | MEDIUM (user-facing authed) | Phase A smoke (Q5 γ). May split into 2 commits (top-level vs discovery sub-routes) |
| 9 | **SWOT** (32 files / 151 occ + 26 hex) | 177 | 2-3h | LOW (internal feature) but HIGH usage | **Sub-split recommended**: 9a (workshop / chat), 9b (drafts / canvas / framework), 9c (synthesis + finalize). Phase A smoke 1-2 representative pages (Q5 γ-borderline) |
| 10 | **Close-out** | — | 30 min | — | Production verify + HANDOFF + ACTIVE_CONTEXT update + plan archive |

**Total revised effort estimate**: **5-7 hours Cursor execution** (vs original 6-7h estimate — about same, scope concentrated more in SWOT than predicted).

### Q7 effort revised

| Metric | Original Task 1 | Task 1.5 corrected |
|---|---|---|
| Raw palette occ | 343 | 306 (-37 false +) + 32 arbitrary hex = 338 |
| Files | 85 | 72 (-13 false-positive-only files) |
| Estimated commits | ~10 | ~9-11 (4 done, 5-7 remaining: Layout doc-only + Page doc-only + 5 consumer + close-out, possibly 1-2 SWOT sub-splits) |
| LOC churn | ~400-500 | ~300-400 (272 raw + 32 hex × ~1 line each, accounting for keep-raw 34) |
| Time | 3-4h + 30-45min smoke | 5-7h + 60-90min smoke (SWOT bigger than originally estimated as raw share) |
| Risk grade | LOW build / MEDIUM visual | unchanged |

---

## Task 1 — Verify-first audit findings

### V1 — Git state confirm

| Check | Result |
|---|---|
| HEAD | `224e5d5` |
| Branch | `master` |
| Working tree | clean (nothing to commit) |
| Last commits | 224e5d5 (Dark-1.5 verify PASS) → 4b28178 (placeholder fix) → 67919e0 (Dark-1.5 hotfix) → 3e3df3a (C7 placeholder fix) → 74b1c65 (Dark-1 close-out) |

### V2 — 2 findings off-scope confirmation

| Finding (from Dark-1.5 verify chain) | Verify result | Status |
|---|---|---|
| /dashboard 4 navigation cards `bg-white` literal | `app/dashboard/page.tsx` 4 cards use `card-subtle` className, NOT `bg-white` Tailwind. BUT `.card-subtle` definition at `globals.css:809-814` uses `background: var(--white)` literal token (`--white: #FFFFFF` :root line 173). Indirect literal — same root cause. | **STILL OPEN** (different vector: CSS-side, not Tailwind class) |
| Sidebar collapsed rail `bg-white` literal | `components/layout/sidebar.tsx` shell uses `bg-bg-dark` (token-based, OK). Hover/text utility uses `bg-white/10`, `text-white/60`, `border-white/20` raw alpha — 19 instances. No collapsed rail variant exists in code (single static dark sidebar, no collapse mode). The "rail" in original report = the sidebar itself, "literal" = white alpha on dark surface. | **STILL OPEN** (raw white alpha utility on dark surface) |

**Re-framing**: Findings hold but vector ≠ what original verify-chain prose suggested. Card-subtle = CSS literal (`--white`), sidebar = raw Tailwind alpha. Two different mechanical fixes.

### V3 — Raw Tailwind palette consumer audit (full repo scan)

**Pattern grepped** (excludes `node_modules`, `.next`, `plans/_archive`):
- Color families: white, black, gray, slate, zinc, neutral, stone, red, green, amber, yellow, blue, pink, indigo, purple, orange, emerald, teal, cyan, rose, fuchsia, violet, lime, sky
- Utility prefixes: bg-, text-, border-, ring-, from-, to-, via-, fill-, stroke-, outline-, divide-, placeholder-, caret-, decoration-, shadow-, accent-

**Total**: **346 occurrences across 88 files** (vs ~28 estimate — actual is ~12× higher).

**Grouped by directory**:

| Group | Files | Occurrences | Notes |
|---|---:|---:|---|
| `components/swot/` | 32 | ~150 | Largest bucket — Phase B candidate |
| `app/dashboard/` (incl. report, discovery, kpi, help) | 12 | ~64 | Mixed user-facing + internal |
| `components/layout/` | 3 | 26 (sidebar 19, org-switcher 6, header 1) | Includes Finding 2 |
| `components/annual-review/` | 5 | 23 | Internal-facing form UI |
| `app/admin/` (incl. hoshin-explorer) | 6 | 19 | Internal super-admin only |
| `app/page.tsx` + `components/landing/` | 5 | 22 | User-facing landing |
| `app/x-ray/` (public lead gen) | 3 | 10 | User-facing |
| `app/(auth)/` | 4 | 9 | User-facing auth pages |
| `components/x-matrix/canvas/` | 8 | 13 | Mixed |
| `app/lien-he/page.tsx` | 1 | 5 | Static page |
| `components/dashboard/`, `components/gemba/`, `components/hansei/` | 3 | 3 | Tiny |
| `components/ui/` (shadcn primitives) | 3 | 3 | `bg-black/10` `bg-black/30` overlays — backdrop alpha INTENTIONAL, **EXCLUDE** |

**After excluding shadcn primitives**: **343 occurrences across 85 files**.

### V4 — Foundation token availability check (pattern L48)

**`@theme inline` block** (`app/globals.css:12-90`) exposes Tailwind v4 utilities:

| Class | Token | Maps from |
|---|---|---|
| `bg-bg-warm` | `--bg` | OK |
| `bg-bg-muted-warm` | `--bg-muted` | OK |
| `bg-bg-paper` | `--bg-paper` | OK |
| `bg-bg-dark` | `--bg-dark` | OK |
| `text-ink` / `bg-ink` | `--ink` | OK |
| `text-text-2` / `text-text-3` | `--text-2` / `--text-3` | OK |
| `bg-accent-brand` / `text-accent-brand` | `--brand` | OK |
| `bg-accent-{yellow,cyan,lime,pink,peach,lavender}` | `--accent-*` | OK |
| `border-border` | `--border` (shadcn) → `#1A1A1A` :root | OK |
| `bg-kpi-{healthy,attention,warning,critical}` | `--kpi-*` | OK |

**Foundation gaps identified**:

1. **No `bg-white-pure` / `bg-surface-elevated` token** for elevated card surfaces (currently `var(--white)` raw in `.card-subtle`). M-Design-Tokens-Cleanup-1 close-out comment line 304 already flags `--white` as semantic "high-contrast text on saturated brand surface". Re-using it as card background = semantic conflict.
2. **No `bg-on-dark-{5,10,20,40}` token family** for white-alpha utilities on dark sidebar surface. Current raw `bg-white/10` etc. work fine but are not token-mediated — break dark mode if dark sidebar were ever themed.
3. **No semantic `bg-error-soft` / `bg-success-soft`** for error/success state backgrounds. Spot uses raw `bg-red-50`, `bg-green-50`. Could re-use `bg-accent-pink` (mauve mute = warm error) and `bg-accent-lime` (sage mute = success), OR introduce explicit semantic tokens.

### V5 — Convention precedent check (L48 reinforced lần 2)

| Token class | Usage count | Files |
|---:|---:|---:|
| `bg-bg-*` family | 194 | 78 |
| `text-text-*` / `text-ink` | 558+ | 100+ |
| `border-ink` / `border-border` / `bg-accent-brand` / `bg-ink` / `text-accent-brand` | 411+ | 100+ |
| `bg-accent-{pastel}` / `bg-kpi-*` | 24 | 9 |

**Convention reality**: Token-based classes are **dominant** in the codebase (~1180+ token usages vs 343 raw palette usages = ~77% token / 23% raw). The 88 raw-palette files are clear **outliers** that drifted in via copy-paste from external snippets / pre-token era. **No new naming convention needed** — strict 1:1 mapping into existing token classes covers the vast majority of cases. Only Foundation gap (V4) requires net-new tokens for ~2-3 specific use cases.

### V6 — Edge cases enumeration

| Case | Decision |
|---|---|
| `components/ui/dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx` `bg-black/{10,30}` overlay | **SKIP** — shadcn primitive backdrop alpha is intentional |
| `lib/email/templates.ts` 42 inline `style=`/`background:`/`color:` hits | **SKIP** — HTML email cannot use Tailwind classes (CSS class refs strip in many email clients) |
| Storybook / test files | **N/A** — no test suite, no Storybook in repo |
| Print/export styles | **N/A** — none in scope |
| `dark:*` variant usage | **0 across whole repo** — Q3 collapses (nothing to strip OR keep dormant) |

### V7 — Risk assessment

| Risk | Grade | Mitigation |
|---|---|---|
| Business logic touch | **NONE** — pure styling refactor | No verification beyond visual |
| Visual regression user-facing (auth, landing, x-ray, dashboard) | **MEDIUM** — 4× more files than estimated, mistake potential scales | Phase A smoke per directory + git diff visual review per commit |
| Visual regression internal (admin, hoshin-explorer, annual-review) | **LOW** — internal users only, low blast radius | Defer Phase A smoke to Cursor self-verify (L42 partial coverage) |
| Token mapping ambiguity (which `bg-gray-X` → which `bg-bg-X`?) | **MEDIUM** — gray-50 vs gray-100 vs gray-200 don't have 1:1 token equivalents | Decision lock Q2 mapping table required before Task 2A starts |
| Foundation gap (V4) cascading into per-file decisions | **MEDIUM** | Foundation completion commit FIRST (L48 pattern), then consumer migration |
| Sidebar `bg-white/10` alpha-on-dark (V2 Finding 2) | **LOW** | Either keep raw OR introduce `--bg-on-dark-{N}` token family — Q2 sub-decision |
| `dark:*` variants | **NONE** — 0 found | Q3 collapses |

---

## Decision lock — 7 questions

### Q1 — Scope/commit cadence

| Option | Description |
|---|---|
| α | File-by-file commit per directory (28+ commits, finest reversibility) |
| β (precedent M-Design-Tailwind-Cleanup-1 Q1) | **Batch by directory bucket** — 1 commit per group from V3 table (~10 commits, balance reversibility vs noise) |
| γ | Phase boundary by user-facing vs internal — Phase A user-facing in 1 commit + Phase B internal in 1 commit (2 commits, max batching) |

**Recommend β** — directory-bucket commits match the V3 grouping naturally + each commit is visually verifiable in isolation + easy to revert without unwinding cross-bucket work. Precedent: M-Design-Tailwind-Cleanup-1 used same approach with success.

### Q2 — Token mapping strategy

Mapping table required before Task 2A. Proposed mapping (pending Vũ Hải override):

| Raw class | → Token class | Rationale |
|---|---|---|
| `bg-white` (Tailwind), `bg-[#fff]` | `bg-bg-paper` (most cards) OR `bg-bg-warm` (elevated surfaces) | Use `bg-bg-paper` as default; case-by-case override per file |
| `bg-gray-50` / `bg-gray-100` | `bg-bg-warm` | warm beige neutral |
| `bg-gray-200` / `bg-gray-300` | `bg-bg-muted-warm` | one tier deeper |
| `bg-black`, `bg-gray-900` | `bg-ink` | ink token |
| `text-white` (on dark surfaces) | **keep raw** `text-white` (no token needed for pure white text on dark) — OR introduce `text-on-dark` semantic | Q2-sub |
| `text-black`, `text-gray-900` | `text-ink` | |
| `text-gray-{500,600,700}` | `text-text-2` | |
| `text-gray-{400,500}` | `text-text-3` | |
| `border-gray-{200,300}` | `border-border` (uses `--border` = #1A1A1A, may be too dark for subtle borders) — OR introduce `--border-subtle-token` | Q2-sub: V4 foundation gap |
| `bg-red-50` / `text-red-600` | `bg-accent-pink` / `text-accent-brand` (warm mauve + brand red) | leverages existing accent tokens |
| `bg-green-50` / `text-green-600` | `bg-accent-lime` / `text-ink` | sage mute |
| `bg-amber-50` / `bg-yellow-50` | `bg-accent-yellow` | warm yellow mute |
| `bg-blue-*`, `bg-indigo-*`, `bg-purple-*` | `bg-accent-cyan` / `bg-accent-lavender` | cool pastel mutes |
| `bg-white/{10,20,40}` (on dark sidebar) | **Decision Q2-sub-α**: keep raw (intentional alpha utility), **β**: introduce `--bg-on-dark-{5,10,20,40}` token family | Recommend **α keep raw** — 19 sidebar hits are tightly scoped + introducing tokens for alpha utilities is over-engineering for non-themable surface |

**Foundation gap fixes** required FIRST (Task 2A foundation commit, L48 pattern):
1. (Optional Q2-sub) `--bg-on-dark-*` token family in `:root` + `@theme inline` IF Vũ Hải picks Q2-sub-β
2. (Optional Q2-sub) `--border-subtle` semantic token if `border-border` (= --border = #1A1A1A) reads too heavy as 1px subtle border (currently `.card-subtle` uses `var(--bg-muted)` for 1px border — that pattern could be exposed as `border-bg-muted-warm` Tailwind class via @theme; already mapped, just unused)

### Q3 — `dark:*` variants handling

**Precedent**: M-KPI-Restore-1 / KpiCard pattern Q3 A stripped raw `dark:*`. M-Design-Dark-1.5 hotfix preserved infrastructure (`.dark` class generation force-disabled but tokens kept) per pattern L57 reversible deprecation.

**This milestone**: V6 confirmed **0 `dark:*` variants** in entire repo. Question collapses — nothing to strip OR keep. **Skip Q3, no decision needed**.

### Q4 — shadcn UI primitives override

**V6 finding**: 3 files (dialog, sheet, alert-dialog) with `bg-black/{10,30}` backdrop overlay. These are **intentional** Radix backdrop alpha pattern.

| Option | Description |
|---|---|
| α (recommend) | **Skip migrate** — backdrop alpha is shadcn convention, not raw drift |
| β | Audit each: replace with `bg-ink/10` token-mediated alpha (consistent with token-based system) |

**Recommend α** — backdrop alpha is universal CSS pattern, not theming-relevant. Migrating to `bg-ink/10` works mechanically (ink = #1A1A1A ≈ near-black) but adds zero value + diverges from shadcn upstream (future shadcn-cli updates would re-introduce raw).

### Q5 — Smoke test scope

| Option | Description |
|---|---|
| α (precedent M-Design-Tailwind-Cleanup-1 Q5) | **Phase A visual N cases** per directory bucket (claude.ai web Playwright MCP) |
| β | Cursor self-verify defer (L42 partial coverage acceptable for mechanical refactor) |
| γ | Hybrid: Phase A for user-facing buckets (auth, landing, x-ray, dashboard); β for internal (admin, annual-review, hansei, gemba) |

**Recommend γ** — risk grade differential per V7 supports split: user-facing visual regression has higher blast radius, internal admin can absorb Cursor self-verify gap.

### Q6 — Commit boundary discipline

| Option | Description |
|---|---|
| α | Atomic per directory only (Q1 β implies this) |
| β (precedent M-Design-Tokens-Cleanup-1 L50) | **Atomic per concern** — separate commit for foundation completion (V4 gaps) FIRST + consumer migration commits AFTER |

**Recommend β** — L48 + L50 pattern: foundation tokens MUST be in :root + @theme BEFORE consumers can use them. If Q2-sub-β picked (new `--bg-on-dark-*` family), Task 2A = foundation commit + Tasks 2B-2L = consumer commits per directory.

### Q7 — Effort estimate + risk grade

| Metric | Value |
|---|---|
| Total raw palette occurrences | 343 (post-shadcn exclude) |
| Total files | 85 |
| Estimated commits | 1 foundation (if Q2-sub-β) + 9 directory buckets = **~10 commits** |
| Estimated LOC churn | ~400-500 (mostly +N -N class renames, no logic) |
| Estimated time | **3-4 hours** for full execution Cursor (mechanical sed-style edits) + 30-45 min Phase A smoke if Q5 γ |
| Risk grade | **LOW** — pure styling, 0 business logic, foundation gap minimal, precedent strong |
| Verification | typecheck + build + Phase A smoke (Q5 γ) + git diff visual review per commit |

---

## Tasks breakdown (placeholder — finalize post Q-decision-lock)

> Below assumes recommended path: Q1 β / Q2 default-mapping with Q2-sub-α (keep raw white-alpha) / Q3 skip / Q4 α (skip shadcn) / Q5 γ / Q6 β / risk LOW.

- **Task 2A — Foundation completion commit** (L48 + L50): `app/globals.css` — verify all needed tokens already exist (V4 confirmed gaps minimal). If no foundation gap → SKIP Task 2A, jump to 2B.
- **Task 2B — Layout bucket** (`components/layout/`, 3 files, 26 occ): finding 2 close-out + sidebar/header/org-switcher token migration. Decision Q2-sub for white-alpha applies here.
- **Task 2C — Auth pages bucket** (`app/(auth)/`, 4 files, 9 occ): user-facing critical, Phase A smoke required (Q5 γ).
- **Task 2D — Landing bucket** (`app/page.tsx` + `components/landing/`, 5 files, 22 occ): user-facing critical, Phase A smoke.
- **Task 2E — X-Ray + lien-he bucket** (`app/x-ray/`, `app/lien-he/`, 4 files, 15 occ): user-facing public, Phase A smoke.
- **Task 2F — Dashboard bucket** (`app/dashboard/`, 12 files, ~64 occ): user-facing authed. Includes Finding 1 close-out (`.card-subtle` CSS literal `var(--white)` → migrate to `var(--bg)` or new token TBD Q2-sub).
- **Task 2G — Admin bucket** (`app/admin/`, 6 files, 19 occ): internal-only, defer smoke to Cursor self-verify (Q5 γ β-side).
- **Task 2H — Annual-review bucket** (`components/annual-review/`, 5 files, 23 occ): internal-facing forms, Cursor self-verify.
- **Task 2I — SWOT bucket** (`components/swot/`, 32 files, ~150 occ): **largest bucket** — may want to sub-split into 2-3 commits by sub-area (workshop / drafts / framework / synthesis) if diff > 200 LOC. Phase A smoke 1-2 representative pages.
- **Task 2J — X-Matrix canvas bucket** (`components/x-matrix/canvas/`, 8 files, 13 occ): user-facing, Phase A smoke if affects visible chrome.
- **Task 2K — Misc small bucket** (`components/dashboard/`, `components/gemba/`, `components/hansei/`, 3 files, 3 occ): trivial, batch into a single commit.
- **Task 2L — Close-out** (precedent M-Design-Dark-1 C7 / Tokens-Cleanup-1 close-out chain): production verify post-Vercel-deploy + HANDOFF.md update + ACTIVE_CONTEXT.md update + plan archive.

---

## Risk + mitigation

1. **Token mapping ambiguity** (V7 Medium) → **Mitigation**: Q2 mapping table locked BEFORE Task 2A. Each ambiguous case (e.g. `bg-gray-100` vs `bg-gray-50` both → `bg-bg-warm`?) flagged inline in commit message with rationale.
2. **Visual regression user-facing** (V7 Medium) → **Mitigation**: Q5 γ Phase A smoke for auth/landing/x-ray/dashboard buckets.
3. **Foundation gap surfacing mid-execution** (V4 + L48 lesson) → **Mitigation**: Task 2A foundation commit FIRST. If gap discovered later mid-bucket, halt + add to foundation commit + reset bucket diff.
4. **shadcn drift on future updates** (Q4 trade-off) → **Mitigation**: Q4 α leaves shadcn primitives untouched; future `npx shadcn-cli@latest add dialog` won't conflict.
5. **`bg-white/N` alpha utilities** (V2 Finding 2) → **Mitigation**: Q2-sub α (recommend) keeps raw to avoid over-engineering. If dark sidebar ever themed in future, Task 2B-revisit.
6. **Email templates inline style drift** (V6 N/A) → **Mitigation**: out of scope, document in HANDOFF (templates stay raw HTML).

---

## Pattern reuse + lessons reference

- **M-Design-Tailwind-Cleanup-1 Q1 β** (batch by directory): Q1 recommendation here.
- **M-Design-Tailwind-Cleanup-1 Q2 α** (file-by-file scope inside bucket): atomic per file inside Q1 β commit boundary.
- **M-Design-Tailwind-Cleanup-1 Q5 α** (Phase A visual smoke user-facing): Q5 γ user-facing slice.
- **M-Design-Tailwind-Cleanup-1 L48** (foundation completion check `:root` + `@theme` mirror): V4 + Q6 β + Task 2A foundation-first.
- **M-Design-Tokens-Cleanup-1 L50** (atomic commit boundary discipline — concern-per-commit): Q6 β.
- **L42 Phase A partial coverage** (acceptable for design refactor mechanical 1:1 with no business logic): Q5 γ β-side internal buckets.
- **M-Design-Dark-1 Commit 2 / L48** (foundation parity LITERAL→REFERENCE refactor pattern): if Q2-sub-β picked, mirror new `--bg-on-dark-*` family in both `:root` and `@theme inline`.
- **M-Design-Dark-1.5 L57** (reversible deprecation pattern dark:* dormant vs strip): collapses to N/A here (V6 confirmed 0 `dark:*` in repo).
- **M-Design-Tokens-Cleanup-1 L41** (Vercel log expire → production verify INCONCLUSIVE acceptable): Task 2L close-out verify pattern.

---

## Constraints (Task 1)

- ✅ KHÔNG patch code Task 1 — verified, no Edit/Write tool used on `.ts/.tsx/.css` files this turn.
- ✅ Output plan doc only — this file written.
- ✅ Audit exhaustive — 5 grep families × full repo + file-level deep-read for findings 1+2 + foundation token block + precedent counts.
- ✅ Time budget: ~30 min audit + plan write.
- ✅ Risk grade LOW expected — confirmed (V7).

---

## Awaiting Vũ Hải decision lock

Q1 (commit cadence), Q2 (mapping table + Q2-sub-α/β white-alpha + Q2-sub on `--border-subtle` need), Q4 (shadcn skip), Q5 (smoke scope), Q6 (foundation-first ordering). Q3 + Q7 already collapsed/computed.

---

## Post-milestone Next Steps (deferred follow-ups discovered during execution)

### N1 — lien-he DRY refactor (LOW priority)

**Discovery**: Commit 3 Task 2B revealed `app/lien-he/page.tsx` lines 141-201 inline-duplicates the `.input-brutal` design system pattern (5× input/select/textarea elements, each spelling out `border-2 border-ink bg-card px-4 py-3 font-body text-[15px] text-ink shadow-brutal-sm outline-none transition-shadow focus:shadow-brutal-accent`).

**Action**: Replace 5 inline className blocks with `className="input-brutal"`. Now that `.input-brutal` foundation Commit 4 (`0d6a792`) uses `var(--card)` (matching the lien-he Commit 3 `bg-card` migration), the visual will be identical post-refactor. Net: removes ~30 LOC of design system duplication.

**Risk**: LOW. Effort: 10 min. Defer to standalone follow-up commit OR bundle into Task 2L close-out chain.

### N2 — Arbitrary hex audit (MEDIUM priority)

**Discovery**: Task 1.5 surfaced 32 arbitrary hex `bg-[#xxxxxx]` / `text-[#xxx]` classes across 17 files (mostly SWOT 26/14). NOT in Task 1 V3 scope.

**Action**: During SWOT bucket (Task 2I), grep arbitrary hex per file, decide per occurrence: token-mappable (e.g. `bg-[#FFFFFF]` → `bg-card`) vs intentional one-off (e.g. SWOT framework color codes per Porter/PEST/etc.). Bundle into SWOT migration commit if mappable.

**Risk**: MEDIUM (some hex codes may be data-driven from framework definitions). Effort: 30 min audit + per-case decision.

### N3 — Email templates (`lib/email/templates.ts`) (LOW priority, OUT OF SCOPE)

**Discovery**: 42 inline `style=`/`background:`/`color:` HTML email styles. Cannot use Tailwind classes (CSS class refs strip in many email clients).

**Action**: Document in HANDOFF as out-of-scope permanent — email templates use raw HTML inline styles by necessity. No migration planned.

### N4 — `--bg-on-dark-*` token family (NICE-TO-HAVE, NOT NEEDED)

**Discovery**: Q2-sub-α decision lock keeps raw `bg-white/N`, `text-white/N` on dark surface. If a future milestone wants to make dark sidebar themable, introduce `--bg-on-dark-{5,10,20,40}` token family in `:root` + `.dark` override + `@theme inline` mirror. Pattern L48 + L57 reversible deprecation.

**Status**: NOT needed in this milestone. Documented for future reference only.

---

## Audit re-verification log

| Run | Date | HEAD | Findings |
|---|---|---|---|
| Initial Task 1 | 2026-05-11 | `224e5d5` | 343 occ / 85 files (regex BUG: `accent-` prefix → ~37 false positives) |
| Task 1.5 corrected | 2026-05-11 | `0d6a792` | 306 raw + 32 arbitrary hex / 72 files (post-shadcn-exclude) |
| Task 7 Auth audit-fix | 2026-05-11 | `b6846a6` | 9 occ predicted → 5× text-red-600 → text-destructive + 1× hover:bg-gray-50 → hover:bg-bg-muted. 4 keep-raw (1× bg-white Google btn + 3× text-white/N on dark panel). Net 6 migrations / 4 audit-fix. |
| Task 8 X-Ray audit-fix | 2026-05-11 | `b6846a6` | 10 occ predicted → **0 migrated**. All 10 fall under keep-raw precedents (Q2-sub-α + Q2 ext saturated brand/dark + Ambiguous 1 C elevated white card). Doc-only commit recording decision. |

---

## Close-out 2026-05-11

**Status**: ✅ SHIPPED — 14 sub-bucket commits + 2 foundation + 1 audit-fix + 1 plan-doc close-out (this section). Branch `master` ahead `origin/master` by 17 commits pending push batch.

### Final cumulative metrics

| Metric | Value |
|---|---|
| Total commits | 14 atomic + 2 foundation (1 + 4) + 1 audit-fix (5) + 1 plan-doc (this close-out) = **15 in-milestone commits** (Task 1 plan `85fbcc5` pre-existed) |
| Real migrations cumulative | **~200 occurrences across ~65 files / 9 consumer buckets** |
| Keep-raw cumulative | **~70 occurrences documented** (Q2-sub-α dark surface + Q2 extended saturated-brand + Ambiguous 1 C elevated cards on warm cream + Hoshin Explorer 2-color category + AI sparkle hex) |
| Migration ratio (real ÷ baseline) | **~65%** avg cumulative (200 ÷ 304 baseline) — semantic-context per-occurrence audit reveal keep-raw justified majority cases |
| Foundation tokens introduced | **0 net-new tokens** (L48 verified — all consumes existing `--bg-warm/--bg-muted/--bg-paper/--ink/--text-2/--text-3/--brand/--accent-{yellow,cyan,lime,pink,peach,lavender}/--card/--kpi-*` family) |
| Business logic / state / JSX structure delta | **0 change** — pure styling refactor |
| `dark:*` variants touched | **0** (V6 confirmed 0 in repo cross-milestone) |

### Final bucket ratio table

| Bucket | Files | Real migration | Keep-raw | Ratio | Commit hash |
|---|---:|---:|---:|---:|---|
| Foundation `.card-subtle` | 1 CSS | 1 | 0 | — | `b0edc91` Commit 1 |
| lien-he | 1 | 5 | 0 | 100% | `0d220cc` Commit 2 |
| Foundation `.input-brutal` | 1 CSS | 1 | 0 | — | `0d6a792` Commit 4 |
| Task 1.5 audit doc | — | — | — | — | `a922ed3` Commit 5 |
| X-Matrix canvas | 3 | 1 | 4 | 20% | `947a2c4` Commit 6 |
| Auth | 4 | 6 | 4 (Ambig 1C + dark panel) | 67% | `b6846a6` Commit 7 |
| X-Ray (doc-only) | 3 | 0 | 10 (Q2-sub-α + ext saturated + Ambig 1C) | 0% | `955036a` Commit 8 |
| Annual-review | 5 | 14 | 3 | 82% | `ce17b7d` Commit 9 |
| Admin | 7 | 2 | 18 (Hoshin Explorer 2-color category keep-raw) | 10% | `29fe6f5` Commit 10 |
| Dashboard 11a Surface | partial | ~20 | ~5 | — | `3a3a883` Commit 11a |
| Dashboard 11b KPI status | partial | ~14 | ~2 | — | `cb4a365` Commit 11b |
| Dashboard 11c Discovery | partial | ~13 | ~5 | — | `0825f2c` Commit 11c |
| **Dashboard total** | 14 | 47 | 19 (incl. AI sparkle hex keep-raw) | **71%** | (sum) |
| SWOT 9a Workshop+Chat | partial | 39 | ~17 | 70% | `c8a8e01` Commit 12 |
| SWOT 9b Context+Drafts+Canvas | partial | 60 | ~15 | 80% | `276307c` Commit 13 |
| SWOT 9c TOWS+Synthesis+Finalize | partial | 31 | ~15 | 67% | `4a8de48` Commit 14 |
| **SWOT total** | 32 | 130 | ~47 | **74%** | (sum) |
| **TOTAL** | **~65** | **~200** | **~70** | **~65%** | — |

### 14 commits list

1. `85fbcc5` — Task 1 plan
2. `b0edc91` — Commit 1 `.card-subtle` foundation `var(--white)` → `var(--card)`
3. `0d220cc` — Commit 2 lien-he 5× `bg-white` → `bg-card`
4. `0d6a792` — Commit 4 `.input-brutal` foundation `var(--white)` → `var(--card)`
5. `a922ed3` — Commit 5 Task 1.5 corrected re-audit + revised V3 + bucket order
6. `947a2c4` — Commit 6 X-Matrix canvas `amber-600` → `kpi-attention-strong`
7. `b6846a6` — Commit 7 Auth (6 migrations / 4 keep-raw audit-fix)
8. `955036a` — Commit 8 X-Ray 0-net-migration doc-only
9. `ce17b7d` — Commit 9 Annual-review (14 migrations / 3 keep-raw)
10. `29fe6f5` — Commit 10 Admin (Hoshin Explorer 2-color category keep-raw scope)
11. `3a3a883` — Commit 11a Dashboard surface
12. `cb4a365` — Commit 11b Dashboard KPI status
13. `0825f2c` — Commit 11c Dashboard discovery decoration
14. `c8a8e01` — Commit 12 SWOT 9a Workshop+Chat
15. `276307c` — Commit 13 SWOT 9b Context+Drafts+Canvas
16. `4a8de48` — Commit 14 SWOT 9c TOWS+Synthesis+Finalize (FINAL pre close-out)
17. `<close-out hash>` — this close-out docs commit (HANDOFF §16/§17/§18 + plan archive + plans/README update)

### Smoke test status — deferred manual Phase A

Per L42 partial coverage convention reinforced lần 8 (cumulative across M-KPI-Mgmt-1 → M-KPI-Restore-1 → M-Design-Tailwind-Cleanup-1 → M-Cleanup-batch-2026-05-09 → M-RateLimit-Generic-1 → M-Design-Tokens-Cleanup-1 → M-Design-Dark-1 → this), Phase A visual smoke deferred manual anh Vũ Hải khi tiện cross 10 routes (high-priority user-facing first):

| Priority | Route | Bucket | Verify |
|---|---|---|---|
| HIGH | `/lien-he` | lien-he | 5 form inputs `bg-card` warm card |
| HIGH | `/login` + `/register` + `/update-password` + `/reset-password` | Auth | Red error inline + Google btn elevated card + dark panel `text-white/N` preserved |
| HIGH | `/dashboard` | Dashboard 11a top-level | Surface tokens render NB v3.2 warm |
| HIGH | `/dashboard/kpi` | Dashboard 11b KPI status | KpiCard 3-tier render + threshold gradient |
| MEDIUM | `/dashboard/settings` | Dashboard 11a (settings subset) | Form inputs + section dividers |
| MEDIUM | `/dashboard/discovery` (+ swot/pain-mapper/vision-workshop/synthesis/benchmark/xray-history) | Dashboard 11c | Gradient stickers + CTA brand red + status pills |
| MEDIUM | `/dashboard/x-matrix/new` | X-Matrix canvas | CenterX KPI badge `kpi-attention-strong` color + HoshinEditModal warning |
| MEDIUM | `/dashboard/discovery/swot` workshop entry | SWOT 9a Workshop+Chat | SwotWorkshopChat + SwotChatComposer color hierarchy |
| MEDIUM | `/dashboard/discovery/swot` draft + canvas | SWOT 9b Context+Drafts+Canvas | TowsCanvas + SwotContextForm + SwotFrameworkPicker render |
| MEDIUM | `/dashboard/discovery/synthesis` | SWOT 9c TOWS+Synthesis+Finalize | TowsStrategy 4-quadrant + SwotFinalizeList |
| LOW | `/admin/hoshin-explorer` | Admin (super-admin) | 2-color category keep-raw preserved |

Phase B Cursor self-verify implicit qua build + typecheck PASS cross all 14 atomic commits (L42 partial coverage).

### Pattern lessons captured

**NEW patterns (2)**:

- **L58 NEW — Pre-decision lock pattern cho large bucket milestone save ambiguous round-trips**: 7 Q-cases pre-locked cross 3 SWOT sub-buckets (9a/9b/9c) saved ~10 round-trip ambiguous prompts. Pattern: BEFORE start sub-bucket execution, enumerate ambiguous decisions (semantic surface ambiguity, keep-raw vs migrate boundary, gradient handling, dynamic hex from data) + resolve cross-bucket consistent (Q2-sub-α dark surface + Q2 extended saturated-brand + Ambiguous 1 C elevated cards on warm cream). Apply universally future large-scope cleanup milestones (≥5 sub-buckets). Cost ~10-15 phút decision lock, save ~30-60 phút avoid round-trip mid-execution.
- **L59 NEW — Baseline grep count ≠ migration count, real ratio ~60-65% cumulative avg**: Task 1.5 corrected re-audit (306 raw + 32 arbitrary hex = 338 baseline) → actual migrations ~200 (65% ratio). Per-occurrence semantic context audit (NOT bulk grep replace) reveal keep-raw justified majority cases: Q2-sub-α dark surface (~30 occ) + Q2 extended saturated-brand (~15 occ) + Ambiguous 1 C elevated cards on warm cream (~8 occ) + Hoshin Explorer 2-color category data-driven (~14 occ) + AI sparkle decorative hex (~3 occ). Apply universally future raw palette / token migration milestones: budget execution time at 60-70% baseline grep count, not 100%. Pattern reinforce L42 partial coverage + L48 verify-first audit consumer.

**Reinforced patterns**:

- **L42 reinforced lần 8** — Phase A visual coverage acceptable cho design refactor mechanical 1:1 with no business logic. Phase B Cursor self-verify implicit qua typecheck + build PASS cross 14 atomic commits. Pattern proven 8 lần (M-KPI-Mgmt-1 → M-KPI-Restore-1 → M-Design-Tailwind-Cleanup-1 → M-Cleanup-batch-2026-05-09 → M-RateLimit-Generic-1 → M-Design-Tokens-Cleanup-1 → M-Design-Dark-1 → M-Design-Tangential-Cleanup-1).
- **L48 reinforced lần 11** — Foundation completion check pre consumer migration. Foundation Commit 1 (.card-subtle) + Commit 4 (.input-brutal) BOTH ship FIRST trước 9 consumer buckets. `:root` `--card` token reuse validated (existing shadcn token, NO net-new introduction). Tailwind v4 `@theme inline --color-card` mirror exists pre-milestone.
- **L50 reinforced lần 6** — Atomic commit boundary discipline per concern. Dashboard 11a/11b/11c sub-split (surface vs KPI status vs discovery decoration) + SWOT 9a/9b/9c sub-split (Workshop+Chat vs Context+Drafts+Canvas vs TOWS+Synthesis+Finalize) proven scalable cho large bucket diff. Per atomic commit ~30-60 min effort, reversibility granular per concern.

**Decision lock summary** (cumulative 7 Q-cases + Task 1.5 + Task 8 + Task 7 mid-task + 5 SWOT sub-bucket pre-locks):

| Q-case | Decision | Apply scope |
|---|---|---|
| Q1 | β Commit cadence directory-bucket atomic | Cross 14 commits proven |
| Q2 | Default mapping table | Cross 9 buckets uniform |
| Q2-sub-α | Keep-raw white-alpha on dark surface | Layout sidebar + Page footer + Auth dark panel + X-Ray CTA banner |
| Q2 extended | Keep-raw white text on saturated-brand surface | Layout header brand button + Auth Google btn + X-Ray pills/checkmark |
| Q2 Ambig 1 C | Keep-raw elevated `bg-white` cards on warm cream | Auth Google btn + X-Ray option pill |
| Q3 | N/A (0 `dark:*` in repo cross-milestone) | Skip |
| Q4 | α Skip shadcn primitives backdrop alpha | Cross dialog/sheet/alert-dialog 3 files |
| Q5 | γ Hybrid Phase A user-facing + Cursor self-verify internal | Manual deferred anh Vũ Hải |
| Q6 | β Atomic per concern (foundation FIRST + consumer per bucket) | 14 commits proven |
| Q7 | Effort 5-7h Cursor + 60-90min smoke (actual ~6h Cursor, smoke deferred) | Validated post-ship |

**Methodology source** (cumulative pattern reuse):

- M-Design-Tailwind-Cleanup-1 Q1 β + L48 foundation completion check
- M-Design-Tokens-Cleanup-1 L50 atomic commit boundary discipline
- M-Design-Dark-1 L48 foundation parity LITERAL→REFERENCE (collapsed N/A here, REFERENCE form already established)
- M-Design-Dark-1.5 L57 reversible deprecation (N/A scope, but cross-reference for future re-enable)
- Verify-first L29/L32/L45/L48/L49 reinforced lần 9 — Task 1.5 corrected re-audit Bug surfaced Commit 3 (`accent-` regex false positive), per-occurrence semantic audit reveal keep-raw justified.

### Constraints cho future AI sessions

- KHÔNG modify foundation tokens (`--card`, `--white`, `--bg`, `--bg-warm`, `--bg-muted`, `--bg-paper`, `--bg-dark`, `--ink`, `--text-2`, `--text-3`, `--brand`, `--accent-*`, `--kpi-*` family) without explicit decision lock — semantic role established cumulative cross M-Design-3a/3b/Tokens-Cleanup-1/Tailwind-Cleanup-1/Dark-1/Tangential-Cleanup-1.
- KHÔNG re-introduce raw `bg-white` / `bg-gray-*` / `text-gray-*` Tailwind palette utilities cho new code — pattern `bg-card` / `bg-bg-warm` / `text-text-2` token-based class. Anti-pattern: copy-paste from external snippets → future cleanup tốn migration scope.
- KHÔNG migrate keep-raw white-on-saturated-surface intentional contrast cases (Q2-sub-α + Q2 extended). Anti-pattern: bulk regex replace → break sidebar text contrast + button readability + X-Ray CTA banner.
- KHÔNG add `dark:*` variant cho new code — defer M-Design-Dark-1 re-enable milestone nếu user complain (M-Design-Dark-1.5 force-light lock 2026-05-11).
- KHI add new component dùng warm cream + brand red + accent pastel palette, FOLLOW token class pattern cumulative established. KHÔNG invent new `--bg-X` foundation token unless verify-first confirm gap (L48 audit checklist).
- KHI cleanup milestone large-scope (≥5 sub-buckets), apply L58 pre-decision lock pattern: enumerate ambiguous Q-cases cross sub-buckets + resolve consistent BEFORE start execution.
- KHI estimate raw palette migration effort, budget 60-70% baseline grep count (L59 pattern) — keep-raw justified majority cases via per-occurrence semantic audit.

### Production verify chain (post-push)

Pending Step 4 close-out: Vercel deploy `<deploy_id_TBD>` state=READY ✓ + githubCommitSha match HEAD close-out + build clean + runtime 30 phút 0 user-facing crash + smoke 3 routes curl production.
