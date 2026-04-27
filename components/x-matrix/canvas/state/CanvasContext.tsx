'use client'

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import { LIMITS, type XMatrixHoshin } from '@/lib/x-matrix/types'
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

// Dot-notation address for a single field within state.data.
// e.g. "vision", "yearGoals.0.title", "hoshins.2.kpis.0.targetValue"
export type FieldPath = string

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface CanvasUiState {
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  aiSuggestedFields: Set<FieldPath>
  errors: Map<FieldPath, string>
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
  | { type: 'CLEAR_DRAFT' }

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
  aiSuggestedFields: new Set<FieldPath>(),
  errors: new Map<FieldPath, string>(),
}

const initialState: CanvasState = {
  data: initialData,
  ui: initialUi,
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
      // TODO: Task 4 — merge AI prefill into state.data + populate
      // ui.aiSuggestedFields with payload.suggestedFields paths.
      return state

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

    case 'CLEAR_DRAFT':
      return {
        data: initialData,
        ui: {
          ...initialUi,
          aiSuggestedFields: new Set<FieldPath>(),
          errors: new Map<FieldPath, string>(),
        },
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
}

const CanvasContext = createContext<CanvasContextValue | null>(null)

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialState)
  return (
    <CanvasContext.Provider value={{ state, dispatch }}>
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
