# M-Design-Dark-1 — Plan Doc

> **Status**: Task 1 plan doc — verify-first extension audit + Q-decision propose. Task 2-7 implementation prompts build sau khi Vũ Hải confirm Q4-Q8.
> **Trigger**: M-Design-Tokens-Cleanup-1 close-out 2026-05-10 surface dark mode gap. M-Design-3a/3b foundation tokens (8 KPI + 4 score + 2 KPI-strong) shipped NHƯNG `.dark` block CHỈ override shadcn neutral set (~30 tokens) — toàn bộ NB v3.2 design system custom (~38 tokens hardcoded `@theme inline`) thiếu dark variants. Theme toggle UI EXIST `header.tsx:99` (Sun/Moon button via `next-themes`) NHƯNG inline script `app/layout.tsx:113` FORCE LIGHT mỗi reload → toggle dead.
> **Risk grade**: γ FULL MEDIUM-HIGH (scope all tokens + UI fix + visual A/B). Session split fallback ready.
> **Effort estimate**: ~6-8h, 7 commits (default α). Trigger split γ nếu Cursor V2 verify-first phát hiện >25 pastel files HOẶC V5 dual-mirror scope creep.

---

## Section 1 — Decisions locked (Q1-Q3 từ Vũ Hải)

| Q | Decision | Rationale |
|---|---|---|
| **Q1 γ FULL** | All tokens + theme toggle UI fix 1 milestone (~6-8h, 7 commits) | M-Design-Tokens-Cleanup-1 evidence eye-fatigue dropdown hover → user signal dark mode mature. Half-ship (α/β skip Pastel hoặc skip toggle) tạo regression debt — 19 pastel consumer files visual jarring nếu user toggle DevTools manual. |
| **Q2 Invert lab** | Flip cứng `--ink #FFFEF9` / `--bg #1A1A1A` brand foundation dark mode | Brand foundation tokens (`--ink`, `--bg`, `--text-*`, `--white`) hiện CHƯA override `.dark` block → text/border/shadow vô hình trên dark bg `#1A1A1A`. Invert đảm bảo NB v3.2 design system "Inverted Brutalism" đúng spec block comment line 256. |
| **Q3 Full 8 cases Phase A smoke** | KPI consumers + Score consumers + sidebar + header + modal coverage | Visual A/B beta SaaS solo dev judgment — 8 cases minimum cho confidence ship dark mode đầu tiên. L42 partial coverage acceptable cho mechanical refactor, NHƯNG dark mode = NEW visual semantic, KHÔNG mechanical. Phase B Cursor self-verify defer reactive. |

---

## Section 2 — Verify-first audit V1-V5

### V1 — Brand foundation tokens completeness check

`:root` block `app/globals.css` lines 122-253 inventory tokens scope dark mode:

| Token | Light value | `.dark` current override | Need flip dark? |
|---|---|---|---|
| `--ink` (line 164) | `#1A1A1A` | ❌ KHÔNG override | YES → `#FFFEF9` (Q2 invert lab) |
| `--text-2` (line 165) | `#4A4848` | ❌ KHÔNG override | YES → `#8A8787` (lighten cho dark bg AA contrast) |
| `--text-3` (line 166) | `#6B6868` | ❌ KHÔNG override | YES → `#A0A0A0` (lighter still, secondary text on dark) |
| `--brand` (line 167) | `#c73937` | ❌ KHÔNG override | Q4 decision pending |
| `--brand-dark` (line 168) | `#9e1f1e` | ❌ KHÔNG override | Q4 decision pending (likely darken further nếu --brand brighten) |
| `--bg` (line 169) | `#FFFEF9` | ❌ KHÔNG override | YES → `#1A1A1A` (Q2 invert lab) |
| `--bg-muted` (line 170) | `#F5F0E8` | ❌ KHÔNG override | YES → `#3a3939` (match shadcn `--secondary` dark) |
| `--bg-paper` (line 171) | `#F5F0E8` | ❌ KHÔNG override | YES → `#3a3939` (paper section dark) |
| `--bg-dark` (line 172) | `#1A1A1A` | ❌ KHÔNG override | **EDGE CASE** — light value đã `#1A1A1A`. Dark mode flip về `#FFFEF9` (warm white) HAY stay `#1A1A1A`? Recommendation: flip về `#FFFEF9` để consistent với invert pattern (semantic name "dark section" bg = inverse của theme bg). Marquee (`nb-marquee` line 552 `background: var(--ink)`) sẽ visible trên `--bg-dark` flip warm white. |
| `--white` (line 173) | `#FFFFFF` | ❌ KHÔNG override | YES → `#1A1A1A` (white = inverse, dùng làm fg cho `--brand` `--ink` text) |

