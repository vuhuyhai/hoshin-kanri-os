import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  ALL_ROLES,
  ADMIN_ROLES,
} from '@/lib/supabase/server'
import { parseBody, updateAnnualReviewSchema } from '@/lib/validation'
import type { TablesUpdate } from '@/lib/supabase/types'

export async function GET(
  _req: NextRequest,
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

    const { data: review, error: reviewError } = await supabase
      .from('annual_reviews')
      .select(
        'id, x_matrix_id, org_id, status, reviewed_at, a3_background, a3_current_state, a3_target_gap, a3_next_action',
      )
      .eq('id', id)
      .maybeSingle()

    if (reviewError) {
      console.error(`[annual-review/get] [${requestId}]`, reviewError)
      return NextResponse.json(
        { error: 'Không thể tải annual review', requestId },
        { status: 500 },
      )
    }
    if (!review) {
      return NextResponse.json(
        { error: 'Annual review không tồn tại', requestId },
        { status: 404 },
      )
    }

    // Explicit membership check produces a 403 instead of an empty
    // result set. RLS would silently filter the row out otherwise.
    const check = await requireOrgRole(
      supabase,
      user.id,
      review.org_id,
      ALL_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    const [{ data: actualsRows, error: actualsError }, { data: carryRows, error: carryError }] =
      await Promise.all([
        supabase
          .from('kpi_actuals')
          .select('kpi_id, actual_value, achievement_pct, note')
          .eq('annual_review_id', id),
        supabase
          .from('carry_overs')
          .select('source_hoshin_id, decision, modified_title, rationale')
          .eq('annual_review_id', id),
      ])

    if (actualsError || carryError) {
      console.error(
        `[annual-review/get] [${requestId}]`,
        actualsError ?? carryError,
      )
      return NextResponse.json(
        { error: 'Không thể tải annual review', requestId },
        { status: 500 },
      )
    }

    return NextResponse.json({
      id: review.id,
      xMatrixId: review.x_matrix_id,
      status: review.status,
      reviewedAt: review.reviewed_at,
      a3: {
        background: review.a3_background ?? '',
        currentState: review.a3_current_state ?? '',
        targetGap: review.a3_target_gap ?? '',
        nextAction: review.a3_next_action ?? '',
      },
      kpiActuals: (actualsRows ?? []).map((r) => ({
        kpiId: r.kpi_id,
        actualValue: Number(r.actual_value),
        achievementPct: r.achievement_pct == null ? 0 : Number(r.achievement_pct),
        note: r.note ?? undefined,
      })),
      carryOvers: (carryRows ?? []).map((r) => ({
        sourceHoshinId: r.source_hoshin_id,
        decision: r.decision,
        modifiedTitle: r.modified_title ?? undefined,
        rationale: r.rationale ?? undefined,
      })),
    })
  } catch (err) {
    console.error(`[annual-review/get] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Không thể tải annual review', requestId },
      { status: 500 },
    )
  }
}

export async function PUT(
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

    const bodyParsed = await parseBody(request, updateAnnualReviewSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const { status, a3, kpiActuals, carryOvers } = bodyParsed.data

    const { data: review, error: reviewError } = await supabase
      .from('annual_reviews')
      .select('id, org_id, status')
      .eq('id', id)
      .maybeSingle()

    if (reviewError) {
      console.error(`[annual-review/put] [${requestId}]`, reviewError)
      return NextResponse.json(
        { error: 'Không thể cập nhật annual review', requestId },
        { status: 500 },
      )
    }
    if (!review) {
      return NextResponse.json(
        { error: 'Annual review không tồn tại', requestId },
        { status: 404 },
      )
    }

    if (review.status === 'transitioned') {
      return NextResponse.json(
        {
          error:
            'Annual review đã chuyển giao — không thể chỉnh sửa. Hãy chỉnh sửa X-Matrix mới.',
          requestId,
        },
        { status: 409 },
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

    const reviewUpdate: TablesUpdate<'annual_reviews'> = {}
    if (a3) {
      reviewUpdate.a3_background = a3.background
      reviewUpdate.a3_current_state = a3.currentState
      reviewUpdate.a3_target_gap = a3.targetGap
      reviewUpdate.a3_next_action = a3.nextAction
    }
    if (status) {
      reviewUpdate.status = status
      if (status === 'completed') {
        reviewUpdate.reviewed_at = new Date().toISOString()
      }
    }

    if (Object.keys(reviewUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('annual_reviews')
        .update(reviewUpdate)
        .eq('id', id)
      if (updateError) {
        console.error(`[annual-review/put] [${requestId}]`, updateError)
        return NextResponse.json(
          { error: 'Không thể cập nhật annual review', requestId },
          { status: 500 },
        )
      }
    }

    if (kpiActuals && kpiActuals.length > 0) {
      const kpiIds = kpiActuals.map((k) => k.kpiId)
      const { data: kpisRows, error: kpisError } = await supabase
        .from('kpis')
        .select('id, target_value, org_id')
        .in('id', kpiIds)

      if (kpisError) {
        console.error(`[annual-review/put] [${requestId}]`, kpisError)
        return NextResponse.json(
          { error: 'Không thể cập nhật actual KPI', requestId },
          { status: 500 },
        )
      }

      const targetById = new Map(
        (kpisRows ?? []).map((k) => [k.id, Number(k.target_value)] as const),
      )

      // Reject KPIs that don't belong to this org. Without this an admin
      // user could write actuals for KPIs outside their org via crafted
      // payload — RLS on kpis would block reads, but the kpi_actuals row
      // itself would slip through (its policies join annual_reviews, not kpis).
      const wrongOrg = (kpisRows ?? []).find((k) => k.org_id !== review.org_id)
      if (wrongOrg || (kpisRows ?? []).length !== kpiIds.length) {
        return NextResponse.json(
          { error: 'Một số KPI không thuộc tổ chức này', requestId },
          { status: 400 },
        )
      }

      const upsertRows = kpiActuals.map((entry) => {
        const target = targetById.get(entry.kpiId)
        const achievement =
          target && target !== 0 ? (entry.actualValue / target) * 100 : null
        return {
          annual_review_id: id,
          kpi_id: entry.kpiId,
          actual_value: entry.actualValue,
          achievement_pct: achievement,
          note: entry.note ?? null,
        }
      })

      const { error: actualsError } = await supabase
        .from('kpi_actuals')
        .upsert(upsertRows, { onConflict: 'annual_review_id,kpi_id' })

      if (actualsError) {
        console.error(`[annual-review/put] [${requestId}]`, actualsError)
        return NextResponse.json(
          { error: 'Không thể cập nhật actual KPI', requestId },
          { status: 500 },
        )
      }
    }

    if (carryOvers && carryOvers.length > 0) {
      const upsertRows = carryOvers.map((c) => ({
        annual_review_id: id,
        source_hoshin_id: c.sourceHoshinId,
        decision: c.decision,
        modified_title: c.modifiedTitle ?? null,
        rationale: c.rationale ?? null,
      }))

      const { error: carryError } = await supabase
        .from('carry_overs')
        .upsert(upsertRows, { onConflict: 'annual_review_id,source_hoshin_id' })

      if (carryError) {
        console.error(`[annual-review/put] [${requestId}]`, carryError)
        return NextResponse.json(
          { error: 'Không thể cập nhật carry-over', requestId },
          { status: 500 },
        )
      }
    }

    const { data: updated, error: refetchError } = await supabase
      .from('annual_reviews')
      .select(
        'id, x_matrix_id, status, reviewed_at, a3_background, a3_current_state, a3_target_gap, a3_next_action',
      )
      .eq('id', id)
      .single()

    if (refetchError || !updated) {
      console.error(`[annual-review/put] [${requestId}]`, refetchError)
      return NextResponse.json(
        { error: 'Cập nhật xong nhưng không tải lại được', requestId },
        { status: 500 },
      )
    }

    const [{ data: actualsRows }, { data: carryRows }] = await Promise.all([
      supabase
        .from('kpi_actuals')
        .select('kpi_id, actual_value, achievement_pct, note')
        .eq('annual_review_id', id),
      supabase
        .from('carry_overs')
        .select('source_hoshin_id, decision, modified_title, rationale')
        .eq('annual_review_id', id),
    ])

    return NextResponse.json({
      id: updated.id,
      xMatrixId: updated.x_matrix_id,
      status: updated.status,
      reviewedAt: updated.reviewed_at,
      a3: {
        background: updated.a3_background ?? '',
        currentState: updated.a3_current_state ?? '',
        targetGap: updated.a3_target_gap ?? '',
        nextAction: updated.a3_next_action ?? '',
      },
      kpiActuals: (actualsRows ?? []).map((r) => ({
        kpiId: r.kpi_id,
        actualValue: Number(r.actual_value),
        achievementPct: r.achievement_pct == null ? 0 : Number(r.achievement_pct),
        note: r.note ?? undefined,
      })),
      carryOvers: (carryRows ?? []).map((r) => ({
        sourceHoshinId: r.source_hoshin_id,
        decision: r.decision,
        modifiedTitle: r.modified_title ?? undefined,
        rationale: r.rationale ?? undefined,
      })),
    })
  } catch (err) {
    console.error(`[annual-review/put] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Không thể cập nhật annual review', requestId },
      { status: 500 },
    )
  }
}
