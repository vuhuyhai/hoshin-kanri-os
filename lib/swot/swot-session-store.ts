import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { toJson } from '@/lib/utils'
import type {
  ChatMessage,
  CoachingTrackerState,
  FrameworkId,
  ExternalFrameworkChoice,
  DimensionInsight,
  ContextCard,
  SwotQuadrant,
  SwotIngredient,
  SwotContextData,
  SwotWorkshopStep,
  TavilyEvidenceResult,
} from './types'
import type {
  SwotDraft,
  SwotDraftItem,
  SwotContextInput,
  QuadrantKey,
  QuadrantSuggestState,
  ConflictCheckResult,
} from './coaching-types'
import {
  createInitialCoachingTracker,
  getNextDimension,
  getNextFramework,
  getFirstDimension,
  getFirstSelectedDimension,
  findFrameworkForDimension,
  selectCoachingProgress,
} from './coaching-tracker'
import {
  COACHING_QUESTION_BANK,
  REQUIRED_DIMENSIONS,
  MIN_COVERAGE_TO_ADVANCE,
} from './frameworks'

// ============================================================
// COACHING COVERAGE — coverage-based exit condition
// ============================================================

export interface CoachingCoverage {
  answered: Record<string, boolean>
  questionIds: Record<string, boolean>
  totalQuestions: number
  answeredCount: number
}

function createEmptyCoverage(): CoachingCoverage {
  return {
    answered: {},
    questionIds: {},
    totalQuestions: COACHING_QUESTION_BANK.length,
    answeredCount: 0,
  }
}

function computeCoverageDerived(coverage: CoachingCoverage) {
  const answeredCount = Object.values(coverage.answered).filter(Boolean).length
  const requiredDimensionsMet = REQUIRED_DIMENSIONS.every(
    (d) => coverage.answered[d] === true
  )
  const canAdvanceToPhase2 = answeredCount >= MIN_COVERAGE_TO_ADVANCE
  return { answeredCount, requiredDimensionsMet, canAdvanceToPhase2 }
}

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
    contextCards: ContextCard[]
    contextCardsStatus: 'idle' | 'loading' | 'complete' | 'error'
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
    evidence: { status: 'locked', batches: [], allSources: [], contextCards: [], contextCardsStatus: 'idle' },
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

// Per-step upsert helper — DELETE then INSERT for a specific step key
async function upsertStep(
  supabase: ReturnType<typeof createClient>,
  orgId: string,
  userId: string,
  step: string,
  data: Record<string, unknown>
): Promise<string | null> {
  await supabase
    .from('discovery_sessions')
    .delete()
    .eq('org_id', orgId)
    .eq('step_completed', step)

  const { data: inserted } = await supabase
    .from('discovery_sessions')
    .insert({
      org_id: orgId,
      user_id: userId,
      step_completed: step,
      data_json: toJson(data),
    })
    .select('id')
    .single()

  return inserted?.id ?? null
}

// ============================================================
// DEBOUNCE AUTO-SAVE
// ============================================================

let saveTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSave(saveFn: () => Promise<void>) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveFn().catch(() => {})
  }, 2000)
}

// ============================================================
// COACHING WIZARD SLICE — merged from useSwotCoachingStore
// ============================================================

export type CoachingWizardStep = 'form' | 'loading' | 'review' | 'confirmed'

export interface CoachingWizardState {
  step: CoachingWizardStep
  contextInput: SwotContextInput | null
  draft: SwotDraft | null
  loadingMessage: string
  suggestState: QuadrantSuggestState
  conflictResult: ConflictCheckResult | null
  isCheckingConflicts: boolean
}

function createEmptyCoachingWizard(): CoachingWizardState {
  return {
    step: 'form',
    contextInput: null,
    draft: null,
    loadingMessage: '',
    suggestState: { isOpen: false, isLoading: false, quadrant: null },
    conflictResult: null,
    isCheckingConflicts: false,
  }
}

// ============================================================
// PERSIST STORAGE — TTL wrapper + version migration
// ============================================================

const SWOT_STORE_NAME = 'hoshin-swot-session'
const SWOT_STORE_VERSION = 2
const SWOT_STORE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface PersistedEnvelope {
  state?: { __savedAt?: number } & Record<string, unknown>
  version?: number
}

