import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapXRayToSwotSeed } from '@/lib/swot/xray-to-swot-mapper'
import type { XRayResult } from '@/lib/x-ray/types'

export async function GET(request: NextRequest) {
  try {
    const xrayId = request.nextUrl.searchParams.get('xray_id')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Không tìm thấy tổ chức' },
        { status: 404 },
      )
    }

    let query = supabase
      .from('xray_results')
      .select('id, result_json')
      .eq('org_id', membership.org_id)
    if (xrayId) {
      query = query.eq('id', xrayId)
    } else {
      query = query.order('created_at', { ascending: false })
    }
    const { data: rows } = await query.limit(1)

    const row = (rows as unknown as Array<{ id: string; result_json: unknown }>)?.[0]

    if (!row) {
      return NextResponse.json({ hasXRay: false, data: null })
    }

    const seed = mapXRayToSwotSeed(row.id, row.result_json as XRayResult)

    return NextResponse.json({ hasXRay: true, data: seed })
  } catch {
    return NextResponse.json(
      { error: 'Không thể tải dữ liệu X-Ray' },
      { status: 500 },
    )
  }
}
