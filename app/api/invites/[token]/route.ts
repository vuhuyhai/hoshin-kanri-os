import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  ADMIN_ROLES,
} from '@/lib/supabase/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// DELETE /api/invites/[token] — CEO revoke pending invite by token
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const requestId = crypto.randomUUID()
  try {
    const { token } = await params

    if (!UUID_RE.test(token)) {
      return NextResponse.json(
        { error: 'Lời mời không tồn tại', requestId },
        { status: 404 },
      )
    }

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

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json(
        { error: 'Bạn chưa thuộc tổ chức nào', requestId },
        { status: 403 },
      )
    }

    const check = await requireOrgRole(
      supabase,
      user.id,
      membership.org_id,
      ADMIN_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    const { data: invite, error: lookupError } = await supabase
      .from('org_invites')
      .select('id, accepted_at')
      .eq('token', token)
      .eq('org_id', membership.org_id)
      .maybeSingle()

    if (lookupError) {
      console.error(`[invites/delete] [${requestId}]`, lookupError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }
    if (!invite) {
      return NextResponse.json(
        { error: 'Lời mời không tồn tại', requestId },
        { status: 404 },
      )
    }
    if (invite.accepted_at !== null) {
      return NextResponse.json(
        { error: 'Lời mời đã được chấp nhận, không thể hủy.', requestId },
        { status: 400 },
      )
    }

    const { error: deleteError } = await supabase
      .from('org_invites')
      .delete()
      .eq('token', token)

    if (deleteError) {
      console.error(`[invites/delete] [${requestId}]`, deleteError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(`[invites/delete] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}