function createTtlLocalStorage(ttlMs: number): StateStorage {
  return {
    getItem: (key) => {
      if (typeof window === 'undefined') return null
      const raw = window.localStorage.getItem(key)
      if (!raw) return null
      try {
        const parsed = JSON.parse(raw) as PersistedEnvelope
        const savedAt = parsed.state?.__savedAt
        if (typeof savedAt === 'number' && Date.now() - savedAt > ttlMs) {
          window.localStorage.removeItem(key)
          return null
        }
      } catch {
        // malformed — let zustand handle
      }
      return raw
    },
    setItem: (key, value) => {
      if (typeof window === 'undefined') return
      try {
        const parsed = JSON.parse(value) as PersistedEnvelope
        if (parsed.state) {
          parsed.state.__savedAt = Date.now()
          window.localStorage.setItem(key, JSON.stringify(parsed))
          return
        }
      } catch {
        // fall through
      }
      window.localStorage.setItem(key, value)
    },
    removeItem: (key) => {
      if (typeof window === 'undefined') return
      window.localStorage.removeItem(key)
    },
  }
}

// ============================================================
// ZUSTAND STORE
// ============================================================

export type SwotPhaseNumber = 1 | 2 | 3

interface SwotStoreState extends SwotSession {
  isLoading: boolean
  isSaving: boolean

  // Top-level SWOT phase (1=coaching, 2=context, 3=synthesis)
  swotPhase: SwotPhaseNumber
  setSwotPhase: (phase: SwotPhaseNumber) => void

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
  setContextCards: (cards: ContextCard[]) => void
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

  // Coaching coverage
  coachingCoverage: CoachingCoverage
  requiredDimensionsMet: boolean
  canAdvanceToPhase2: boolean
  canAdvanceToPhase3: boolean
  markDimensionAnswered: (dimension_key: string) => void
  markQuestionAsked: (question_id: string) => void
  resetCoverage: () => void

  // Full session reset
  resetSession: () => void

  // Coaching state machine
  coachingTracker: CoachingTrackerState
  coachingMessages: ChatMessage[]

  // SWOT framework toggle (M-AICoach-Sensei-1 Task 6C)
  currentFramework: 'sw' | 'ot'
  swMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  otMessages: Array<{ role: 'user' | 'assistant'; content: string }>

