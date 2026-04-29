import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  createClient,
  requireOrgRole,
  ADMIN_ROLES,
} from '@/lib/supabase/server'
import { parseBody, transitionAnnualReviewSchema } from '@/lib/validation'
import type { XMatrixData, XMatrixHoshin } from '@/lib/x-matrix/types'
import { toJson } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID()
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401 },
      )
    }

    const bodyParsed = await parseBody(request, transitionAnnualReviewSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const { newYear } = bodyParsed.data

    const { data: review, error: reviewError } = await supabase
      .from('annual_reviews')
      .select('id, org_id, x_matrix_id, status')
      .eq('id', id)
      .maybeSingle()

    if (reviewError) {
      console.error(`[annual-review/transition] [${requestId}]`, reviewError)
      return NextResponse.json(
        { error: 'Không thể chuyển giao', requestId },
        { status: 500 },
      )
    }
    if (!review) {
      return NextResponse.json(
        { error: 'Annual review không tồn tại', requestId },
        { status: 404 },
      )
    }

    const check = await requireOrgRole(
      supabase,
      user.id,
      review.org_id,
      ADMIN_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    if (review.status !== 'completed') {
      return NextResponse.json(
        {
          error:
            review.status === 'transitioned'
              ? 'Annual review đã chuyển giao'
              : 'Phải hoàn thành (completed) annual review trước khi chuyển giao',
          requestId,
        },
        { status: 409 },
      )
    }

    const { data: oldMatrix, error: matrixError } = await supabase
      .from('x_matrices')
      .select('id, vision_json, year, status')
      .eq('id', review.x_matrix_id)
      .maybeSingle()

    if (matrixError) {
      console.error(`[annual-review/transition] [${requestId}]`, matrixError)
      return NextResponse.json(
        { error: 'Không thể chuyển giao', requestId },
        { status: 500 },
      )
    }
    if (!oldMatrix || !oldMatrix.vision_json) {
      return NextResponse.json(
        { error: 'X-Matrix gốc không tồn tại hoặc thiếu dữ liệu', requestId },
        { status: 404 },
      )
    }

    const oldData = oldMatrix.vision_json as unknown as XMatrixData

    const { data: carryRows, error: carryError } = await supabase
      .from('carry_overs')
      .select('source_hoshin_id, decision, modified_title')
      .eq('annual_review_id', id)

    if (carryError) {
      console.error(`[annual-review/transition] [${requestId}]`, carryError)
      return NextResponse.json(
        { error: 'Không thể chuyển giao', requestId },
        { status: 500 },
      )
    }

    const decisionByHoshin = new Map(
      (carryRows ?? []).map(
        (r) =>
          [r.source_hoshin_id, { decision: r.decision, modifiedTitle: r.modified_title }] as const,
      ),
    )

    const newHoshins: XMatrixHoshin[] = []
    for (const hoshin of oldData.hoshins ?? []) {
      const carry = decisionByHoshin.get(hoshin.id)
      if (!carry) continue
      if (carry.decision === 'drop' || carry.decision === 'pending') continue

      const newHoshinId = crypto.randomUUID()
      const newKpis = (hoshin.kpis ?? []).map((kpi) => ({
        ...kpi,
        id: crypto.randomUUID(),
      }))
      const newInitiatives = (hoshin.initiatives ?? []).map((ini) => ({
        ...ini,
        id: crypto.randomUUID(),
      }))

      newHoshins.push({
        id: newHoshinId,
        title:
          carry.decision === 'modify' && carry.modifiedTitle
            ? carry.modifiedTitle
            : hoshin.title,
        description: hoshin.description,
        initiatives: newInitiatives,
        kpis: newKpis,
        sourceSwotCellType: hoshin.sourceSwotCellType,
        suggestedKpis: hoshin.suggestedKpis,
        status: hoshin.status,
      })
    }

    const newData: XMatrixData = {
      vision: oldData.vision,
      yearGoals: oldData.yearGoals ?? [],
      hoshins: newHoshins,
    }

    // Migration 015: x_matrices has UNIQUE active per org. Archive the
    // old matrix and deactivate its KPIs BEFORE inserting the new active
    // row, otherwise the partial unique index throws and leaves the
    // annual review in 'completed' state.
    const { error: archiveError } = await supabase
      .from('x_matrices')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', oldMatrix.id)

    if (archiveError) {
      console.error(`[annual-review/transition] [${requestId}]`, archiveError)
      return NextResponse.json(
        { error: 'Không thể archive X-Matrix cũ', requestId },
        { status: 500 },
      )
    }

    await supabase
      .from('kpis')
      .update({ is_active: false })
      .eq('x_matrix_id', oldMatrix.id)
      .eq('is_active', true)

    const { data: newMatrix, error: insertError } = await supabase
      .from('x_matrices')
      .insert({
        org_id: review.org_id,
        year: newYear,
        title: `X-Matrix ${newYear}`,
        vision_json: toJson(newData),
        status: 'active',
      })
      .select('id')
      .single()

    if (insertError || !newMatrix) {
      console.error(`[annual-review/transition] [${requestId}]`, insertError)
      // Best-effort rollback: re-activate old matrix so the org isn't
      // left without an active X-Matrix. KPIs stay deactivated — user
      // can reactivate them via the dashboard.
      await supabase
        .from('x_matrices')
        .update({ status: 'active' })
        .eq('id', oldMatrix.id)
      return NextResponse.json(
        { error: 'Không thể tạo X-Matrix mới', requestId },
        { status: 500 },
      )
    }

    // Mirror create route: insert KPIs from carried-over hoshins so the
    // dashboard KPI tracker has fresh rows for the new year.
    for (const hoshin of newHoshins) {
      for (const kpi of hoshin.kpis) {
        if (!kpi.name.trim() || !kpi.unit.trim() || kpi.targetValue <= 0) continue
        await supabase.from('kpis').insert({
          org_id: review.org_id,
          x_matrix_id: newMatrix.id,
          owner_user_id: kpi.ownerUserId,
          name: kpi.name,
          unit: kpi.unit,
          target_value: kpi.targetValue,
          frequency: kpi.frequency,
          is_active: true,
          dept_level: kpi.deptLevel,
        })
      }
    }

    const { error: reviewUpdateError } = await supabase
      .from('annual_reviews')
      .update({ status: 'transitioned' })
      .eq('id', id)

    if (reviewUpdateError) {
      console.error(
        `[annual-review/transition] [${requestId}]`,
        reviewUpdateError,
      )
      // The X-Matrix swap already happened — surface the error but
      // the new matrix exists. Client should re-fetch the review.
      return NextResponse.json(
        {
          error: 'X-Matrix mới đã tạo nhưng không cập nhật được trạng thái review',
          requestId,
          newXMatrixId: newMatrix.id,
        },
        { status: 500 },
      )
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/x-matrix')
    revalidatePath('/dashboard/kpi')

    return NextResponse.json({
      newXMatrixId: newMatrix.id,
      oldXMatrixId: oldMatrix.id,
      year: newYear,
    })
  } catch (err) {
    console.error(`[annual-review/transition] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Không thể chuyển giao', requestId },
      { status: 500 },
    )
  }
}
