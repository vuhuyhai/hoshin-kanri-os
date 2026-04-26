import { createClient } from '@/lib/supabase/server'
import type {
  XMatrixData,
  XMatrixHoshin,
  XMatrixInitiative,
  XMatrixKpi,
  SwotCellSource,
} from '@/lib/x-matrix/types'
import { LIMITS } from '@/lib/x-matrix/types'
import type {
  StrategyAction,
  KpiSuggestion,
  Timeframe,
} from '@/lib/swot/tows-types'
import { toJson, fromJson } from '@/lib/utils'

export interface SyncResult {
  success: boolean
  syncedCount: number
  errors: string[]
  xMatrixId?: string
}

const TOWS_TO_SOURCE: Record<string, SwotCellSource> = {
  SO: 'SO',
  WO: 'WO',
  ST: 'ST',
  WT: 'WT',
}

/**
 * Smart truncation theo word boundary cho tiếng Việt.
 * Tránh cắt giữa từ (vd "chi nh" thay vì "chi nhánh").
 */
function smartTruncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const slice = text.slice(0, maxLen)
  const lastSpace = slice.lastIndexOf(' ')
  if (lastSpace > maxLen * 0.6) {
    return slice.slice(0, lastSpace) + '…'
  }
  return slice + '…'
}

/**
 * Map TOWS frequency → XMatrixKpi frequency.
 * XMatrixKpi không hỗ trợ 'daily' → fallback 'weekly'.
 */
function mapFrequency(
  freq: 'daily' | 'weekly' | 'monthly',
): 'weekly' | 'monthly' {
  return freq === 'monthly' ? 'monthly' : 'weekly'
}

/**
 * Map TOWS StrategyAction[] → XMatrixInitiative[].
 * Inherit strategy-level timeframe vì XMatrixInitiative yêu cầu timeframe.
 * Append owner_hint vào title nếu có (XMatrixInitiative không có owner field).
 */
function mapActionsToInitiatives(
  actions: StrategyAction[] | null,
  strategyTimeframe: Timeframe | null,
  hoshinId: string,
): XMatrixInitiative[] {
  if (!actions || actions.length === 0) return []
  const tf: Timeframe = strategyTimeframe ?? '60d'
  return actions.slice(0, LIMITS.MAX_INITIATIVES_PER_HOSHIN).map((a, idx) => ({
    id: `${hoshinId}-init-${idx}`,
    title: a.owner_hint
      ? `${a.description} — ${a.owner_hint}`
      : a.description,
    timeframe: tf,
  }))
}

/**
 * Map TOWS KpiSuggestion[] → XMatrixKpi[].
 * targetValue camelCase, frequency drop 'daily' → 'weekly'.
 * Owner fields default empty (user fills in X-Matrix Wizard).
 */
function mapKpiSuggestionsToKpis(
  kpis: KpiSuggestion[] | null,
  hoshinId: string,
): XMatrixKpi[] {
  if (!kpis || kpis.length === 0) return []
  return kpis.slice(0, LIMITS.MAX_KPIS_PER_HOSHIN).map((k, idx) => ({
    id: `${hoshinId}-kpi-${idx}`,
    name: k.name,
    unit: k.unit,
    targetValue: k.target_value,
    ownerUserId: null,
    ownerName: '',
    frequency: mapFrequency(k.frequency),
    deptLevel: 'company',
  }))
}

/**
 * Sync approved TOWS strategies → x_matrices.vision_json.hoshins[]
 *
 * Flow:
 * 1. Load approved strategies for the analysis session
 * 2. Find or create active x_matrix for org
 * 3. Preserve manual/confirmed hoshins, replace ai_suggested with new approved ones
 * 4. Respect MAX_HOSHINS=5 limit
 * 5. Mark synced rows as status='in_x_matrix' (prevent duplicate re-sync)
 */
