import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import type {
  ChatMessage,
  CoachingTrackerState,
  FrameworkId,
  ExternalFrameworkChoice,
  DimensionInsight,
} from './types'
import {
  createInitialCoachingTracker,
  getNextDimension,
  getNextFramework,
  getFirstDimension,
  getFirstSelectedDimension,
  findFrameworkForDimension,
  selectCoachingProgress,
} from './coaching-tracker'

// ============================================================
// TYPES
// ============================================================

export type SwotDimension =
  | '8M_manpower'
  | '8M_machine'
  | '8M_material'
  | '8M_method'
  | '8M_measurement'
  | '8M_mother_nature'
  | '8M_management'
  | '8M_money'
  | 'porter_rivalry'
  | 'porter_buyers'
  | 'porter_suppliers'
  | 'porter_entrants'
  | 'porter_substitutes'
  | 'pestel_political'
  | 'pestel_economic'
  | 'pestel_social'
  | 'pestel_technological'
  | 'pestel_environmental'
  | 'pestel_legal'

export type SwotCategory = 'S' | 'W' | 'O' | 'T'
export type ExtendedCellType = 'SO' | 'ST' | 'WO' | 'WT'
export type PhaseStatus =
  | 'locked'
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'stale'
export type PhaseName = 'coaching' | 'evidence' | 'synthesis' | 'strategy'

// Phase 1 — AI Coaching
export interface CoachingResponse {
  questionId: string
  dimension: SwotDimension
  swotCategory: SwotCategory
  statement: string
  hasEvidence: boolean
  needsEvidence: boolean
  evidenceHint?: string
}

// Phase 2 — Evidence Engine
export type EvidenceSourceType =
  | 'decision_lab'
  | 'vnexpress'
  | 'gso'
  | 'virac'
  | 'other'

export interface EvidenceSource {
  query: string
  url: string
  title: string
  snippet: string
  sourceType: EvidenceSourceType
  relevantToItemId?: string
}

export type EvidenceBatchStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'

export interface EvidenceBatch {
  batchIndex: number
  status: EvidenceBatchStatus
  queries: string[]
  sources: EvidenceSource[]
}

// Phase 3 — Synthesis
export interface SwotItemEvidence {
  ceoInput: string[]
  webSources: EvidenceSource[]
}

export interface SwotItem {
  id: string
  category: SwotCategory
  statement: string
  evidence: SwotItemEvidence
  implication: string
  rootCause: string
  priority: 1 | 2 | 3
}

// Phase 4 — Extended SWOT → Hoshin Candidates
export interface ExtendedSwotCell {
  cellType: ExtendedCellType
  strengthIds?: string[]
  weaknessIds?: string[]
  opportunityIds?: string[]
  threatIds?: string[]
  aiStrategies: string[]
  selectedStrategy?: string
}

export interface HoshinCandidate {
  id: string
  name: string
  description: string
  sourceCellType: ExtendedCellType
  sourceItemIds: string[]
  priority: 1 | 2 | 3 | 4 | 5
  suggestedKpis: string[]
  isSelectedForXMatrix: boolean
}

// Session
export interface SwotSession {
  sessionId?: string
  orgId: string
  lastSaved?: string

  coaching: {
    status: PhaseStatus
    completedAt?: string
    responses: CoachingResponse[]
  }
  evidence: {
    status: PhaseStatus
    completedAt?: string
    batches: EvidenceBatch[]
    allSources: EvidenceSource[]
  }
  synthesis: {
    status: PhaseStatus
    completedAt?: string
    items: SwotItem[]
  }
  strategy: {
    status: PhaseStatus
    completedAt?: string
    matrix: {
      SO: ExtendedSwotCell
      ST: ExtendedSwotCell
      WO: ExtendedSwotCell
      WT: ExtendedSwotCell
    }
    candidates: HoshinCandidate[]
  }

  staleSince?: string
  staleReason?: string
}

// ============================================================
// HELPERS
// ============================================================

