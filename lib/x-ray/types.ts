export type OpexPillar =
  | 'lean'
  | 'six_sigma'
  | 'workplace'
  | 'value_chain'
  | 'cx'
  | 'value_innovation'
  | 'value_ai'

export interface XRayOption {
  value: number // 1 | 2 | 3 | 4
  label: string
}

export interface XRayQuestion {
  id: string
  pillar: OpexPillar
  question: string
  helpText: string
  options: XRayOption[]
}

export type ScoreLevel = 'critical' | 'weak' | 'moderate' | 'strong'

export interface PillarScore {
  pillar: OpexPillar
  label: string
  icon: string
  score: number // 0-100
  level: ScoreLevel
  summary: string
  topIssue: string
}

export interface XRayResult {
  orgName: string
  industry: string
  overallScore: number
  overallLevel: ScoreLevel
  executiveSummary: string
  pillarScores: PillarScore[]
  topActions: string[] // top 3
  generatedAt: string
}

// Score level thresholds
// 0-25:  critical  -> "Nguy hiem"
// 26-50: weak      -> "Yeu"
// 51-75: moderate  -> "Trung binh"
// 76-100: strong   -> "Tot"

export interface CompanyInfo {
  email: string
  companyName: string
  industry: string
  headcount: '1-10' | '10-50' | '50-200'
}

export interface XRayScoreRequest {
  answers: Record<string, number>
  companyInfo: CompanyInfo
}

export interface XRayFormState {
  currentStep: number
  answers: Record<string, number>
  companyInfo: CompanyInfo
  isLoading: boolean
  result: XRayResult | null
  error: string | null
}