export async function syncTowsStrategiesToXMatrix(
  orgId: string,
  analysisId: string
): Promise<SyncResult> {
  const errors: string[] = []
  const supabase = await createClient()

  // 1. Load approved strategies
  const { data: strategies, error: loadErr } = await supabase
    .from('tows_strategies')
    .select('*')
    .eq('swot_analysis_id', analysisId)
    .eq('status', 'approved')
    .order('order_index', { ascending: true })

  if (loadErr) {
    return {
      success: false,
      syncedCount: 0,
      errors: ['Không thể đọc chiến lược: ' + loadErr.message],
    }
  }

  if (!strategies || strategies.length === 0) {
    return {
      success: false,
      syncedCount: 0,
      errors: ['Chưa có chiến lược nào ở trạng thái "Duyệt"'],
    }
  }

  // 2. Find or create active x_matrix
  let { data: xMatrix } = await supabase
    .from('x_matrices')
    .select('id, vision_json')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (!xMatrix) {
    const { data: created, error: createErr } = await supabase
      .from('x_matrices')
      .insert({
        org_id: orgId,
        year: new Date().getFullYear(),
        title: `X-Matrix ${new Date().getFullYear()}`,
        vision_json: toJson({ vision: '', yearGoals: [''], hoshins: [] }),
        status: 'active',
      })
      .select('id, vision_json')
      .single()

    if (createErr || !created) {
      return {
        success: false,
        syncedCount: 0,
        errors: ['Không thể tạo X-Matrix mới'],
      }
    }
    xMatrix = created
  }

  // 3. Read existing vision_json
  const existingData = fromJson<XMatrixData>(xMatrix.vision_json) ?? {
    vision: '',
    yearGoals: [''],
    hoshins: [],
  }

  // 4. Preserve manual/confirmed hoshins — only replace ai_suggested ones
  const preservedHoshins = (existingData.hoshins ?? []).filter(
    (h) => h.status === 'confirmed' || h.status === 'manual' || !h.sourceSwotCellType
  )

  // 5. Check capacity: MAX_HOSHINS=5 total
  const availableSlots = Math.max(0, LIMITS.MAX_HOSHINS - preservedHoshins.length)

  if (strategies.length > availableSlots) {
    errors.push(
      `Chỉ sync được ${availableSlots}/${strategies.length} chiến lược (${preservedHoshins.length} Hoshin đã confirm trước đó, tối đa ${LIMITS.MAX_HOSHINS} total)`
    )
  }

  // 6. Transform approved strategies → XMatrixHoshin
  const newHoshins: XMatrixHoshin[] = strategies
    .slice(0, availableSlots)
    .map((s) => {
      const description = s.rationale
        ? `${s.strategy_statement}\n\n💡 Vital signal: ${s.rationale}`
        : s.strategy_statement

      return {
        id: s.id,
        title:
          s.strategy_title || smartTruncate(s.strategy_statement, 80),
        description,
        initiatives: mapActionsToInitiatives(
          s.actions as StrategyAction[] | null,
          s.timeframe as Timeframe | null,
          s.id,
        ),
        kpis: mapKpiSuggestionsToKpis(
          s.kpi_suggestions as KpiSuggestion[] | null,
          s.id,
        ),
        sourceSwotCellType: TOWS_TO_SOURCE[s.quadrant],
        status: 'ai_suggested' as const,
      }
    })

  // 7. Merge and save
  const mergedHoshins = [...preservedHoshins, ...newHoshins]
  const updatedData: XMatrixData = { ...existingData, hoshins: mergedHoshins }

  const { error: updateErr } = await supabase
    .from('x_matrices')
    .update({ vision_json: toJson(updatedData) })
    .eq('id', xMatrix.id)

  if (updateErr) {
    return {
      success: false,
      syncedCount: 0,
      errors: ['Không thể cập nhật X-Matrix: ' + updateErr.message],
    }
  }

  // 8. Mark synced strategies as 'in_x_matrix' (prevent re-sync next time)
  const syncedIds = newHoshins.map((h) => h.id)
  if (syncedIds.length > 0) {
    await supabase
      .from('tows_strategies')
      .update({ status: 'in_x_matrix' })
      .in('id', syncedIds)
  }

  return {
    success: true,
    syncedCount: syncedIds.length,
    errors,
    xMatrixId: xMatrix.id,
  }
}
