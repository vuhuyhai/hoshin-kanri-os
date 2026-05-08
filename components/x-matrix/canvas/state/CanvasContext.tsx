'use client'

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react'
import {
  LIMITS,
  type XMatrixData,
  type XMatrixHoshin,
} from '@/lib/x-matrix/types'
import type { Database } from '@/lib/supabase/types'
import { fetchJson, postJson } from '@/lib/http/fetch-json'
import { genHoshinId } from '@/lib/x-matrix/utils'

// ============================================================
// Canvas-local types
// ============================================================
// Year goals in the canvas carry a description in addition to the title.
// The persisted XMatrixData.yearGoals is still string[] — Task 6 maps
// these objects back to strings (or extends vision_json) before POST.
export interface XMatrixYearGoal {
  title: string
  description: string
}

// Mirrors the design doc §3.3: persisted XMatrixHoshin extended with an
// optional owner_name (free-text display name in V1).
export interface XMatrixHoshinExtended extends XMatrixHoshin {
  owner_name?: string
}

export interface XMatrixCanvasData {
  vision: string
  yearGoals: XMatrixYearGoal[]
  hoshins: XMatrixHoshinExtended[]
}

export type CorrelationStrength =
  Database['public']['Tables']['xmatrix_correlations']['Row']['strength']

export type CorrelationKey = string

export type CorrelationsMap = Record<CorrelationKey, CorrelationStrength>

export function makeCorrelationKey(
  yearGoalId: string,
  hoshinId: string,
): CorrelationKey {
  return `${yearGoalId}:${hoshinId}`
}

export function getCorrelation(
  map: CorrelationsMap,
  yearGoalId: string,
  hoshinId: string,
): CorrelationStrength {
  return map[makeCorrelationKey(yearGoalId, hoshinId)] ?? 'none'
}

// Dot-notation address for a single field within state.data.
// e.g. "vision", "yearGoals.0.title", "hoshins.2.kpis.0.targetValue"
export type FieldPath = string

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface CoachCacheEntry {
  questions: string[]
  loading: boolean
  error: string | null
}

export type CoachCacheMap = Record<string, CoachCacheEntry>

export interface CanvasUiState {
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  aiSuggestedFields: FieldPath[]
  errors: Map<FieldPath, string>
  correlations: CorrelationsMap
  correlationsLoading: boolean
  correlationsError: string | null
  coachCache: CoachCacheMap
  // M-Member-POV-1: permission flag derived from membership.role at
  // page level (CEO/Manager → true, Member → false). Seeded once via
  // CanvasProvider prop, not mutated by reducer actions. Components
  // subscribe via useCanEdit() instead of prop-drilling 4-5 levels.
  canEdit: boolean
}

export interface CanvasState {
  data: XMatrixCanvasData
  ui: CanvasUiState
}

// ============================================================
// Actions
// ============================================================
export type CanvasAction =
  | { type: 'HYDRATE_FROM_STORAGE'; payload: XMatrixCanvasData }
  | { type: 'ADD_YEAR_GOAL'; payload: { title: string; description: string } }
  | {
      type: 'UPDATE_YEAR_GOAL'
      payload: { index: number; patch: Partial<XMatrixYearGoal> }
    }
  | { type: 'REMOVE_YEAR_GOAL'; payload: { index: number } }
  | {
      type: 'ADD_HOSHIN'
      payload: { hoshin: Omit<XMatrixHoshin, 'id'> & { owner_name?: string } }
    }
  | {
      type: 'UPDATE_HOSHIN'
      payload: {
        index: number
        patch: Partial<XMatrixHoshin> & { owner_name?: string }
      }
    }
  | { type: 'REMOVE_HOSHIN'; payload: { index: number } }
  | {
      type: 'SET_AI_PREFILL'
      payload: { data: XMatrixCanvasData; suggestedFields: FieldPath[] }
    }
  | { type: 'SET_SAVE_STATUS'; payload: SaveStatus }
  | { type: 'SET_VISION'; payload: string }
  | { type: 'CLEAR_DRAFT' }
  | { type: 'LOAD_CORRELATIONS_START' }
  | { type: 'LOAD_CORRELATIONS_SUCCESS'; payload: CorrelationsMap }
  | { type: 'LOAD_CORRELATIONS_ERROR'; payload: string }
  | {
      type: 'SET_CORRELATION'
      payload: {
        yearGoalId: string
        hoshinId: string
        strength: CorrelationStrength
      }
    }
  | {
      type: 'ROLLBACK_CORRELATION'
      payload: {
        yearGoalId: string
        hoshinId: string
        previousStrength: CorrelationStrength
      }
    }
  | { type: 'COACH_FETCH_START'; payload: { key: string } }
  | {
      type: 'COACH_FETCH_SUCCESS'
      payload: { key: string; questions: string[] }
    }
  | { type: 'COACH_FETCH_ERROR'; payload: { key: string; error: string } }

