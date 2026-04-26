import type { SwotQuadrant } from '@/lib/swot/types'

export type TowsQuadrant = 'SO' | 'WO' | 'ST' | 'WT'
export type BscPerspective = 'finance' | 'customer' | 'process' | 'learning'
export type StrategyStatus = 'draft' | 'approved' | 'in_x_matrix' | 'rejected'
export type SourceFramework = 'manual' | '8Ms' | 'porter5' | 'PESTEL' | 'discovery_session'
export type Timeframe = '30d' | '60d' | '90d'

export interface StrategyAction {
  description: string
  owner_hint?: string
}

export interface KpiSuggestion {
  name: string
  unit: string
  target_value: number
  frequency: 'daily' | 'weekly' | 'monthly'
}

export const BSC_LABELS: Record<BscPerspective, string> = {
  finance:  'Tài chính',
  customer: 'Khách hàng',
  process:  'Quy trình',
  learning: 'Học hỏi & Phát triển',
}

export const TOWS_CONFIG: Record<TowsQuadrant, {
  desc: string
  full: string
  swQuadrant: SwotQuadrant
  otQuadrant: SwotQuadrant
}> = {
  SO: { desc: 'Tấn công',    full: 'Tận dụng Điểm mạnh khai thác Cơ hội',          swQuadrant: 'S', otQuadrant: 'O' },
  WO: { desc: 'Cải thiện',   full: 'Khắc phục Điểm yếu không bỏ lỡ Cơ hội',        swQuadrant: 'W', otQuadrant: 'O' },
  ST: { desc: 'Phòng thủ',   full: 'Dùng Điểm mạnh né tránh Mối đe dọa',            swQuadrant: 'S', otQuadrant: 'T' },
  WT: { desc: 'Tái cơ cấu',  full: 'Giảm thiểu Điểm yếu và Mối đe dọa',            swQuadrant: 'W', otQuadrant: 'T' },
}

export interface SwotFactor {
  id: string
  org_id: string
  swot_analysis_id: string
  quadrant: SwotQuadrant
  code: string
  content: string
  source_framework: SourceFramework | null
  source_ref: string | null
  evidence_text: string | null
  quality_score: number | null
  is_key_factor: boolean
  priority_rank: number | null
  created_at: string
  updated_at: string
}

export interface TowsStrategyRecord {
  id: string
  org_id: string
  swot_analysis_id: string
  quadrant: TowsQuadrant
  sw_factor_ids: string[]
  ot_factor_ids: string[]
  combined_code: string
  bsc_perspective: BscPerspective
  strategy_statement: string
  strategy_title: string | null
  ai_generated: boolean
  ai_prompt_used: string | null
  actions: StrategyAction[] | null
  kpi_suggestions: KpiSuggestion[] | null
  timeframe: Timeframe | null
  rationale: string | null
  status: StrategyStatus
  order_index: number
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface TowsStrategyWithFactorsRecord extends TowsStrategyRecord {
  sw_factors: SwotFactor[]
  ot_factors: SwotFactor[]
}

export interface CreateSwotFactorDto {
  quadrant: SwotQuadrant
  content: string
  source_framework?: SourceFramework
  source_ref?: string
  evidence_text?: string
  is_key_factor?: boolean
}

export interface CreateTowsStrategyDto {
  quadrant: TowsQuadrant
  sw_factor_ids: string[]
  ot_factor_ids: string[]
  bsc_perspective: BscPerspective
  strategy_statement: string
  strategy_title?: string
  ai_generated?: boolean
}

export interface AiTowsGenerationRequest {
  sw_factors: Pick<SwotFactor, 'code' | 'content' | 'evidence_text'>[]
  ot_factors: Pick<SwotFactor, 'code' | 'content' | 'evidence_text'>[]
  quadrant: TowsQuadrant
  org_context: {
    industry: string
    headcount: string
    city: string
  }
}

export interface AiStrategyItem {
  strategy_statement: string
  strategy_title: string
  bsc_perspective: BscPerspective
  actions?: StrategyAction[]
  kpi_suggestions?: KpiSuggestion[]
  timeframe?: Timeframe
  rationale?: string
}

export interface TowsExportRow {
  stt: number
  chien_luoc_type: TowsQuadrant
  sw_code: string
  nguyen_lieu_sw: string
  ot_code: string
  nguyen_lieu_ot: string
  combined_code: string
  bsc: string
  chien_luoc: string
}
