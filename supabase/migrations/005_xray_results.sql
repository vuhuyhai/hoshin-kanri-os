-- ============================================================
-- HOSHIN KANRI OS — Migration 005: X-Ray Results History
-- Stores full X-Ray results for history tracking & comparison
-- ============================================================

-- 1. Create xray_results table (append-only history)
CREATE TABLE xray_results (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES users(id),
  overall_score integer NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  overall_level text NOT NULL
    CHECK (overall_level IN ('critical', 'weak', 'moderate', 'strong')),
  result_json   jsonb NOT NULL,
  answers_json  jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_xray_results_org ON xray_results(org_id, created_at DESC);

-- 2. RLS
ALTER TABLE xray_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read xray"
  ON xray_results FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org members can insert xray"
  ON xray_results FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Allow anon insert for public X-Ray (org_id = null)
CREATE POLICY "allow anon insert xray"
  ON xray_results FOR INSERT
  WITH CHECK (org_id IS NULL);

-- 3. Add UNIQUE constraint on discovery_sessions for upsert
-- (org_id, user_id, step_completed) must be unique
ALTER TABLE discovery_sessions
  ADD CONSTRAINT discovery_sessions_org_user_step_unique
  UNIQUE (org_id, user_id, step_completed);