// ============================================================
// Initial state
// ============================================================
const initialData: XMatrixCanvasData = {
  vision: '',
  yearGoals: [],
  hoshins: [],
}

const initialUi: CanvasUiState = {
  saveStatus: 'idle',
  lastSavedAt: null,
  aiSuggestedFields: [],
  errors: new Map<FieldPath, string>(),
  correlations: {},
  correlationsLoading: false,
  correlationsError: null,
  coachCache: {},
  canEdit: false,
}

const initialState: CanvasState = {
  data: initialData,
  ui: initialUi,
}

// DB stores XMatrixData (yearGoals: string[]); canvas state uses
// XMatrixYearGoal[] (object with title/description). Inflate strings
// into objects at hydrate time so the canvas editors stay typed.
function dbToCanvas(data: XMatrixData): XMatrixCanvasData {
  return {
    vision: data.vision,
    yearGoals: data.yearGoals.map((title) => ({ title, description: '' })),
    hoshins: data.hoshins,
  }
}

// ============================================================
// Reducer
// ============================================================
export function canvasReducer(
  state: CanvasState,
  action: CanvasAction
): CanvasState {
  switch (action.type) {
    case 'HYDRATE_FROM_STORAGE':
      return { ...state, data: action.payload }

    case 'ADD_YEAR_GOAL': {
      if (state.data.yearGoals.length >= LIMITS.MAX_YEAR_GOALS) {
        console.error(
          `[Canvas] ADD_YEAR_GOAL rejected: already at MAX_YEAR_GOALS (${LIMITS.MAX_YEAR_GOALS})`
        )
        return state
      }
      const next: XMatrixYearGoal = {
        title: action.payload.title,
        description: action.payload.description,
      }
      return {
        ...state,
        data: {
          ...state.data,
          yearGoals: [...state.data.yearGoals, next],
        },
      }
    }

    case 'UPDATE_YEAR_GOAL': {
      const { index, patch } = action.payload
      if (index < 0 || index >= state.data.yearGoals.length) return state
      const yearGoals = state.data.yearGoals.map((g, i) =>
        i === index ? { ...g, ...patch } : g
      )
      return { ...state, data: { ...state.data, yearGoals } }
    }

    case 'REMOVE_YEAR_GOAL': {
      const { index } = action.payload
      if (index < 0 || index >= state.data.yearGoals.length) return state
      const yearGoals = state.data.yearGoals.filter((_, i) => i !== index)
      return { ...state, data: { ...state.data, yearGoals } }
    }

    case 'ADD_HOSHIN': {
      if (state.data.hoshins.length >= LIMITS.MAX_HOSHINS) {
        console.error(
          `[Canvas] ADD_HOSHIN rejected: already at MAX_HOSHINS (${LIMITS.MAX_HOSHINS})`
        )
        return state
      }
      const idx = state.data.hoshins.length
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? genHoshinId(idx)
          : genHoshinId(idx)
      const next: XMatrixHoshinExtended = {
        id,
        title: action.payload.hoshin.title ?? '',
        description: action.payload.hoshin.description ?? '',
        initiatives: action.payload.hoshin.initiatives ?? [],
        kpis: action.payload.hoshin.kpis ?? [],
        status: action.payload.hoshin.status ?? 'manual',
        sourceSwotCellType: action.payload.hoshin.sourceSwotCellType,
        suggestedKpis: action.payload.hoshin.suggestedKpis,
        owner_name: action.payload.hoshin.owner_name,
      }
      return {
        ...state,
        data: {
          ...state.data,
          hoshins: [...state.data.hoshins, next],
        },
      }
    }

    case 'UPDATE_HOSHIN': {
      const { index, patch } = action.payload
      if (index < 0 || index >= state.data.hoshins.length) return state
      const hoshins = state.data.hoshins.map((h, i) =>
        i === index ? { ...h, ...patch } : h
      )
      return { ...state, data: { ...state.data, hoshins } }
    }

    case 'REMOVE_HOSHIN': {
      const { index } = action.payload
      if (index < 0 || index >= state.data.hoshins.length) return state
      const hoshins = state.data.hoshins.filter((_, i) => i !== index)
      return { ...state, data: { ...state.data, hoshins } }
    }

    case 'SET_AI_PREFILL':
      return {
        ...state,
        data: action.payload.data,
        ui: {
          ...state.ui,
          aiSuggestedFields: action.payload.suggestedFields,
        },
      }

    case 'SET_SAVE_STATUS': {
      const status = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          saveStatus: status,
          lastSavedAt: status === 'saved' ? new Date() : state.ui.lastSavedAt,
        },
      }
    }

    case 'SET_VISION':
      return {
        ...state,
        data: { ...state.data, vision: action.payload },
      }

    case 'CLEAR_DRAFT':
      return {
        data: initialData,
        ui: {
          ...initialUi,
          aiSuggestedFields: [],
          errors: new Map<FieldPath, string>(),
          // Permission must survive draft clear — CEO clearing draft
          // shouldn't lose edit affordances.
          canEdit: state.ui.canEdit,
        },
      }

    case 'LOAD_CORRELATIONS_START':
      return {
        ...state,
        ui: {
          ...state.ui,
          correlationsLoading: true,
          correlationsError: null,
        },
      }

    case 'LOAD_CORRELATIONS_SUCCESS':
      return {
        ...state,
        ui: {
          ...state.ui,
          correlations: action.payload,
          correlationsLoading: false,
          correlationsError: null,
        },
      }

    case 'LOAD_CORRELATIONS_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          correlationsLoading: false,
          correlationsError: action.payload,
        },
      }

    case 'SET_CORRELATION': {
      const { yearGoalId, hoshinId, strength } = action.payload
      const key = makeCorrelationKey(yearGoalId, hoshinId)
      return {
        ...state,
        ui: {
          ...state.ui,
          correlations: { ...state.ui.correlations, [key]: strength },
        },
      }
    }

    case 'ROLLBACK_CORRELATION': {
      const { yearGoalId, hoshinId, previousStrength } = action.payload
      const key = makeCorrelationKey(yearGoalId, hoshinId)
      return {
        ...state,
        ui: {
          ...state.ui,
          correlations: {
            ...state.ui.correlations,
            [key]: previousStrength,
          },
        },
      }
    }

    case 'COACH_FETCH_START': {
      const { key } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          coachCache: {
            ...state.ui.coachCache,
            [key]: { questions: [], loading: true, error: null },
          },
        },
      }
    }

    case 'COACH_FETCH_SUCCESS': {
      const { key, questions } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          coachCache: {
            ...state.ui.coachCache,
            [key]: { questions, loading: false, error: null },
          },
        },
      }
    }

    case 'COACH_FETCH_ERROR': {
      const { key, error } = action.payload
      return {
        ...state,
        ui: {
          ...state.ui,
          coachCache: {
            ...state.ui.coachCache,
            [key]: { questions: [], loading: false, error },
          },
        },
      }
    }

    default:
      return state
  }
}