  updateCoachingTracker: (partial: Partial<CoachingTrackerState>) => void
  addCoachingInsight: (framework: FrameworkId, insight: DimensionInsight) => void
  advanceDimension: () => void
  advanceFramework: () => void
  resetCoaching: () => void
  addCoachingMessage: (msg: ChatMessage) => void
  setCoachingMessages: (msgs: ChatMessage[]) => void
  setCurrentFramework: (fw: 'sw' | 'ot') => void
  setSwMessages: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void
  setOtMessages: (messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void
  getCoachingProgress: () => {
    totalDimensions: number
    completedCount: number
    percentage: number
  }

  // Confirmed draft from Phase 1
  confirmedDraft: SwotDraft | null
  setConfirmedDraft: (draft: SwotDraft) => void

  // Coaching wizard (Step 1) — merged from useSwotCoachingStore
  coachingWizard: CoachingWizardState
  setCoachingStep: (step: CoachingWizardStep) => void
  setCoachingContextInput: (input: SwotContextInput) => void
  setCoachingDraft: (draft: SwotDraft) => void
  setCoachingLoadingMessage: (msg: string) => void
  updateCoachingDraftItem: (quadrant: QuadrantKey, itemId: string, newStatement: string) => void
  addCoachingDraftItem: (quadrant: QuadrantKey) => void
  removeCoachingDraftItem: (quadrant: QuadrantKey, itemId: string) => void
  appendCoachingSuggestedItems: (quadrant: QuadrantKey, items: SwotDraftItem[]) => void
  openCoachingSuggestDialog: (quadrant: QuadrantKey) => void
  closeCoachingSuggestDialog: () => void
  setCoachingConflictResult: (result: ConflictCheckResult | null) => void
  setCoachingIsCheckingConflicts: (loading: boolean) => void
  dismissCoachingConflict: (issueIndex: number) => void
  resetCoachingWizard: () => void

  // Intro screen actions
  startCoaching: (
    selectedDimensions: Record<FrameworkId, string[]>,
    selectedExternalFramework: ExternalFrameworkChoice
  ) => void
  jumpToDimension: (dimension: string) => void

  // Workshop slice — B1 context → B2 ingredients → B3 finalize
  workshopStep: SwotWorkshopStep
  contextData: SwotContextData | null
  ingredients: SwotIngredient[]
  activeEvidenceItemId: string | null

  setWorkshopStep: (step: SwotWorkshopStep) => void
  setContextData: (data: SwotContextData) => void
  setIngredients: (items: SwotIngredient[]) => void
  addIngredient: (
    item: Omit<SwotIngredient, 'selected' | 'isSearching' | 'evidence'>
  ) => void
  updateIngredient: (id: string, patch: Partial<SwotIngredient>) => void
  removeIngredient: (id: string) => void
  toggleIngredientSelected: (id: string) => void
  selectAllByQuadrant: (quadrant: SwotQuadrant) => void
  setItemEvidence: (id: string, evidence: TavilyEvidenceResult[]) => void
  setItemSearching: (id: string, loading: boolean) => void
  setActiveEvidenceItemId: (id: string | null) => void
  getByQuadrant: (quadrant: SwotQuadrant) => SwotIngredient[]
  getSelectedIngredients: () => SwotIngredient[]
}

// Module-level synthesis recovery timer — resets stuck 'in_progress' status
let _synthesisRecoveryTimer: ReturnType<typeof setTimeout> | null = null
function clearSynthesisRecovery() {
  if (_synthesisRecoveryTimer) {
    clearTimeout(_synthesisRecoveryTimer)
    _synthesisRecoveryTimer = null
  }
}

export const useSwotStore = create<SwotStoreState>()(
  persist(
    (set, get) => ({
  // Initial empty state
  ...createEmptySession(''),
  isLoading: false,
  isSaving: false,
  swotPhase: 1 as SwotPhaseNumber,

  setSwotPhase: (phase: SwotPhaseNumber) => {
    set({ swotPhase: phase })
  },

  // Confirmed draft from Phase 1
  confirmedDraft: null as SwotDraft | null,

  // Coaching wizard (Step 1) — initial state
  coachingWizard: createEmptyCoachingWizard(),

  // Coaching state machine
  coachingTracker: createInitialCoachingTracker(),
  coachingMessages: [] as ChatMessage[],

  // SWOT framework toggle (Task 6C)
  currentFramework: 'sw' as 'sw' | 'ot',
  swMessages: [] as Array<{ role: 'user' | 'assistant'; content: string }>,
  otMessages: [] as Array<{ role: 'user' | 'assistant'; content: string }>,

  // Coaching coverage
  coachingCoverage: createEmptyCoverage(),
  requiredDimensionsMet: false,
  canAdvanceToPhase2: false,
  canAdvanceToPhase3: false,

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

      // Load all SWOT step records for this org
      const { data: rows } = await supabase
        .from('discovery_sessions')
        .select('step_completed, data_json')
        .eq('org_id', orgId)
        .in('step_completed', [
          'swot_coaching',
          'swot_coaching_draft',
          'swot_evidence',
          'swot_synthesis',
          'swot_strategy',
        ])

      const session = createEmptySession(orgId)
      let restoredDraft: SwotDraft | null = null

      for (const row of rows ?? []) {
        const d = row.data_json as Record<string, unknown>
        switch (row.step_completed) {
          case 'swot_coaching': {
            const completedAt = d.completedAt as string | null
            session.coaching = {
              ...session.coaching,
              status: completedAt ? 'completed' : 'in_progress',
              completedAt: completedAt ?? undefined,
            }
            if (completedAt) {
              session.evidence = {
                ...session.evidence,
                status:
                  session.evidence.status === 'locked'
                    ? 'not_started'
                    : session.evidence.status,
              }
            }
            break
          }
          case 'swot_coaching_draft': {
            // Restore confirmedDraft from DB — survives localStorage clear
            const draft = d.draft as SwotDraft | undefined
            if (draft) {
              restoredDraft = draft
            }
            break
          }
          case 'swot_evidence': {
            session.evidence = {
              status: (d.status as PhaseStatus) ?? 'not_started',
              completedAt: (d.completedAt as string) ?? undefined,
              batches: (d.batches as EvidenceBatch[]) ?? [],
              allSources: (d.allSources as EvidenceSource[]) ?? [],
              contextCards: (d.contextCards as ContextCard[]) ?? [],
              contextCardsStatus: (d.contextCardsStatus as 'idle' | 'loading' | 'complete' | 'error') ?? 'idle',
            }
            break
          }
          case 'swot_synthesis': {
            // DB stores SynthesizedSwotItem[] (quadrant field) — transform to store SwotItem[] (category field)
            const rawItems = (d.items as Array<Record<string, unknown>>) ?? []
            const storeItems: SwotItem[] = rawItems.map((item) => ({
              id: (item.id as string) ?? crypto.randomUUID(),
              category: (item.category ?? item.quadrant ?? 'S') as SwotCategory,
              statement: (item.statement as string) ?? '',
              evidence: (item.evidence as SwotItemEvidence) ?? { ceoInput: [], webSources: [] },
              implication: (item.implication as string) ?? '',
              rootCause: (item.rootCause as string) ?? '',
              priority: (item.priority as 1 | 2 | 3) ?? 1,
            }))
            session.synthesis = {
              status: (d.status as PhaseStatus) ?? 'not_started',
              completedAt: (d.completedAt as string) ?? undefined,
              items: storeItems,
            }
            break
          }
          case 'swot_strategy': {
            session.strategy = {
              status: (d.status as PhaseStatus) ?? 'not_started',
              completedAt: (d.completedAt as string) ?? undefined,
              matrix: (d.matrix as typeof session.strategy.matrix) ??
                session.strategy.matrix,
              candidates: (d.candidates as HoshinCandidate[]) ?? [],
            }
            break
          }
        }
      }

      // Merge restored draft — prefer localStorage (more recent) over DB
      const currentDraft = get().confirmedDraft
      set({
        ...session,
        orgId,
        isLoading: false,
        confirmedDraft: currentDraft ?? restoredDraft,
      })
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

      const now = new Date().toISOString()

      // Per-step save — only steps this store owns (NOT swot_coaching)
      if (state.evidence.status !== 'locked') {
        await upsertStep(supabase, state.orgId, user.id, 'swot_evidence', {
          step: 'swot_evidence',
          status: state.evidence.status,
          batches: state.evidence.batches,
          allSources: state.evidence.allSources,
          completedAt: state.evidence.completedAt ?? null,
          savedAt: now,
        })
      }

      if (state.synthesis.status !== 'locked') {
        await upsertStep(supabase, state.orgId, user.id, 'swot_synthesis', {
          step: 'swot_synthesis',
          status: state.synthesis.status,
          items: state.synthesis.items,
          completedAt: state.synthesis.completedAt ?? null,
          savedAt: now,
        })
      }

      if (state.strategy.status !== 'locked') {
        await upsertStep(supabase, state.orgId, user.id, 'swot_strategy', {
          step: 'swot_strategy',
          status: state.strategy.status,
          matrix: state.strategy.matrix,
          candidates: state.strategy.candidates,
          completedAt: state.strategy.completedAt ?? null,
          savedAt: now,
        })
      }

      set({ lastSaved: now, isSaving: false })
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
            coachingWizard: createEmptyCoachingWizard(),
            confirmedDraft: null,
            evidence: { status: 'locked', batches: [], allSources: [], contextCards: [], contextCardsStatus: 'idle' },
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
            evidence: { status: 'not_started', batches: [], allSources: [], contextCards: [], contextCardsStatus: 'idle' as const },
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
  // CONFIRMED DRAFT
  // ============================================================

  setConfirmedDraft: (draft: SwotDraft) => {
    set({ confirmedDraft: draft })
  },

  // ============================================================
  // COACHING WIZARD (STEP 1) — merged from useSwotCoachingStore
  // ============================================================
  //
  // Sync invariant: if the user edits the working draft after having
  // already confirmed, we clear confirmedDraft so downstream steps
  // (Context/Synthesis) don't operate on stale data. They must
  // re-confirm through SwotConfirmButton.

  setCoachingStep: (step) =>
    set((state) => ({ coachingWizard: { ...state.coachingWizard, step } })),

  setCoachingContextInput: (input) =>
    set((state) => ({ coachingWizard: { ...state.coachingWizard, contextInput: input } })),

  setCoachingDraft: (draft) =>
    set((state) => ({
      coachingWizard: { ...state.coachingWizard, draft },
      // Replacing draft wholesale invalidates previous confirmation
      confirmedDraft: null,
    })),

  setCoachingLoadingMessage: (msg) =>
    set((state) => ({ coachingWizard: { ...state.coachingWizard, loadingMessage: msg } })),

  updateCoachingDraftItem: (quadrant, itemId, newStatement) =>
    set((state) => {
      if (!state.coachingWizard.draft) return state
      return {
        coachingWizard: {
          ...state.coachingWizard,
          draft: {
            ...state.coachingWizard.draft,
            [quadrant]: state.coachingWizard.draft[quadrant].map((item: SwotDraftItem) =>
              item.id === itemId ? { ...item, statement: newStatement } : item
            ),
          },
        },
        confirmedDraft: null,
      }
    }),

  addCoachingDraftItem: (quadrant) =>
    set((state) => {
      if (!state.coachingWizard.draft) return state
      const newItem: SwotDraftItem = {
        id: crypto.randomUUID(),
        statement: '',
        rationale: '',
        frameworkSource: '8Ms',
        confidence: 'medium',
        isUserAdded: true,
      }
      return {
        coachingWizard: {
          ...state.coachingWizard,
          draft: {
            ...state.coachingWizard.draft,
            [quadrant]: [...state.coachingWizard.draft[quadrant], newItem],
          },
        },
        confirmedDraft: null,
      }
    }),

  removeCoachingDraftItem: (quadrant, itemId) =>
    set((state) => {
      if (!state.coachingWizard.draft) return state
      return {
        coachingWizard: {
          ...state.coachingWizard,
          draft: {
            ...state.coachingWizard.draft,
            [quadrant]: state.coachingWizard.draft[quadrant].filter(
              (item: SwotDraftItem) => item.id !== itemId
            ),
          },
        },
        confirmedDraft: null,
      }
    }),

  appendCoachingSuggestedItems: (quadrant, items) =>
    set((state) => {
      if (!state.coachingWizard.draft) return state
      return {
        coachingWizard: {
          ...state.coachingWizard,
          draft: {
            ...state.coachingWizard.draft,
            [quadrant]: [...state.coachingWizard.draft[quadrant], ...items],
          },
        },
        confirmedDraft: null,
      }
    }),

  openCoachingSuggestDialog: (quadrant) =>
    set((state) => ({
      coachingWizard: {
        ...state.coachingWizard,
        suggestState: { isOpen: true, isLoading: false, quadrant },
      },
    })),

  closeCoachingSuggestDialog: () =>
    set((state) => ({
      coachingWizard: {
        ...state.coachingWizard,
        suggestState: { isOpen: false, isLoading: false, quadrant: null },
      },
    })),

  setCoachingConflictResult: (result) =>
    set((state) => ({
      coachingWizard: { ...state.coachingWizard, conflictResult: result },
    })),

  setCoachingIsCheckingConflicts: (loading) =>
    set((state) => ({
      coachingWizard: { ...state.coachingWizard, isCheckingConflicts: loading },
    })),

  dismissCoachingConflict: (issueIndex) =>
    set((state) => {
      if (!state.coachingWizard.conflictResult) return state
      const issues = state.coachingWizard.conflictResult.issues.filter(
        (_, i) => i !== issueIndex
      )
      return {
        coachingWizard: {
          ...state.coachingWizard,
          conflictResult: {
            ...state.coachingWizard.conflictResult,
            hasIssues: issues.length > 0,
            issues,
          },
        },
      }
    }),

  resetCoachingWizard: () =>
    set({ coachingWizard: createEmptyCoachingWizard() }),

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

  setContextCards: (cards: ContextCard[]) => {
    set((state) => ({
      evidence: {
        ...state.evidence,
        contextCards: cards,
        contextCardsStatus: 'complete' as const,
        status: 'in_progress' as PhaseStatus,
      },
      canAdvanceToPhase3: cards.length > 0,
    }))
    debouncedSave(get().saveSession)
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
    clearSynthesisRecovery()
    set((state) => ({
      synthesis: {
        ...state.synthesis,
        status: 'in_progress' as PhaseStatus,
        items,
      },
    }))
    // Auto-recovery: if still 'in_progress' after 65s → reset to 'error'
    _synthesisRecoveryTimer = setTimeout(() => {
      if (get().synthesis.status === 'in_progress') {
        set((state) => ({
          synthesis: { ...state.synthesis, status: 'error' as PhaseStatus },
        }))
      }
    }, 65000)
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
    clearSynthesisRecovery()
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
  // COACHING COVERAGE
  // ============================================================

  markDimensionAnswered: (dimension_key: string) => {
    set((state) => {
      const updated: CoachingCoverage = {
        ...state.coachingCoverage,
        answered: { ...state.coachingCoverage.answered, [dimension_key]: true },
      }
      const { answeredCount, requiredDimensionsMet, canAdvanceToPhase2 } =
        computeCoverageDerived(updated)
      return {
        coachingCoverage: { ...updated, answeredCount },
        requiredDimensionsMet,
        canAdvanceToPhase2,
      }
    })
  },

  markQuestionAsked: (question_id: string) => {
    set((state) => ({
      coachingCoverage: {
        ...state.coachingCoverage,
        questionIds: { ...state.coachingCoverage.questionIds, [question_id]: true },
      },
    }))
  },

  resetCoverage: () => {
    set({
      coachingCoverage: createEmptyCoverage(),
      requiredDimensionsMet: false,
      canAdvanceToPhase2: false,
    })
  },

  resetSession: () => {
    const orgId = get().orgId
    set({
      ...createEmptySession(orgId),
      swotPhase: 1 as SwotPhaseNumber,
      confirmedDraft: null,
      coachingWizard: createEmptyCoachingWizard(),
      coachingTracker: createInitialCoachingTracker(),
      coachingMessages: [],
      coachingCoverage: createEmptyCoverage(),
      requiredDimensionsMet: false,
      canAdvanceToPhase2: false,
      canAdvanceToPhase3: false,
      staleSince: undefined,
      staleReason: undefined,
    })
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
      coachingCoverage: createEmptyCoverage(),
      requiredDimensionsMet: false,
      canAdvanceToPhase2: false,
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

  setCurrentFramework: (fw) => set({ currentFramework: fw }),
  setSwMessages: (messages) => set({ swMessages: messages }),
  setOtMessages: (messages) => set({ otMessages: messages }),

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

  // ============================================================
  // WORKSHOP — B1 context → B2 ingredients → B3 finalize
  // ============================================================

  workshopStep: 'context' as SwotWorkshopStep,
  contextData: null as SwotContextData | null,
  ingredients: [] as SwotIngredient[],
  activeEvidenceItemId: null as string | null,

  setWorkshopStep: (step) => set({ workshopStep: step }),
  setContextData: (data) => set({ contextData: data }),

  setIngredients: (items) => set({ ingredients: items }),

  addIngredient: (item) =>
    set((state) => ({
      ingredients: [
        ...state.ingredients,
        {
          ...item,
          evidence: [],
          isSearching: false,
          selected: false,
        },
      ],
    })),

  updateIngredient: (id, patch) =>
    set((state) => ({
      ingredients: state.ingredients.map((it) =>
        it.id === id ? { ...it, ...patch } : it
      ),
    })),

  removeIngredient: (id) =>
    set((state) => ({
      ingredients: state.ingredients.filter((it) => it.id !== id),
      activeEvidenceItemId:
        state.activeEvidenceItemId === id ? null : state.activeEvidenceItemId,
    })),

  toggleIngredientSelected: (id) =>
    set((state) => ({
      ingredients: state.ingredients.map((it) =>
        it.id === id ? { ...it, selected: !it.selected } : it
      ),
    })),

  selectAllByQuadrant: (quadrant) =>
    set((state) => ({
      ingredients: state.ingredients.map((it) =>
        it.quadrant === quadrant ? { ...it, selected: true } : it
      ),
    })),

  setItemEvidence: (id, evidence) =>
    set((state) => ({
      ingredients: state.ingredients.map((it) =>
        it.id === id ? { ...it, evidence, isSearching: false } : it
      ),
    })),

  setItemSearching: (id, loading) =>
    set((state) => ({
      ingredients: state.ingredients.map((it) =>
        it.id === id ? { ...it, isSearching: loading } : it
      ),
    })),

  setActiveEvidenceItemId: (id) => set({ activeEvidenceItemId: id }),

  getByQuadrant: (quadrant) =>
    get().ingredients.filter((it) => it.quadrant === quadrant),

  getSelectedIngredients: () =>
    get().ingredients.filter((it) => it.selected),
    }),
    {
      name: SWOT_STORE_NAME,
      version: SWOT_STORE_VERSION,
      storage: createJSONStorage(() => createTtlLocalStorage(SWOT_STORE_TTL_MS)),
      // v1 → v2: schema changed (added coachingWizard slice, migrated from
      // useSwotCoachingStore). Drop old cache — DB (discovery_sessions) is the
      // source of truth and will repopulate on initSession(). Returning an
      // empty object leaves the factory-initialised default state intact after
      // zustand's shallow merge.
      migrate: (persistedState, version) => {
        if (version < SWOT_STORE_VERSION) {
          return {} as SwotStoreState
        }
        return persistedState as SwotStoreState
      },
      partialize: (state) => ({
        swotPhase: state.swotPhase,
        confirmedDraft: state.confirmedDraft,
        workshopStep: state.workshopStep,
        contextData: state.contextData,
        ingredients: state.ingredients,
        // Only persist resumable wizard fields. Transient UI state
        // (loadingMessage, suggestState, conflictResult, isCheckingConflicts)
        // is recomputed on interaction and should not survive a refresh.
        coachingWizard: {
          step: state.coachingWizard.step,
          contextInput: state.coachingWizard.contextInput,
          draft: state.coachingWizard.draft,
          loadingMessage: '',
          suggestState: { isOpen: false, isLoading: false, quadrant: null },
          conflictResult: null,
          isCheckingConflicts: false,
        } satisfies CoachingWizardState,
        coachingTracker: state.coachingTracker,
        coachingMessages: state.coachingMessages.slice(-20),
        currentFramework: state.currentFramework,
        swMessages: state.swMessages.slice(-20),
        otMessages: state.otMessages.slice(-20),
        coachingCoverage: state.coachingCoverage,
        contextCards: state.evidence.contextCards,
        synthesis: state.synthesis,
        staleSince: state.staleSince,
        staleReason: state.staleReason,
      }),
      onRehydrateStorage: () => (state) => {
        // Orphan cleanup: previous version used a separate sessionStorage key
        // for the coaching wizard. Remove it once so stale data can't leak in.
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.removeItem('swot-coaching-session')
          } catch {
            /* noop */
          }
        }

        if (state) {
          const updates: Record<string, unknown> = {}
          if (state.coachingCoverage) {
            const { requiredDimensionsMet, canAdvanceToPhase2 } =
              computeCoverageDerived(state.coachingCoverage)
            updates.requiredDimensionsMet = requiredDimensionsMet
            updates.canAdvanceToPhase2 = canAdvanceToPhase2
          }
          // Restore contextCards from persisted state back into evidence
          const persistedCards = (state as unknown as Record<string, unknown>).contextCards as ContextCard[] | undefined
          if (persistedCards?.length) {
            updates.evidence = {
              ...state.evidence,
              contextCards: persistedCards,
              contextCardsStatus: 'complete' as const,
            }
          }
          updates.canAdvanceToPhase3 = (persistedCards?.length ?? state.evidence?.contextCards?.length ?? 0) > 0
          // Recovery: if synthesis was stuck at 'in_progress' (crash/refresh), reset to 'error'
          if (state.synthesis?.status === 'in_progress') {
            updates.synthesis = {
              ...state.synthesis,
              status: 'error' as const,
            }
          }
          useSwotStore.setState(updates)
        }
      },
    }
  )
)
