import { createClient } from '@/lib/supabase/server'
import type { XMatrixData, XMatrixHoshin, SwotCellSource } from '@/lib/x-matrix/types'
import type { Json } from '@/lib/supabase/types'
import { LIMITS } from '@/lib/x-matrix/types'

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
        vision_json: { vision: '', yearGoals: [''], hoshins: [] } as unknown as Json,
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
  const existingData = (xMatrix.vision_json as unknown as XMatrixData) ?? {
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
  const newHoshins: XMatrixHoshin[] = strategies.slice(0, availableSlots).map((s) => ({
    id: s.id,
    title: s.strategy_title || s.strategy_statement.slice(0, 80),
    description: s.strategy_statement,
    initiatives: [],
    kpis: [],
    sourceSwotCellType: TOWS_TO_SOURCE[s.quadrant],
    status: 'ai_suggested' as const,
  }))

  // 7. Merge and save
  const mergedHoshins = [...preservedHoshins, ...newHoshins]
  const updatedData: XMatrixData = { ...existingData, hoshins: mergedHoshins }

  const { error: updateErr } = await supabase
    .from('x_matrices')
    .update({ vision_json: updatedData as unknown as Json })
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
