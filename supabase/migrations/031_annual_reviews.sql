-- Migration 031: Annual Review workflow (X-Matrix year-end review)
-- =============================================================
-- Three tables capture the annual review of an X-Matrix:
--
--   annual_reviews   one per x_matrix_id (unique). Holds A3 reflection
--                    fields and review status lifecycle (draft →
--                    completed → transitioned).
--   kpi_actuals      actual end-of-year values per KPI tied to the
--                    review, with auto-computed achievement %.
--   carry_overs      decisions on each Hoshin (3-5 yr breakthrough)
--                    from x_matrices.vision_json: carry / drop /
--                    modify / pending.
--
-- carry_overs.source_hoshin_id is a string ID from
-- x_matrices.vision_json (hoshins[].id) — NOT a foreign key, same
-- pattern as xmatrix_correlations in migration 030.
--
-- Permission matrix:
--   +------------------+--------+------+------+------+
--   | Table            | SELECT | INS  | UPD  | DEL  |
--   +------------------+--------+------+------+------+
--   | annual_reviews   | any    | CEO  | CEO  | CEO  |
--   | kpi_actuals      | any    | CEO  | CEO  | CEO  |
--   | carry_overs      | any    | CEO  | CEO  | CEO  |
--   +------------------+--------+------+------+------+
--   "any" = any org_member of the row's org. CEO check on org_members.role.
--   kpi_actuals and carry_overs derive org_id by joining annual_reviews.
--
-- Idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS) and wrapped in
-- a transaction so partial failure leaves RLS intact.

BEGIN;

-- -------------------------------------------------------------
-- annual_reviews
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS annual_reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  x_matrix_id       uuid NOT NULL REFERENCES x_matrices(id) ON DELETE CASCADE,
  org_id            uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reviewed_by       uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'completed', 'transitioned')),
  reviewed_at       timestamptz,
  a3_background     text,
  a3_current_state  text,
  a3_target_gap     text,
  a3_next_action    text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS annual_reviews_x_matrix_unique
  ON annual_reviews (x_matrix_id);

CREATE INDEX IF NOT EXISTS annual_reviews_org_id_idx
  ON annual_reviews (org_id);

-- -------------------------------------------------------------
-- kpi_actuals
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS kpi_actuals (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annual_review_id  uuid NOT NULL REFERENCES annual_reviews(id) ON DELETE CASCADE,
  kpi_id            uuid NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  actual_value      numeric NOT NULL,
  achievement_pct   numeric,
  note              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (annual_review_id, kpi_id)
);

CREATE INDEX IF NOT EXISTS kpi_actuals_review_id_idx
  ON kpi_actuals (annual_review_id);

-- -------------------------------------------------------------
-- carry_overs
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carry_overs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annual_review_id  uuid NOT NULL REFERENCES annual_reviews(id) ON DELETE CASCADE,
  source_hoshin_id  text NOT NULL,
  decision          text NOT NULL DEFAULT 'pending'
                    CHECK (decision IN ('carry', 'drop', 'modify', 'pending')),
  modified_title    text,
  rationale         text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (annual_review_id, source_hoshin_id)
);

CREATE INDEX IF NOT EXISTS carry_overs_review_id_idx
  ON carry_overs (annual_review_id);

-- -------------------------------------------------------------
-- updated_at triggers (reuses update_updated_at() from migration 001)
-- -------------------------------------------------------------
DROP TRIGGER IF EXISTS annual_reviews_updated_at ON annual_reviews;
CREATE TRIGGER annual_reviews_updated_at
  BEFORE UPDATE ON annual_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS kpi_actuals_updated_at ON kpi_actuals;
CREATE TRIGGER kpi_actuals_updated_at
  BEFORE UPDATE ON kpi_actuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS carry_overs_updated_at ON carry_overs;
CREATE TRIGGER carry_overs_updated_at
  BEFORE UPDATE ON carry_overs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------
-- RLS: annual_reviews
-- -------------------------------------------------------------
ALTER TABLE annual_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "annual_reviews_select" ON annual_reviews;
DROP POLICY IF EXISTS "annual_reviews_insert" ON annual_reviews;
DROP POLICY IF EXISTS "annual_reviews_update" ON annual_reviews;
DROP POLICY IF EXISTS "annual_reviews_delete" ON annual_reviews;

