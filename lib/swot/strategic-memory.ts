import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { XRayResult } from '@/lib/x-ray/types'

type Tables = Database['public']['Tables']
type SwotFactorRow = Tables['swot_factors']['Row']

export interface XrayContextSummary {
  xrayId: string
  overallScore: number
  overallLevel: string
  result: XRayResult
  capturedAt: string
}

export interface StrategicMemory {
  factors: SwotFactorRow[]
  xrayContext: XrayContextSummary | null
}

const FINALIZED_FRAMEWORKS = ['workshop', 'ai_synthesized'] as const
const FACTORS_LIMIT = 100

export async function loadStrategicMemory(
  supabase: SupabaseClient<Database>,
  orgId: string,
  userId: string,
): Promise<StrategicMemory> {
  const { data: factors, error: factorsError } = await supabase
    .from('swot_factors')
    .select('*')
    .eq('org_id', orgId)
    .in('source_framework', FINALIZED_FRAMEWORKS as unknown as string[])
    .order('created_at', { ascending: false })
    .limit(FACTORS_LIMIT)

  if (factorsError) {
    throw new Error(`Failed to load swot_factors: ${factorsError.message}`)
  }

  const { data: xrayRow, error: xrayError } = await supabase
    .from('xray_results')
    .select('id, overall_score, overall_level, result_json, created_at')
    .or(`org_id.eq.${orgId},user_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let xrayContext: XrayContextSummary | null = null
  if (!xrayError && xrayRow) {
    xrayContext = {
      xrayId: xrayRow.id,
      overallScore: xrayRow.overall_score,
      overallLevel: xrayRow.overall_level,
      result: xrayRow.result_json as unknown as XRayResult,
      capturedAt: xrayRow.created_at,
    }
  }

  return {
    factors: factors ?? [],
    xrayContext,
  }
}
