import { createClient } from '@/lib/supabase/client'
import type { TablesInsert } from '@/lib/supabase/types'
import type { SwotSynthesisOutput, SwotQuadrant } from './types'
import { reserveFactorCodes } from './factor-utils'

/**
 * After AI synthesis completes, persist the refined SWOT items to `swot_factors`.
 * Replaces ALL source_framework='ai_coaching' or 'ai_synthesized' rows for this
 * analysis with new 'ai_synthesized' rows.
 *
 * Codes are reserved atomically via reserve_factor_codes() RPC (migration 014),
 * so concurrent writers never collide on UNIQUE (analysis, code).
 */
export async function materializeSynthesisToFactors(
  analysisId: string,
  orgId: string,
  synthesis: SwotSynthesisOutput
): Promise<void> {
  const supabase = createClient()

  // 1. Delete existing AI-origin factors for this session
  await supabase
    .from('swot_factors')
    .delete()
    .eq('swot_analysis_id', analysisId)
    .in('source_framework', ['ai_coaching', 'ai_synthesized'])

  // 2. Reserve contiguous code blocks per quadrant (parallel, atomic)
  const quadrants: SwotQuadrant[] = ['S', 'W', 'O', 'T']
  const reservations = await Promise.all(
    quadrants.map(async (q): Promise<[SwotQuadrant, number]> => {
      const count = synthesis[q].length
      if (count === 0) return [q, 0]
      const start = await reserveFactorCodes(supabase, analysisId, q, count)
      return [q, start]
    })
  )
  const startByQuadrant = Object.fromEntries(reservations) as Record<
    SwotQuadrant,
    number
  >

  // 3. Build rows using reserved code numbers
  const rows: TablesInsert<'swot_factors'>[] = quadrants.flatMap((q) => {
    const start = startByQuadrant[q]
    return synthesis[q].map((item, i) => ({
      org_id: orgId,
      swot_analysis_id: analysisId,
      quadrant: q,
      code: `${q}${start + i}`,
      content: item.statement,
      source_framework: 'ai_synthesized',
      source_ref: 'wizard_step_3',
      is_key_factor: false,
      quality_score: Math.max(1, Math.min(5, Math.round(item.confidence * 5))),
      evidence_text: item.implication || null,
    }))
  })

  if (rows.length > 0) {
    await supabase.from('swot_factors').insert(rows)
  }
}
