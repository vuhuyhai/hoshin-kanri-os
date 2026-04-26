# Phase 3: Fix SynthesisPhase

**Bugs fixed:** #1 (field name mismatch), #2 (empty coaching data), #5 (API response shape)
**Priority:** CRITICAL

## Context

SynthesisPhase has three independent bugs:
1. Sends `{summary, evidenceItems, orgContext}` but API expects `{org_id, coaching_items, evidence_items}`
2. Builds `dummySummary` with empty arrays instead of reading from `confirmedDraft`
3. Reads `data.synthesis` but API returns flat `SynthesisResult`

## Related Code Files

| File | Action | Path |
|------|--------|------|
| SynthesisPhase.tsx | MODIFY | `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\components\swot\SynthesisPhase.tsx` |

## Type Mappings

Transform needed:
```
SwotDraftItem (coaching-store)  -->  CoachingItem (synthesis API)
─────────────────────────────       ─────────────────────────────
id                              -->  id
statement                       -->  text
frameworkSource ('8Ms'|'5Forces'|'PESTEL') --> framework_source
confidence ('high'|'medium'|'low')  -->  ai_confidence
isUserAdded                     -->  source ('user_added' | 'ai_extracted')
(quadrant key: 'strengths')     -->  quadrant ('S')
```

Transform needed:
```
ContextCard (swot-store)        -->  EvidenceItemV2 (synthesis API)
────────────────────────────        ──────────────────────────────
id                              -->  id
insight                         -->  text
swot_quadrant ('O'|'T')        -->  quadrant
title                           -->  source_name
relevance_score                 -->  credibility_score (scale to 10)
(always new)                    -->  is_new_discovery: true
                                -->  confidence: based on relevance_score
```

## Implementation Steps

### Step 3.1: Add import for coaching store and types

**File:** `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\components\swot\SynthesisPhase.tsx`

Add imports:
```ts
import type { SwotDraft, QuadrantKey } from '@/lib/swot/coaching-types'
import type { CoachingItem, EvidenceItemV2, SynthesisResult } from '@/lib/swot/types'
```

### Step 3.2: Add transform functions

**File:** `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\components\swot\SynthesisPhase.tsx`

Replace the existing `contextCardsToEvidenceItems` function (lines 53-62) with two new transform functions:

```ts
const QUADRANT_MAP: Record<QuadrantKey, 'S' | 'W' | 'O' | 'T'> = {
  strengths: 'S', weaknesses: 'W', opportunities: 'O', threats: 'T',
}

function draftToCoachingItems(draft: SwotDraft): CoachingItem[] {
  return (['strengths', 'weaknesses', 'opportunities', 'threats'] as const).flatMap(
    (q) => draft[q].map((item) => ({
      id: item.id,
      quadrant: QUADRANT_MAP[q],
      text: item.statement,
      source: item.isUserAdded ? 'user_added' as const : 'ai_extracted' as const,
      framework_source: item.frameworkSource,
      ai_confidence: item.confidence,
    }))
  )
}

function contextCardsToEvidenceV2(cards: ContextCard[]): EvidenceItemV2[] {
  return cards.map((card) => ({
    id: card.id,
    quadrant: card.swot_quadrant,
    text: `${card.title}: ${card.insight}`,
    is_new_discovery: true,
    source_name: card.title,
    confidence: card.relevance_score >= 0.8 ? 'high' as const
      : card.relevance_score >= 0.5 ? 'medium' as const : 'low' as const,
    credibility_score: Math.round(card.relevance_score * 10),
  }))
}
```

### Step 3.3: Read `confirmedDraft` from store and fix API call

**File:** `c:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os\components\swot\SynthesisPhase.tsx`

Add store selector at top of component (near line 67):
```ts
const confirmedDraft = useSwotStore((s) => s.confirmedDraft)
```

Replace the entire `runSynthesis` function (lines 86-118) with:

```ts
const runSynthesis = async () => {
  setStatus('loading')
  try {
    if (!confirmedDraft) {
      toast.error('Khong co du lieu coaching. Vui long quay lai buoc 1.')
      setStatus('error')
      return
    }

    const coaching_items = draftToCoachingItems(confirmedDraft)
    const evidence_items = contextCardsToEvidenceV2(contextCards)

    const response = await fetch('/api/swot/synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_id: orgContext.orgId,
        coaching_items,
        evidence_items,
      }),
    })

    if (!response.ok) throw new Error('Synthesis failed')
    const result: SynthesisResult = await response.json()

    // Transform SynthesisResult (flat swot_items) -> SwotSynthesisOutput (quadrant-grouped)
    const grouped: SwotSynthesisOutput = {
      S: [], W: [], O: [], T: [],
      summary: `${result.stats.total_output} insights tong hop tu ${result.stats.total_input} du lieu`,
    }
    for (const item of result.swot_items) {
      grouped[item.quadrant].push({
        id: item.id,
        statement: item.statement,
        implication: item.implication,
        confidence: item.credibility_score / 10,
        framework_source: item.evidence_source,
      })
    }

    setSynthesis(grouped)
    setStatus('complete')
  } catch {
    setStatus('error')
    toast.error('Loi khi tong hop SWOT. Thu lai.')
  }
}
```

### Step 3.4: Remove dead import

Remove `EvidenceItem` from the import on line 16 since we no longer use the old `EvidenceItem` type. Keep `ContextCard`. Add `SynthesisResult` to the import from `@/lib/swot/types`.

Updated import block:
```ts
import type {
  OrgContext,
  SwotSynthesisOutput,
  SwotItem,
  SwotQuadrant,
  ContextCard,
  CoachingItem,
  EvidenceItemV2,
  SynthesisResult,
} from '@/lib/swot/types'
import type { SwotDraft, QuadrantKey } from '@/lib/swot/coaching-types'
```

## Data Flow After Fix

```
Phase 1 (CoachingPhase)
  |-- user confirms draft
  |-- writes SwotDraft -> useSwotStore.confirmedDraft (localStorage)
  |-- saves to Supabase
  |-- advances to Phase 2
  v
Phase 2 (ContextCardsPhase)
  |-- receives CoachingSummary derived from confirmedDraft
  |-- fetches context cards from API
  |-- saves cards -> useSwotStore.evidence.contextCards (localStorage)
  |-- advances to Phase 3
  v
Phase 3 (SynthesisPhase)
  |-- reads confirmedDraft -> transforms to CoachingItem[]
  |-- reads contextCards -> transforms to EvidenceItemV2[]
  |-- POSTs { org_id, coaching_items, evidence_items } to API
  |-- API returns flat SynthesisResult
  |-- transforms to SwotSynthesisOutput (quadrant-grouped)
  |-- renders 2x2 SWOT grid
```

## Edge Cases

- **No confirmedDraft:** Show error, prompt to go back to Phase 1. Handled by the null check at top of `runSynthesis`.
- **No contextCards:** Empty `evidence_items` array. API handles this fine -- synthesis engine just uses coaching items only.
- **Page refresh between phases:** All critical data persisted via localStorage partialize.

## Success Criteria

- [ ] SynthesisPhase sends `{org_id, coaching_items, evidence_items}` matching API contract
- [ ] `coaching_items` populated from actual draft data (not empty arrays)
- [ ] API response (`SynthesisResult`) correctly transformed to `SwotSynthesisOutput` for rendering
- [ ] Full Phase 1 -> 2 -> 3 flow works end-to-end
- [ ] Page refresh at any phase doesn't lose data
