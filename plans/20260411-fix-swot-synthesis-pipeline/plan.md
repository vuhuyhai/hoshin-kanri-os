# Fix SWOT Synthesis Pipeline (Phase 1 -> 2 -> 3)

**Date:** 2026-04-11
**Priority:** CRITICAL
**Status:** Ready for implementation
**Estimated effort:** ~2 hours

## Problem

SWOT synthesis (Phase 3) always fails because:
1. SynthesisPhase sends wrong field names to the API
2. Coaching draft data never reaches SynthesisPhase
3. Phase 1 confirm doesn't transfer data to Phase 2/3
4. contextCards lost on page refresh (not persisted)
5. API response shape mismatch
6. Orchestrator passes null summary to Phase 2

## Phases

| # | Phase | File(s) | Bugs Fixed |
|---|-------|---------|------------|
| 1 | [Data transfer Phase 1->2](./phase-01-data-transfer.md) | CoachingPhase.tsx, SwotOrchestrator.tsx, swot-session-store.ts | #3, #6 |
| 2 | [Persist contextCards](./phase-02-persist-context-cards.md) | swot-session-store.ts | #4 |
| 3 | [Fix SynthesisPhase](./phase-03-fix-synthesis-phase.md) | SynthesisPhase.tsx | #1, #2, #5 |

## Dependency Chain

```
Phase 1 (data transfer) -> Phase 2 (persist) -> Phase 3 (synthesis fix)
```

All three phases must be completed. Phase 3 depends on Phase 1 data being available.

## Key Insight

The root cause: two stores were built independently. `useSwotCoachingStore` (sessionStorage) holds the draft data. `useSwotStore` (localStorage) drives the phase navigation and synthesis. Nobody bridges them. The fix is a simple transform + store write at the confirm boundary.
