export type EightMId =
  | 'M1_Man'
  | 'M2_Machine'
  | 'M3_Material'
  | 'M4_Method'
  | 'M5_Measurement'
  | 'M6_Nature'
  | 'M7_Management'
  | 'M8_Money'

export type PorterId =
  | 'Porter_P1'
  | 'Porter_P2'
  | 'Porter_P3'
  | 'Porter_P4'
  | 'Porter_P5'

export type PestelId =
  | 'PESTEL_P'
  | 'PESTEL_E'
  | 'PESTEL_S'
  | 'PESTEL_T'
  | 'PESTEL_En'
  | 'PESTEL_L'

export type FrameworkSourceId = EightMId | PorterId | PestelId
export type SwotQuadrant = 'S' | 'W' | 'O' | 'T'
export type SwotTarget = 'S' | 'W' | 'O' | 'T'

export type FrameworkSource =
  | '8M:Man' | '8M:Machine' | '8M:Material' | '8M:Method'
  | '8M:Measurement' | '8M:Management' | '8M:Money'
  | 'Porter:Rivalry' | 'Porter:NewEntrants' | 'Porter:Substitutes'
  | 'Porter:BuyerPower' | 'Porter:SupplierPower'
  | 'PESTEL:Political' | 'PESTEL:Economic' | 'PESTEL:Social'
  | 'PESTEL:Technological' | 'PESTEL:Environmental' | 'PESTEL:Legal'

