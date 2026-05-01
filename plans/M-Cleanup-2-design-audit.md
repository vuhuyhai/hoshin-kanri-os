# M-Cleanup-2 — Design Audit

> **Mục tiêu**: Cleanup 9 duplicate "Ladysfit" orgs trong DB (data pollution from testing sessions).
>
> **Driving need**: Pattern lesson M-Hoshin-3 #1 + M-Hoshin-6.1 L1 — `name ILIKE '%ladysfit%' LIMIT 1` anti-pattern đã hit **2 sessions diagnose** (~30 phút M-Hoshin-3 + ~1h M-Hoshin-6.1). Nếu không cleanup, debug session tiếp theo có thể consume thêm 30-60 phút identity confusion.
>
> **Status**: TASK 1 — DESIGN AUDIT ONLY. KHÔNG cleanup. KHÔNG modify DB. Output là plan file này.
>
> **Created**: 2026-04-30
> **Owner**: Vũ Hải (solo dev)

---

## A. Discovery queries

> ⚠️ **Anh chạy 4 queries này trong Supabase Dashboard → SQL Editor và paste output vào placeholder bên dưới.** Em không có direct DB access. Sau khi anh paste output, em refine section B-C dựa trên data thật.

### A1. List 9 Ladysfit orgs (basic info)

```sql
SELECT id, name, created_at, plan_tier, headcount, industry, city
FROM organizations
WHERE name ILIKE '%ladysfit%'
ORDER BY created_at ASC;
```

**Output**: `[PASTE OUTPUT HERE — expected 9 rows]`

```
| id | name | created_at | plan_tier | headcount | industry | city |
|----|------|------------|-----------|-----------|----------|------|
|    |      |            |           |           |          |      |
```

---

### A2. FK impact map per org

```sql
SELECT
  o.id,
  o.name,
  o.created_at,
  (SELECT COUNT(*) FROM org_members WHERE org_id = o.id) AS members,
  (SELECT COUNT(*) FROM x_matrices WHERE org_id = o.id) AS xmatrices,
  (SELECT COUNT(*) FROM x_matrices WHERE org_id = o.id AND status='active') AS xmatrices_active,
  (SELECT COUNT(*) FROM kpis WHERE org_id = o.id) AS kpis,
  (SELECT COUNT(*) FROM kpis WHERE org_id = o.id AND is_active=true) AS kpis_active,
  (SELECT COUNT(*) FROM kpi_entries ke JOIN kpis k ON ke.kpi_id = k.id WHERE k.org_id = o.id) AS kpi_entries,
  (SELECT COUNT(*) FROM swot_analyses WHERE org_id = o.id) AS swot,
  (SELECT COUNT(*) FROM gemba_comments WHERE org_id = o.id) AS gemba,
  (SELECT COUNT(*) FROM weekly_hansei WHERE org_id = o.id) AS hansei,
  (SELECT COUNT(*) FROM annual_reviews WHERE org_id = o.id) AS annual_reviews,
  (SELECT COUNT(*) FROM xmatrix_correlations WHERE org_id = o.id) AS correlations,
  (SELECT COUNT(*) FROM xray_results WHERE org_id = o.id) AS xray_results
FROM organizations o
WHERE o.name ILIKE '%ladysfit%'
ORDER BY o.created_at ASC;
```

**Output**: `[PASTE OUTPUT HERE]`

```
| id | name | created_at | members | xmatrices | xmatrices_active | kpis | kpis_active | kpi_entries | swot | gemba | hansei | annual_reviews | correlations | xray_results |
```

> 💡 **Lưu ý**: Query A2 chưa cover toàn bộ FK refs. Nếu anh chọn Option A (hard delete) → cần extend query thêm: `swot_factors`, `tows_strategies`, `kpi_actuals`, `carry_overs`, `discovery_sessions`, `subscriptions`, `admin_notes`, `notification_logs`. Em sẽ list extended query khi anh decide Option A.

---

### A3. Members + emails per org (identify CANONICAL)

```sql
SELECT
  o.id AS org_id,
  o.name AS org_name,
  o.created_at AS org_created,
  om.role,
  om.user_id,
  u.email,
  u.created_at AS user_created
FROM organizations o
LEFT JOIN org_members om ON om.org_id = o.id
LEFT JOIN auth.users u ON u.id = om.user_id
WHERE o.name ILIKE '%ladysfit%'
ORDER BY o.created_at ASC, om.role ASC;
```

**Output**: `[PASTE OUTPUT HERE]`

```
| org_id | org_name | org_created | role | user_id | email | user_created |
```

---

### A4. Identify CANONICAL org

