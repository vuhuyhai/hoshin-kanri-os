// SWOT AI Coaching — structured context intake + 1-shot draft types

import type { XRaySeedContext } from './xray-to-swot-mapper'

export type AnalysisFramework = '8Ms' | '5Forces' | 'PESTEL'

export interface SelectedElements {
  eightMs: string[]
  fiveForces: string[]
  pestel: string[]
}

export interface SwotContextInput {
  orgName: string
  city: string
  industry: string
  headcount: string
  topChallenges: string
  currentStrengths: string
  breakthroughGoal: string
  selectedFrameworks: AnalysisFramework[]
  selectedElements?: SelectedElements
  xrayContext?: XRaySeedContext
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