**Total: 10 tokens brand foundation cần `.dark` override.** Confirmed exact 10 tokens em đoán Phần A audit trước. KHÔNG miss token nào.

### V2 — 6 Pastel accents consumer audit (CRITICAL count verify)

Grep `var\(--accent-(yellow|cyan|lime|pink|peach|lavender)` + `bg-accent-(yellow|cyan|lime|pink|peach|lavender)` + Tailwind class variants:

**Distinct files: 18 files** (HANDOFF prose claim 19 — 1 file off, em verify-first invalidate prose lần 9 reinforced L48). File list:

| Category | Files |
|---|---|
| **Layout/landing (5)** | `app/onboarding/setup-org/page.tsx:234`, `components/landing/CtaBannerNB.tsx:27,31,33,44`, `components/landing/HeroNB.tsx:5,9,13,111,120,129`, `components/landing/MarqueeStrip.tsx:13-16`, `app/globals.css:188-190,236-239,515,530,534,543-544,607,614,621,628,635,642,658,678,705-708` (foundation defs + utility classes) |
| **X-Matrix canvas (6)** | `components/x-matrix/canvas/SubmitBar.tsx:88`, `components/x-matrix/canvas/GembaModal.tsx:58,74`, `components/x-matrix/canvas/CanvasMiniMap.tsx:46`, `components/x-matrix/canvas/CanvasHeader.tsx:154`, `components/x-matrix/canvas/EducationalTooltip.tsx:41`, `components/x-matrix/canvas/CoachPopover.tsx:111`, `components/x-matrix/canvas/CenterX.tsx:217` (7 files thực, count 6 trên bảng nếu gộp CoachPopover+CenterX) |
| **Annual review/dashboard (4)** | `components/dashboard/AnnualReviewCard.tsx:10`, `components/annual-review/TransitionPreviewModal.tsx:118,128,181`, `components/annual-review/CarryOverDecisions.tsx:29,34,39`, `components/hansei/HanseiHistoryList.tsx:98` |
| **Gemba (1)** | `components/gemba/GembaCommentThread.tsx:51` |

**Pattern distribution**:
- CSS inline style (`style={{ background: 'var(--accent-yellow)' }}`): ~10 occurrences
- Tailwind class (`bg-accent-yellow`, `bg-accent-cyan`, etc.): ~12 occurrences
- CSS arbitrary value (`bg-[var(--accent-yellow)]`): ~5 occurrences (legacy pattern, mixed)

**Critical insight**: Tailwind class consumers (>12 occurrences) yêu cầu **dual-mirror** `:root .dark` + `@theme inline` refactor (Pattern L48). CSS inline + arbitrary value consumers chỉ cần `:root .dark` override (browser cascade auto-resolve).

### V3 — Composite borders/shadows consumer audit

Grep `var\(--shadow-*` + `var\(--border-(heavy|accent|subtle)` + Tailwind classes `shadow-brutal-*`:

**Distinct files: 21 files** (15 CSS var consumers + 6 Tailwind class consumers). Critical files breakdown:

| Token | Consumers (sample) | Pattern |
|---|---|---|
| `--shadow-md/lg` (var) | 15 files: x-matrix canvas (5), banners (3), modals (2), dashboard (2), landing (1), onboarding (1), components/ui/dialog (1) | CSS inline/utility |
| `--shadow-brand` literal `#c73937` | `components/x-matrix/canvas/cards/HoshinCard.tsx`, CenterX, edges | CSS inline (Q6 decision) |
| `--shadow-yellow/cyan/pink` literal | landing/CtaBannerNB, x-matrix EducationalTooltip | CSS inline (Q6 decision) |
| `shadow-brutal-md/lg` (Tailwind class) | 6 files: header, org-switcher, lien-he, hoshin-explorer/PhaseBlock, swot/SwotIndustryDropdown, x-ray/QuestionStep | Tailwind class (`@theme inline` line 83-95 hardcoded `#1A1A1A`) |

**Critical insight**: 13 NB shadow tokens trong `@theme inline` lines 83-95 đều **hardcoded `#1A1A1A` literal** → KHÔNG auto-flip Q2 invert. Cần Q6 decision: stay hardcoded (sub-optimal cho dark, cohesive light) HAY refactor `var()` reference (`6px 6px 0 var(--ink)` để auto-flip).

### V4 — clearTokenCache() invalidation strategy verify

