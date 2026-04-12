-- Migration 016: Role-based RLS on strategic tables
-- =============================================================
-- Tightens RLS on swot_factors and tows_strategies (currently any org
-- member can write) and fills a gap on x_matrices (no DELETE policy →
-- default deny = CEO can't delete either). Role values come from the
-- existing CHECK constraint on org_members.role: CEO | Manager | Member.
--
-- Permission matrix:
--
--   +-----------------+--------+---------+---------+---------+
--   | Table           | SELECT | INSERT  | UPDATE  | DELETE  |
--   +-----------------+--------+---------+---------+---------+
--   | x_matrices      | any    | CEO     | CEO     | CEO     |
--   | swot_factors    | any    | CEO+Mgr | CEO+Mgr | CEO+Mgr |
--   | tows_strategies | any    | CEO+Mgr | CEO+Mgr | CEO     |
--   +-----------------+--------+---------+---------+---------+
--
-- Rationale: SWOT is a collaborative workshop so Managers can edit
-- factors and draft strategies. X-Matrix is the CEO's formal
-- declaration of strategy, so writes stay CEO-only. TOWS strategy
-- deletes are CEO-only because they represent finalised decisions.
--
-- This migration is idempotent (DROP IF EXISTS + CREATE) and runs
-- inside a transaction so a partial failure leaves RLS intact.

BEGIN;

-- -------------------------------------------------------------
-- swot_factors: replace single permissive policy with 4 per-op policies
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "org_members_swot_factors" ON swot_factors;
DROP POLICY IF EXISTS "swot_factors_select"      ON swot_factors;
DROP POLICY IF EXISTS "swot_factors_insert"      ON swot_factors;
DROP POLICY IF EXISTS "swot_factors_update"      ON swot_factors;
DROP POLICY IF EXISTS "swot_factors_delete"      ON swot_factors;

CREATE POLICY "swot_factors_select" ON swot_factors
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "swot_factors_insert" ON swot_factors
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role IN ('CEO', 'Manager')
    )
  );

CREATE POLICY "swot_factors_update" ON swot_factors
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role IN ('CEO', 'Manager')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role IN ('CEO', 'Manager')
    )
  );

CREATE POLICY "swot_factors_delete" ON swot_factors
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role IN ('CEO', 'Manager')
    )
  );

-- -------------------------------------------------------------
-- tows_strategies: similar split, DELETE restricted to CEO
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "org_members_tows_strategies" ON tows_strategies;
DROP POLICY IF EXISTS "tows_strategies_select"      ON tows_strategies;
DROP POLICY IF EXISTS "tows_strategies_insert"      ON tows_strategies;
DROP POLICY IF EXISTS "tows_strategies_update"      ON tows_strategies;
DROP POLICY IF EXISTS "tows_strategies_delete"      ON tows_strategies;

CREATE POLICY "tows_strategies_select" ON tows_strategies
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tows_strategies_insert" ON tows_strategies
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role IN ('CEO', 'Manager')
    )
  );

CREATE POLICY "tows_strategies_update" ON tows_strategies
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role IN ('CEO', 'Manager')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role IN ('CEO', 'Manager')
    )
  );

CREATE POLICY "tows_strategies_delete" ON tows_strategies
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role = 'CEO'
    )
  );

-- -------------------------------------------------------------
-- x_matrices: add missing DELETE policy + re-assert WITH CHECK
-- -------------------------------------------------------------
-- Existing INSERT / UPDATE (from migration 002) are CEO-only and OK
-- as-is. They lack an explicit WITH CHECK on UPDATE, so re-create to
-- add it. DELETE has no policy today → add one (CEO-only).
DROP POLICY IF EXISTS "x_matrices_insert" ON x_matrices;
DROP POLICY IF EXISTS "x_matrices_update" ON x_matrices;
DROP POLICY IF EXISTS "x_matrices_delete" ON x_matrices;

CREATE POLICY "x_matrices_insert" ON x_matrices
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role = 'CEO'
    )
  );

CREATE POLICY "x_matrices_update" ON x_matrices
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role = 'CEO'
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role = 'CEO'
    )
  );

CREATE POLICY "x_matrices_delete" ON x_matrices
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
        AND role = 'CEO'
    )
  );

COMMIT;