CREATE POLICY "annual_reviews_select" ON annual_reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = annual_reviews.org_id
        AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "annual_reviews_insert" ON annual_reviews
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = annual_reviews.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'CEO'
    )
  );

CREATE POLICY "annual_reviews_update" ON annual_reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = annual_reviews.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'CEO'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = annual_reviews.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'CEO'
    )
  );

CREATE POLICY "annual_reviews_delete" ON annual_reviews
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = annual_reviews.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'CEO'
    )
  );

-- -------------------------------------------------------------
-- RLS: kpi_actuals (org_id derived via annual_reviews)
-- -------------------------------------------------------------
ALTER TABLE kpi_actuals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kpi_actuals_select" ON kpi_actuals;
DROP POLICY IF EXISTS "kpi_actuals_insert" ON kpi_actuals;
DROP POLICY IF EXISTS "kpi_actuals_update" ON kpi_actuals;
DROP POLICY IF EXISTS "kpi_actuals_delete" ON kpi_actuals;

CREATE POLICY "kpi_actuals_select" ON kpi_actuals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = kpi_actuals.annual_review_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "kpi_actuals_insert" ON kpi_actuals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = kpi_actuals.annual_review_id
        AND om.user_id = auth.uid()
        AND om.role = 'CEO'
    )
  );

CREATE POLICY "kpi_actuals_update" ON kpi_actuals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = kpi_actuals.annual_review_id
        AND om.user_id = auth.uid()
        AND om.role = 'CEO'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = kpi_actuals.annual_review_id
        AND om.user_id = auth.uid()
        AND om.role = 'CEO'
    )
  );

CREATE POLICY "kpi_actuals_delete" ON kpi_actuals
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = kpi_actuals.annual_review_id
        AND om.user_id = auth.uid()
        AND om.role = 'CEO'
    )
  );

-- -------------------------------------------------------------
-- RLS: carry_overs (org_id derived via annual_reviews)
-- -------------------------------------------------------------
ALTER TABLE carry_overs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "carry_overs_select" ON carry_overs;
DROP POLICY IF EXISTS "carry_overs_insert" ON carry_overs;
DROP POLICY IF EXISTS "carry_overs_update" ON carry_overs;
DROP POLICY IF EXISTS "carry_overs_delete" ON carry_overs;

CREATE POLICY "carry_overs_select" ON carry_overs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = carry_overs.annual_review_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "carry_overs_insert" ON carry_overs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = carry_overs.annual_review_id
        AND om.user_id = auth.uid()
        AND om.role = 'CEO'
    )
  );

CREATE POLICY "carry_overs_update" ON carry_overs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = carry_overs.annual_review_id
        AND om.user_id = auth.uid()
        AND om.role = 'CEO'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = carry_overs.annual_review_id
        AND om.user_id = auth.uid()
        AND om.role = 'CEO'
    )
  );

CREATE POLICY "carry_overs_delete" ON carry_overs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM annual_reviews ar
      JOIN org_members om ON om.org_id = ar.org_id
      WHERE ar.id = carry_overs.annual_review_id
        AND om.user_id = auth.uid()
        AND om.role = 'CEO'
    )
  );

-- -------------------------------------------------------------
-- Comments
-- -------------------------------------------------------------
COMMENT ON TABLE annual_reviews IS
  'Year-end review of an X-Matrix. One per x_matrix_id. Holds A3 reflection (background, current state, target/gap, next action) and lifecycle status.';

COMMENT ON COLUMN annual_reviews.status IS
  'draft → completed → transitioned. transitioned means a successor X-Matrix has been created from carry-over decisions.';

COMMENT ON TABLE kpi_actuals IS
  'End-of-year actual values per KPI tied to an annual_review. achievement_pct is the computed actual/target ratio.';

COMMENT ON TABLE carry_overs IS
  'Per-Hoshin decision (carry / drop / modify / pending) for each hoshin from x_matrices.vision_json. source_hoshin_id is a string ID from vision_json.hoshins[].id and is NOT a foreign key.';

COMMIT;