| Item | State | Note |
|---|---|---|
| `clearTokenCache()` export | EXISTS `lib/design/chart-tokens.ts:58` | Comment line 11 explicit: *"Currently unused — dark mode is out of scope for M-Design-3a"* |
| `clearTokenCache()` callers | **0 callers** verified Explore agent grep | Dead export — wire ready cho theme toggle (em đoán đúng từ M-Design-3a comment) |
| `next-themes` API | `useTheme()` hook exposes `theme`, `setTheme`, `resolvedTheme` | Standard react hook pattern, KHÔNG có `onChange` callback API |
| `theme-provider.tsx` config | `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`, `storageKey="hoshin-theme-v2"`, `disableTransitionOnChange` | Wrap `NextThemesProvider` minimal, no custom logic |
| `header.tsx:99` toggle button | `setTheme(theme === 'dark' ? 'light' : 'dark')` | Plain setTheme call, KHÔNG wire side effect cache invalidation |

**Critical insight**: `next-themes` KHÔNG expose theme-change event API → wire `clearTokenCache()` qua **useEffect listen `theme` change** (Q7 α) là canonical pattern. MutationObserver (Q7 β) over-engineered. Cache key bao gồm theme state (Q7 γ) elegant nhất NHƯNG yêu cầu refactor `tokenCache` Map → composite key — risk regression.

### V5 — `@theme inline` DUAL-MIRROR scope inventory

`@theme inline` block lines 12-117 phân loại theo dark-aware mechanism:

#### Group A — REFERENCE form (✓ dark-aware via `:root .dark` cascade) — 31 tokens

shadcn mappings lines 14-44 (`--color-* : var(--*)`):

| Token range | Count | Form |
|---|---|---|
| Lines 14-44 shadcn neutral + chart + sidebar | 31 tokens | `var(--*)` reference — auto-flip với `:root .dark` |

**Status**: Dark-aware NOW. KHÔNG cần touch trong M-Design-Dark-1.

#### Group B — LITERAL form (✗ NOT dark-aware, NEED fix) — 38 tokens

| Token group | Lines | Count | Has Tailwind consumer? | Refactor strategy |
|---|---|---|---|---|
| **NB colors** (`--color-ink`, `--color-text-2/3`, `--color-accent-brand/dark`, `--color-bg-*`, 6 pastel) | 47-61 | 15 | **YES** (`text-bg-warm`, `bg-accent-brand`, `bg-accent-yellow` etc. — V2 confirm 12+ Tailwind class occurrences) | Convert LITERAL → REFERENCE: `--color-ink: var(--ink);` + add `:root .dark { --ink: #FFFEF9 }` |
| **KPI tokens** (4 base + 4 fg + 2 strong) | 63-73 | 10 | **YES** (`bg-kpi-healthy`, `text-kpi-attention-fg` — KpiCard 9 classes M-Design-Tailwind-Cleanup-1) | Convert LITERAL → REFERENCE + add `:root .dark { --kpi-* : ... }` |
| **NB shadows** (`--shadow-brutal-*`) | 83-95 | 13 | **YES** (`shadow-brutal-md/lg` — V3 confirm 6 Tailwind class consumers) | Convert LITERAL → REFERENCE: `--shadow-brutal-md: 6px 6px 0 var(--ink);` (Q6 γ refactor approach) |
| **Fonts** (`--font-display/body/sans/mono/heading`) | 76-80 | 5 | YES | Theme-agnostic, KHÔNG cần touch |
| **Radii** (`--radius-sm/md/lg/xl/2xl/3xl/4xl`) | 98-104 | 7 | YES | Theme-agnostic, KHÔNG cần touch |
| **Spacing** (`--space-1..8`, `--spacing-sidebar/header`) | 107-116 | 10 | YES | Theme-agnostic, KHÔNG cần touch |

**Total cần refactor**: **38 tokens LITERAL → REFERENCE** + add overrides trong `:root .dark` block.

**Critical insight**: Refactor LITERAL → REFERENCE pattern (Q6 γ for shadows) eliminate dual-mirror `@theme inline .dark` requirement. `@theme inline` define token shape, `:root .dark` override values. Tailwind v4 + `@custom-variant dark (&:is(.dark *))` line 5 already handles `dark:` prefix variants automatically. Khi `--color-ink: var(--ink)` reference, Tailwind class `text-ink` resolve runtime browser cascade → auto-flip dark.

