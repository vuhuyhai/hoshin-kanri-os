-- ============================================================
-- HOSHIN KANRI OS — Migration 002: RLS Policies
-- ============================================================

-- ORGANIZATIONS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'CEO'
    )
  );

-- USERS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    id = auth.uid() OR
    id IN (
      SELECT user_id FROM org_members
      WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (id = auth.uid());

-- ORG_MEMBERS
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON org_members
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "org_members_insert" ON org_members
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'CEO'
    ) OR user_id = auth.uid()
  );

-- X_MATRICES
ALTER TABLE x_matrices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "x_matrices_select" ON x_matrices
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "x_matrices_insert" ON x_matrices
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'CEO'
    )
  );

CREATE POLICY "x_matrices_update" ON x_matrices
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'CEO'
    )
  );

-- KPIS
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpis_select" ON kpis
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "kpis_insert" ON kpis
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('CEO', 'Manager')
    )
  );

-- KPI_ENTRIES
ALTER TABLE kpi_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpi_entries_select" ON kpi_entries
  FOR SELECT USING (
    kpi_id IN (
      SELECT id FROM kpis WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "kpi_entries_insert" ON kpi_entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    kpi_id IN (
      SELECT id FROM kpis WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- NOTIFICATION_LOGS
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_logs_select" ON notification_logs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- SWOT_ANALYSES
ALTER TABLE swot_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swot_select" ON swot_analyses
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "swot_insert" ON swot_analyses
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'CEO'
    )
  );

CREATE POLICY "swot_update" ON swot_analyses
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'CEO'
    )
  );

CREATE POLICY "swot_delete" ON swot_analyses
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'CEO'
    )
  );

-- DISCOVERY_SESSIONS
ALTER TABLE discovery_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discovery_select" ON discovery_sessions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "discovery_insert" ON discovery_sessions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "discovery_update" ON discovery_sessions
  FOR UPDATE USING (user_id = auth.uid());
