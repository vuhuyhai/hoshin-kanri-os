export type DimensionId =
  | 'strategy'
  | 'execution'
  | 'people'
  | 'finance'
  | 'customer'

export interface XRayOption {
  value: 1 | 2 | 3 | 4
  label: string
}

export interface XRayQuestion {
  id: string
  dimensionId: DimensionId
  text: string
  helpText?: string
  options: XRayOption[]
}

export interface XRayDimension {
  id: DimensionId
  name: string
  description: string
  icon: string
  questions: XRayQuestion[]
}

export type XRayAnswers = Record<string, 1 | 2 | 3 | 4>

export interface DimensionScore {
  dimensionId: DimensionId
  name: string
  score: number
  level: 'critical' | 'weak' | 'moderate' | 'strong'
  feedback: string
  topIssue: string
}

export interface XRayResult {
  email: string
  completedAt: string
  overallScore: number
  overallLevel: 'critical' | 'weak' | 'moderate' | 'strong'
  dimensions: DimensionScore[]
  executiveSummary: string
  topPriorities: string[]
  ctaMessage: string
}

export interface XRayScoreRequest {
  answers: XRayAnswers
  email: string
}

export interface XRayFormState {
  currentStep: number
  answers: XRayAnswers
  email: string
  isLoading: boolean
  result: XRayResult | null
  error: string | null
}
