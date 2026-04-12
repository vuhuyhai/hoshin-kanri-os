import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { XMatrixData } from '@/lib/x-matrix/types'
import { validateXMatrix } from '@/lib/x-matrix/utils'
import type { Json } from '@/lib/supabase/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { data, year, orgId } = body as {
      data: XMatrixData
      year: number
      orgId: string
    }

    // Verify user belongs to org
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .single()

    if (!membership)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    // Validate
    const errors = validateXMatrix(data)
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 })
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
