import type { SupabaseClient } from '@supabase/supabase-js'
import type { SwotQuadrant } from '@/lib/swot/types'
import type {
  SwotFactor,
  TowsStrategyWithFactorsRecord,
  TowsExportRow,
} from '@/lib/swot/tows-types'
import { BSC_LABELS } from '@/lib/swot/tows-types'

/**
 * Atomically reserve a block of consecutive factor code numbers for
 * a (analysis, quadrant) pair. Returns the first usable number.
 *
 * Caller formats codes as `${quadrant}${start}`, `${quadrant}${start+1}`,
 * ..., `${quadrant}${start+count-1}`.
 *
 * Backed by Postgres RPC `reserve_factor_codes` (see migration 014)
 * which uses INSERT ... ON CONFLICT DO UPDATE as a single atomic
 * statement — concurrent callers serialize on the PK row lock, so
 * no retry loop is needed.
 */
export async function reserveFactorCodes(
  supabase: SupabaseClient,
  analysisId: string,
  quadrant: SwotQuadrant,
  count: number = 1,
): Promise<number> {
  if (count < 1) throw new Error('count must be >= 1')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('reserve_factor_codes', {
    p_analysis_id: analysisId,
    p_quadrant: quadrant,
    p_count: count,
  })
  if (error) throw new Error(error.message ?? 'Lỗi reserve factor code')
  if (typeof data !== 'number') {
    throw new Error('reserve_factor_codes trả về dữ liệu không hợp lệ')
  }
  return data
}

/**
 * Helper: format a block of N consecutive codes starting from `start`.
 * e.g. formatFactorCodes('S', 5, 3) → ['S5', 'S6', 'S7']
 */
export function formatFactorCodes(
  quadrant: SwotQuadrant,
  start: number,
  count: number,
): string[] {
  return Array.from({ length: count }, (_, i) => `${quadrant}${start + i}`)
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
