import { NextRequest, NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  ALL_ROLES,
} from '@/lib/supabase/server'
import { parseBody, createGembaCommentSchema } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'

// Member là primary writer ở route này — feature đầu tiên trong repo
// dùng ALL_ROLES cho user-context write. RLS migration 033 đã gate
// (created_by = auth.uid() trong WITH CHECK) nhưng vẫn check role
// explicit để có 403 sạch trước khi DB throw.
export async function POST(request: NextRequest) {
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

    const bodyParsed = await parseBody(request, createGembaCommentSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const { target_type, target_id, body } = bodyParsed.data

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

    const rate = await checkRateLimit({
      key: `gemba:create:${user.id}`,
      limit: 20,
      windowSeconds: 300,
    })
    if (!rate.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rate.resetAt.getTime() - Date.now()) / 1000),
      )
      return NextResponse.json(
        {
          error: 'Bạn đang gửi góp ý quá nhanh. Vui lòng đợi vài phút.',
          retryAfter,
          requestId,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      )
    }

    // Note: KHÔNG validate target tồn tại (Hoshin trong vision_json
    // hoặc KPI trong kpis). Member có thể tạo orphan comment nếu
    // target bị xoá — không phá hệ thống. Defer M-Hoshin-6 nếu cần.
    const { data: row, error: insertError } = await supabase
      .from('gemba_comments')
      .insert({
        org_id: orgMember.org_id,
        target_type,
        target_id,
        body,
        created_by: user.id,
      })
      .select('id, created_at')
      .single()

    if (insertError || !row) {
      console.error(`[gemba/create] [${requestId}]`, insertError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }

    return NextResponse.json({ id: row.id, created_at: row.created_at })
  } catch (err) {
    console.error(`[gemba/create] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}
