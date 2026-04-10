-- 010_admin_views.sql
-- Subscriptions table, admin views, admin_notes table

-- SUBSCRIPTIONS TABLE — billing/plan per org
CREATE TABLE subscriptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  plan                text NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free', 'starter', 'growth', 'enterprise')),
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  stripe_customer_id  text,
  current_period_end  timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- CEO cua org doc duoc subscription cua org minh
CREATE POLICY "subscriptions_org_ceo_select" ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = subscriptions.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role = 'CEO'
    )
  );
-- Super admin doc/ghi tat ca subscriptions
CREATE POLICY "subscriptions_super_admin_all" ON subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
  );
CREATE INDEX idx_subscriptions_org_id ON subscriptions(org_id);
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- HELPER: check_is_super_admin() — dung trong RLS policies
CREATE OR REPLACE FUNCTION check_is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- VIEW 1: admin_customers_overview
-- Danh sach orgs voi owner info + subscription + activity
CREATE OR REPLACE VIEW admin_customers_overview AS
SELECT
  o.id AS org_id, o.name AS org_name,
  u.email AS owner_email, p.full_name AS owner_name,
  COALESCE(s.plan, 'free') AS plan,
  COALESCE(s.status, 'active') AS sub_status,
  COALESCE(mc.member_count, 0) AS member_count,
  o.created_at, ds_latest.last_active_at
FROM organizations o
LEFT JOIN LATERAL (
  SELECT om.user_id FROM org_members om
  WHERE om.org_id = o.id AND om.role = 'CEO' LIMIT 1
) owner_member ON true
LEFT JOIN users u ON u.id = owner_member.user_id
LEFT JOIN profiles p ON p.id = owner_member.user_id
LEFT JOIN subscriptions s ON s.org_id = o.id
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS member_count FROM org_members om WHERE om.org_id = o.id
) mc ON true
LEFT JOIN LATERAL (
  SELECT MAX(ds.updated_at) AS last_active_at FROM discovery_sessions ds WHERE ds.org_id = o.id
) ds_latest ON true;

-- VIEW 2: admin_customer_detail
-- Chi tiet org — mo rong overview + counts + billing
CREATE OR REPLACE VIEW admin_customer_detail AS
SELECT
  o.id AS org_id, o.name AS org_name,
  o.industry, o.headcount, o.city,
  u.email AS owner_email, p.full_name AS owner_name,
  COALESCE(s.plan, 'free') AS plan,
  COALESCE(s.status, 'active') AS sub_status,
  s.current_period_end, s.stripe_customer_id,
  COALESCE(mc.member_count, 0) AS member_count,
  COALESCE(xm.total_x_matrices, 0) AS total_x_matrices,
  COALESCE(ds_count.total_sessions, 0) AS total_sessions,
  o.created_at, ds_latest.last_active_at
FROM organizations o
LEFT JOIN LATERAL (
  SELECT om.user_id FROM org_members om
  WHERE om.org_id = o.id AND om.role = 'CEO' LIMIT 1
) owner_member ON true
LEFT JOIN users u ON u.id = owner_member.user_id
LEFT JOIN profiles p ON p.id = owner_member.user_id
LEFT JOIN subscriptions s ON s.org_id = o.id
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS member_count FROM org_members om WHERE om.org_id = o.id
) mc ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS total_x_matrices FROM x_matrices xm WHERE xm.org_id = o.id
) xm ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS total_sessions FROM discovery_sessions ds WHERE ds.org_id = o.id
) ds_count ON true
LEFT JOIN LATERAL (
  SELECT MAX(ds.updated_at) AS last_active_at FROM discovery_sessions ds WHERE ds.org_id = o.id
) ds_latest ON true;

-- ADMIN_NOTES — super admin ghi chu ve tung khach hang
CREATE TABLE admin_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
-- Chi super admin doc/ghi admin_notes
CREATE POLICY "admin_notes_super_admin_only" ON admin_notes
  FOR ALL USING (check_is_super_admin());
CREATE INDEX idx_admin_notes_org_id ON admin_notes(org_id);
