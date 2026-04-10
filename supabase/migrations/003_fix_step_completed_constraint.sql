-- ============================================================
-- 003: Expand step_completed CHECK constraint
-- Adds 'synthesis' for Discovery AI Synthesis output
-- ============================================================

ALTER TABLE discovery_sessions
  DROP CONSTRAINT IF EXISTS discovery_sessions_step_completed_check;

ALTER TABLE discovery_sessions
  ADD CONSTRAINT discovery_sessions_step_completed_check
  CHECK (
    step_completed IN (
      'x-ray',
      'current_state',
      'swot',
      'pain_mapper',
      'vision',
      'synthesis'
    )
  );
