-- Migration 012: SWOT Factors + TOWS Strategies tables
-- Bảng swot_factors: lưu từng yếu tố S/W/O/T riêng biệt
-- Bảng tows_strategies: kết quả TOWS matrix

-- ============================================================
-- swot_factors
-- ============================================================
CREATE TABLE swot_factors (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  swot_analysis_id uuid NOT NULL REFERENCES swot_analyses(id) ON DELETE CASCADE,
  quadrant         char(1) NOT NULL CHECK (quadrant IN ('S','W','O','T')),
  code             varchar(10) NOT NULL,       -- auto: S1, W3, O7, T2
  content          text NOT NULL,
  source_framework varchar(20),               -- 'manual'|'8Ms'|'porter5'|'PESTEL'|'discovery_session'
  source_ref       varchar(100),              -- "8Ms > Manpower"
  evidence_text    text,
  quality_score    int CHECK (quality_score BETWEEN 1 AND 5),
  is_key_factor    boolean NOT NULL DEFAULT false,
  priority_rank    int,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (swot_analysis_id, code)
);

-- ============================================================
-- tows_strategies
-- ============================================================
CREATE TABLE tows_strategies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  swot_analysis_id uuid NOT NULL REFERENCES swot_analyses(id) ON DELETE CASCADE,
  quadrant         varchar(5) NOT NULL CHECK (quadrant IN ('SO','WO','ST','WT')),
  sw_factor_ids    uuid[] NOT NULL DEFAULT '{}',
  ot_factor_ids    uuid[] NOT NULL DEFAULT '{}',
  combined_code    varchar(100) NOT NULL,     -- "S35O35O7"
  bsc_perspective  varchar(30) NOT NULL DEFAULT 'finance'
                   CHECK (bsc_perspective IN ('finance','customer','process','learning')),
  strategy_statement text NOT NULL,
  strategy_title   varchar(200),
  ai_generated     boolean NOT NULL DEFAULT false,
  ai_prompt_used   text,
  status           varchar(20) NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','approved','in_x_matrix','rejected')),
  order_index      int NOT NULL DEFAULT 0,
  reviewed_by      uuid REFERENCES profiles(id),
  reviewed_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (swot_analysis_id, combined_code)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_swot_factors_analysis    ON swot_factors(swot_analysis_id);
CREATE INDEX idx_swot_factors_quadrant    ON swot_factors(swot_analysis_id, quadrant);
CREATE INDEX idx_tows_strategies_analysis ON tows_strategies(swot_analysis_id);
CREATE INDEX idx_tows_strategies_status   ON tows_strategies(swot_analysis_id, status);
CREATE INDEX idx_tows_sw_factors          ON tows_strategies USING GIN(sw_factor_ids);
CREATE INDEX idx_tows_ot_factors          ON tows_strategies USING GIN(ot_factor_ids);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE swot_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_swot_factors" ON swot_factors
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

ALTER TABLE tows_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_members_tows_strategies" ON tows_strategies
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE TRIGGER swot_factors_updated_at
  BEFORE UPDATE ON swot_factors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tows_strategies_updated_at
  BEFORE UPDATE ON tows_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
