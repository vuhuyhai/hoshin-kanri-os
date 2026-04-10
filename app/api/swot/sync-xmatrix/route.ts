import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncCandidatesToXMatrix } from '@/lib/swot/sync-to-xmatrix'
import type { HoshinCandidate } from '@/lib/swot/swot-session-store'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership)
      return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    const body = await request.json()
    const { candidates } = body as { candidates: HoshinCandidate[] }

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json(
        { error: 'Chưa chọn Hoshin Candidate nào' },
        { status: 400 }
      )
    }

    const result = await syncCandidatesToXMatrix(
      membership.org_id,
      candidates
    )

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
