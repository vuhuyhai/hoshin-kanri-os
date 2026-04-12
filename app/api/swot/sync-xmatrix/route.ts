import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncTowsStrategiesToXMatrix } from '@/lib/swot/sync-to-xmatrix'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Org not found' }, { status: 404 })
    }

    const body = await request.json()
    const { analysisId } = body as { analysisId?: string }

    if (!analysisId || typeof analysisId !== 'string') {
      return NextResponse.json({ error: 'Thiếu analysisId' }, { status: 400 })
    }

    // Verify the analysis belongs to this org
    const { data: analysis } = await supabase
      .from('swot_analyses')
      .select('org_id')
      .eq('id', analysisId)
      .single()

    if (!analysis || analysis.org_id !== membership.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const result = await syncTowsStrategiesToXMatrix(membership.org_id, analysisId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors[0] ?? 'Sync failed', errors: result.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[swot/sync-xmatrix] error:', error)
    return NextResponse.json(
      { error: 'Không thể đồng bộ sang X-Matrix' },
      { status: 500 }
    )
  }
}
