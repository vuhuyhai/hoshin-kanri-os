import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  SwotCoachingState,
  SwotContextInput,
  SwotDraft,
  SwotDraftItem,
  QuadrantKey,
  QuadrantSuggestState,
  ConflictCheckResult,
} from './coaching-types'

export const useSwotCoachingStore = create<SwotCoachingState>()(
  persist(
    (set) => ({
      step: 'form',
      contextInput: null,
      draft: null,
      loadingMessage: '',
      suggestState: { isOpen: false, isLoading: false, quadrant: null } as QuadrantSuggestState,
      conflictResult: null as ConflictCheckResult | null,
      isCheckingConflicts: false,

      setStep: (step) => set({ step }),

      setContextInput: (input: SwotContextInput) =>
        set({ contextInput: input }),

      setDraft: (draft: SwotDraft) => set({ draft }),

      setLoadingMessage: (msg: string) => set({ loadingMessage: msg }),

      updateDraftItem: (
        quadrant: QuadrantKey,
        itemId: string,
        newStatement: string
      ) =>
        set((state) => {
          if (!state.draft) return state
          return {
            draft: {
              ...state.draft,
              [quadrant]: state.draft[quadrant].map((item: SwotDraftItem) =>
                item.id === itemId
                  ? { ...item, statement: newStatement }
                  : item
              ),
            },
          }
        }),

      addDraftItem: (quadrant: QuadrantKey) =>
        set((state) => {
          if (!state.draft) return state
          const newItem: SwotDraftItem = {
            id: crypto.randomUUID(),
            statement: '',
            rationale: '',
            frameworkSource: '8Ms',
            confidence: 'medium',
            isUserAdded: true,
          }
          return {
            draft: {
              ...state.draft,
              [quadrant]: [...state.draft[quadrant], newItem],
            },
          }
        }),

      removeDraftItem: (quadrant: QuadrantKey, itemId: string) =>
        set((state) => {
          if (!state.draft) return state
          return {
            draft: {
              ...state.draft,
              [quadrant]: state.draft[quadrant].filter(
                (item: SwotDraftItem) => item.id !== itemId
              ),
            },
          }
        }),

      reset: () =>
        set({
          step: 'form',
          contextInput: null,
          draft: null,
          loadingMessage: '',
          suggestState: { isOpen: false, isLoading: false, quadrant: null },
          conflictResult: null,
          isCheckingConflicts: false,
        }),

      openSuggestDialog: (quadrant: QuadrantKey) =>
        set({ suggestState: { isOpen: true, isLoading: false, quadrant } }),

      closeSuggestDialog: () =>
        set({ suggestState: { isOpen: false, isLoading: false, quadrant: null } }),

      appendSuggestedItems: (quadrant: QuadrantKey, items: SwotDraftItem[]) =>
        set((state) => {
          if (!state.draft) return state
          return {
            draft: {
              ...state.draft,
              [quadrant]: [...state.draft[quadrant], ...items],
            },
          }
        }),

      setConflictResult: (result: ConflictCheckResult | null) =>
        set({ conflictResult: result }),

      setIsCheckingConflicts: (loading: boolean) =>
        set({ isCheckingConflicts: loading }),

      dismissConflict: (issueIndex: number) =>
        set((state) => {
          if (!state.conflictResult) return state
          const issues = state.conflictResult.issues.filter((_, i) => i !== issueIndex)
          return {
            conflictResult: {
              ...state.conflictResult,
              hasIssues: issues.length > 0,
              issues,
            },
          }
        }),
    }),
    {
      name: 'swot-coaching-session',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
