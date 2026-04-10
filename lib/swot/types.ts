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
  id?: string
  quadrant: SwotQuadrant
  frameworkSource: FrameworkSourceId
  statement: string
  evidence: EvidenceItem[]
  implication: string
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
  items: SwotItem[]
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
  items: SwotItem[]
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
}

export interface CoachingContext {
  currentDimension: string | null
  completedDimensions: string[]
  collectedInsights: ExtractedInsight[]
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
