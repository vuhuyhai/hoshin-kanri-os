# Phase 2: Persist contextCards in localStorage

**Bug fixed:** #4 (contextCards lost on refresh)
**Priority:** HIGH

## Context

`swot-session-store.ts` line 1134 `partialize` excludes `evidence.contextCards`. When user refreshes after Phase 2, context cards are gone. SynthesisPhase then has empty evidence data.

## Related Code Files

| File | Action | Path |
|------|--------|------|
| swot-session-store.ts | MODIFY | `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\lib\swot\swot-session-store.ts` |

## Implementation Steps

### Step 2.1: Add `contextCards` to partialize

**File:** `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\lib\swot\swot-session-store.ts`

**Why:** contextCards fetched in Phase 2 must survive page refresh so Phase 3 can use them.

Change the `partialize` function (lines 1134-1141) from:
```ts
partialize: (state) => ({
  swotPhase: state.swotPhase,
  coachingTracker: state.coachingTracker,
  coachingMessages: state.coachingMessages.slice(-20),
  coachingCoverage: state.coachingCoverage,
  staleSince: state.staleSince,
  staleReason: state.staleReason,
}),
```

To (combined with Phase 1 change):
```ts
partialize: (state) => ({
  swotPhase: state.swotPhase,
  confirmedDraft: state.confirmedDraft,
  evidence: {
    contextCards: state.evidence.contextCards,
    contextCardsStatus: state.evidence.contextCardsStatus,
  },
  coachingTracker: state.coachingTracker,
  coachingMessages: state.coachingMessages.slice(-20),
  coachingCoverage: state.coachingCoverage,
  staleSince: state.staleSince,
  staleReason: state.staleReason,
}),
```

### Step 2.2: Fix rehydration for evidence.contextCards

**Why:** On rehydrate, the persisted partial `evidence` object will overwrite the full `evidence` object created by `createEmptySession`. Need to merge properly.

Change `onRehydrateStorage` (lines 1142-1154) to merge the persisted evidence fields back in:

```ts
onRehydrateStorage: () => (state) => {
  if (state) {
    const updates: Record<string, unknown> = {}
    if (state.coachingCoverage) {
      const { requiredDimensionsMet, canAdvanceToPhase2 } =
        computeCoverageDerived(state.coachingCoverage)
      updates.requiredDimensionsMet = requiredDimensionsMet
      updates.canAdvanceToPhase2 = canAdvanceToPhase2
    }
    // Restore contextCards into the full evidence object
    const persistedEvidence = (state as any).evidence
    if (persistedEvidence?.contextCards?.length) {
      updates.evidence = {
        ...state.evidence,
        contextCards: persistedEvidence.contextCards,
        contextCardsStatus: persistedEvidence.contextCardsStatus ?? 'complete',
      }
    }
    updates.canAdvanceToPhase3 = (state.evidence?.contextCards?.length ?? 0) > 0
    useSwotStore.setState(updates)
  }
},
```

**Note:** The persisted `evidence` is partial (only `contextCards` + `contextCardsStatus`). On rehydrate, Zustand's persist middleware merges top-level keys, but `evidence` is a nested object. The partial persisted `evidence` would replace the full one from `createEmptySession`, losing fields like `batches`, `allSources`, `status`. The fix above merges them back correctly.

## Success Criteria

- [ ] Fetch context cards in Phase 2, refresh page, cards still visible
- [ ] `useSwotStore.getState().evidence.contextCards` populated after rehydration
- [ ] Other evidence fields (`batches`, `allSources`, `status`) not wiped by rehydration