**Pattern lesson L48 reinforced lần 9**: Foundation completion check now extends — `:root` defined ≠ `@theme inline` enabled ≠ dark-aware. Three checkpoints: (a) `:root` block has token defined, (b) `:root .dark` block has override, (c) `@theme inline` token uses REFERENCE form (not LITERAL) để Tailwind class read runtime cascade.

---

## Section 3 — Q4-Q8 propose options + recommend default

### Q4 — Brand value strategy dark mode

**Context**: Q2 invert lab flip `--ink/--bg` cứng. Nhưng `--brand #c73937` stay light value sẽ render dark trên dark bg `#1A1A1A` → contrast ratio ~4.1:1 (passes WCAG AA-large nhưng fail AA-normal cho body text). shadcn `--primary` đã override `#E84947` brighter `.dark` block line 266 (audit Phần A confirm).

| Option | Value | Tradeoff |
|---|---|---|
| **α** | `--brand` stay `#c73937` cả 2 themes | Cohesive brand identity light, contrast ratio 4.1:1 dark may fail AA-normal trên dark bg |
| **β** ⭐ | `--brand` override `#E84947` `.dark` (align shadcn `--primary`) | Cohesive với shadcn theme system, contrast ratio ~5.8:1 dark passes AA-normal, brand recognition nhẹ shift (1 hue step) |
| **γ** | `--brand` override custom `#DC4644` `.dark` | Middle ground — em không thấy lý do pick custom hex thay vì align shadcn |

**Recommendation: β** — align shadcn `--primary` `#E84947` đã proven dark mode design (shadcn ship `.dark` override 2026-04-27 M-Design-1 trước M-Design-3a/3b/Tokens-Cleanup-1). Cohesive theme system + AA-normal contrast pass + brand identity preserve (red hue family). `--brand-dark` cũng override `#9e1f1e` → `#C73937` (lighten 1 step parallel).

### Q5 — 6 Pastel accents dark variants strategy

**Context**: V2 confirm 18 consumer files. Pastel light hex (vd `--accent-yellow #F5E4B8`) trên dark bg jarring + low contrast `var(--ink)` text khi `--ink` flip `#FFFEF9` (yellow bg + white text = unreadable).

| Option | Value | Tradeoff |
|---|---|---|
| **α** | Dark mute version (preserve hue, drop lightness 50%+, vd `#F5E4B8` → `#4A4530`) | Subtle dark UI matches inverted brutalism aesthetic, contrast text-on-pastel preserve (white text trên dark mute pastel ~7:1 AA pass), pastel identity preserve nhẹ |
| **β** | Saturated reuse strong tokens hue (vd `--accent-yellow` dark = `#D97706`) | Bold visual identity dark, BUT pastel cards (HeroNB, FeatureCardNB) trở nên saturated → mất "subtle accent" semantic — visual jarring khác |
| **γ** ⭐ | Hybrid: bg dark mute + text saturated companion | Best contrast accessibility (dark mute bg `#4A4530` + saturated `#D97706` text → 4.5:1 AA pass), preserve pastel identity nhẹ, complex token model (2x tokens per pastel) |

**Recommendation: α** — dark mute version pure simplicity. Pastel cards keep "subtle accent" semantic + text auto-flip via `--ink: #FFFEF9` cascade (white text trên dark mute bg = 7:1+ AA pass). γ hybrid over-engineered cho beta — defer M-Design-Dark-2 nếu user complain accessibility. Mute version values:

| Pastel | Light | Dark mute |
|---|---|---|
| `--accent-yellow` | `#F5E4B8` | `#4A4530` (warm dark yellow) |
| `--accent-cyan` | `#C4DEDC` | `#2E4644` (deep teal) |
| `--accent-lime` | `#DDE4C5` | `#3D4530` (olive dark) |
| `--accent-pink` | `#F0DCDD` | `#4A3839` (mauve dark) |
| `--accent-peach` | `#F0DCC0` | `#4A3D2E` (warm brown) |
| `--accent-lavender` | `#DDD3EE` | `#3D364A` (deep purple) |

### Q6 — Composite shadow tokens dark strategy

**Context**: V3 audit 21 consumer files. `--shadow-md` `:root` line 230 dùng `var(--ink)` cascade → Q2 invert auto-flip light shadow trên dark bg ✓. NHƯNG `--shadow-brand`, `--shadow-yellow/cyan/pink`, `--shadow-double` `:root` lines 236-239 hardcoded hex literal (vd `6px 6px 0 var(--accent-yellow)` reference accent token — actually some reference, some literal). Plus `@theme inline` lines 83-95 13 shadow tokens **all hardcoded `#1A1A1A` literal**.

