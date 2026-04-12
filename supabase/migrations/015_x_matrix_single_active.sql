-- Migration 015: Enforce single active X-Matrix per org
-- =============================================================
-- Prevents the class of bug where repeat saves of the X-Matrix wizard
-- stack up multiple rows with status='active' for the same org, which
-- then breaks dashboard queries that use .maybeSingle().
--
-- The /api/x-matrix/create route now archives old active rows before
-- inserting a new one, but a partial UNIQUE index is the DB-level
-- guarantee that belt-and-suspenders the application logic.

CREATE UNIQUE INDEX IF NOT EXISTS x_matrices_one_active_per_org
  ON x_matrices (org_id)
  WHERE status = 'active';

COMMENT ON INDEX x_matrices_one_active_per_org IS
  'Enforces at most one x_matrices row with status=''active'' per org. Future inserts that would violate this must first archive the existing active row (see /api/x-matrix/create).';
