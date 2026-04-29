-- Migration 032: Weekly Hansei (KPI red streak reflection)
-- =============================================================
-- Mini-A3 reflection captured when a KPI has been red (< 70%
-- of target) for 2+ consecutive weeks. Two free-text fields
-- (why_red, next_action) match Toyota gemba weekly hansei
-- pattern — lighter than annual A3 (4 fields) but heavier
-- than nothing.
--
-- streak_weeks freezes the streak length at the moment of
-- reflection. UNIQUE (kpi_id, week_start) makes the upsert
-- idempotent per streak detection point. If the streak
-- extends past the previously hansei'd week, the prompt
-- re-fires with a later week_start (see Q6 in
-- plans/M-Hoshin-4-hansei-auto-prompt.md).
--
-- Permission matrix:
--   +-----------------+--------+---------+---------+--------+
--   | Table           | SELECT | INSERT  | UPDATE  | DELETE |
--   +-----------------+--------+---------+---------+--------+
--   | weekly_hansei   | any    | CEO+Mgr | CEO+Mgr | CEO    |
--   +-----------------+--------+---------+---------+--------+
--   "any" = any org_member of the row's org.
--
-- Milestone: M-Hoshin-4 — Hansei Auto-prompt khi KPI red 2+ tuần
-- Date:      2026-04-29
--
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS) and wrapped
-- in a transaction so partial failure leaves RLS intact.

BEGIN;

-- -------------------------------------------------------------
-- weekly_hansei
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS weekly_hansei (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kpi_id        uuid NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  week_start    date NOT NULL,
  streak_weeks  int  NOT NULL CHECK (streak_weeks >= 2),
  why_red       text NOT NULL CHECK (char_length(why_red) >= 30 AND char_length(why_red) <= 1000),
  next_action   text NOT NULL CHECK (char_length(next_action) >= 30 AND char_length(next_action) <= 1000),
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kpi_id, week_start)
);

-- -------------------------------------------------------------
-- Indexes
-- -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_weekly_hansei_org_week
  ON weekly_hansei (org_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_weekly_hansei_kpi_week
  ON weekly_hansei (kpi_id, week_start DESC);

-- -------------------------------------------------------------
-- updated_at trigger (reuses update_updated_at() from migration 001)
-- -------------------------------------------------------------
DROP TRIGGER IF EXISTS weekly_hansei_updated_at ON weekly_hansei;
CREATE TRIGGER weekly_hansei_updated_at
  BEFORE UPDATE ON weekly_hansei
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
ALTER TABLE weekly_hansei ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weekly_hansei_select_org_members" ON weekly_hansei;
DROP POLICY IF EXISTS "weekly_hansei_insert_write_roles" ON weekly_hansei;
DROP POLICY IF EXISTS "weekly_hansei_update_write_roles" ON weekly_hansei;
DROP POLICY IF EXISTS "weekly_hansei_delete_admin" ON weekly_hansei;

CREATE POLICY "weekly_hansei_select_org_members" ON weekly_hansei
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = weekly_hansei.org_id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "weekly_hansei_insert_write_roles" ON weekly_hansei
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = weekly_hansei.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  );

CREATE POLICY "weekly_hansei_update_write_roles" ON weekly_hansei
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = weekly_hansei.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = weekly_hansei.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('CEO', 'Manager')
    )
  );

CREATE POLICY "weekly_hansei_delete_admin" ON weekly_hansei
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = weekly_hansei.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'CEO'
    )
  );

-- -------------------------------------------------------------
-- Comments
-- -------------------------------------------------------------
COMMENT ON TABLE weekly_hansei IS
  'Weekly mini-A3 reflection on a KPI red streak (< 70% target for 2+ consecutive weeks). One row per (kpi_id, week_start). Toyota gemba pattern — lighter than annual_reviews A3 (4 fields).';

COMMENT ON COLUMN weekly_hansei.week_start IS
  'Monday of the week the streak was detected. Together with kpi_id forms the idempotent upsert key.';

COMMENT ON COLUMN weekly_hansei.streak_weeks IS
  'Streak length frozen at reflection time (>= 2). If the streak later extends past the next prompt threshold, a new row is inserted with a later week_start.';

COMMIT;