function emptyCell(cellType: ExtendedCellType): ExtendedSwotCell {
  return { cellType, aiStrategies: [] }
}

function createEmptySession(orgId: string): SwotSession {
  return {
    orgId,
    coaching: { status: 'not_started', responses: [] },
    evidence: { status: 'locked', batches: [], allSources: [] },
    synthesis: { status: 'locked', items: [] },
    strategy: {
      status: 'locked',
      matrix: {
        SO: emptyCell('SO'),
        ST: emptyCell('ST'),
        WO: emptyCell('WO'),
        WT: emptyCell('WT'),
      },
      candidates: [],
    },
  }
}

function highestCompletedStep(_session: SwotSession): string {
  // Always use 'swot' — granular phase tracking lives in data_json.
  // Using sub-keys (swot_coaching, swot_strategy, etc.) violates the
  // discovery_sessions CHECK constraint and conflicts with coaching-persistence.
  return 'swot'
}

// ============================================================
// DEBOUNCE AUTO-SAVE
// ============================================================

let saveTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSave(saveFn: () => Promise<void>) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveFn().catch((err) => console.error('[swot-store] auto-save error:', err))
  }, 2000)
}

// ============================================================
// ZUSTAND STORE
// ============================================================

interface SwotStoreState extends SwotSession {
  isLoading: boolean
  isSaving: boolean

  // Lifecycle
  initSession: (orgId: string) => Promise<void>
  saveSession: () => Promise<void>
  resetPhase: (phase: PhaseName) => void

  // Phase status
  setPhaseStatus: (phase: PhaseName, status: PhaseStatus) => void
  markStale: (reason: string) => void
  clearStale: () => void

  // Phase 1
  addCoachingResponse: (response: CoachingResponse) => void
  updateCoachingResponse: (
    questionId: string,
    updates: Partial<CoachingResponse>
  ) => void
  completeCoaching: () => void

  // Phase 2
  updateEvidenceBatch: (
    batchIndex: number,
    updates: Partial<EvidenceBatch>
  ) => void
  addSource: (source: EvidenceSource) => void
  completeEvidence: () => void

  // Phase 3
  setSynthesisItems: (items: SwotItem[]) => void
  updateSwotItem: (id: string, updates: Partial<SwotItem>) => void
  completeSynthesis: () => void

  // Phase 4
  setExtendedCell: (
    cellType: ExtendedCellType,
    cell: ExtendedSwotCell
  ) => void
  setHoshinCandidates: (candidates: HoshinCandidate[]) => void
  updateCandidate: (
    id: string,
    updates: Partial<HoshinCandidate>
  ) => void
  toggleCandidateForXMatrix: (id: string) => void
  completeStrategy: () => void

  // Computed
  getPhaseProgress: () => {
    phase: PhaseName
    status: PhaseStatus
    completedAt?: string
  }[]
  canStartPhase: (phase: 'evidence' | 'synthesis' | 'strategy') => boolean
  getXMatrixCandidates: () => HoshinCandidate[]

  // Coaching state machine
  coachingTracker: CoachingTrackerState
  coachingMessages: ChatMessage[]

  updateCoachingTracker: (partial: Partial<CoachingTrackerState>) => void
  addCoachingInsight: (framework: FrameworkId, insight: DimensionInsight) => void
  advanceDimension: () => void
  advanceFramework: () => void
  resetCoaching: () => void
  addCoachingMessage: (msg: ChatMessage) => void
  setCoachingMessages: (msgs: ChatMessage[]) => void
  getCoachingProgress: () => {
    totalDimensions: number
    completedCount: number
    percentage: number
  }

  // Intro screen actions
  startCoaching: (
    selectedDimensions: Record<FrameworkId, string[]>,
    selectedExternalFramework: ExternalFrameworkChoice
  ) => void
  jumpToDimension: (dimension: string) => void
}

