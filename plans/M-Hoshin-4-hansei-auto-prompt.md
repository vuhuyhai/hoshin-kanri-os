# M-Hoshin-4 — Hansei Auto-prompt khi KPI red 2+ tuần

> **Status**: Planning — Task 1 design lock
> **Started**: 2026-04-29
> **Depends on**: M-Hoshin-3 (Annual Review Workflow) ✅ shipped 2026-04-29

## Mục tiêu

Khi KPI có 2+ tuần liên tiếp < 70% target → auto-prompt user nhập mini-hansei reflection (2 fields: why_red + next_action). Build trên top M-Hoshin-3 infrastructure (kpi_actuals + A3 patterns proven).

Đóng góp vào PDCA loop của Hoshin Kanri:
- M-Hoshin-3 closed annual PDCA (year-end review)
- M-Hoshin-4 closes weekly PDCA (red streak intervention)
- Toyota gemba philosophy: hansei = intentional reflection on failure, not checklist routine

## 6 Locked Decisions

### Q1 — Schema: Table mới `weekly_hansei`

Tạo bảng riêng thay vì extend `kpi_entries` hoặc reuse `annual_reviews`.

**Schema dự kiến**:
- `id` uuid primary key
- `org_id` uuid FK organizations
- `kpi_id` uuid FK kpis
- `week_start` date (Monday của tuần phát hiện streak)
- `streak_weeks` int (số tuần liên tiếp đỏ tại thời điểm hansei)
- `why_red` text not null (Tại sao đỏ?)
- `next_action` text not null (Làm gì khác?)
- `created_by` uuid FK users
- `created_at` timestamptz default now()
- UNIQUE(kpi_id, week_start) — idempotent upsert per streak

**RLS policies**:
- SELECT: all org members
- INSERT/UPDATE/DELETE: CEO + Manager (WRITE_ROLES)

**Rationale**:
- Clean separation: `kpi_entries` raw tracking, `weekly_hansei` reflection layer
- Pattern proven: M-Hoshin-2 `xmatrix_correlations`, M-Hoshin-3 `kpi_actuals` đều tách table
- `annual_reviews` scope khác (year-end, A3 4-field) — reuse tạo conditional logic phức tạp

### Q2 — Detection: Query realtime mỗi load `/dashboard/kpi`

Query Postgres trực tiếp khi user vào KPI tracker.

**Logic**:
- Lấy 14 ngày gần nhất kpi_entries per KPI
- Group theo tuần (Monday-Sunday)
- Tính avg value/tuần (hoặc last value/tuần — TBD ở Task 2)
- Compare với target: < 70% = red week
- Identify KPIs có 2+ red weeks consecutive

**Rationale**:
- Solo dev, không infra cron/materialized view
- KPI tracker không high-traffic (CEO check 1-2 lần/ngày)
- Future scale: migrate materialized view khi user > 100

### Q3 — UX: Banner top + click expand inline form

Pattern y M-Hoshin-3 `AnnualReviewBanner` trên `/dashboard`.

**UX flow**:
1. User vào `/dashboard/kpi` → banner top "Có N KPIs đỏ 2+ tuần — click để hansei"
2. User click → expand inline form per KPI red (NOT modal popup)
3. Form 2 fields why_red + next_action
4. Save → banner update count, KPI đó banner-hidden cho đến khi streak break/extend

**Rationale**:
- Banner pattern proven, user familiar
- KHÔNG block UX (modal popup force nhập)
- KHÔNG inline cạnh mỗi KPI card (clutter tracker)

### Q4 — Structure: 2 fields minimal

`why_red` + `next_action` — match Toyota mini-A3 pattern cho daily/weekly gemba.

**Field validation**:
- Min length: 30 chars mỗi field (đủ để force suy nghĩ, không quá ngặt)
- Max length: 1000 chars (paragraph-level reflection, không novel)

**Rationale**:
- Weekly cadence != Annual review, friction thấp critical cho adoption
- Full A3 4-field là moment cho annual review, không phải weekly
- Upgrade 3-field nếu data baseline cho thấy 2-field không đủ

### Q5 — AI: Defer M-Hoshin-5

Ship manual hansei trước, AI assist add sau.

**Rationale**:
- Ship manual → có data baseline để biết user struggle ở đâu
- AI cost risk: 12 routes hiện không có per-user rate limit (P0.1 pending)
- M-Hoshin-2 coach-correlation pattern dành cho strong link, không match weekly failure analysis context
- Pattern: ship Plan/Do/Check trước, Act phase optimize sau

### Q6 — Frequency: 1 lần/streak với re-prompt nếu extend

KPI đỏ 2 tuần → prompt lần 1. User hansei → banner ẩn. Logic:
- Streak break (1 tuần ≥ 70%) → reset, banner reset cho streak mới
- Streak extend sang tuần thứ 4 (2 tuần sau lần hansei trước) → prompt lại "Đã hansei tuần trước, cập nhật?"

**Implementation note**:
- Track `last_hansei_week` per KPI qua query MAX(week_start) FROM weekly_hansei WHERE kpi_id = ?
- Show banner khi streak_weeks >= 2 AND (last_hansei_week IS NULL OR streak_weeks - weeks_since_last_hansei >= 2)

