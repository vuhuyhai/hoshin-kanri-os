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

    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError?.code === 'PGRST116') {
      console.warn(`[xray-context] Multi-org user ${user.id}`)
      return NextResponse.json(
        { error: 'User belongs to multiple organizations. Please specify org_id explicitly.' },
        { status: 409 },
      )
    }

    if (!membership) {
      return NextResponse.json(
        { error: 'Không tìm thấy tổ chức' },
        { status: 404 },
      )
    }

    // Match by current org_id OR by user_id — covers users who ran X-Ray
    // before their org_members row existed. Mirrors prefill-from-xray route.
    let query = supabase
      .from('xray_results')
      .select('id, result_json')
      .or(`org_id.eq.${membership.org_id},user_id.eq.${user.id}`)
    if (xrayId) {
      query = query.eq('id', xrayId)
    } else {
      query = query.order('created_at', { ascending: false })
    }
    const { data: rows } = await query.limit(1)

    const row = (rows as unknown as Array<{ id: string; result_json: unknown }>)?.[0]

    // Explicit xrayId but no row → either doesn't exist or belongs to another
    // org (RLS filters silently). Return 404 so the caller can surface a clear
    // "bản X-Ray này không tồn tại" error instead of treating it like "never ran".
    if (xrayId && !row) {
      return NextResponse.json(
        { error: 'Không tìm thấy bản X-Ray này' },
        { status: 404 },
      )
    }

    // No xrayId and no history → org genuinely hasn't run X-Ray yet.
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
