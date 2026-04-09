-- ============================================================
-- HOSHIN KANRI OS — Migration 001: Initial Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  industry      text NOT NULL,
  headcount     text CHECK (headcount IN ('1-10', '10-50', '50-200')) NOT NULL,
  city          text NOT NULL,
  plan_tier     text NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),
  zalo_oa_token text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ============================================================
-- 2. USERS (mirror of auth.users)
-- ============================================================
CREATE TABLE users (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  full_name     text,
  zalo_user_id  text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ============================================================
-- 3. ORG_MEMBERS
-- ============================================================
CREATE TABLE org_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       text NOT NULL CHECK (role IN ('CEO', 'Manager', 'Member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ============================================================
-- 4. X_MATRICES
-- ============================================================
CREATE TABLE x_matrices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year        integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  title       text NOT NULL,
  vision_json jsonb DEFAULT '{}',
  status      text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ============================================================
-- 5. KPIS
-- ============================================================
CREATE TABLE kpis (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  x_matrix_id    uuid REFERENCES x_matrices(id) ON DELETE SET NULL,
  owner_user_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  name           text NOT NULL,
  unit           text NOT NULL,
  target_value   numeric NOT NULL,
  frequency      text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  is_active      boolean NOT NULL DEFAULT true,
  dept_level     text CHECK (dept_level IN ('company', 'dept')),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ============================================================
-- 6. KPI_ENTRIES
-- ============================================================
CREATE TABLE kpi_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id      uuid NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value       numeric NOT NULL,
  note        text,
  period_date date NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE kpi_entries REPLICA IDENTITY FULL;

-- ============================================================
-- 7. NOTIFICATION_LOGS
-- ============================================================
CREATE TABLE notification_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('zalo', 'email', 'in_app')),
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'opened')),
  payload    jsonb DEFAULT '{}',
  sent_at    timestamptz,
  opened_at  timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. SWOT_ANALYSES
-- ============================================================
CREATE TABLE swot_analyses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quadrant         text NOT NULL CHECK (quadrant IN ('S', 'W', 'O', 'T')),
  framework_source text NOT NULL,
  statement        text NOT NULL,
  evidence_json    jsonb DEFAULT '[]',
  implication      text,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- 9. DISCOVERY_SESSIONS
-- ============================================================
CREATE TABLE discovery_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_completed text CHECK (
    step_completed IN ('x-ray', 'current_state', 'swot', 'pain_mapper', 'vision')
  ),
  data_json      jsonb DEFAULT '{}',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_org_members_user_id    ON org_members(user_id);
CREATE INDEX idx_org_members_org_id     ON org_members(org_id);
CREATE INDEX idx_kpis_org_id            ON kpis(org_id);
CREATE INDEX idx_kpi_entries_kpi_id     ON kpi_entries(kpi_id);
CREATE INDEX idx_kpi_entries_period     ON kpi_entries(period_date);
CREATE INDEX idx_swot_analyses_org_id   ON swot_analyses(org_id);
CREATE INDEX idx_discovery_sessions_org ON discovery_sessions(org_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_x_matrices_updated_at
  BEFORE UPDATE ON x_matrices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_kpis_updated_at
  BEFORE UPDATE ON kpis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_discovery_sessions_updated_at
  BEFORE UPDATE ON discovery_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
