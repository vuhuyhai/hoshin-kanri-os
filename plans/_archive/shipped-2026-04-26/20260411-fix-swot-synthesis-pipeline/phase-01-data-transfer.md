# Phase 1: Data Transfer Phase 1 -> 2

**Bugs fixed:** #3 (no data transfer), #6 (null summary)
**Priority:** CRITICAL

## Context

When user clicks "Xac nhan" in CoachingPhase, `handleConfirm` saves drafts to Supabase and advances to Phase 2. But it never writes the coaching data into `useSwotStore` where SynthesisPhase reads it. Also, `SwotOrchestrator` hardcodes `summary={null}` for ContextCardsPhase.

## Related Code Files

| File | Action | Path |
|------|--------|------|
| swot-session-store.ts | MODIFY | `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\lib\swot\swot-session-store.ts` |
| CoachingPhase.tsx | MODIFY | `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\components\swot\CoachingPhase.tsx` |
| SwotOrchestrator.tsx | MODIFY | `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\components\swot\SwotOrchestrator.tsx` |

## Implementation Steps

### Step 1.1: Add `confirmedDraft` field to `useSwotStore`

**File:** `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\lib\swot\swot-session-store.ts`

**Why:** Need a place in the persisted store to hold the coaching draft data so Phase 2 and 3 can read it.

Add import at top:
```ts
import type { SwotDraft } from './coaching-types'
```

Add to `SwotStoreState` interface (around line 285):
```ts
confirmedDraft: SwotDraft | null
setConfirmedDraft: (draft: SwotDraft) => void
```

Add initial value (around line 389):
```ts
confirmedDraft: null,
```

Add setter (near `setSwotPhase`):
```ts
setConfirmedDraft: (draft: SwotDraft) => {
  set({ confirmedDraft: draft })
},
```

Add `confirmedDraft` to `partialize` (line 1134). Add it to the returned object:
```ts
partialize: (state) => ({
  swotPhase: state.swotPhase,
  confirmedDraft: state.confirmedDraft,   // <-- ADD THIS
  coachingTracker: state.coachingTracker,
  coachingMessages: state.coachingMessages.slice(-20),
  coachingCoverage: state.coachingCoverage,
  staleSince: state.staleSince,
  staleReason: state.staleReason,
}),
```

### Step 1.2: Write draft into `useSwotStore` on confirm

**File:** `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\components\swot\CoachingPhase.tsx`

**Why:** Bridge the two stores at the confirm boundary.

Change `handleConfirm` (lines 114-118) from:
```ts
const handleConfirm = useCallback(async () => {
  await handleSaveDraft()
  setStep('confirmed')
  setSwotPhase(2)
}, [handleSaveDraft, setStep, setSwotPhase])
```

To:
```ts
const setConfirmedDraft = useSwotStore((s) => s.setConfirmedDraft)

const handleConfirm = useCallback(async () => {
  await handleSaveDraft()
  if (draft) {
    setConfirmedDraft(draft)
  }
  setStep('confirmed')
  setSwotPhase(2)
}, [handleSaveDraft, setStep, setSwotPhase, draft, setConfirmedDraft])
```

Note: `setConfirmedDraft` selector must be added at the top of the component alongside the other `useSwotStore` selectors (near line 30).

### Step 1.3: Pass real summary to ContextCardsPhase

**File:** `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\components\swot\SwotOrchestrator.tsx`

**Why:** ContextCardsPhase receives `summary={null}` which means context cards have no coaching context to work with.

Change line 27 from:
```tsx
<ContextCardsPhase orgContext={orgContext} summary={null} />
```

To:
```tsx
{(() => {
  const confirmedDraft = useSwotStore.getState().confirmedDraft
  const summary = confirmedDraft ? {
    strengths: confirmedDraft.strengths.map(i => ({ source: i.frameworkSource as any, content: i.statement })),
    weaknesses: confirmedDraft.weaknesses.map(i => ({ source: i.frameworkSource as any, content: i.statement })),
    opportunities: confirmedDraft.opportunities.map(i => ({ source: i.frameworkSource as any, content: i.statement })),
    threats: confirmedDraft.threats.map(i => ({ source: i.frameworkSource as any, content: i.statement })),
  } : null
  return <ContextCardsPhase orgContext={orgContext} summary={summary} />
})()}
```

**Cleaner alternative** (preferred): read from store with hook:
```tsx
export function SwotOrchestrator({ orgContext, userId }: SwotOrchestratorProps) {
  const swotPhase = useSwotStore((s) => s.swotPhase)
  const confirmedDraft = useSwotStore((s) => s.confirmedDraft)

  const coachingSummary = confirmedDraft ? {
    strengths: confirmedDraft.strengths.map(i => ({ source: i.frameworkSource as any, content: i.statement })),
    weaknesses: confirmedDraft.weaknesses.map(i => ({ source: i.frameworkSource as any, content: i.statement })),
    opportunities: confirmedDraft.opportunities.map(i => ({ source: i.frameworkSource as any, content: i.statement })),
    threats: confirmedDraft.threats.map(i => ({ source: i.frameworkSource as any, content: i.statement })),
  } : null

  return (
    <div className="max-w-5xl mx-auto px-6 py-4">
      <PhaseStepperHeader />
      <div>
        {swotPhase === 1 && <CoachingPhase orgContext={orgContext} userId={userId} />}
        {swotPhase === 2 && <ContextCardsPhase orgContext={orgContext} summary={coachingSummary} />}
        {swotPhase === 3 && <SynthesisPhase orgContext={orgContext} />}
      </div>
    </div>
  )
}
```

Use the cleaner alternative.

## Success Criteria

- [ ] After confirming Phase 1 draft, `useSwotStore.getState().confirmedDraft` contains the full `SwotDraft`
- [ ] `confirmedDraft` survives page refresh (persisted via localStorage)
- [ ] ContextCardsPhase receives non-null summary derived from coaching data
