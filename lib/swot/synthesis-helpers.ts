import type {
  SwotSynthesisOutput,
  SwotItem,
  SwotQuadrant,
  CoachingItem,
  EvidenceItemV2,
  SynthesisResult,
} from '@/lib/swot/types'
import type { QuadrantKey, SwotDraft } from '@/lib/swot/coaching-types'

const QUADRANT_KEY_TO_CODE: Record<QuadrantKey, SwotQuadrant> = {
  strengths: 'S',
  weaknesses: 'W',
  opportunities: 'O',
  threats: 'T',
}

/** Convert confirmed draft items → CoachingItem[] for synthesis API */
export function draftToCoachingItems(draft: SwotDraft): CoachingItem[] {
  const items: CoachingItem[] = []
  for (const [key, quadrant] of Object.entries(QUADRANT_KEY_TO_CODE)) {
    const qKey = key as QuadrantKey
    for (const item of draft[qKey]) {
      items.push({
        id: item.id,
        quadrant,
        text: item.statement,
        source: item.isUserAdded ? 'user_added' : 'ai_extracted',
        framework_source: item.frameworkSource,
        ai_confidence: item.confidence,
      })
    }
  }
  return items
}

/** Convert context cards → EvidenceItemV2[] for synthesis API */
export function contextCardsToEvidence(
  cards: {
    id: string
    title: string
    insight: string
    swot_quadrant: 'O' | 'T'
    relevance_score: number
  }[]
): EvidenceItemV2[] {
  return cards.map((card) => ({
    id: card.id,
    quadrant: card.swot_quadrant,
    text: `${card.title}: ${card.insight}`,
    is_new_discovery: true,
    source_name: 'AI Context Analysis',
    confidence: card.relevance_score >= 0.7 ? ('high' as const) : ('medium' as const),
    credibility_score: Math.round(card.relevance_score * 10),
  }))
}

/** Convert SynthesisResult → SwotSynthesisOutput for UI rendering */
export function synthesisResultToOutput(result: SynthesisResult): SwotSynthesisOutput {
  const output: SwotSynthesisOutput = { S: [], W: [], O: [], T: [], summary: '' }
  for (const item of result.swot_items) {
    const swotItem: SwotItem = {
      id: item.id,
      statement: item.statement,
      implication: item.implication,
      confidence: Math.min(1, Math.max(0, (item.credibility_score ?? 5) / 10)),
      framework_source: item.evidence_source,
    }
    output[item.quadrant].push(swotItem)
  }
  const { stats } = result
  output.summary = `Tổng hợp ${stats.total_input} inputs → ${stats.total_output} items (${stats.merged_count} merged, ${stats.discarded_count} loại bỏ)`
  return output
}

/** Rebuild SwotSynthesisOutput from store items (for cached display) */
export function storeItemsToOutput(
  items: import('@/lib/swot/swot-session-store').SwotItem[],
): SwotSynthesisOutput {
  const output: SwotSynthesisOutput = { S: [], W: [], O: [], T: [], summary: '' }
  for (const item of items) {
    output[item.category as SwotQuadrant]?.push({
      id: item.id,
      statement: item.statement,
      implication: item.implication,
      confidence: 0.8,
      framework_source: undefined,
    })
  }
  output.summary = `${items.length} insights từ phân tích trước đó`
  return output
}
