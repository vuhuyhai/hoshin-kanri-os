-- Migration 030: X-Matrix correlations (Year Goals × Hoshins)
-- =============================================================
-- Stores correlation strength between yearGoals[] and hoshins[]
-- (both live as string IDs inside x_matrices.vision_json — no FK
-- to those rows, only to x_matrices itself).
--
-- Visual mapping (UI layer):
--   strong = ●   medium = ◐   weak = ○   none = -  (explicit no relation)
--
-- Permission matrix:
--   +-----------------------+--------+---------+---------+---------+
--   | Table                 | SELECT | INSERT  | UPDATE  | DELETE  |
--   +-----------------------+--------+---------+---------+---------+
--   | xmatrix_correlations  | any    | CEO+Mgr | CEO+Mgr | CEO+Mgr |
--   +-----------------------+--------+---------+---------+---------+
--
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS) and wrapped in
-- a transaction so partial failure leaves RLS intact.

BEGIN;

-- -------------------------------------------------------------
-- xmatrix_correlations
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xmatrix_correlations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  x_matrix_id   uuid NOT NULL REFERENCES x_matrices(id) ON DELETE CASCADE,
  year_goal_id  text NOT NULL,
  hoshin_id     text NOT NULL,
  strength      text NOT NULL CHECK (strength IN ('strong', 'medium', 'weak', 'none')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (x_matrix_id, year_goal_id, hoshin_id)
);

-- -------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_xmatrix_correlations_matrix
  ON xmatrix_correlations (x_matrix_id);

CREATE INDEX IF NOT EXISTS idx_xmatrix_correlations_org
  ON xmatrix_correlations (org_id);

-- -------------------------------------------------------------
-- updated_at trigger (reuses update_updated_at() from migration 001)
-- -------------------------------------------------------------
DROP TRIGGER IF EXISTS xmatrix_correlations_updated_at ON xmatrix_correlations;
CREATE TRIGGER xmatrix_correlations_updated_at
  BEFORE UPDATE ON xmatrix_correlations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE xmatrix_correlations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "xmatrix_correlations_select" ON xmatrix_correlations;
DROP POLICY IF EXISTS "xmatrix_correlations_insert" ON xmatrix_correlations;
DROP POLICY IF EXISTS "xmatrix_correlations_update" ON xmatrix_correlations;
DROP POLICY IF EXISTS "xmatrix_correlations_delete" ON xmatrix_correlations;

CREATE POLICY "xmatrix_correlations_select" ON xmatrix_correlations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = xmatrix_correlations.org_id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "xmatrix_correlations_insert" ON xmatrix_correlations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = xmatrix_correlations.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  );

CREATE POLICY "xmatrix_correlations_update" ON xmatrix_correlations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = xmatrix_correlations.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = xmatrix_correlations.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  );

CREATE POLICY "xmatrix_correlations_delete" ON xmatrix_correlations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = xmatrix_correlations.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  );

-- -------------------------------------------------------------
-- Comments
-- -------------------------------------------------------------
COMMENT ON TABLE xmatrix_correlations IS
  'Correlation strength between X-Matrix Year Goals and Hoshins (3-5 yr breakthroughs). year_goal_id and hoshin_id are string IDs from x_matrices.vision_json (yearGoals[].id, hoshins[].id) and are NOT foreign keys.';

COMMENT ON COLUMN xmatrix_correlations.strength IS
  'Visual mapping: strong=●, medium=◐, weak=○, none=- (explicit no relation)';

COMMIT;
