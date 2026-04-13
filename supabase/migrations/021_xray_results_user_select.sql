-- Allow authenticated users to read xray_results rows they own directly
-- via user_id, in addition to the existing org-membership SELECT policy
-- from migration 005. Without this, a user who ran X-Ray *before* their
-- org_members row existed (anon → signup → x-ray → onboarding) cannot
-- ever see their own result, because `org_id IS NULL IN (...)` is false
-- in SQL — RLS silently filters the row out. Postgres combines RLS
-- policies with OR, so this is purely additive: existing org-based reads
-- are unchanged.

CREATE POLICY "user can read own xray by user_id"
  ON xray_results FOR SELECT
  USING (user_id = auth.uid());
