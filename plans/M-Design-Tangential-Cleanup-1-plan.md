# M-Design-Tangential-Cleanup-1 Plan

> **Status**: AUDIT-ONLY (Task 1). Code patches deferred to Task 2A+ post-decision-lock.
> **Author**: claude.ai web (Opus 4.7)
> **Date drafted**: 2026-05-11
> **HEAD at audit**: `224e5d5` (M-Design-Dark-1.5 close-out, working tree clean, branch `master`)
> **Pattern reuse**: M-Design-Tailwind-Cleanup-1 (Q1 β / Q2 α / L48 foundation completion / L42 Phase A partial coverage), M-Design-Tokens-Cleanup-1 (L50 atomic commit boundary), M-Design-Dark-1 (L48 foundation parity), M-Design-Dark-1.5 (L57 reversible deprecation).

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
