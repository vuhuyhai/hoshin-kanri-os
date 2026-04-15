-- Manual Data Migration: Convert Tab A coaching drafts → swot_factors rows
--
-- ==============================================================
-- BỐI CẢNH (anh Vũ Hải đọc trước)
-- ==============================================================
-- P2 merge flow: wizard mới sẽ ghi AI coaching output thẳng vào swot_factors
-- (thay vì swot_analyses.quadrant='draft' hack cũ).
--
-- Script này convert DỮ LIỆU HIỆN CÓ của Tab A (nếu có) sang table swot_factors
-- với marker source_framework='ai_coaching'. KHÔNG cần schema change.
--
-- Wizard mới dùng 2 tín hiệu để phân biệt draft vs reviewed:
--   1. source_framework='ai_coaching' + source_ref='migrated_from_swot_analyses'
--      → factor migrated từ Tab A cũ, cần review
--   2. discovery_sessions.step_completed='swot_wizard_step_3'
--      → user đã hoàn thành bước review
--
-- ==============================================================
-- HƯỚNG DẪN CHẠY
-- ==============================================================
-- 1. Mở Supabase Dashboard → SQL Editor
--
-- 2. BƯỚC KIỂM ĐẾM (chạy trước):
--      SELECT COUNT(*) FROM swot_analyses WHERE quadrant = 'draft';
--    → Ghi lại con số. Nếu = 0 → bỏ qua cả script này.
--
-- 3. Nếu > 0 → chạy toàn bộ block BEGIN...COMMIT bên dưới.
--    (Trong 1 transaction, có thể ROLLBACK nếu sai.)
--
-- 4. Verify sau migration:
--      SELECT COUNT(*) FROM swot_factors
--        WHERE source_framework = 'ai_coaching'
--          AND source_ref = 'migrated_from_swot_analyses';
--    → Con số phải = con số ở bước 2.
--
-- 5. CHỈ SAU KHI verify OK → chạy cleanup (irreversible!):
--      DELETE FROM swot_analyses WHERE quadrant = 'draft';
--      DELETE FROM discovery_sessions
--        WHERE step_completed = 'swot_coaching_draft';
-- ==============================================================

BEGIN;

-- Pre-check: báo số rows sẽ migrate
DO $$
DECLARE
  draft_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO draft_count FROM swot_analyses WHERE quadrant = 'draft';
  RAISE NOTICE '[PRE]  % draft rows in swot_analyses to migrate', draft_count;
END $$;

-- Step 1: đảm bảo mọi org có draft đều có ít nhất 1 anchor row non-draft
-- (để FK swot_factors.swot_analysis_id không trỏ tới draft row sắp xoá)
WITH orgs_with_drafts AS (
  SELECT DISTINCT org_id FROM swot_analyses WHERE quadrant = 'draft'
),
existing_anchors AS (
  SELECT DISTINCT ON (org_id)
    org_id,
    id AS anchor_id
  FROM swot_analyses
  WHERE quadrant != 'draft'
  ORDER BY org_id, created_at DESC
)
INSERT INTO swot_analyses (org_id, quadrant, framework_source, statement)
SELECT owd.org_id, 'S', 'manual', 'TOWS Analysis Session'
FROM orgs_with_drafts owd
LEFT JOIN existing_anchors ea ON ea.org_id = owd.org_id
WHERE ea.org_id IS NULL;

-- Step 2: resolve (org_id → anchor_id) mapping (now guaranteed to exist)
CREATE TEMP TABLE tmp_anchors ON COMMIT DROP AS
SELECT DISTINCT ON (org_id)
  org_id,
  id AS anchor_id
FROM swot_analyses
WHERE quadrant != 'draft'
ORDER BY org_id, created_at DESC;

-- Step 3: build insert batch with unique codes per (anchor, quadrant)
-- Codes start from MAX(existing S/W/O/T number) + 1 to avoid collision with Tab B factors
CREATE TEMP TABLE tmp_drafts_to_insert ON COMMIT DROP AS
WITH draft_mapped AS (
  SELECT
    sa.id AS source_id,
    sa.org_id,
    ta.anchor_id,
    sa.statement,
    sa.evidence_json,
    CASE (sa.evidence_json->>'quadrant')
      WHEN 'strengths'     THEN 'S'
      WHEN 'weaknesses'    THEN 'W'
      WHEN 'opportunities' THEN 'O'
      WHEN 'threats'       THEN 'T'
      ELSE 'S'
    END AS quadrant_letter,
    sa.created_at
  FROM swot_analyses sa
  JOIN tmp_anchors ta ON ta.org_id = sa.org_id
  WHERE sa.quadrant = 'draft'
),
existing_max_codes AS (
  SELECT
    swot_analysis_id,
    quadrant,
    COALESCE(
      MAX(CAST(REGEXP_REPLACE(code, '^[SWOT]', '') AS INTEGER)),
      0
    ) AS max_num
  FROM swot_factors
  WHERE code ~ '^[SWOT][0-9]+$'
  GROUP BY swot_analysis_id, quadrant
)
SELECT
  dm.source_id,
  dm.org_id,
  dm.anchor_id,
  dm.quadrant_letter,
  dm.quadrant_letter || (
    COALESCE(emc.max_num, 0) +
    ROW_NUMBER() OVER (
      PARTITION BY dm.anchor_id, dm.quadrant_letter
      ORDER BY dm.created_at
    )
  ) AS new_code,
  dm.statement,
  dm.evidence_json->>'rationale' AS rationale
FROM draft_mapped dm
LEFT JOIN existing_max_codes emc
  ON emc.swot_analysis_id = dm.anchor_id
  AND emc.quadrant = dm.quadrant_letter;

-- Step 4: INSERT
INSERT INTO swot_factors (
  org_id,
  swot_analysis_id,
  quadrant,
  code,
  content,
  source_framework,
  source_ref,
  is_key_factor,
  evidence_text
)
SELECT
  org_id,
  anchor_id,
  quadrant_letter,
  new_code,
  statement,
  'ai_coaching',
  'migrated_from_swot_analyses',
  false,
  rationale
FROM tmp_drafts_to_insert
ON CONFLICT (swot_analysis_id, code) DO NOTHING;

-- Report results
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM swot_factors
  WHERE source_framework = 'ai_coaching'
    AND source_ref = 'migrated_from_swot_analyses';
  RAISE NOTICE '[POST] % swot_factors rows after migration (source=ai_coaching, ref=migrated)', migrated_count;
END $$;

COMMIT;

-- ==============================================================
-- CLEANUP — chạy RIÊNG sau khi verify OK (irreversible!)
-- ==============================================================
-- DELETE FROM swot_analyses WHERE quadrant = 'draft';
-- DELETE FROM discovery_sessions WHERE step_completed = 'swot_coaching_draft';
