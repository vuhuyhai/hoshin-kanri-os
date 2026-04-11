// SWOT AI Coaching — structured context intake + 1-shot draft types

export type AnalysisFramework = '8Ms' | '5Forces' | 'PESTEL'

export interface SwotContextInput {
  orgName: string
  city: string
  industry: string
  headcount: string
  topChallenges: string
  currentStrengths: string
  breakthroughGoal: string
  selectedFrameworks: AnalysisFramework[]
}

export interface SwotDraftItem {
  id: string
  statement: string
  rationale: string
  frameworkSource: AnalysisFramework
  confidence: 'high' | 'medium' | 'low'
  isUserAdded: boolean
}

export type QuadrantKey = 'strengths' | 'weaknesses' | 'opportunities' | 'threats'

export const QUADRANT_LABELS: Record<QuadrantKey, string> = {
  strengths: 'Điểm mạnh',
  weaknesses: 'Điểm yếu',
  opportunities: 'Cơ hội',
  threats: 'Thách thức',
}

export interface SwotDraft {
  strengths: SwotDraftItem[]
  weaknesses: SwotDraftItem[]
  opportunities: SwotDraftItem[]
  threats: SwotDraftItem[]
  generatedAt: string
  frameworksUsed: AnalysisFramework[]
}

export interface SwotCoachingState {
  step: 'form' | 'loading' | 'review' | 'confirmed'
  contextInput: SwotContextInput | null
  draft: SwotDraft | null
  loadingMessage: string
  setStep: (step: SwotCoachingState['step']) => void
  setContextInput: (input: SwotContextInput) => void
  setDraft: (draft: SwotDraft) => void
  setLoadingMessage: (msg: string) => void
  updateDraftItem: (
    quadrant: QuadrantKey,
    itemId: string,
    newStatement: string
  ) => void
  addDraftItem: (quadrant: QuadrantKey) => void
  removeDraftItem: (quadrant: QuadrantKey, itemId: string) => void
  reset: () => void
  // Suggest more
  suggestState: QuadrantSuggestState
  openSuggestDialog: (quadrant: QuadrantKey) => void
  closeSuggestDialog: () => void
  appendSuggestedItems: (quadrant: QuadrantKey, items: SwotDraftItem[]) => void
  // Conflict detection
  conflictResult: ConflictCheckResult | null
  isCheckingConflicts: boolean
  setConflictResult: (result: ConflictCheckResult | null) => void
  setIsCheckingConflicts: (loading: boolean) => void
  dismissConflict: (issueIndex: number) => void
}

// === SUGGEST MORE ===

export interface SuggestMoreRequest {
  quadrant: QuadrantKey
  hint: string
  existingItems: string[]
  contextInput: SwotContextInput
}

export interface SuggestMoreResponse {
  items: Omit<SwotDraftItem, 'id' | 'isUserAdded'>[]
}

export interface QuadrantSuggestState {
  isOpen: boolean
  isLoading: boolean
  quadrant: QuadrantKey | null
}

// === CONFLICT DETECTION ===

export type ConflictType = 'contradiction' | 'duplicate'

export interface ConflictIssue {
  type: ConflictType
  affectedItems: { quadrant: QuadrantKey; itemId: string }[]
  explanation: string
  severity: 'warning' | 'info'
}

export interface ConflictCheckResult {
  hasIssues: boolean
  issues: ConflictIssue[]
  checkedAt: string
}