**Rationale**:
- Weekly Monday prompt: annoying nếu user dismiss
- Mỗi load prompt: aggressive, user sẽ ignore
- Streak-based: intentional reflection, match Toyota philosophy

## Tasks Roadmap

### Task 1 — Design lock ✅ (this file)
1 commit: `docs: M-Hoshin-4 plan with 6 locked decisions`

### Task 2 — Migration + types
1. Create `supabase/migrations/032_weekly_hansei.sql`
2. Update `lib/supabase/types.ts` với weekly_hansei Row/Insert/Update
3. Apply migration qua dashboard hoặc `node scripts/apply-migration.mjs 032_weekly_hansei.sql`
4. Verify schema bằng SQL query
1 commit: `feat(db): add weekly_hansei migration + types`

### Task 3 — Detection logic + queries
1. Create `lib/hansei/queries.ts`:
   - `getRedStreaks(supabase, orgId)` — return KPIs có streak ≥ 2 weeks
   - `getKpiHanseiHistory(supabase, kpiId)` — list past hansei entries
   - `shouldPromptHansei(streakWeeks, lastHanseiWeek)` — boolean logic Q6
2. Create `lib/hansei/types.ts`:
   - RedStreakKpi type (kpi + streak_weeks + last_hansei_week + should_prompt)
   - HanseiEntry type (mirror table row)
3. Create `lib/hansei/schema.ts`:
   - Zod schema cho POST /api/hansei/create
1 commit: `feat(hansei): add detection queries + types + schema`

### Task 4 — API routes
1. POST `/api/hansei/create` — Zod parseBody, requireOrgRole WRITE_ROLES, idempotent upsert UNIQUE(kpi_id, week_start), rate-limit
2. GET `/api/hansei/list?kpi_id=` — list history per KPI
1 commit: `feat(api): hansei create + list endpoints`

### Task 5 — UI Banner + Inline Form
1. Component `components/hansei/HanseiBanner.tsx` — banner pattern y AnnualReviewBanner
2. Component `components/hansei/HanseiForm.tsx` — 2-field inline form, auto-save 2s debounce
3. Component `components/hansei/HanseiHistoryList.tsx` — past hansei view
4. Wire vào `app/dashboard/kpi/page.tsx`
1 commit: `feat(hansei): banner + inline form UI`

### Task 6 — Smoke test + handoff update
1. Smoke test 5 cases:
   - KPI 1 tuần đỏ → no banner
   - KPI 2 tuần đỏ → banner show
   - User hansei → banner hide
   - KPI break streak → banner reset
   - KPI extend streak 4 tuần → re-prompt
2. Update HANDOFF.md sections 16, 17, 18
1 commit: `docs: update handoff after M-Hoshin-4`

## Constraints (từ pattern lessons HANDOFF §16)

**M-Hoshin-3 lessons cần tôn trọng**:

1. **vision_json kpi.id regenerate on save** (#2): KHÔNG dùng vision_json kpi.id làm join key. Luôn dùng `kpi.name` hoặc `kpis.id` (table) làm reference. Hansei link `kpi_id` qua FK `kpis.id` (table), không phải vision_json.

2. **Migration 015 UNIQUE active per org** (#3): KHÔNG ảnh hưởng M-Hoshin-4 (không tạo x_matrices). Nhưng nếu cần query kpis của active matrix → archive logic không reach.

3. **SQL paste-prose pollution** (#6): Khi viết SQL trong commit messages hoặc handoff updates, TÁCH prose hướng dẫn ra ngoài code blocks. Code blocks pure paste-able SQL.

4. **Multi-org dev environment confusion** (#1): Khi smoke test, ALWAYS verify `auth.uid()` + `org_members.org_id` trước. Tránh debug RLS khi root cause là wrong org login.

5. **Test data limitations** (#5): KPIs trong vision_json phải match names với `kpis` table. Khi seed test data manual, align names.

**Cross-milestone constraints**:

6. **AI cost protection P0.1 pending**: M-Hoshin-4 KHÔNG add AI route mới (Q5 defer). Nếu future M-Hoshin-5 add AI sensei → MUST wire rate-limit helper từ commit `a8d5e58` (pattern: createRateLimitHelper bucket='hansei').

7. **NB v3.2 design tokens**: Banner + form UI MUST dùng tokens (var(--brand), var(--accent-yellow), var(--shadow-md), var(--ease-nb)). KHÔNG hardcode hex. KHÔNG inline Tailwind arbitrary value.

8. **Mobile responsive**: Banner + form MUST render mobile (NOT hidden md:block pattern). Pitfall #14 HANDOFF §10.

## Blockers / Open Questions

- **Q2 detection — avg vs last value/tuần**: TBD ở Task 3. Recommend `last value` (status cuối tuần) thay vì avg (averaged out misses signal).
- **Q4 min length 30 chars**: tentative. Adjust nếu user feedback "too restrictive" sau ship.
- **Q6 implementation complexity**: track `last_hansei_week` qua query MAX() — performance OK với index trên (kpi_id, week_start).

## Success Metrics (sau ship)

- 80% KPIs red 2+ tuần có hansei entry trong 7 ngày
- Avg time fill form < 2 phút
- 0 false positive (banner show khi KPI không thật sự red)
- 0 N+1 query trên `/dashboard/kpi` page load

---

**End of plan. Task 1 lock ✅. Sang Task 2 migration.**