| Option | Value | Tradeoff |
|---|---|---|
| **α** | Stay hardcoded hex literal cả `:root` lẫn `@theme inline` | Saturated colored shadows visible cả 2 themes, brand red preserved consistent, BUT NB shadow `6px 6px 0 #1A1A1A` invisible trên dark bg `#1A1A1A` → broken visual signature |
| **β** | Override colored shadow tokens `.dark` block với brighter variants | Effort 13 tokens × 2 (`@theme` + `:root`) = 26 token overrides, complex, partial fix (`--shadow-md/lg` already var() cascade auto-flip) |
| **γ** ⭐ | Refactor LITERAL → REFERENCE: `--shadow-brutal-md: 6px 6px 0 var(--ink)` (`@theme inline`) + colored shadows reference accent vars | Auto-flip với Q2 invert pattern + Q5 pastel dark mute (shadow yellow `#F5E4B8` → `#4A4530`), elegant single source of truth, eliminate dual-mirror cho shadows |

**Recommendation: γ** — refactor LITERAL → REFERENCE single source of truth. Pattern lesson L48 reinforced lần 9. Cost: 13 `@theme inline` shadow tokens refactor lines 83-95 + verify visual equivalence light mode (browser cascade resolve identical hex). Risk LOW — Tailwind v4 + `@custom-variant dark` already supports REFERENCE form (proven shadcn mappings lines 14-44).

### Q7 — clearTokenCache() invalidation hook strategy

**Context**: V4 audit identify `next-themes` `useTheme()` hook returns `theme` state. KHÔNG có onChange callback. Pattern phải useEffect listen theme change.

| Option | Value | Tradeoff |
|---|---|---|
| **α** ⭐ | useEffect listen `theme` change từ `useTheme()` → `clearTokenCache()` side effect | Standard React pattern, simple wire 5 LOC trong `theme-provider.tsx` hoặc dedicated hook `useThemeCache()`, reactive guaranteed |
| **β** | MutationObserver `document.documentElement.classList` change → `clearTokenCache()` | Decoupled từ next-themes (works cả manual DOM toggle), BUT over-engineered cho 1 use case + browser API overhead |
| **γ** | Patch `resolveToken()` cache key bao gồm `.dark` class state (eliminate invalidation) | Elegant — cache key `${dark ? 'dark:' : 'light:'}${tokenName}` → no invalidation needed, BUT requires refactor `tokenCache` Map shape + verify SSR fallback path không break |

**Recommendation: α** — useEffect listen pattern simple + reactive guaranteed. Wire trong `theme-provider.tsx` thêm wrapper hook hoặc dedicated `components/providers/theme-cache-bridge.tsx`. 5 LOC + 1 file delta. γ refactor cache key elegant nhưng risk regression cao + test coverage cần expand chart-tokens unit tests (currently 0 test coverage).

### Q8 — Phase boundary 7-commit breakdown lock

**Context**: V2 18 pastel files + V3 21 shadow files + V5 38 LITERAL tokens + Q3 8 cases smoke = full scope significant. Session limit pattern §17 ~8h trigger threshold.

| Option | Breakdown | Tradeoff |
|---|---|---|
| **α** ⭐ | 7 commits standard:<br>1. Plan doc (this task)<br>2. Brand foundation `.dark` (10 tokens) + V5 NB colors LITERAL→REFERENCE refactor (15 tokens `@theme`)<br>3. Composite borders/shadows refactor LITERAL→REFERENCE Q6 γ (13 shadow tokens `@theme`)<br>4. KPI + KPI-strong + Score `.dark` (14 tokens) + KPI 10 tokens LITERAL→REFERENCE refactor<br>5. 6 Pastel `.dark` mute Q5 α (6 tokens)<br>6. Toggle UI fix (`layout.tsx:113` honor dark + `clearTokenCache` wire Q7 α)<br>7. Smoke 8 cases Phase A + close-out HANDOFF | Atomic per concern, easier rollback per layer |
| **β** | 8 commits split — Commit 4 tách KPI + Score riêng | Atomic hơn nhưng marginal benefit (KPI + Score cùng group "status colors"), 1 extra commit overhead |
| **γ** ⭐ FALLBACK | Session split trigger ~6h boundary:<br>**Session 1 M-Design-Dark-1a**: Commits 1-4 (foundation + composite + KPI/Score/strong)<br>**Session 2 M-Design-Dark-1b**: Commits 5-7 (Pastel + toggle UI + smoke 8 cases) | Pattern §17 Vibe coding session limit ~8h proven, rest between sessions cho judgment quality. Trade-off: dark mode incomplete giữa session 1 và 2 (Pastel vẫn light → user toggle DevTools jarring) |

