import { createClient } from '@/lib/supabase/server'
import type { HoshinCandidate } from '@/lib/swot/swot-session-store'
import type { XMatrixData, XMatrixHoshin } from '@/lib/x-matrix/types'
import type { Json } from '@/lib/supabase/types'
import { LIMITS } from '@/lib/x-matrix/types'

interface SyncResult {
  success: boolean
  syncedCount: number
  errors: string[]
}

export async function syncCandidatesToXMatrix(
  orgId: string,
  candidates: HoshinCandidate[]
): Promise<SyncResult> {
  const errors: string[] = []

  // 1. Filter: only isSelectedForXMatrix
  const selected = candidates.filter((c) => c.isSelectedForXMatrix)
  if (selected.length === 0) {
    return { success: false, syncedCount: 0, errors: ['Chưa chọn Hoshin Candidate nào'] }
  }
  if (selected.length > LIMITS.MAX_HOSHINS) {
    return {
      success: false,
      syncedCount: 0,
      errors: [`Tối đa ${LIMITS.MAX_HOSHINS} Hoshins — focus là nói không. Đã chọn ${selected.length}.`],
    }
  }

  try {
    const supabase = await createClient()

    // 2. Find or create active X-Matrix for this org
    let { data: xMatrix } = await supabase
      .from('x_matrices')
      .select('id, vision_json')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .maybeSingle()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!xMatrix) {
      // Create a new X-Matrix
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
        return { success: false, syncedCount: 0, errors: ['Không thể tạo X-Matrix mới'] }
      }
      xMatrix = created
    }

    // 3. Read existing data
    const existingData = (xMatrix.vision_json as unknown as XMatrixData) ?? {
      vision: '',
      yearGoals: [''],
      hoshins: [],
    }

    // 4. Separate manual/confirmed hoshins from AI-suggested ones
    const manualHoshins = (existingData.hoshins ?? []).filter(
      (h) => h.status === 'confirmed' || h.status === 'manual' || !h.sourceSwotCellType
    )

    // 5. Transform candidates → XMatrixHoshin
    const aiHoshins: XMatrixHoshin[] = selected.map((c) => ({
      id: c.id,
      title: c.name,
      description: c.description,
      initiatives: [],
      kpis: [],
      sourceSwotCellType: c.sourceCellType,
      suggestedKpis: c.suggestedKpis,
      status: 'ai_suggested' as const,
    }))

    // 6. Merge: manual first, then AI (respect hard limit)
    const totalAllowed = LIMITS.MAX_HOSHINS - manualHoshins.length
    const mergedHoshins = [
      ...manualHoshins,
      ...aiHoshins.slice(0, Math.max(0, totalAllowed)),
    ]

    if (aiHoshins.length > totalAllowed && totalAllowed >= 0) {
      errors.push(
        `Chỉ sync được ${totalAllowed}/${aiHoshins.length} candidates (${manualHoshins.length} Hoshin thủ công đã có)`
      )
    }

    const updatedData: XMatrixData = {
      ...existingData,
      hoshins: mergedHoshins,
    }

    // 7. Save
    const { error: updateErr } = await supabase
      .from('x_matrices')
      .update({ vision_json: updatedData as unknown as Json })
      .eq('id', xMatrix.id)

    if (updateErr) {
      return { success: false, syncedCount: 0, errors: ['Không thể cập nhật X-Matrix'] }
    }

    const syncedCount = Math.min(aiHoshins.length, Math.max(0, totalAllowed))
    return { success: true, syncedCount, errors }
  } catch (err) {
    console.error('[sync-to-xmatrix] error:', err)
    return {
      success: false,
      syncedCount: 0,
      errors: ['Lỗi hệ thống khi đồng bộ'],
    }
  }
}
