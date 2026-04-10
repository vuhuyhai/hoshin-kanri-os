import { EIGHT_MS, PORTER_FORCES, PESTEL_FACTORS } from './frameworks'
import type { CoachingTrackerState, FrameworkId } from './types'

// ============================================================
// Dimension sequences — derived from frameworks.ts
// ============================================================

export const DIMENSION_SEQUENCES: Record<FrameworkId, string[]> = {
  '8M': EIGHT_MS.map((d) => d.nameEn),
  Porter: PORTER_FORCES.map((d) => d.nameEn),
  PESTEL: PESTEL_FACTORS.map((d) => d.nameEn),
}

export const FRAMEWORK_SEQUENCE: FrameworkId[] = ['8M', 'Porter', 'PESTEL']

// ============================================================
// Default selections — all dimensions
// ============================================================

export function getDefaultSelectedDimensions(): Record<FrameworkId, string[]> {
  return {
    '8M': [...DIMENSION_SEQUENCES['8M']],
    Porter: [...DIMENSION_SEQUENCES.Porter],
    PESTEL: [...DIMENSION_SEQUENCES.PESTEL],
  }
}

// ============================================================
// Initial state factory
// ============================================================

export function createInitialCoachingTracker(): CoachingTrackerState {
  return {
    currentFramework: '8M',
    currentDimension: DIMENSION_SEQUENCES['8M'][0],
    currentPhase: 'intro',
    completedFrameworks: [],
    completedDimensions: { '8M': [], Porter: [], PESTEL: [] },
    insights: { '8M': [], Porter: [], PESTEL: [] },
    messageCount: 0,
    lastUpdated: new Date().toISOString(),
    selectedDimensions: getDefaultSelectedDimensions(),
    selectedExternalFramework: 'both',
  }
}

// ============================================================
// Navigation helpers
// ============================================================

export function getNextDimension(
  framework: FrameworkId,
  currentDimension: string
): string | null {
  const dims = DIMENSION_SEQUENCES[framework]
  const idx = dims.indexOf(currentDimension)
  if (idx === -1 || idx >= dims.length - 1) return null
  return dims[idx + 1]
}

/** Get next selected dimension within a framework (skips unselected). */
export function getNextSelectedDimension(
  framework: FrameworkId,
  currentDimension: string,
  selectedDimensions: Record<FrameworkId, string[]>
): string | null {
  const allDims = DIMENSION_SEQUENCES[framework]
  const selected = selectedDimensions[framework]
  const idx = allDims.indexOf(currentDimension)
  if (idx === -1) return null
  for (let i = idx + 1; i < allDims.length; i++) {
    if (selected.includes(allDims[i])) return allDims[i]
  }
  return null
}

export function getNextFramework(current: FrameworkId): FrameworkId | null {
  const idx = FRAMEWORK_SEQUENCE.indexOf(current)
  if (idx === -1 || idx >= FRAMEWORK_SEQUENCE.length - 1) return null
  return FRAMEWORK_SEQUENCE[idx + 1]
}

export function getFirstDimension(framework: FrameworkId): string {
  return DIMENSION_SEQUENCES[framework][0]
}

/** Get first selected dimension in a framework. */
export function getFirstSelectedDimension(
  framework: FrameworkId,
  selectedDimensions: Record<FrameworkId, string[]>
): string {
  const selected = selectedDimensions[framework]
  const allDims = DIMENSION_SEQUENCES[framework]
  for (const dim of allDims) {
    if (selected.includes(dim)) return dim
  }
  return allDims[0]
}

// ============================================================
// Progress computation
// ============================================================

export function getTotalDimensions(): number {
  return Object.values(DIMENSION_SEQUENCES).reduce(
    (sum, dims) => sum + dims.length,
    0
  )
}

export function getCompletedCount(
  completedDimensions: Record<FrameworkId, string[]>
): number {
  return Object.values(completedDimensions).reduce(
    (sum, dims) => sum + new Set(dims).size,
    0
  )
}

export function selectCoachingProgress(state: CoachingTrackerState): {
  totalDimensions: number
  completedCount: number
  percentage: number
} {
  // Use selected dimensions for total if available
  const selected = state.selectedDimensions
  const total = selected
    ? Object.values(selected).reduce((sum, dims) => sum + dims.length, 0)
    : getTotalDimensions()
  const completed = Math.min(getCompletedCount(state.completedDimensions), total)
  return {
    totalDimensions: total,
    completedCount: completed,
    percentage: total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0,
  }
}

// ============================================================
// Dimension status helpers (for pills UI)
// ============================================================

export type DimensionStatus = 'completed' | 'active' | 'pending'

export function getDimensionStatus(
  dimension: string,
  framework: FrameworkId,
  tracker: CoachingTrackerState
): DimensionStatus {
  if (tracker.completedDimensions[framework].includes(dimension)) {
    return 'completed'
  }
  if (
    tracker.currentFramework === framework &&
    tracker.currentDimension === dimension
  ) {
    return 'active'
  }
  return 'pending'
}

/** Find which framework a dimension belongs to. */
export function findFrameworkForDimension(
  dimension: string
): FrameworkId | null {
  for (const [fw, dims] of Object.entries(DIMENSION_SEQUENCES)) {
    if (dims.includes(dimension)) return fw as FrameworkId
  }
  return null
}

// ============================================================
// Legacy mapping
// ============================================================

export function frameworkIdToLegacy(fw: FrameworkId): 'sw' | 'ot' {
  return fw === '8M' ? 'sw' : 'ot'
}

export function trackerToCoachingContext(
  tracker: CoachingTrackerState
): {
  currentDimension: string | null
  completedDimensions: string[]
  collectedInsights: {
    framework: '8M' | 'Porter' | 'PESTEL'
    dimension: string
    insight: string
    confidence: 'high' | 'medium' | 'low'
  }[]
} {
  return {
    currentDimension: tracker.currentDimension,
    completedDimensions: Object.values(tracker.completedDimensions).flat(),
    collectedInsights: (
      Object.entries(tracker.insights) as [FrameworkId, typeof tracker.insights[FrameworkId]][]
    ).flatMap(([fw, items]) =>
      items.map((i) => ({
        framework: fw,
        dimension: i.dimension,
        insight: i.insight,
        confidence: i.confidence,
      }))
    ),
  }
}