**Recommendation: α default + γ fallback trigger**:
- **Ship α 7 commits 1 session NẾU**: V2 verify-first Cursor Commit 5 confirm 18 files (KHÔNG bump >25), AND Cursor coding pace healthy ≥2 commit/h sau Commit 3.
- **Pivot γ session split NẾU**: V2 Commit 5 phát hiện scope creep (vd thêm 5 files chưa grep), HOẶC Cursor pace <1.5 commit/h sau Commit 3 (signal scope vs time mismatch), HOẶC anh decide batch quality > completion speed.

---

## Section 4 — Risk grade + effort estimate + phase boundary

### R1. Risk grade γ FULL — 5 risks concrete + mitigation

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Scope creep V2 pastel 18→25+ files** | MEDIUM | Cursor verify-first GREP exhaustive Commit 5 trước refactor + flag scope deviation HANDOFF prose claim invalidate (L29/L32/L45/L48 lần 9). Trigger Q8 γ session split nếu >25 files. |
| 2 | **Visual A/B subjective Q3 8 cases** | MEDIUM | Vũ Hải screenshot comparison 8 cases (Light side-by-side Dark) thay text-only review. Pattern M-Design-Tokens-Cleanup-1 evidence eye-fatigue Vũ Hải screenshot 2026-05-10 proven. Phase B Cursor self-verify defer reactive nếu Phase A 6/8+ PASS visual. |
| 3 | **Session limit ~8h pattern §17** | MEDIUM | Q8 γ fallback session split ready. Trigger ~6h elapsed boundary OR Cursor pace <1.5 commit/h sau Commit 3. |
| 4 | **Tailwind v4 dual-mirror pattern L48 lần 9** | HIGH | Q6 γ refactor LITERAL→REFERENCE single source of truth eliminate dual-mirror cho NB colors + KPI + shadows. Cursor verify-first mỗi commit grep `--color-X` trong `@theme inline` block + `:root .dark` block + 1 consumer test. |
| 5 | **Theme toggle UX edge cases SSR flash + system preference** | MEDIUM | `app/layout.tsx:113` inline script update support 3-option (light/dark/system) honor `next-themes` storage. `enableSystem={false}` `theme-provider.tsx:153` flip → `enableSystem={true}` để system preference detect work. SSR flash mitigate qua `suppressHydrationWarning` đã có line 109 + `disableTransitionOnChange` đã có line 155. |

### R2. Effort estimate per commit (LOC + minutes)

| Commit | Description | LOC delta estimate | Time estimate |
|---|---|---|---|
| **1** | Plan doc (this task) | +400 LOC plan file | ~45 phút (DONE this session) |
| **2** | Brand foundation 10 tokens `.dark` override + 15 NB colors LITERAL→REFERENCE refactor `@theme inline` | `globals.css` ~+30/-15 LOC (10 dark overrides + 15 reference rewrites) | ~30 phút |
| **3** | Composite shadows 13 tokens LITERAL→REFERENCE refactor `@theme inline` Q6 γ | `globals.css` ~+15/-13 LOC | ~25 phút |
| **4** | KPI 8 tokens + Score 4 tokens + KPI-strong 2 tokens `.dark` override + KPI 10 tokens LITERAL→REFERENCE refactor | `globals.css` ~+25/-10 LOC | ~35 phút |
| **5** | 6 Pastel `.dark` mute Q5 α | `globals.css` ~+8 LOC | ~30 phút (verify V2 18 files visual A/B at end) |
| **6** | Toggle UI fix `layout.tsx:113` script update + `theme-provider.tsx` `enableSystem={true}` + dedicated `useThemeCache` hook wire `clearTokenCache` Q7 α + header.tsx 3-option dropdown (Sun/Moon/System) | `layout.tsx` ~+15/-3 LOC + `theme-provider.tsx` ~+1/-1 LOC + new hook file ~+25 LOC + `header.tsx` ~+20/-5 LOC | ~50 phút |
| **7** | Smoke 8 cases Phase A + close-out HANDOFF §16 + §17 + §18 + plans/M-Design-Dark-1-plan.md mark complete | HANDOFF ~+200 LOC delta + plan doc ~+50 LOC | ~60 phút |

**Total LOC delta**: ~+340/-50 across 4-5 files (`globals.css`, `layout.tsx`, `theme-provider.tsx`, `header.tsx`, new `theme-cache-bridge.tsx`, `HANDOFF.md`).

