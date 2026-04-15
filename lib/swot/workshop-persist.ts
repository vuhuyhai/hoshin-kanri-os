import { createClient } from '@/lib/supabase/client'
import type { TablesInsert, Json } from '@/lib/supabase/types'
import { reserveFactorCodes } from './factor-utils'
import type { SwotIngredient, SwotQuadrant } from './types'

const QUADRANTS: SwotQuadrant[] = ['S', 'W', 'O', 'T']

function formatEvidenceText(ing: SwotIngredient): string | null {
  if (ing.evidence.length === 0) return null
  return ing.evidence
    .map((e, i) => {
      let domain = e.url
      try { domain = new URL(e.url).hostname.replace('www.', '') } catch { /* keep raw */ }
      return `[${i + 1}] ${e.title} (${domain}): ${e.snippet} — ${e.url}`
    })
    .join('\n')
}

export async function persistWorkshopSelection(
  analysisId: string,
  orgId: string,
  selected: SwotIngredient[],
): Promise<void> {
  const supabase = createClient()

  await supabase
    .from('swot_factors')
    .delete()
    .eq('swot_analysis_id', analysisId)
    .eq('source_framework', 'workshop')

  const byQuadrant = Object.fromEntries(
    QUADRANTS.map((q) => [q, selected.filter((i) => i.quadrant === q)]),
  ) as Record<SwotQuadrant, SwotIngredient[]>

  const reservations = await Promise.all(
    QUADRANTS.map(async (q): Promise<[SwotQuadrant, number]> => {
      const count = byQuadrant[q].length
      if (count === 0) return [q, 0]
      const start = await reserveFactorCodes(supabase, analysisId, q, count)
      return [q, start]
    }),
  )
  const startBy = Object.fromEntries(reservations) as Record<SwotQuadrant, number>

  const rows: TablesInsert<'swot_factors'>[] = QUADRANTS.flatMap((q) => {
    const start = startBy[q]
    return byQuadrant[q].map((ing, i) => ({
      org_id: orgId,
      swot_analysis_id: analysisId,
      quadrant: q,
      code: `${q}${start + i}`,
      content: ing.statement,
      source_framework: 'workshop',
      source_ref: ing.source,
      is_key_factor: false,
      evidence_text: formatEvidenceText(ing),
    }))
  })

  if (rows.length > 0) {
    const { error } = await supabase.from('swot_factors').insert(rows)
    if (error) throw new Error(error.message)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const data_json = {
      ingredientCount: selected.length,
      completedAt: new Date().toISOString(),
    } as unknown as Json
    await supabase
      .from('discovery_sessions')
      .delete()
      .eq('org_id', orgId)
      .eq('step_completed', 'swot')
    await supabase.from('discovery_sessions').insert({
      org_id: orgId,
      user_id: user.id,
      step_completed: 'swot',
      data_json,
    })
  }
}
