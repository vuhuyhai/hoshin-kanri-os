import { createClient } from '@/lib/supabase/client'
import type { TablesInsert } from '@/lib/supabase/types'
import type { SwotDraft, QuadrantKey } from './coaching-types'
import type { SwotQuadrant } from './types'
import { reserveFactorCodes } from './factor-utils'
import { toJson } from '@/lib/utils'

const QKEY_TO_QUAD: Record<QuadrantKey, SwotQuadrant> = {
  strengths: 'S',
  weaknesses: 'W',
  opportunities: 'O',
  threats: 'T',
}

const CONFIDENCE_TO_SCORE: Record<'high' | 'medium' | 'low', number> = {
  high: 4,
  medium: 3,
  low: 2,
}

/**
 * Replace the current AI-coaching draft rows in swot_factors for this session.
 * Deletes existing coaching rows, reserves a fresh block of codes per
 * quadrant via reserve_factor_codes() RPC (atomic), then batch-inserts.
 *
 * Code numbers grow monotonically across re-saves. If the user re-runs
 * coaching multiple times, codes may become non-contiguous (e.g. S3 then
 * S8). That's acceptable since codes are identifiers, not rankings.
 */
export async function saveCoachingDraftToFactors(
  analysisId: string,
  orgId: string,
  draft: SwotDraft
): Promise<void> {
  const supabase = createClient()

  // 1. Delete existing coaching drafts for this analysis
  await supabase
    .from('swot_factors')
    .delete()
    .eq('swot_analysis_id', analysisId)
    .eq('source_framework', 'ai_coaching')

  // 2. Reserve contiguous code blocks per quadrant (parallel, atomic)
  const quadrantCounts: Array<[QuadrantKey, SwotQuadrant, number]> = [
    ['strengths', QKEY_TO_QUAD.strengths, draft.strengths.length],
    ['weaknesses', QKEY_TO_QUAD.weaknesses, draft.weaknesses.length],
    ['opportunities', QKEY_TO_QUAD.opportunities, draft.opportunities.length],
    ['threats', QKEY_TO_QUAD.threats, draft.threats.length],
  ]

  const reservations = await Promise.all(
    quadrantCounts.map(async ([, q, count]): Promise<[SwotQuadrant, number]> => {
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
  const rows: TablesInsert<'swot_factors'>[] = quadrantCounts.flatMap(
    ([qKey, q]) => {
      const start = startByQuadrant[q]
      return draft[qKey].map((item, i) => ({
        org_id: orgId,
        swot_analysis_id: analysisId,
        quadrant: q,
        code: `${q}${start + i}`,
        content: item.statement,
        source_framework: 'ai_coaching',
        source_ref: 'coaching_draft',
        is_key_factor: false,
        quality_score: CONFIDENCE_TO_SCORE[item.confidence] ?? 3,
        evidence_text: item.rationale || null,
      }))
    }
  )

  if (rows.length > 0) {
    await supabase.from('swot_factors').insert(rows)
  }
}

/**
 * Upsert wizard progress marker in discovery_sessions.
 * Used to resume user at the correct wizard step on page reload.
 */
export async function persistWizardStep(
  orgId: string,
  userId: string,
  stepKey: 'swot_wizard_step_1' | 'swot_wizard_step_2' | 'swot_wizard_step_3' | 'swot_wizard_step_4' | 'swot_wizard_step_5'
): Promise<void> {
  const supabase = createClient()
  await supabase.from('discovery_sessions').upsert(
    {
      org_id: orgId,
      user_id: userId,
      step_completed: stepKey,
      data_json: toJson({ savedAt: new Date().toISOString() }),
    },
    { onConflict: 'org_id,user_id,step_completed' } as never
  )
}
