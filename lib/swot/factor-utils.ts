import type { SupabaseClient } from '@supabase/supabase-js'
import type { SwotQuadrant } from '@/lib/swot/types'
import type {
  SwotFactor,
  TowsStrategyWithFactorsRecord,
  TowsExportRow,
} from '@/lib/swot/tows-types'
import { BSC_LABELS } from '@/lib/swot/tows-types'

/**
 * Count existing factors in the same quadrant, return next code.
 * e.g. if 3 "S" factors exist → returns "S4"
 */
export async function generateFactorCode(
  supabase: SupabaseClient,
  analysisId: string,
  quadrant: SwotQuadrant,
): Promise<string> {
  const { count } = await supabase
    .from('swot_factors')
    .select('id', { count: 'exact', head: true })
    .eq('swot_analysis_id', analysisId)
    .eq('quadrant', quadrant)

  return `${quadrant}${(count ?? 0) + 1}`
}

/**
 * Sort SW codes and OT codes separately, then concatenate.
 * e.g. sw=[{code:'W1'},{code:'S36'}], ot=[{code:'O7'}] → "S36W1O7"
 */
export function generateCombinedCode(
  swFactors: Pick<SwotFactor, 'code'>[],
  otFactors: Pick<SwotFactor, 'code'>[],
): string {
  const swSorted = swFactors
    .map((f) => f.code)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const otSorted = otFactors
    .map((f) => f.code)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  return [...swSorted, ...otSorted].join('')
}

/**
 * Filter approved/in_x_matrix strategies, sort by order_index, map to export rows.
 */
export function buildExportRows(
  strategies: TowsStrategyWithFactorsRecord[],
): TowsExportRow[] {
  return strategies
    .filter((s) => s.status === 'approved' || s.status === 'in_x_matrix')
    .sort((a, b) => a.order_index - b.order_index)
    .map((s, i) => ({
      stt: i + 1,
      chien_luoc_type: s.quadrant,
      sw_code: s.sw_factors.map((f) => f.code).join(', '),
      nguyen_lieu_sw: s.sw_factors.map((f) => f.content).join(' | '),
      ot_code: s.ot_factors.map((f) => f.code).join(', '),
      nguyen_lieu_ot: s.ot_factors.map((f) => f.content).join(' | '),
      combined_code: s.combined_code,
      bsc: BSC_LABELS[s.bsc_perspective],
      chien_luoc: s.strategy_statement,
    }))
}