export interface CoachingQuestion {
  id: string
  text: string
  follow_up_prompt?: string
  framework_source: FrameworkSource
  swot_target: SwotTarget
  dimension_key: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface CoachingState {
  messages: ChatMessage[]
  currentFramework: 'sw' | 'ot'
  isComplete: boolean
  isLoading: boolean
  summary: CoachingSummary | null
}

export interface CoachingSummary {
  strengths: FrameworkInput[]
  weaknesses: FrameworkInput[]
  opportunities: FrameworkInput[]
  threats: FrameworkInput[]
}

export interface FrameworkInput {
  source: FrameworkSourceId
  content: string
}

export interface SearchQuery {
  query: string
  purpose: string
  targetDimension: SwotQuadrant
  frameworkSource: FrameworkSourceId
}

export interface EvidenceItem {
  source: 'CEO' | 'Web'
  content: string
  url?: string
  relevance: 'high' | 'medium'
}

export interface EvidenceBatch {
  batchIndex: number
  queries: SearchQuery[]
  results: EvidenceItem[]
  isComplete: boolean
  isLoading: boolean
}

export interface EvidenceState {
  batches: EvidenceBatch[]
  totalBatches: number
  completedBatches: number
  isComplete: boolean
}

export interface SwotItem {
  id: string
  statement: string
  implication: string
  confidence: number
  framework_source?: string
}

export interface SwotSynthesisOutput {
  S: SwotItem[]
  W: SwotItem[]
  O: SwotItem[]
  T: SwotItem[]
  summary: string
}

// ============================================================
// Context Cards — replaces manual evidence collection
// ============================================================

export type ContextCardType = 'market_trend' | 'competitive_risk' | 'regulatory' | 'opportunity'

export interface ContextCard {
  id: string
  title: string
  insight: string
  card_type: ContextCardType
  swot_quadrant: 'O' | 'T'
  relevance_score: number
}

export interface ContextCardsOutput {
  cards: ContextCard[]
  generated_at: string
}

export type SwotPhase =
  | 'coaching'
  | 'evidence'
  | 'synthesis'
  | 'results'
  | 'complete'

export interface SwotModuleState {
  phase: SwotPhase
  coaching: CoachingState
  evidence: EvidenceState
  synthesisOutput: SwotSynthesisOutput | null
  isSaved: boolean
  sessionId: string | null
}

export interface CoachingRequest {
  messages: ChatMessage[]
  orgContext: OrgContext
  currentFramework: 'sw' | 'ot'
  coachingContext?: CoachingContext
  coachingTracker?: CoachingTrackerState
}

export interface CoachingResponse {
  message: ChatMessage
  isCoachingComplete: boolean
  summary?: CoachingSummary
  extractedInsight?: ExtractedInsight | null
  shouldTransition?: boolean
  nextDimension?: string | null
  updatedCoachingTracker?: CoachingTrackerState
}

export interface GenerateQueriesRequest {
  summary: CoachingSummary
  orgContext: OrgContext
}

export interface GenerateQueriesResponse {
  queries: SearchQuery[]
}

export interface EvidenceRequest {
  queries: SearchQuery[]
  orgContext: OrgContext
}

export interface EvidenceResponse {
  results: EvidenceItem[]
}

export interface SynthesisRequest {
  summary: CoachingSummary
  evidenceItems: EvidenceItem[]
  orgContext: OrgContext
}

export interface SynthesisResponse {
  synthesis: SwotSynthesisOutput
}

export interface OrgContext {
  orgId: string
  orgName: string
  industry: string
  city: string
  headcount: string
}

// ============================================================
// Coaching — structured AI output
// ============================================================

export interface ExtractedInsight {
  framework: '8M' | 'Porter' | 'PESTEL'
  dimension: string
  insight: string
  confidence: 'high' | 'medium' | 'low'
  quadrant: SwotQuadrant
}

export interface CoachingContext {
  currentDimension: string | null
  completedDimensions: string[]
  collectedInsights: Omit<ExtractedInsight, 'quadrant'>[]
}

// ============================================================
// Coaching — state machine
// ============================================================

export type CoachingPhase =
  | 'intro'
  | 'questioning'
  | 'probing'
  | 'transitioning'
  | 'completed'

export type FrameworkId = '8M' | 'Porter' | 'PESTEL'
export type ExternalFrameworkChoice = 'Porter' | 'PESTEL' | 'both'

export interface DimensionInsight {
  dimension: string
  insight: string
  confidence: 'high' | 'medium' | 'low'
  collectedAt: string
}

export interface CoachingTrackerState {
  currentFramework: FrameworkId
  currentDimension: string
  currentPhase: CoachingPhase
  completedFrameworks: FrameworkId[]
  completedDimensions: Record<FrameworkId, string[]>
  insights: Record<FrameworkId, DimensionInsight[]>
  messageCount: number
  lastUpdated: string
  selectedDimensions: Record<FrameworkId, string[]>
  selectedExternalFramework: ExternalFrameworkChoice
}

// ============================================================
// Discovery session data_json shapes — 1 step = 1 interface
// ============================================================

export interface DiscoverySessionCoaching {
  step: 'swot_coaching'
  coachingState: CoachingTrackerState
  messages: ChatMessage[]
  completedAt: string | null
  savedAt: string
}

export interface DiscoverySessionEvidence {
  step: 'swot_evidence'
  status: string
  batches: EvidenceBatch[]
  allSources: EvidenceItem[]
  completedAt: string | null
  savedAt: string
}

export interface DiscoverySessionSynthesis {
  step: 'swot_synthesis'
  status: string
  synthesis: SwotSynthesisOutput
  completedAt: string | null
  savedAt: string
}

export interface DiscoverySessionStrategy {
  step: 'swot_strategy'
  status: string
  matrix: Record<string, unknown>
  candidates: unknown[]
  completedAt: string | null
  savedAt: string
}

export type SwotDiscoverySession =
  | DiscoverySessionCoaching
  | DiscoverySessionEvidence
  | DiscoverySessionSynthesis
  | DiscoverySessionStrategy

// ─── INPUT TYPES ─────────────────────────────────────────────────

export interface CoachingItem {
  id: string
  quadrant: 'S' | 'W' | 'O' | 'T'
  text: string
  source: 'ai_extracted' | 'user_added' | 'ai_extracted_edited'
  framework_source?: string
  ai_confidence?: 'high' | 'medium' | 'low'
}

export interface EvidenceItemV2 {
  id: string
  quadrant: 'S' | 'W' | 'O' | 'T'
  text: string
  is_new_discovery: boolean
  evidence_text?: string
  data_point?: string
  source_name?: string
  source_url?: string
  published_year?: number
  confidence: 'high' | 'medium' | 'low' | 'not_found'
  credibility_score: number
}

export interface OrgContextV2 {
  industry: string
  headcount: string
  city: string
}

// ─── STEP 2 TYPES ────────────────────────────────────────────────

export interface GeneratedQuery {
  type: 'stat' | 'report' | 'news'
  query: string
  target_metric: string
  days: number
  priority: number
}

export interface EvidenceResult {
  found: boolean
  evidence_text?: string
  data_point?: string
  source_name?: string
  source_url?: string
  published_year?: number
  confidence: 'high' | 'medium' | 'low' | 'not_found'
  confidence_reason: string
  credibility_score: number
}

// ─── STEP 3 TYPES ────────────────────────────────────────────────

export interface SynthesizedSwotItem {
  id: string
  quadrant: 'S' | 'W' | 'O' | 'T'
  statement: string
  evidence: string
  evidence_source?: string
  evidence_url?: string
  evidence_year?: number
  implication: string
  priority: 1 | 2 | 3 | 4 | 5
  merged_from?: string[]
  credibility_score: number
}

export interface SynthesisResult {
  swot_items: SynthesizedSwotItem[]
  merge_log: Array<{
    merged_ids: string[]
    into_item: string
    reason: string
  }>
  discarded: Array<{
    original_text: string
    reason: string
  }>
  stats: {
    total_input: number
    total_output: number
    merged_count: number
    discarded_count: number
  }
}

// ─── STEP 4 TYPES ────────────────────────────────────────────────

export interface TowsStrategy {
  strategy: string
  s_item_ids: string[]
  w_item_ids: string[]
  o_item_ids: string[]
  t_item_ids: string[]
}

export interface HoshinCandidate {
  rank: number
  title: string
  type: 'SO' | 'ST' | 'WO' | 'WT'
  rationale: string
  score: number
  score_breakdown: {
    impact: number
    feasibility: number
    evidence: number
  }
  linked_item_ids: {
    s: string[]
    w: string[]
    o: string[]
    t: string[]
  }
  kpi_suggestion: string
  timeframe: '90_days' | '6_months' | '12_months'
  selected?: boolean
}

export interface TowsResult {
  tows_strategies: {
    SO: TowsStrategy[]
    ST: TowsStrategy[]
    WO: TowsStrategy[]
    WT: TowsStrategy[]
  }
  hoshin_candidates: HoshinCandidate[]
  ai_recommendation: string
}

// ─── PER-ITEM EVIDENCE (POST /api/swot/item-evidence) ────────────

export interface TavilyEvidenceResult {
  title: string
  url: string
  snippet: string
  score: number
  published_date?: string
}

export interface ItemEvidenceResponse {
  query: string
  results: TavilyEvidenceResult[]
  cached: boolean
}

// ─── WORKSHOP (B1 context → B2 ingredients → B3 finalize) ────────

export type IngredientSource = 'ai_draft' | 'chat_extract' | 'manual'

export interface SwotIngredient {
  id: string
  quadrant: SwotQuadrant
  statement: string
  source: IngredientSource
  evidence: TavilyEvidenceResult[]
  isSearching: boolean
  selected: boolean
}

export interface SwotContextData {
  industry: string
  headcount: '1-10' | '10-50' | '50-200'
  mainMarket: string

  revenueRange: '<1B' | '1-5B' | '5-20B' | '20-100B' | '>100B'
  revenueTrend: 'growing' | 'stable' | 'declining'
  coreProducts: string
  targetCustomers: string

  mainCompetitors: string
  competitiveAdvantage: string
  yearGoal: string
  topChallenges: string

  additionalContext?: string
}

export type SwotWorkshopStep = 'context' | 'workshop' | 'finalize'