**Criteria**:
- Có member `email='<owner-email>'` với `role='CEO'`
- Nhiều related rows nhất (xmatrices_active=1, kpis_active>0, gemba>0, hansei>0)
- Created_at lớn nhất hoặc nhỏ nhất tùy data thật (Vũ Hải xác nhận từ DB)

**CANONICAL org_id**: `[FILL UUID HERE — sau khi anh paste A2 + A3 output]`

**8 DUPLICATE org_ids** (cần cleanup):
- `[UUID 1]` — `[counts summary]`
- `[UUID 2]` — `[counts summary]`
- ...

---

## B. Cleanup strategy options

### B1. Option A — HARD DELETE 8 duplicate orgs

**Approach**:
```sql
DELETE FROM organizations
WHERE name ILIKE '%ladysfit%'
  AND id != '<canonical_uuid>';
-- FK CASCADE sẽ xóa toàn bộ org_members, x_matrices, kpis, swot_*, gemba_*, hansei, annual_reviews, correlations, xray_results, ...
```

**Pros**:
- Clean DB hoàn toàn
- Query `name ILIKE '%ladysfit%' LIMIT 1` deterministic (chỉ 1 org match)
- Không pollute future debugging
- Effort: 1 query

**Cons**:
- Mất audit trail vĩnh viễn
- FK CASCADE 8 orgs × ~14 tables = mất hết test data history
- Không reversible nếu sai org chosen làm canonical
- Risk: nếu 1 duplicate có data thật user khác (không phải Vũ Hải) → mất vĩnh viễn

**Reversibility**: ❌ chỉ qua DB backup restore (Supabase dashboard)

---

### B2. Option B — SOFT DEACTIVATE qua flag column

**Approach**:
```sql
-- Migration mới (034_org_soft_delete.sql):
ALTER TABLE organizations ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at) WHERE deleted_at IS NOT NULL;

-- Cleanup:
UPDATE organizations SET deleted_at = NOW()
WHERE name ILIKE '%ladysfit%' AND id != '<canonical_uuid>';
```

**Pros**:
- 100% reversible (`UPDATE ... SET deleted_at = NULL`)
- Audit trail preserved hoàn toàn
- Không touch FK refs (data history intact)

**Cons**:
- Schema change ripple — phải update **mọi query** `name ILIKE` filter `deleted_at IS NULL`
- Pattern không có precedent trong repo (chưa có table nào dùng soft delete flag)
- Risk: dev quên filter → "deleted" orgs vẫn xuất hiện trong UI/admin panels
- Effort: 1 migration + audit toàn bộ org queries (potentially > 20 sites)

**Reversibility**: ✅ trivial

---

### B3. Option C — RENAME duplicates + transfer members

**Approach**:
```sql
-- Step 1: Transfer Vũ Hải membership từ duplicates sang canonical (UPSERT, dedupe role)
INSERT INTO org_members (org_id, user_id, role, created_at)
SELECT '<canonical_uuid>', om.user_id, om.role, MIN(om.created_at)
FROM org_members om
JOIN organizations o ON o.id = om.org_id
WHERE o.name ILIKE '%ladysfit%' AND o.id != '<canonical_uuid>'
GROUP BY om.user_id, om.role
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Step 2: Rename duplicates
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
  FROM organizations
  WHERE name ILIKE '%ladysfit%' AND id != '<canonical_uuid>'
)
UPDATE organizations
SET name = '[ARCHIVED 2026-04-30 #' || duplicates.rn || '] Ladysfit'
FROM duplicates
WHERE organizations.id = duplicates.id;
```

**Pros**:
- Minimal destructive — không xóa rows nào
- Audit trail full preserved
- Easy recover nếu sai (rename ngược)
- 8 orgs renamed dễ filter qua prefix `[ARCHIVED`

**Cons**:
- Vẫn có 8 rows ô nhiễm trong table
- `name ILIKE '%ladysfit%'` vẫn match (anti-pattern không kill triệt để — vẫn cần thêm filter)
- Future query phải nhớ exclude `name NOT ILIKE '[ARCHIVED%'`

**Reversibility**: ✅ rename ngược trivial

---

### B4. Option D — HYBRID: HARD DELETE zero-data + RENAME remaining