// ============================================================
// Context + Provider + Hook
// ============================================================
interface CanvasContextValue {
  state: CanvasState
  dispatch: Dispatch<CanvasAction>
  xMatrixId?: string
}

const CanvasContext = createContext<CanvasContextValue | null>(null)

export function CanvasProvider({
  children,
  xMatrixId,
  initialData,
  canEdit = false,
}: {
  children: ReactNode
  xMatrixId?: string
  initialData?: XMatrixData
  // Optional with defensive default `false` so the prop can land in
  // Task 2A without breaking XMatrixCanvasPage's existing call site.
  // Task 2B refactors the caller to pass the real role-derived value;
  // until then any caller silently gets read-only state, which is the
  // safe failure mode for permission flags.
  canEdit?: boolean
}) {
  // Seed reducer state from DB initialData (server-fetched matrix) when
  // present. Saved-matrix wins over localStorage draft because the user
  // has already committed it — see useLocalStorageSync, which checks
  // `dbHydrated` via context to skip its own hydrate path.
  // canEdit seeds ui from CanvasProvider prop (derived from
  // membership.role at page level). One-shot seed via reducer init
  // function avoids the SET_CAN_EDIT-in-useEffect flash.
  const [state, dispatch] = useReducer(
    canvasReducer,
    initialState,
    (seed) => ({
      data: initialData ? dbToCanvas(initialData) : seed.data,
      ui: { ...seed.ui, canEdit },
    }),
  )

  const hasFetchedCorrelations = useRef(false)
  useEffect(() => {
    if (!xMatrixId) return
    if (hasFetchedCorrelations.current) return
    hasFetchedCorrelations.current = true

    dispatch({ type: 'LOAD_CORRELATIONS_START' })
    fetchJson<{
      correlations: Array<{
        yearGoalId: string
        hoshinId: string
        strength: CorrelationStrength
      }>
    }>(`/api/xmatrix/correlations?xMatrixId=${encodeURIComponent(xMatrixId)}`)
      .then((res) => {
        const map: CorrelationsMap = {}
        for (const c of res.correlations) {
          map[makeCorrelationKey(c.yearGoalId, c.hoshinId)] = c.strength
        }
        dispatch({ type: 'LOAD_CORRELATIONS_SUCCESS', payload: map })
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : 'Không thể tải correlations'
        dispatch({ type: 'LOAD_CORRELATIONS_ERROR', payload: message })
      })
  }, [xMatrixId])

  return (
    <CanvasContext.Provider value={{ state, dispatch, xMatrixId }}>
      {children}
    </CanvasContext.Provider>
  )
}

