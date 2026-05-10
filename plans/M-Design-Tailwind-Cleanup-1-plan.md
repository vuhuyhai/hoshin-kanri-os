# M-Design-Tailwind-Cleanup-1 — Plan

## Goal
Replace Tailwind utility classes (raw palette `bg-green-100`, `text-red-600`, etc.) trong KpiCard.tsx + discovery hub bằng KPI tokens (M-Design-3a foundation) hoặc shadcn semantic tokens. Unblock M-Design-Dark-1 (consumer ready).

## Verify-First Audit (V1-V5)
- V1 KpiCard.tsx: 26 instances, 100% KPI status semantic, zero ambiguity
- V2 discovery/page.tsx: 34 instances, 0 KPI leakage, ~22 generic chrome + ~7 brand CTA + 1 UNKNOWN (L280 progress bar)
- V3 tangential files: ~28 files (DEFER milestone riêng M-Design-Tangential-Cleanup-1)
- V4 KPI/score tokens: 14/14 tồn tại trong `:root`, **NHƯNG `@theme inline` chỉ mirror 8/14** (xem Q7)
- V5 shadcn tokens: precedent có sẵn (5+ files dùng `bg-destructive`, `text-muted-foreground`)

## 7 Decisions locked Q1-Q7

### Q1 — Replacement strategy: β Tailwind v4 class generation
- Pattern: `className="bg-kpi-healthy text-kpi-healthy-fg"` thay vì inline style
- Rationale: M-Design-3a đã ship `@theme inline --color-kpi-*` foundation, drop-in replace LIGHT_CONFIG object
- Verify: build success post-refactor (Tailwind v4 emit on-demand, pitfall #19)

### Q2 — Scope boundary: α MVP only (KpiCard + discovery hub)
- 2 files / 60 instances, ~3h budget fit
- V3 tangential ~28 files defer M-Design-Tangential-Cleanup-1

### Q3 — Dark mode: A strip dark:* raw
- Remove `dark:bg-green-950` etc. từ class config
- Defer M-Design-Dark-1 ship `.dark` block KPI tokens centralized
- Note: dashboard partial dark mode hiện có, strip = visible regression cho dark mode user — acceptable trade-off cho beta SaaS solo dev

### Q4 — Discovery hub gray chrome handling: mixed
- Generic chrome (~22): migrate sang shadcn tokens (`border-border`, `text-muted-foreground`, `bg-background`)
- Brand CTA (~7): migrate sang `bg-ink text-bg hover:bg-ink/90` (NB v3.2 token)
- L280 progress bar (UNKNOWN): C `bg-brand` (semantic fix — visual feedback đỏ thương hiệu)

### Q5 — Smoke test: α Phase A 4 cases
1. KpiCard 3 status colors render đúng dashboard `/dashboard/kpi`
2. Discovery hub gray chrome + CTA + progress bar render đúng `/dashboard/discovery`
3. Build clean: `npm run typecheck` + `npm run build` PASS
4. Phase B Cursor self-verify SKIPPED (L42 partial coverage pattern)

### Q6 — Effort: ~2.5h, LOW risk
- Task 1 plan: DONE
- Task 2A KpiCard refactor + @theme mirror: ~30 phút (mechanical 1:1 mapping + 2-line CSS edit)
- Task 2B Discovery hub refactor: ~45 phút (3 sub-categories: chrome + CTA + progress)
- Task 3 Phase A smoke test: ~30 phút
- Task 4 Close-out: ~30 phút
- 3 commits target

### Q7 — `-strong` token gap resolution: A Mirror vào @theme (BLOCKER discovered verify-first)
- Problem: `@theme inline` chỉ có 8 KPI tokens, MISSING `--color-kpi-healthy-strong` + `--color-kpi-attention-strong`
- Tailwind v4 emit utility classes từ `@theme` keys → utility nào không có corresponding `--color-*` trong `@theme` sẽ KHÔNG generate
- Fix: Add 2 lines vào `@theme` block (L63-71 area):
  ```css
  --color-kpi-healthy-strong: #16A34A;
  --color-kpi-attention-strong: #D97706;
  ```
- Bundle vào Task 2A commit (cùng KpiCard refactor)
- Future-proof: unblock bất kỳ consumer nào cần saturated KPI strokes/dots/text
- Score tokens (`--color-score-*`) defer — không có consumer trong scope V1+V2

## Token mapping table (for refactor reference)

### KpiCard.tsx (26 instances)
| Tailwind class | Replacement |
|---|---|
| bg-green-100 | bg-kpi-healthy |
| text-green-700 | text-kpi-healthy-fg |
| dark:bg-green-950 | (strip) |
| dark:text-green-300 | (strip) |
| border-green-200 | border-kpi-healthy |
| bg-green-500 | bg-kpi-healthy-strong |
| text-green-600 | text-kpi-healthy-strong |
| dark:text-green-400 | (strip) |
| bg-yellow-100 | bg-kpi-attention |
| text-yellow-700 | text-kpi-attention-fg |
| dark:bg-yellow-950 | (strip) |
| dark:text-yellow-300 | (strip) |
| border-yellow-200 | border-kpi-attention |
| bg-yellow-500 | bg-kpi-attention-strong |
| text-yellow-600 | text-kpi-attention-strong |
| dark:text-yellow-400 | (strip) |
| bg-red-100 | bg-kpi-warning |
| text-red-700 | text-kpi-warning-fg |
| dark:bg-red-950 | (strip) |
| dark:text-red-300 | (strip) |
| border-red-200 | border-kpi-warning |
| bg-red-500 | bg-destructive |
| text-red-600 | text-destructive |
| dark:text-red-400 | (strip) |
| dark:border-red-900 | (strip) |

Note: KpiCard "red" semantic là CRITICAL state (< 70% target), map sang `--kpi-warning` (pastel pink card bg) + `--destructive` (saturated red text/dot). KHÔNG dùng `--kpi-critical` (= `--brand`) vì critical reserve cho system-blocking errors (L43 4-layer defense pattern). 3-tier KpiCard preserved (M-Design-3b decision lock).

### discovery/page.tsx (34 instances)
| Tailwind class | Replacement |
|---|---|
| border-gray-200 | border-border |
| hover:border-gray-400 | hover:border-foreground |
| border-gray-300 | border-border |
| text-gray-600 | text-muted-foreground |
| bg-white | bg-background |
| hover:bg-gray-50 | hover:bg-muted |
| border-gray-400 | border-foreground |
| bg-gray-900 | bg-ink |
| text-white | text-bg |
| hover:bg-gray-700 | hover:bg-ink/90 |
| text-gray-900 | text-foreground |
| bg-gray-200 | bg-muted |
| bg-gray-800 (L280) | bg-brand (Q4 C semantic fix) |
| text-gray-300 | text-muted-foreground/50 |
| text-gray-400 | text-muted-foreground |

Note: Task 2B sẽ verify-first lại discovery mapping vì `text-bg` / `bg-brand` chưa confirm có trong `@theme` (Q7 chỉ resolve KPI scope). Sẽ surface tương tự nếu thiếu.

## Pattern lessons anticipate
- L48 NEW (anticipate): Tailwind v4 `@theme inline` class generation requires consumer reference (foundation alone không trigger). Verify post-refactor via build success, NOT grep compiled CSS. Pitfall #19 reinforced.
- L49 NEW (Q7): Foundation milestones (M-Design-3a) must mirror `:root` ↔ `@theme` 1:1, KHÔNG partial mirror. Partial = invisible time-bomb cho consumer. M-Design-3a missed `-strong` mirror — caught verify-first ở consumer milestone, fix retroactive.
- L42 reinforced lần 3: Phase A visual coverage acceptable, Phase B self-verify defer cho design refactor (no business logic touch).

## Constraints cho future AI sessions
- KHÔNG re-introduce raw Tailwind palette classes (bg-green-100, text-red-600, etc.) trong KpiCard hoặc discovery hub. Pattern: KPI tokens hoặc shadcn tokens.
- KHÔNG add `dark:*` variants trong scope này — defer M-Design-Dark-1 ship `.dark` block centralized.
- KHÔNG modify KpiCard 3-tier logic (< 70% / 70-90% / ≥ 90%) — M-Design-3b decision lock.
- KHI add UI mới có status colors (KPI, score, alert, badge), MUST consume KPI tokens hoặc shadcn tokens, KHÔNG raw Tailwind palette.
- KHI add KPI/score token mới vào `:root`, MUST mirror sync vào `@theme inline` block (L49 lesson).
