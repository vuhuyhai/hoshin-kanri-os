import { NextRequest, NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRoleForAnalysis,
  ADMIN_ROLES,
} from '@/lib/supabase/server'
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

    const body = await request.json()
    const { analysisId } = body as { analysisId?: string }

    if (!analysisId || typeof analysisId !== 'string') {
      return NextResponse.json({ error: 'Thiếu analysisId' }, { status: 400 })
    }

    // Sync writes to x_matrices (CEO-only per migration 016).
    const check = await requireOrgRoleForAnalysis(supabase, user.id, analysisId, ADMIN_ROLES)
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }
    const { orgId } = check

    const result = await syncTowsStrategiesToXMatrix(orgId, analysisId)

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
