-- Migration 033: Gemba Comments (Member bottom-up feedback)
-- =============================================================
-- Bottom-up feedback từ Member role lên CEO/Manager. Member có
-- thể comment trên Hoshin (3-5 yr breakthrough lưu trong
-- x_matrices.vision_json.hoshins[].id) hoặc KPI (kpis.id).
-- Status lifecycle: open → acknowledged → resolved.
--
-- target_id stored as text (polymorphic):
--   target_type='hoshin' → JSON-embedded ID từ x_matrices.vision_json.hoshins[].id
--   target_type='kpi'    → kpis.id stringified (UUID dạng text)
-- Không enforce FK vì target heterogeneous — application layer
-- validate target tồn tại trước khi insert.
--
-- Permission matrix:
--   +-----------------+--------+---------+---------+---------+
--   | Table           | SELECT | INSERT  | UPDATE  | DELETE  |
--   +-----------------+--------+---------+---------+---------+
--   | gemba_comments  | any    | any     | CEO+Mgr | CEO+Mgr |
--   +-----------------+--------+---------+---------+---------+
--   "any" = bất kỳ org_member của row's org. M-Hoshin-5 là feature
--   ĐẦU TIÊN có Member là primary writer — INSERT cho phép cả 3 role
--   để Member submit gemba feedback. Constraint created_by = auth.uid()
--   để Member không spoof author. UPDATE/DELETE chỉ CEO+Manager
--   (acknowledge/resolve/moderate) để bảo toàn audit trail —
--   Member KHÔNG sửa hoặc xoá comment của chính mình.
--
-- Milestone: M-Hoshin-5 — Gemba feedback (Member→CEO bottom-up signal)
-- Date:      2026-04-29
--
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS / DO block cho
-- CREATE TYPE) và wrapped trong transaction để partial failure
-- không leave RLS half-applied.

BEGIN;

-- -------------------------------------------------------------
-- Enums (CREATE TYPE không có IF NOT EXISTS native — dùng DO block)
-- -------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE gemba_target_type AS ENUM ('hoshin', 'kpi');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE gemba_status AS ENUM ('open', 'acknowledged', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- -------------------------------------------------------------
-- gemba_comments
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gemba_comments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  target_type      gemba_target_type NOT NULL,
  target_id        text NOT NULL,
  body             text NOT NULL CHECK (char_length(body) BETWEEN 20 AND 1000),
  status           gemba_status NOT NULL DEFAULT 'open',
  created_by       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acknowledged_at  timestamptz,
  resolved_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------
-- Banner CEO POV: WHERE org_id=? AND status='open' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_gemba_comments_org_status
  ON gemba_comments (org_id, status, created_at DESC);

-- Inline thread: WHERE org_id=? AND target_type=? AND target_id=? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_gemba_comments_target
  ON gemba_comments (org_id, target_type, target_id, created_at DESC);

-- Member self-view: WHERE created_by=? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_gemba_comments_created_by
  ON gemba_comments (created_by, created_at DESC);

-- -------------------------------------------------------------
-- updated_at trigger (custom function — isolated, không reuse
-- update_updated_at() để tránh coupling cross-feature)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_gemba_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gemba_comments_updated_at ON gemba_comments;
CREATE TRIGGER gemba_comments_updated_at
  BEFORE UPDATE ON gemba_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_gemba_comments_updated_at();

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE gemba_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gemba_comments_select" ON gemba_comments;
DROP POLICY IF EXISTS "gemba_comments_insert" ON gemba_comments;
DROP POLICY IF EXISTS "gemba_comments_update" ON gemba_comments;
DROP POLICY IF EXISTS "gemba_comments_delete" ON gemba_comments;

CREATE POLICY "gemba_comments_select" ON gemba_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = gemba_comments.org_id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "gemba_comments_insert" ON gemba_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = gemba_comments.org_id
        AND org_members.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "gemba_comments_update" ON gemba_comments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = gemba_comments.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = gemba_comments.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  );

CREATE POLICY "gemba_comments_delete" ON gemba_comments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = gemba_comments.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  );

-- -------------------------------------------------------------
-- Comments
-- -------------------------------------------------------------
COMMENT ON TABLE gemba_comments IS
  'Bottom-up gemba feedback Member→CEO. Polymorphic target qua (target_type, target_id). Status lifecycle: open → acknowledged → resolved. M-Hoshin-5: feature đầu tiên cho Member là primary writer.';

COMMENT ON COLUMN gemba_comments.target_id IS
  'Polymorphic target ID. target_type=hoshin → text ID từ x_matrices.vision_json.hoshins[].id (không FK). target_type=kpi → kpis.id stringified. Application layer validate target tồn tại.';

COMMENT ON COLUMN gemba_comments.body IS
  'Comment body 20-1000 chars. Min 20 để force Member viết đủ context, không bấm submit "test test".';

COMMENT ON COLUMN gemba_comments.status IS
  'open=mới tạo (default), acknowledged=CEO/Manager đã ghi nhận, resolved=đã follow-up xong. acknowledged_at/resolved_at frozen tại transition để audit.';

COMMIT;
