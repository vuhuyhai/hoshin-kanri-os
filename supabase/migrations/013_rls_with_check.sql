-- Migration 013: Add explicit WITH CHECK to RLS policies for swot_factors and tows_strategies
-- Previously only USING was specified; PostgreSQL defaults WITH CHECK to USING,
-- but being explicit is safer and more readable.

DROP POLICY IF EXISTS "org_members_swot_factors" ON swot_factors;
CREATE POLICY "org_members_swot_factors" ON swot_factors
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "org_members_tows_strategies" ON tows_strategies;
CREATE POLICY "org_members_tows_strategies" ON tows_strategies
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));
