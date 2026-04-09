// Pain Mapper
export interface PainPoint {
  id: string
  text: string
}

export interface HoshinCandidate {
  id: string
  hoshin: string
  rationale: string
  painSource: string
  priority: 'high' | 'medium' | 'low'
}

export interface PainMapperResult {
  painPoints: PainPoint[]
  candidates: HoshinCandidate[]
  savedAt: string
}

// Vision Workshop
export interface VisionPrompt {
  id: string
  question: string
  placeholder: string
}

export type VisionAnswers = Record<string, string>

export interface VisionDraft {
  visionStatement: string
  yearGoals: string[]
  timeframe: string
}

// KPI Benchmark
export type IndustryId =
  | 'fitness'
  | 'fnb'
  | 'b2b_services'
  | 'retail'
  | 'education'

export interface BenchmarkKpi {
  id: string
  name: string
  unit: string
  frequency: 'daily' | 'weekly' | 'monthly'
  median: number
  top25: number
  top10: number
  description: string
  dept_level: 'company' | 'dept'
}

export interface IndustryBenchmark {
  id: IndustryId
  name: string
  icon: string
  kpis: BenchmarkKpi[]
}

export interface SelectedBenchmarkKpi {
  kpiId: string
  name: string
  unit: string
  targetValue: number
  frequency: 'daily' | 'weekly' | 'monthly'
  dept_level: 'company' | 'dept'
}

// AI Synthesis
export interface XMatrixPrefill {
  vision: string
  yearGoals: string[]
  hoshinCandidates: PrefillHoshin[]
  initiatives: PrefillInitiative[]
  kpiSuggestions: PrefillKpi[]
  generatedAt: string
  discoveryCompleteness: number
  warnings: string[]
}

export interface PrefillHoshin {
  id: string
  title: string
  description: string
  sourceType: 'pain' | 'swot' | 'ai'
  swotLinks: string[]
}

export interface PrefillInitiative {
  id: string
  hoshinId: string
  title: string
  timeframe: '30d' | '60d' | '90d'
}

export interface PrefillKpi {
  hoshinId: string
  name: string
  unit: string
  targetValue: number
  frequency: 'weekly' | 'monthly'
  dept_level: 'company' | 'dept'
}

// Session data
export interface PainMapperSessionData {
  painPoints: PainPoint[]
  candidates: HoshinCandidate[]
}

export interface VisionSessionData {
  answers: VisionAnswers
  draft: VisionDraft
  finalVision: string
  finalGoals: string[]
}

export interface SynthesisSessionData {
  prefill: XMatrixPrefill
  readyForXMatrix: boolean
}

// API types
export interface PainMapperRequest {
  painPoints: PainPoint[]
  orgContext: { industry: string; city: string; orgName: string }
}

export interface PainMapperResponse {
  candidates: HoshinCandidate[]
}

export interface VisionDraftRequest {
  answers: VisionAnswers
  orgContext: { industry: string; orgName: string; headcount: string }
}

export interface VisionDraftResponse {
  draft: VisionDraft
}

export interface VisionSaveRequest {
  finalVision: string
  finalGoals: string[]
  answers: VisionAnswers
  draft: VisionDraft
}

export interface SynthesisRequest {
  orgId: string
  orgContext: {
    orgName: string
    industry: string
    city: string
    headcount: string
  }
}

export interface SynthesisResponse {
  prefill: XMatrixPrefill
}
