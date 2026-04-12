-- Require every xray_results row to have an owner (org or user).
-- Anonymous X-Ray runs live in xray_leads instead — xray_results is strictly
-- a history table for authenticated users/orgs. This prevents orphan rows
-- that can never be linked back to an account after signup.

-- Clean up any existing orphan rows (both owners NULL = unrecoverable).
-- xray_leads retains the full result_json for anonymous runs, so nothing
-- is actually lost here.
DELETE FROM xray_results
WHERE org_id IS NULL AND user_id IS NULL;

ALTER TABLE xray_results
  ADD CONSTRAINT xray_results_ownership_check
  CHECK (org_id IS NOT NULL OR user_id IS NOT NULL);
