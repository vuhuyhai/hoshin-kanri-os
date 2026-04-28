import { NextRequest, NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  WRITE_ROLES,
  ALL_ROLES,
} from '@/lib/supabase/server'
import { parseBody } from '@/lib/validation'
import {
  listCorrelationsQuerySchema,
  upsertCorrelationSchema,
} from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = listCorrelationsQuerySchema.safeParse({
      xMatrixId: request.nextUrl.searchParams.get('xMatrixId') ?? '',
    })
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'xMatrixId không hợp lệ'
      return NextResponse.json(
        { error: message, issues: parsed.error.issues },
        { status: 400 },
      )
    }
    const { xMatrixId } = parsed.data

    const { data: xMatrix, error: lookupError } = await supabase
      .from('x_matrices')
      .select('org_id')
      .eq('id', xMatrixId)
      .maybeSingle()

    if (lookupError) {
      console.error('[correlations]', lookupError)
      return NextResponse.json(
        { error: 'Không thể tải correlations' },
        { status: 500 },
      )
    }
    if (!xMatrix) {
      return NextResponse.json(
        { error: 'X-Matrix không tồn tại' },
        { status: 404 },
      )
    }

    const check = await requireOrgRole(
      supabase,
      user.id,
      xMatrix.org_id,
      ALL_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { data: rows, error } = await supabase
      .from('xmatrix_correlations')
      .select('year_goal_id, hoshin_id, strength')
      .eq('x_matrix_id', xMatrixId)

    if (error) {
      console.error('[correlations]', error)
      return NextResponse.json(
        { error: 'Không thể tải correlations' },
        { status: 500 },
      )
    }

    const correlations = (rows ?? []).map((r) => ({
      yearGoalId: r.year_goal_id,
      hoshinId: r.hoshin_id,
      strength: r.strength,
    }))

    return NextResponse.json({ correlations })
  } catch (err) {
    console.error('[correlations]', err)
    return NextResponse.json(
      { error: 'Không thể tải correlations' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await parseBody(request, upsertCorrelationSchema)
    if (!body.ok) return body.response
    const { xMatrixId, yearGoalId, hoshinId, strength } = body.data

    const { data: xMatrix, error: lookupError } = await supabase
      .from('x_matrices')
      .select('org_id')
      .eq('id', xMatrixId)
      .maybeSingle()

    if (lookupError) {
      console.error('[correlations]', lookupError)
      return NextResponse.json(
        { error: 'Không thể lưu correlation' },
        { status: 500 },
      )
    }
    if (!xMatrix) {
      return NextResponse.json(
        { error: 'X-Matrix không tồn tại' },
        { status: 404 },
      )
    }

    const check = await requireOrgRole(
      supabase,
      user.id,
      xMatrix.org_id,
      WRITE_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const { data: row, error } = await supabase
      .from('xmatrix_correlations')
      .upsert(
        {
          org_id: xMatrix.org_id,
          x_matrix_id: xMatrixId,
          year_goal_id: yearGoalId,
          hoshin_id: hoshinId,
          strength,
          created_by: user.id,
        },
        { onConflict: 'x_matrix_id,year_goal_id,hoshin_id' },
      )
      .select('year_goal_id, hoshin_id, strength')
      .single()

    if (error || !row) {
      console.error('[correlations]', error)
      return NextResponse.json(
        { error: 'Không thể lưu correlation' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      correlation: {
        yearGoalId: row.year_goal_id,
        hoshinId: row.hoshin_id,
        strength: row.strength,
      },
    })
  } catch (err) {
    console.error('[correlations]', err)
    return NextResponse.json(
      { error: 'Không thể lưu correlation' },
      { status: 500 },
    )
  }
}
