-- Migration 029: Add TOWS Strategy v2 fields
-- Adds actions, kpi_suggestions, timeframe, rationale to tows_strategies
-- All columns nullable to preserve existing data

ALTER TABLE tows_strategies
  ADD COLUMN IF NOT EXISTS actions JSONB,
  ADD COLUMN IF NOT EXISTS kpi_suggestions JSONB,
  ADD COLUMN IF NOT EXISTS timeframe VARCHAR(10),
  ADD COLUMN IF NOT EXISTS rationale TEXT;

-- Constraint cho timeframe enum
ALTER TABLE tows_strategies
  DROP CONSTRAINT IF EXISTS tows_strategies_timeframe_check;

ALTER TABLE tows_strategies
  ADD CONSTRAINT tows_strategies_timeframe_check
  CHECK (timeframe IS NULL OR timeframe IN ('30d', '60d', '90d'));

-- Comment cho audit
COMMENT ON COLUMN tows_strategies.actions IS 'JSONB array of {description, owner_hint?} - 3 actions per strategy';
COMMENT ON COLUMN tows_strategies.kpi_suggestions IS 'JSONB array of {name, unit, target_value, frequency} - 1-2 KPIs per strategy';
COMMENT ON COLUMN tows_strategies.timeframe IS '30d | 60d | 90d - Hoshin discipline timeframe';
COMMENT ON COLUMN tows_strategies.rationale IS 'Why this S+O / W+T pairing makes sense';