**Total time estimate**: ~3h45min - 4h30min (excluding plan doc Task 1). With buffer + smoke test iteration ~5-6h. Within Q1 γ FULL ~6-8h budget.

### R3. Phase boundary recommendation final

**Default: Q8 α 7 commits 1 session** với γ session split fallback ready.

**Trigger threshold pivot γ session split**:
- Cursor verify-first Commit 5 phát hiện >25 pastel consumer files (V2 prose claim 19, em verify 18 — buffer 7 files) → bump split.
- Cursor coding pace <1.5 commit/h sau Commit 3 milestone (~2.5h elapsed) → signal scope vs time mismatch.
- HOẶC Vũ Hải decide batch quality > completion speed sau Commit 4 review.

**Session 1 boundary nếu split** (M-Design-Dark-1a): Commits 1-4 (plan + foundation + composite + KPI/Score). Foundation locked → user toggle DevTools sees inverted brutalism canvas + KPI cards correct, 6 Pastel still light (acceptable interim — pastel cards minor visual regression).

**Session 2 boundary nếu split** (M-Design-Dark-1b): Commits 5-7 (Pastel + toggle UI + smoke 8 cases). Cleanup interim regression + ship complete dark mode reachable end-user.

---

## Section 5 — Implementation prompt outline (Commit 2-7 headlines)

> Em sẽ build atomic prompts Commit 2-7 SAU khi Vũ Hải confirm Q4-Q8. Outline dưới chỉ headline scope per commit, KHÔNG full prompt.

### Commit 2 — Brand foundation `.dark` override + NB colors LITERAL→REFERENCE refactor

**Files touched**: `app/globals.css` only (~+30/-15 LOC).

**Scope**:
- Add `:root .dark { --ink: #FFFEF9; --bg: #1A1A1A; --bg-muted: #3a3939; --bg-paper: #3a3939; --bg-dark: #FFFEF9; --white: #1A1A1A; --text-2: #8A8787; --text-3: #A0A0A0; --brand: #E84947 (Q4 β); --brand-dark: #C73937 (Q4 β parallel); }`
- Refactor `@theme inline` lines 47-61 (15 NB color tokens) LITERAL → REFERENCE: `--color-ink: var(--ink);` etc.
- Verify: `npm run build` PASS, Tailwind class `text-bg-warm` + `bg-accent-brand` resolve runtime light mode hex equivalent.

### Commit 3 — Composite shadows LITERAL→REFERENCE refactor (Q6 γ)

**Files touched**: `app/globals.css` only (~+15/-13 LOC).

**Scope**:
- Refactor `@theme inline` lines 83-95 (13 shadow tokens) LITERAL → REFERENCE: `--shadow-brutal-md: 6px 6px 0 var(--ink);` etc.
- Colored shadows reference accent vars: `--shadow-brutal-yellow: 6px 6px 0 var(--accent-yellow);`
- Verify: V3 21 consumer files visual sample 3 (HoshinCard + GembaBanner + dialog) build clean.

### Commit 4 — KPI + Score + KPI-strong `.dark` override + KPI LITERAL→REFERENCE

**Files touched**: `app/globals.css` only (~+25/-10 LOC).

**Scope**:
- Add `:root .dark { --kpi-healthy: #3D4530 (lime mute); --kpi-attention: #4A4530 (yellow mute); --kpi-warning: #4A3839 (pink mute); --kpi-critical: var(--brand) inherit Q4; --kpi-{*}-fg: var(--ink) cascade; --kpi-healthy-strong: #22C55E (lighten 1 step); --kpi-attention-strong: #F59E0B (lighten 1 step); }`
- Add `:root .dark { --score-critical: var(--brand) inherit; --score-weak: #F59E0B; --score-fair: #3B82F6; --score-good: #22C55E; }` (saturated brighter cho dark contrast)
- Refactor `@theme inline` lines 63-73 (10 KPI tokens) LITERAL → REFERENCE
- Verify: KpiCard 3-tier + KpiSparkline + xray-history chart visual sample.

### Commit 5 — 6 Pastel `.dark` mute (Q5 α)

**Files touched**: `app/globals.css` only (~+8 LOC).

**Scope**:
- Add `:root .dark { --accent-yellow: #4A4530; --accent-cyan: #2E4644; --accent-lime: #3D4530; --accent-pink: #4A3839; --accent-peach: #4A3D2E; --accent-lavender: #3D364A; }`
- Pastel `@theme inline` lines 56-61 đã refactor REFERENCE form Commit 2 → auto-flip OK.
- Verify-first GREP V2 18 files (HANDOFF prose 19, em verify 18) — **TRIGGER γ split nếu >25 files**.
- Visual sample 3 files (HeroNB + AnnualReviewCard + GembaCommentThread).

