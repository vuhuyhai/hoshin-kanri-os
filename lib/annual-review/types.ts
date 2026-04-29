export type ReviewStatus = 'draft' | 'completed' | 'transitioned'
export type CarryOverDecision = 'carry' | 'drop' | 'modify' | 'pending'

export interface A3Reflection {
  background: string
  currentState: string
  targetGap: string
  nextAction: string
}

export interface KpiActualEntry {
  kpiId: string
  actualValue: number
  achievementPct: number
  note?: string
}

export interface CarryOverEntry {
  sourceHoshinId: string
  decision: CarryOverDecision
  modifiedTitle?: string
  rationale?: string
}

export interface AnnualReview {
  id: string
  xMatrixId: string
  status: ReviewStatus
  reviewedAt?: string
  a3: A3Reflection
  kpiActuals: KpiActualEntry[]
  carryOvers: CarryOverEntry[]
}
