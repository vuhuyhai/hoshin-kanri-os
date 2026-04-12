-- Migration 014: Atomic factor code generation
-- =============================================================
-- Replaces the count-based generateFactorCode() TS helper with a
-- per-(analysis, quadrant) sequence table + atomic reservation RPC.
--
-- Problem: generateFactorCode() runs SELECT COUNT(*) then +1 in JS.
-- Two concurrent inserts see the same count, both try the same code,
-- one fails on UNIQUE (swot_analysis_id, code), retries x3 at most,
-- batch inserts (coaching draft, synthesis materialize) have no retry
-- at all and fail the whole batch.
--
-- Solution: INSERT ... ON CONFLICT DO UPDATE RETURNING on a sequences
-- table is a single atomic Postgres statement. Concurrent callers
-- serialize on the PK row lock. No retry needed.

-- -------------------------------------------------------------
-- 1. Sequence table
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS swot_factor_code_sequences (
  swot_analysis_id uuid NOT NULL REFERENCES swot_analyses(id) ON DELETE CASCADE,
  quadrant         char(1) NOT NULL CHECK (quadrant IN ('S','W','O','T')),
  next_value       int NOT NULL DEFAULT 1 CHECK (next_value >= 1),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (swot_analysis_id, quadrant)
);

COMMENT ON TABLE swot_factor_code_sequences IS
  'Atomic counter for generating factor codes (S1, W3, O7, ...). One row per (analysis, quadrant). Use reserve_factor_codes() RPC — never UPDATE directly.';

-- -------------------------------------------------------------
-- 2. Atomic reservation function
-- -------------------------------------------------------------
-- Reserves p_count consecutive code numbers for a given quadrant,
-- returns the FIRST number in the reserved block. Caller generates
-- codes Q{start}, Q{start+1}, ..., Q{start+count-1}.
--
-- SECURITY DEFINER is required to bypass RLS on the sequences table
-- (which has no policy — it's internal). Ownership is enforced
-- inline by checking org membership against the analysis.

CREATE OR REPLACE FUNCTION reserve_factor_codes(
  p_analysis_id uuid,
  p_quadrant    char(1),
  p_count       int DEFAULT 1
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start int;
BEGIN
  IF p_count < 1 THEN
    RAISE EXCEPTION 'p_count must be >= 1' USING ERRCODE = '22023';
  END IF;
  IF p_quadrant NOT IN ('S','W','O','T') THEN
    RAISE EXCEPTION 'p_quadrant must be S|W|O|T' USING ERRCODE = '22023';
  END IF;

  -- Ownership check: caller must be a member of the analysis org
  IF NOT EXISTS (
    SELECT 1
    FROM swot_analyses a
    JOIN org_members   m ON m.org_id = a.org_id
    WHERE a.id = p_analysis_id
      AND m.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Forbidden: analysis not owned by caller'
      USING ERRCODE = '42501';
  END IF;

  -- Atomic reserve: single INSERT ... ON CONFLICT serializes
  -- concurrent callers on the PK row lock.
  INSERT INTO swot_factor_code_sequences AS s
    (swot_analysis_id, quadrant, next_value, updated_at)
  VALUES
    (p_analysis_id, p_quadrant, 1 + p_count, now())
  ON CONFLICT (swot_analysis_id, quadrant) DO UPDATE
    SET next_value = s.next_value + p_count,
        updated_at = now()
  RETURNING next_value - p_count INTO v_start;

  RETURN v_start;
END;
$$;

REVOKE ALL ON FUNCTION reserve_factor_codes(uuid, char, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_factor_codes(uuid, char, int) TO authenticated;

COMMENT ON FUNCTION reserve_factor_codes IS
  'Atomically reserve a block of factor code numbers for (analysis, quadrant). Returns the first usable number. Caller formats as Q{n}.';

-- -------------------------------------------------------------
-- 3. Backfill sequences from existing factors
-- -------------------------------------------------------------
-- For any analysis that already has factors with codes like "S3",
-- initialize next_value = max(existing number) + 1 so new codes
-- don't collide. ON CONFLICT DO NOTHING makes this idempotent.

INSERT INTO swot_factor_code_sequences (swot_analysis_id, quadrant, next_value)
SELECT
  swot_analysis_id,
  quadrant,
  COALESCE(
    MAX(
      CASE
        WHEN code ~ '^[SWOT]\d+$'
        THEN CAST(SUBSTRING(code FROM 2) AS int)
        ELSE 0
      END
    ),
    0
  ) + 1
FROM swot_factors
GROUP BY swot_analysis_id, quadrant
ON CONFLICT (swot_analysis_id, quadrant) DO NOTHING;

-- -------------------------------------------------------------
-- 4. RLS: no policy, table is accessed only via SECURITY DEFINER RPC
-- -------------------------------------------------------------
ALTER TABLE swot_factor_code_sequences ENABLE ROW LEVEL SECURITY;
-- No policy → authenticated clients can't SELECT/INSERT/UPDATE directly.
-- Only reserve_factor_codes() (SECURITY DEFINER) can access.