export const useSwotStore = create<SwotStoreState>()(
  persist(
    (set, get) => ({
  // Initial empty state
  ...createEmptySession(''),
  isLoading: false,
  isSaving: false,

  // Coaching state machine
  coachingTracker: createInitialCoachingTracker(),
  coachingMessages: [] as ChatMessage[],

  // ============================================================
  // LIFECYCLE
  // ============================================================

  initSession: async (orgId: string) => {
    set({ isLoading: true })
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ ...createEmptySession(orgId), isLoading: false })
        return
      }

      const { data: session } = await supabase
        .from('discovery_sessions')
        .select('id, data_json')
        .eq('org_id', orgId)
        .eq('step_completed', 'swot')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (session?.data_json) {
        const stored = session.data_json as unknown as SwotSession
        set({
          ...stored,
          sessionId: session.id,
          orgId,
          isLoading: false,
        })
      } else {
        set({ ...createEmptySession(orgId), isLoading: false })
      }
    } catch (err) {
      console.error('[swot-store] initSession error:', err)
      set({ ...createEmptySession(orgId), isLoading: false })
    }
  },

  saveSession: async () => {
    const state = get()
    if (!state.orgId || state.isSaving) return

    set({ isSaving: true })
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        set({ isSaving: false })
        return
      }

      const sessionData: SwotSession = {
        sessionId: state.sessionId,
        orgId: state.orgId,
        lastSaved: new Date().toISOString(),
        coaching: state.coaching,
        evidence: state.evidence,
        synthesis: state.synthesis,
        strategy: state.strategy,
        staleSince: state.staleSince,
        staleReason: state.staleReason,
      }

      const stepCompleted = highestCompletedStep(sessionData)

      // Delete existing swot session, then insert (safe upsert)
      await supabase
        .from('discovery_sessions')
        .delete()
        .eq('org_id', state.orgId)
        .eq('step_completed', 'swot')

      const { data: inserted } = await supabase
        .from('discovery_sessions')
        .insert({
          org_id: state.orgId,
          user_id: user.id,
          step_completed: stepCompleted,
          data_json: sessionData as unknown as Json,
        })
        .select('id')
        .single()

      if (inserted) {
        set({ sessionId: inserted.id, lastSaved: sessionData.lastSaved, isSaving: false })
      } else {
        set({ isSaving: false })
      }
    } catch (err) {
      console.error('[swot-store] saveSession error:', err)
      set({ isSaving: false })
    }
  },

  resetPhase: (phase: PhaseName) => {
    set((state) => {
      switch (phase) {
        case 'coaching':
          return {
            coaching: { status: 'not_started', responses: [] },
            evidence: { status: 'locked', batches: [], allSources: [] },
            synthesis: { status: 'locked', items: [] },
            strategy: {
              status: 'locked',
              matrix: {
                SO: emptyCell('SO'),
                ST: emptyCell('ST'),
                WO: emptyCell('WO'),
                WT: emptyCell('WT'),
              },
              candidates: [],
            },
          }
        case 'evidence':
          return {
            evidence: { status: 'not_started', batches: [], allSources: [] },
            synthesis: { ...state.synthesis, status: 'locked' },
            strategy: { ...state.strategy, status: 'locked' },
          }
        case 'synthesis':
          return {
            synthesis: { status: 'not_started', items: [] },
            strategy: { ...state.strategy, status: 'locked' },
          }
        case 'strategy':
          return {
            strategy: {
              status: 'not_started',
              matrix: {
                SO: emptyCell('SO'),
                ST: emptyCell('ST'),
                WO: emptyCell('WO'),
                WT: emptyCell('WT'),
              },
              candidates: [],
            },
          }
      }
    })
    debouncedSave(get().saveSession)
  },

  // ============================================================
  // PHASE STATUS
  // ============================================================

  setPhaseStatus: (phase: PhaseName, status: PhaseStatus) => {
    set((state) => ({
      [phase]: { ...state[phase], status },
    }))
  },

  markStale: (reason: string) => {
    set((state) => ({
      staleSince: new Date().toISOString(),
      staleReason: reason,
      synthesis: { ...state.synthesis, status: 'stale' as PhaseStatus },
      strategy: { ...state.strategy, status: 'stale' as PhaseStatus },
    }))
    debouncedSave(get().saveSession)
  },

  clearStale: () => {
    set({ staleSince: undefined, staleReason: undefined })
  },

  // ============================================================
  // PHASE 1 — COACHING
  // ============================================================

  addCoachingResponse: (response: CoachingResponse) => {
    set((state) => ({
      coaching: {
        ...state.coaching,
        status: 'in_progress' as PhaseStatus,
        responses: [...state.coaching.responses, response],
      },
    }))
    debouncedSave(get().saveSession)
  },

  updateCoachingResponse: (
    questionId: string,
    updates: Partial<CoachingResponse>
  ) => {
    set((state) => ({
      coaching: {
        ...state.coaching,
        responses: state.coaching.responses.map((r) =>
          r.questionId === questionId ? { ...r, ...updates } : r
        ),
      },
    }))
    debouncedSave(get().saveSession)
  },

  completeCoaching: () => {
    const state = get()
    const wasStrategyCompleted = state.strategy.status === 'completed'

    set((s) => ({
      coaching: {
        ...s.coaching,
        status: 'completed' as PhaseStatus,
        completedAt: new Date().toISOString(),
      },
      evidence: {
        ...s.evidence,
        status:
          s.evidence.status === 'locked'
            ? ('not_started' as PhaseStatus)
            : s.evidence.status,
      },
    }))

    // Stale check: if strategy was already completed, mark downstream as stale
    if (wasStrategyCompleted) {
      get().markStale(
        'AI Coaching đã cập nhật. Cần chạy lại Tổng hợp và Hoshin Strategy.'
      )
    } else {
      debouncedSave(get().saveSession)
    }
  },

  // ============================================================
  // PHASE 2 — EVIDENCE
  // ============================================================

  updateEvidenceBatch: (
    batchIndex: number,
    updates: Partial<EvidenceBatch>
  ) => {
    set((state) => ({
      evidence: {
        ...state.evidence,
        status: 'in_progress' as PhaseStatus,
        batches: state.evidence.batches.map((b) =>
          b.batchIndex === batchIndex ? { ...b, ...updates } : b
        ),
      },
    }))
    debouncedSave(get().saveSession)
  },

  addSource: (source: EvidenceSource) => {
    set((state) => ({
      evidence: {
        ...state.evidence,
        allSources: [...state.evidence.allSources, source],
      },
    }))
  },

  completeEvidence: () => {
    set((state) => ({
      evidence: {
        ...state.evidence,
        status: 'completed' as PhaseStatus,
        completedAt: new Date().toISOString(),
      },
      synthesis: {
        ...state.synthesis,
        status:
          state.synthesis.status === 'locked'
            ? ('not_started' as PhaseStatus)
            : state.synthesis.status,
      },
    }))
    debouncedSave(get().saveSession)
  },

  // ============================================================
  // PHASE 3 — SYNTHESIS
  // ============================================================

  setSynthesisItems: (items: SwotItem[]) => {
    set((state) => ({
      synthesis: {
        ...state.synthesis,
        status: 'in_progress' as PhaseStatus,
        items,
      },
    }))
    debouncedSave(get().saveSession)
  },

  updateSwotItem: (id: string, updates: Partial<SwotItem>) => {
    set((state) => ({
      synthesis: {
        ...state.synthesis,
        items: state.synthesis.items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      },
    }))
    debouncedSave(get().saveSession)
  },

  completeSynthesis: () => {
    set((state) => ({
      synthesis: {
        ...state.synthesis,
        status: 'completed' as PhaseStatus,
        completedAt: new Date().toISOString(),
      },
      strategy: {
        ...state.strategy,
        status:
          state.strategy.status === 'locked'
            ? ('not_started' as PhaseStatus)
            : state.strategy.status,
      },
    }))
    debouncedSave(get().saveSession)
  },

  // ============================================================
  // PHASE 4 — STRATEGY
  // ============================================================

  setExtendedCell: (
    cellType: ExtendedCellType,
    cell: ExtendedSwotCell
  ) => {
    set((state) => ({
      strategy: {
        ...state.strategy,
        status: 'in_progress' as PhaseStatus,
        matrix: { ...state.strategy.matrix, [cellType]: cell },
      },
    }))
    debouncedSave(get().saveSession)
  },

  setHoshinCandidates: (candidates: HoshinCandidate[]) => {
    set((state) => ({
      strategy: {
        ...state.strategy,
        candidates,
      },
    }))
    debouncedSave(get().saveSession)
  },

  updateCandidate: (id: string, updates: Partial<HoshinCandidate>) => {
    set((state) => ({
      strategy: {
        ...state.strategy,
        candidates: state.strategy.candidates.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      },
    }))
    debouncedSave(get().saveSession)
  },

  toggleCandidateForXMatrix: (id: string) => {
    set((state) => ({
      strategy: {
        ...state.strategy,
        candidates: state.strategy.candidates.map((c) =>
          c.id === id
            ? { ...c, isSelectedForXMatrix: !c.isSelectedForXMatrix }
            : c
        ),
      },
    }))
    debouncedSave(get().saveSession)
  },

  completeStrategy: () => {
    set((state) => ({
      strategy: {
        ...state.strategy,
        status: 'completed' as PhaseStatus,
        completedAt: new Date().toISOString(),
      },
    }))
    debouncedSave(get().saveSession)
  },

  // ============================================================
  // COMPUTED GETTERS
  // ============================================================

  getPhaseProgress: () => {
    const state = get()
    return [
      {
        phase: 'coaching' as PhaseName,
        status: state.coaching.status,
        completedAt: state.coaching.completedAt,
      },
      {
        phase: 'evidence' as PhaseName,
        status: state.evidence.status,
        completedAt: state.evidence.completedAt,
      },
      {
        phase: 'synthesis' as PhaseName,
        status: state.synthesis.status,
        completedAt: state.synthesis.completedAt,
      },
      {
        phase: 'strategy' as PhaseName,
        status: state.strategy.status,
        completedAt: state.strategy.completedAt,
      },
    ]
  },

  canStartPhase: (phase: 'evidence' | 'synthesis' | 'strategy') => {
    const state = get()
    switch (phase) {
      case 'evidence':
        return state.coaching.status === 'completed'
      case 'synthesis':
        return state.evidence.status === 'completed'
      case 'strategy':
        return state.synthesis.status === 'completed'
    }
  },

  getXMatrixCandidates: () => {
    return get().strategy.candidates.filter((c) => c.isSelectedForXMatrix)
  },

  // ============================================================
  // COACHING STATE MACHINE
  // ============================================================

  updateCoachingTracker: (partial: Partial<CoachingTrackerState>) => {
    set((state) => ({
      coachingTracker: {
        ...state.coachingTracker,
        ...partial,
        lastUpdated: new Date().toISOString(),
      },
    }))
  },

  addCoachingInsight: (framework: FrameworkId, insight: DimensionInsight) => {
    set((state) => ({
      coachingTracker: {
        ...state.coachingTracker,
        insights: {
          ...state.coachingTracker.insights,
          [framework]: [...state.coachingTracker.insights[framework], insight],
        },
        lastUpdated: new Date().toISOString(),
      },
    }))
  },

  advanceDimension: () => {
    const tracker = get().coachingTracker
    const fw = tracker.currentFramework
    const current = tracker.currentDimension

    // Mark current dimension as completed
    const updatedCompleted = { ...tracker.completedDimensions }
    if (!updatedCompleted[fw].includes(current)) {
      updatedCompleted[fw] = [...updatedCompleted[fw], current]
    }

    const next = getNextDimension(fw, current)

    if (next) {
      set({
        coachingTracker: {
          ...tracker,
          currentDimension: next,
          completedDimensions: updatedCompleted,
          currentPhase: 'questioning',
          lastUpdated: new Date().toISOString(),
        },
      })
    } else {
      // Last dimension in framework — mark completed, don't crash
      set({
        coachingTracker: {
          ...tracker,
          completedDimensions: updatedCompleted,
          currentPhase: 'completed',
          lastUpdated: new Date().toISOString(),
        },
      })
    }
  },

  advanceFramework: () => {
    const tracker = get().coachingTracker
    const completedFws = tracker.completedFrameworks.includes(tracker.currentFramework)
      ? tracker.completedFrameworks
      : [...tracker.completedFrameworks, tracker.currentFramework]

    const nextFw = getNextFramework(tracker.currentFramework)

    if (nextFw) {
      set({
        coachingTracker: {
          ...tracker,
          currentFramework: nextFw,
          currentDimension: getFirstDimension(nextFw),
          completedFrameworks: completedFws,
          currentPhase: 'intro',
          lastUpdated: new Date().toISOString(),
        },
      })
    } else {
      // All frameworks done
      set({
        coachingTracker: {
          ...tracker,
          completedFrameworks: completedFws,
          currentPhase: 'completed',
          lastUpdated: new Date().toISOString(),
        },
      })
    }
  },

  resetCoaching: () => {
    set({
      coachingTracker: createInitialCoachingTracker(),
      coachingMessages: [],
    })
  },

  addCoachingMessage: (msg: ChatMessage) => {
    set((state) => ({
      coachingMessages: [...state.coachingMessages, msg],
      coachingTracker: {
        ...state.coachingTracker,
        messageCount: state.coachingTracker.messageCount + 1,
        lastUpdated: new Date().toISOString(),
      },
    }))
  },

  setCoachingMessages: (msgs: ChatMessage[]) => {
    set({ coachingMessages: msgs })
  },

  getCoachingProgress: () => {
    return selectCoachingProgress(get().coachingTracker)
  },

  // ============================================================
  // INTRO SCREEN ACTIONS
  // ============================================================

  startCoaching: (
    selectedDimensions: Record<FrameworkId, string[]>,
    selectedExternalFramework: ExternalFrameworkChoice
  ) => {
    const firstDim = getFirstSelectedDimension('8M', selectedDimensions)
    set((state) => ({
      coachingTracker: {
        ...state.coachingTracker,
        selectedDimensions,
        selectedExternalFramework,
        currentPhase: 'questioning',
        currentFramework: '8M',
        currentDimension: firstDim,
        lastUpdated: new Date().toISOString(),
      },
    }))
  },

  jumpToDimension: (dimension: string) => {
    const tracker = get().coachingTracker
    const targetFw = findFrameworkForDimension(dimension)
    if (!targetFw) return

    // Mark current dimension as completed
    const fw = tracker.currentFramework
    const current = tracker.currentDimension
    const updatedCompleted = { ...tracker.completedDimensions }
    if (!updatedCompleted[fw].includes(current)) {
      updatedCompleted[fw] = [...updatedCompleted[fw], current]
    }

    // If crossing framework boundary, mark current framework as completed
    const updatedFws =
      targetFw !== fw && !tracker.completedFrameworks.includes(fw)
        ? [...tracker.completedFrameworks, fw]
        : tracker.completedFrameworks

    set({
      coachingTracker: {
        ...tracker,
        currentFramework: targetFw,
        currentDimension: dimension,
        currentPhase: 'questioning',
        completedDimensions: updatedCompleted,
        completedFrameworks: updatedFws,
        lastUpdated: new Date().toISOString(),
      },
    })
  },
    }),
    {
      name: 'hoshin-swot-session',
      partialize: (state) => ({
        coachingTracker: state.coachingTracker,
        coachingMessages: state.coachingMessages.slice(-20),
      }),
    }
  )
)
