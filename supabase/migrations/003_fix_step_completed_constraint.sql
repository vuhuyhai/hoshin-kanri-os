-- ============================================================
-- 003: Expand step_completed CHECK constraint
--
-- BUG: Code INSERT 5 values not in original CHECK constraint.
--      INSERT fails silently → data loss.
--
-- FIX: Allow all 10 values used across codebase.
--      swot_* = sub-steps of SWOT 4-phase module.
--      synthesis = Discovery AI Strategy Synthesis output.
-- ============================================================

-- 1. Drop old constraint
ALTER TABLE discovery_sessions
  DROP CONSTRAINT IF EXISTS discovery_sessions_step_completed_check;

-- 2. Add new constraint with all 11 values
ALTER TABLE discovery_sessions
  ADD CONSTRAINT discovery_sessions_step_completed_check
  CHECK (step_completed IN (
    'x-ray',
    'current_state',
    'swot',
    'swot_coaching',
    'swot_evidence',
    'swot_synthesis',
    'swot_strategy',
    'pain_mapper',
    'vision',
    'synthesis',
    'xray_history'
  ));

-- 3. Migrate legacy 'swot' records to 'swot_coaching'
UPDATE discovery_sessions
SET step_completed = 'swot_coaching'
WHERE step_completed = 'swot';

-- 4. Document the column
COMMENT ON COLUMN discovery_sessions.step_completed IS
  'Tracking step trong Discovery pipeline.
   swot_* = sub-steps cua SWOT module (4 phases).
   synthesis = AI Strategy Synthesis output.';