### Commit 6 — Toggle UI fix + clearTokenCache wire (Q7 α)

**Files touched**: `app/layout.tsx`, `components/providers/theme-provider.tsx`, NEW `components/providers/theme-cache-bridge.tsx`, `components/layout/header.tsx` (~+60/-10 LOC).

**Scope**:
- `app/layout.tsx:113` inline script update support 3-option (light/dark/system) honor `next-themes` storage:
  ```js
  var k="hoshin-theme-v2";var t=localStorage.getItem(k);
  var theme=t||"light";
  var resolved = theme === "system" ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light") : theme;
  document.documentElement.classList.add(resolved);
  document.documentElement.setAttribute("data-theme", resolved);
  ```
- `theme-provider.tsx:153` `enableSystem={false}` → `enableSystem={true}`.
- NEW `theme-cache-bridge.tsx` — useEffect listen `useTheme().resolvedTheme` change → `clearTokenCache()`.
- `header.tsx:99` toggle button → DropdownMenu 3-option (Sun/Moon/System icons).
- Verify: localStorage `hoshin-theme-v2` write `dark` → reload page → dark mode persist (NOT reset light).

### Commit 7 — Smoke 8 cases Phase A + close-out HANDOFF

**Files touched**: `HANDOFF.md` (~+200 LOC), `plans/M-Design-Dark-1-plan.md` (~+50 LOC).

**Scope**:
- 8 smoke cases (visual screenshot Vũ Hải compare Light vs Dark side-by-side):
  1. **KpiCard 3-tier dashboard `/dashboard/kpi`** — healthy lime mute + attention yellow mute + warning pink mute, text contrast AA pass
  2. **KpiSparkline saturated lines** — strong tokens lighten 1 step visible trên dark card
  3. **Score xray-history chart `/dashboard/discovery/xray-history`** — score tier text + ReferenceLine stroke saturated brighter dark
  4. **Sidebar collapsed/expanded** — invert brutalism background + brand red CTA preserved
  5. **Header dropdown user menu + theme toggle** — dropdown bg neutral dark + Sun/Moon icons swap correctly
  6. **Modal HoshinEditModal hoặc GembaModal** — dark bg + light text + brand red border + colored shadow reference auto-flip
  7. **Landing page hero `/`** — pastel cards mute dark + sticker overlap visible
  8. **Annual Review banner + Hansei banner dashboard top** — yellow mute bg + ink white text + brand red shadow
- HANDOFF §16 add M-Design-Dark-1 entry với 7 commits + Q4-Q8 lock + smoke 8 cases evidence
- HANDOFF §17 add architecture decision 2026-MM-DD M-Design-Dark-1 (Q4 β brand brighten + Q5 α pastel mute + Q6 γ shadows REFERENCE + Q7 α useEffect + Q8 α/γ phase split)
- HANDOFF §18 mark M-Design-Dark-1 SHIPPED + remove from candidates list
- plans/M-Design-Dark-1-plan.md mark Section 5 complete + add post-ship verification log

---

## Section 6 — Verification log (post-ship, fill at Commit 7)

**Smoke 8 cases Phase A results** (table to fill):

| Case | Description | Light | Dark | Result |
|---|---|---|---|---|
| 1 | KpiCard 3-tier `/dashboard/kpi` | screenshot | screenshot | TBD |
| 2 | KpiSparkline | screenshot | screenshot | TBD |
| ... | ... | ... | ... | ... |

**Production verify** (post-deploy commit 7):
- Vercel deploy ID + state
- Build logs clean (0 error/warning)
- Runtime logs window post-deploy (alias propagation L41 reinforced)
- Smoke 3 routes production curl (chienluoc.org / + /dashboard + /dashboard/kpi)

**Pattern lessons emerged** (fill at close-out):
- L52 NEW (potential) — LITERAL → REFERENCE refactor pattern cho `@theme inline` dark-aware single source of truth
- L48 reinforced lần 9 — Foundation completion check 3 layers (`:root` defined + `:root .dark` overridden + `@theme inline` REFERENCE form)
- L42 reinforced lần 7 (potential) — Phase A 8 cases visual smoke sufficient cho dark mode foundation milestone

---

**END Plan Doc Task 1.** Đợi Vũ Hải review Q4-Q8 + confirm path α default hoặc γ fallback. Em build Commit 2-7 atomic prompts SAU khi anh decide.
