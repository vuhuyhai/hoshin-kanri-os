import { NextRequest, NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  ALL_ROLES,
} from '@/lib/supabase/server'
import {
  listGembaCommentsByTarget,
  getGembaUnreadSummary,
} from '@/lib/gemba/queries'
import { GEMBA_TARGET_TYPES } from '@/lib/gemba/types'
import type { GembaTargetType } from '@/lib/gemba/types'

// 2 modes via query params:
//   ?summary=1                                → unread aggregate cho banner CEO
//   ?target_type=hoshin|kpi & target_id=xxx   → list comments cho 1 target
// GET không Zod-parse — match pattern hansei/list (manual searchParams).
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
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

    const { data: orgMember } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập tổ chức này', requestId },
        { status: 403 },
      )
    }

    const check = await requireOrgRole(
      supabase,
      user.id,
      orgMember.org_id,
      ALL_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    const params = request.nextUrl.searchParams
    const isSummary = params.get('summary') === '1'

    if (isSummary) {
      const summary = await getGembaUnreadSummary(supabase, orgMember.org_id)
      return NextResponse.json(summary)
    }

    const targetTypeRaw = params.get('target_type') ?? ''
    const targetId = (params.get('target_id') ?? '').trim()

    const isValidTargetType = (
      GEMBA_TARGET_TYPES as readonly string[]
    ).includes(targetTypeRaw)

    if (!isValidTargetType || !targetId) {
      return NextResponse.json(
        {
          error:
            'Cần ?summary=1 HOẶC ?target_type=hoshin|kpi&target_id=<id>',
          requestId,
        },
        { status: 400 },
      )
    }

    const comments = await listGembaCommentsByTarget(
      supabase,
      orgMember.org_id,
      targetTypeRaw as GembaTargetType,
      targetId,
    )
    return NextResponse.json({ comments })
  } catch (err) {
    console.error(`[gemba/list] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}
