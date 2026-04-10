-- ============================================================
-- HOSHIN KANRI OS — Migration 004: X-Ray Leads Table
-- Stores lead data from public Business X-Ray assessments
-- ============================================================

CREATE TABLE xray_leads (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text NOT NULL,
  company_name   text NOT NULL,
  industry       text NOT NULL,
  headcount      text CHECK (headcount IN ('1-10', '10-50', '50-200')) NOT NULL,
  answers_json   jsonb NOT NULL DEFAULT '{}',
  result_json    jsonb NOT NULL DEFAULT '{}',
  overall_score  integer NOT NULL,
  overall_level  text NOT NULL CHECK (overall_level IN ('critical', 'weak', 'moderate', 'strong')),
  converted      boolean NOT NULL DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

-- Index for lead follow-up queries
CREATE INDEX idx_xray_leads_email ON xray_leads(email);
CREATE INDEX idx_xray_leads_created ON xray_leads(created_at DESC);
CREATE INDEX idx_xray_leads_score ON xray_leads(overall_score);
CREATE INDEX idx_xray_leads_industry ON xray_leads(industry);

-- RLS: Allow insert from anon (public form), select only for service role
ALTER TABLE xray_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on xray_leads"
  ON xray_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role select on xray_leads"
  ON xray_leads FOR SELECT
  USING (auth.role() = 'service_role');
