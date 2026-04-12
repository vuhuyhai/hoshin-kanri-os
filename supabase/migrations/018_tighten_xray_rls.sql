-- Tighten X-Ray RLS: remove anon INSERT policies.
-- Server-side writes now go through the admin (service-role) client, which
-- bypasses RLS entirely. This closes the lead-capture bypass where anyone
-- could POST directly to xray_results / xray_leads from the browser.

DROP POLICY IF EXISTS "allow anon insert xray" ON xray_results;
DROP POLICY IF EXISTS "Allow public insert on xray_leads" ON xray_leads;