export function useCanvas(): CanvasContextValue {
  const ctx = useContext(CanvasContext)
  if (!ctx) {
    throw new Error('useCanvas must be used within CanvasProvider')
  }
  return ctx
}

// M-Member-POV-1: subscribe directly to permission flag instead of
// prop-drilling canEdit through 4-5 component levels (CanvasGrid →
// edges → cards → modals). Default false honoured by initialUi seed
// + CanvasProvider required prop.
export function useCanEdit(): boolean {
  return useCanvas().state.ui.canEdit
}

export async function setCorrelationOptimistic(
  dispatch: Dispatch<CanvasAction>,
  state: { correlations: CorrelationsMap },
  params: {
    xMatrixId: string
    yearGoalId: string
    hoshinId: string
    strength: CorrelationStrength
  },
): Promise<{ ok: boolean; error?: string }> {
  const { xMatrixId, yearGoalId, hoshinId, strength } = params
  const previousStrength = getCorrelation(
    state.correlations,
    yearGoalId,
    hoshinId,
  )

  dispatch({
    type: 'SET_CORRELATION',
    payload: { yearGoalId, hoshinId, strength },
  })

  try {
    await fetchJson('/api/xmatrix/correlations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ xMatrixId, yearGoalId, hoshinId, strength }),
    })
    return { ok: true }
  } catch (err) {
    dispatch({
      type: 'ROLLBACK_CORRELATION',
      payload: { yearGoalId, hoshinId, previousStrength },
    })
    const message =
      err instanceof Error ? err.message : 'Không thể lưu correlation'
    return { ok: false, error: message }
  }
}

export function collectSuggestedFields(data: XMatrixCanvasData): FieldPath[] {
  const fields: FieldPath[] = []
  if (data.vision.trim() !== '') fields.push('vision')
  data.yearGoals.forEach((g, i) => {
    if (g.title.trim() !== '') fields.push(`yearGoals.${i}.title`)
    if (g.description.trim() !== '') fields.push(`yearGoals.${i}.description`)
  })
  data.hoshins.forEach((h, i) => {
    if (h.title.trim() !== '') fields.push(`hoshins.${i}.title`)
    if (h.owner_name && h.owner_name.trim() !== '')
      fields.push(`hoshins.${i}.owner_name`)
    h.initiatives.forEach((init, j) => {
      if (init.title.trim() !== '')
        fields.push(`hoshins.${i}.initiatives.${j}.title`)
    })
    h.kpis.forEach((kpi, k) => {
      if (kpi.name.trim() !== '') fields.push(`hoshins.${i}.kpis.${k}.name`)
    })
  })
  return fields
}

export async function fetchAiPrefill(): Promise<{
  ok: boolean
  hasPrefill?: boolean
  data?: XMatrixCanvasData
  source?: string
  error?: string
}> {
  try {
    const json = await fetchJson<{
      hasPrefill: boolean
      data: XMatrixData | null
      source?: string
    }>('/api/x-matrix/prefill')

    if (!json.hasPrefill || !json.data) {
      return { ok: true, hasPrefill: false }
    }

    return {
      ok: true,
      hasPrefill: true,
      data: dbToCanvas(json.data),
      source: json.source,
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Không thể tải gợi ý AI'
    return { ok: false, error: message }
  }
}

export async function fetchCoachQuestions(
  dispatch: Dispatch<CanvasAction>,
  cache: CoachCacheMap,
  params: {
    yearGoalId: string
    hoshinId: string
    yearGoalTitle: string
    hoshinTitle: string
    visionContext?: string
  },
): Promise<{ ok: boolean; questions?: string[]; error?: string }> {
  const {
    yearGoalId,
    hoshinId,
    yearGoalTitle,
    hoshinTitle,
    visionContext,
  } = params
  const key = makeCorrelationKey(yearGoalId, hoshinId)

  const existing = cache[key]
  if (existing?.loading) {
    return { ok: false, error: 'Đang tải' }
  }
  if (existing && existing.questions.length > 0) {
    return { ok: true, questions: existing.questions }
  }

  dispatch({ type: 'COACH_FETCH_START', payload: { key } })

  try {
    const res = await postJson<{ questions: string[] }>(
      '/api/xmatrix/coach-correlation',
      { yearGoalTitle, hoshinTitle, visionContext },
    )
    dispatch({
      type: 'COACH_FETCH_SUCCESS',
      payload: { key, questions: res.questions },
    })
    return { ok: true, questions: res.questions }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'Sensei đang nghỉ. Thử lại sau nhé.'
    dispatch({ type: 'COACH_FETCH_ERROR', payload: { key, error: message } })
    return { ok: false, error: message }
  }
}