**Approach**:
```sql
-- Step 1: Identify zero-data duplicates
WITH zero_data AS (
  SELECT o.id
  FROM organizations o
  WHERE o.name ILIKE '%ladysfit%'
    AND o.id != '<canonical_uuid>'
    AND NOT EXISTS (SELECT 1 FROM x_matrices WHERE org_id = o.id)
    AND NOT EXISTS (SELECT 1 FROM kpis WHERE org_id = o.id)
    AND NOT EXISTS (SELECT 1 FROM swot_analyses WHERE org_id = o.id)
    AND NOT EXISTS (SELECT 1 FROM gemba_comments WHERE org_id = o.id)
    AND NOT EXISTS (SELECT 1 FROM weekly_hansei WHERE org_id = o.id)
    AND NOT EXISTS (SELECT 1 FROM annual_reviews WHERE org_id = o.id)
    AND NOT EXISTS (SELECT 1 FROM xray_results WHERE org_id = o.id)
)
DELETE FROM organizations WHERE id IN (SELECT id FROM zero_data);
-- (FK CASCADE xóa org_members nếu có — orgs này đã verify zero data nên impact minimal)

-- Step 2: Rename remaining duplicates (có data) — Option C pattern
-- (chỉ run nếu vẫn còn > 1 row Ladysfit sau Step 1)
```

**Pros**:
- Balance safety + cleanliness
- Zero-data orgs an toàn xóa hẳn (không risk mất data thật)
- Orgs có data → rename preserve audit trail
- Effort: 2-3 SQL steps

**Cons**:
- 2-step phức tạp hơn Option A/C
- Vẫn có thể còn 1-2 rows renamed sau cleanup (không kill triệt để như Option A)

**Reversibility**:
- Step 1 (DELETE): ❌ chỉ qua backup restore
- Step 2 (RENAME): ✅ trivial

---

## C. Recommended approach + rationale

> ⚠️ **Tentative — adjust sau khi anh paste data A1-A4**. Recommendation hiện tại dựa trên assumption: canonical org có Vũ Hải CEO + most data, 8 duplicates phần lớn là test pollution với 0 hoặc minimal data.

### Recommendation: **Option D (HYBRID)**

**Rationale**:

1. **Audit trail**:
   - Mất gì: zero-data orgs (chỉ shell row + có thể vài org_members empty) — không có business value
   - Giữ gì: orgs có actual test data → rename preserve toàn bộ history

2. **Reversibility**:
   - Step 1 (DELETE zero-data): không reversible nhưng safe vì verified zero data
   - Step 2 (RENAME): trivial reverse — pattern proven (HANDOFF M-Cleanup-3 dùng ROW_NUMBER soft deactivate KPIs)

3. **Future debugging**:
   - Query `name ILIKE '%ladysfit%'` sau cleanup match: 1 canonical + 1-2 renamed `[ARCHIVED ...]`
   - Filter pattern: `WHERE name ILIKE '%ladysfit%' AND name NOT ILIKE '[ARCHIVED%'` → 1 row deterministic
   - **Anti-pattern killed**: code site nào dùng `name ILIKE` không filter ARCHIVED → 1 deterministic match thay vì 9 ambiguous

4. **Effort**: 2-3 SQL queries, không cần migration mới (vs Option B), không destructive toàn bộ (vs Option A)

### Pattern alignment với HANDOFF.md

HANDOFF §18 M-Cleanup-2 entry: *"cleanup giữ oldest org (FK CASCADE preserve audit trail) + transfer `org_members` của duplicates sang oldest + soft-deactivate phần còn lại"*

**Mismatch**: HANDOFF assume "oldest" = canonical. Realistic canonical có thể là **org có Vũ Hải CEO + most data**, không phải oldest. Em sẽ verify sau khi anh paste A3 output.

**Adjustment**: Canonical = org match cả 2 criteria (Vũ Hải CEO + most data). Nếu oldest org match cả 2 → keep oldest. Nếu không → keep org match criteria, rename oldest thành `[ARCHIVED]`.

### Alternative consideration

Nếu A2 output show **tất cả 8 duplicates đều có data significant** (vd > 5 KPIs hoặc > 1 x_matrix mỗi org) → consider Option C thuần (rename all 8) thay vì Option D hybrid. Lý do: hard delete data significant risk vĩnh viễn, không worth cho cleanup task.

Nếu A2 output show **8 duplicates đều zero data** → simplify thành Option A thuần (hard delete tất cả). Lý do: không có gì để preserve, Option D hybrid trở thành overkill.

**Decision tree**:
- 8 duplicates đều zero data → **Option A** (simplest)
- 8 duplicates đều có data significant → **Option C** (preserve all)
- Mixed (typical) → **Option D** (hybrid)

---

## D. Pre-execution verification checklist

Trước khi run SQL cleanup, MUST verify:

- [ ] **Backup DB snapshot**: Supabase Dashboard → Database → Backups → trigger manual backup. Confirm backup completed + timestamp recorded.
- [ ] **Confirm canonical org_id**: query `SELECT om.org_id, o.name FROM org_members om JOIN organizations o ON o.id=om.org_id JOIN auth.users u ON u.id=om.user_id WHERE u.email='<owner-email>' AND om.role='CEO' AND o.name ILIKE '%ladysfit%';`
- [ ] **Confirm 8 duplicate org_ids zero overlap với canonical**: list 8 UUIDs explicitly, verify canonical UUID NOT in list.
- [ ] **Dry-run COUNT queries**: capture before-numbers cho mỗi affected table:
  ```sql
  SELECT 'organizations' AS table_name, COUNT(*) AS count FROM organizations WHERE name ILIKE '%ladysfit%'
  UNION ALL
  SELECT 'org_members', COUNT(*) FROM org_members om JOIN organizations o ON o.id=om.org_id WHERE o.name ILIKE '%ladysfit%'
  UNION ALL
  -- ... cho mỗi table trong A2
  ;
  ```
- [ ] **Smoke test plan post-cleanup**:
  1. Login `<owner-email>` → `/dashboard` render bình thường
  2. `/dashboard/x-matrix/new` load canonical x_matrix active (M-Hoshin-2 smart route)
  3. `/dashboard/kpi` show Hansei banner nếu có streak (M-Hoshin-4)
  4. `/dashboard/kpi` show Gemba banner nếu có open comment (M-Hoshin-5)
  5. Canvas Hoshin badges show count đúng (M-Hoshin-6)
  6. Verify post-cleanup query: `SELECT name FROM organizations WHERE name ILIKE '%ladysfit%' AND name NOT ILIKE '[ARCHIVED%';` → đúng 1 row (canonical)
- [ ] **Rollback trigger conditions**: nếu smoke test bất kỳ bước nào fail → restore từ backup ngay lập tức (KHÔNG cố fix forward).

---

## E. Estimated SQL execution time + rollback plan

### Execution time estimate

| Step | Action | Estimated time |
|------|--------|----------------|
| 1 | Manual backup trigger (Supabase Dashboard) | 1-3 phút (DB size dependent) |
| 2 | Run A1-A4 discovery queries | < 30s |
| 3 | Anh paste output → em refine plan section C | 5 phút |
| 4 | Run dry-run COUNT queries | < 30s |
| 5 | Run cleanup SQL (Option D hybrid) | < 5s |
| 6 | Smoke test 6 cases | 5-10 phút |
| 7 | Verify post-cleanup query | < 10s |

**Total**: ~15-25 phút end-to-end, phần lớn là backup wait + smoke test.

### Rollback plan

**Trigger**: bất kỳ smoke test step nào fail OR query A1 post-cleanup không match expected.

**Procedure**:
1. **STOP** — không cố fix forward, không run thêm SQL
2. Supabase Dashboard → Database → Backups → identify backup từ Step 1 (timestamp pre-cleanup)
3. Click "Restore" → confirm restore destination
4. Wait restore complete (typically 5-10 phút)
5. Verify restored state: query A1 → expect 9 rows again
6. Document failure reason vào HANDOFF §17 (lessons learned) HOẶC update plan này với root cause + retry strategy

**Failure modes considered**:
- ❌ Wrong canonical chosen → smoke test fail (data missing) → rollback
- ❌ FK CASCADE removed unexpected data → query post-cleanup numbers mismatch → rollback
- ❌ RLS policy break post-rename → login redirect loop → rollback
- ✅ Rename success but query patterns elsewhere break → fix forward (update queries với `NOT ILIKE '[ARCHIVED%'` filter)

---

## F. Open questions for Vũ Hải

1. **Confirm canonical criteria priority**: nếu Vũ Hải CEO email `<owner-email>` xuất hiện trong > 1 org (vd 2-3 orgs đều CEO) → tiebreaker là gì? Most data? Created_at? Em recommend: **most active data** (xmatrices_active + kpis_active + gemba + hansei tổng cao nhất).

2. **Backup trigger timing**: anh muốn em viết SQL cleanup script để run ngay sau khi anh paste output A1-A4, hay anh muốn em pause + verify với anh từng step?

3. **Update HANDOFF §17 sau cleanup**: thêm architecture decision entry "M-Cleanup-2 — DB cleanup duplicate orgs" với rationale + pattern lessons không?

4. **`name ILIKE` anti-pattern cố định**: ngoài cleanup data, có nên thêm convention vào AGENTS.md *"NEVER dùng `name ILIKE LIMIT 1` cho org lookup. Luôn lookup bằng `org_members` JOIN với email cụ thể từ session"*? Lesson đã hit 2 sessions consume ~1.5h tổng — escalate thành hard rule?

---

**End of design audit. Anh paste A1-A4 output để em refine recommendation.**
