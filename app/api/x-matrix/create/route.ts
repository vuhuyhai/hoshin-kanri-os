import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import {
  createClient,
  requireOrgRole,
  ADMIN_ROLES,
} from '@/lib/supabase/server'
import type { XMatrixData } from '@/lib/x-matrix/types'
import { validateXMatrix } from '@/lib/x-matrix/utils'
import type { Json } from '@/lib/supabase/types'
import { parseBody, xMatrixCreateSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await parseBody(request, xMatrixCreateSchema)
    if (!body.ok) return body.response
    const { year, orgId } = body.data
    // Zod validates the envelope shape; validateXMatrix() below enforces
    // XMatrixData business rules (hoshin/kpi counts, required fields).
    const data = body.data.data as unknown as XMatrixData

    // X-Matrix creation is CEO-only (migration 016). Return 403 early
    // instead of letting the row-level INSERT policy throw a generic 500.
    const check = await requireOrgRole(supabase, user.id, orgId, ADMIN_ROLES)
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    // Validate
    const errors = validateXMatrix(data)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 })
    }

    // Atomic dedupe: archive any existing active matrices for this org
    // and deactivate their KPIs BEFORE inserting the new one. Without
    // this, repeat saves stack up multiple active rows and the dashboard
    // query (maybeSingle) returns null on >1 match → empty state. The
    // partial unique index in migration 015 is the DB-level backstop.
    const { data: existingActive } = await supabase
      .from('x_matrices')
      .select('id')
      .eq('org_id', orgId)
      .eq('status', 'active')

    const existingActiveIds = (existingActive ?? []).map((m) => m.id)
    if (existingActiveIds.length > 0) {
      await supabase
        .from('x_matrices')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .in('id', existingActiveIds)

      // kpis.x_matrix_id is SET NULL on FK delete, but we're archiving
      // (soft delete), so we must explicitly deactivate to prevent the
      // dashboard KPI count from double-counting old + new.
      await supabase
        .from('kpis')
        .update({ is_active: false })
        .in('x_matrix_id', existingActiveIds)
        .eq('is_active', true)
    }

    // Create X-Matrix
    const { data: xMatrix, error: insertError } = await supabase
      .from('x_matrices')
      .insert({
        org_id: orgId,
        year,
        title: `X-Matrix ${year}`,
        vision_json: data as unknown as Json,
        status: 'active',
      })
      .select('id')
      .single()

    if (insertError || !xMatrix) {
      console.error('X-Matrix insert error:', insertError)
      return NextResponse.json(
        { error: 'Không thể tạo X-Matrix' },
        { status: 500 }
      )
    }

    // Auto-create KPIs
    let kpisCreated = 0
    for (const hoshin of data.hoshins) {
      for (const kpi of hoshin.kpis) {
        if (!kpi.name.trim() || !kpi.unit.trim() || kpi.targetValue <= 0)
          continue

        const { error: kpiError } = await supabase.from('kpis').insert({
          org_id: orgId,
          x_matrix_id: xMatrix.id,
          owner_user_id: kpi.ownerUserId,
          name: kpi.name,
          unit: kpi.unit,
          target_value: kpi.targetValue,
          frequency: kpi.frequency,
          is_active: true,
          dept_level: kpi.deptLevel,
        })

        if (!kpiError) kpisCreated++
      }
    }

    // Invalidate RSC caches so the dashboard flips to the
    // "X-Matrix exists" state immediately after redirect.
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/x-matrix')
    revalidatePath('/dashboard/x-matrix/new')
    revalidatePath('/dashboard/kpi')

    return NextResponse.json({
      success: true,
      xMatrixId: xMatrix.id,
      kpisCreated,
    })
  } catch (error) {
    console.error('X-Matrix create error:', error)
    return NextResponse.json(
      { error: 'Không thể tạo X-Matrix' },
      { status: 500 }
    )
  }
}
