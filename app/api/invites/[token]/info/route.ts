import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { InvitePublicInfo } from '@/lib/invites/types'

// GET /api/invites/[token]/info — public route, no auth required.
// Trả về thông tin invite đủ để hiển thị landing page chấp nhận.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const requestId = crypto.randomUUID()
  try {
    const { token } = await params

    // UUID format guard — bad token should 404 quickly without DB hit
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(token)) {
      return NextResponse.json(
        { error: 'Lời mời không tồn tại hoặc đã hết hạn.', requestId },
        { status: 404 },
      )
    }

    const admin = createAdminClient()

    const { data: invite, error: inviteError } = await admin
      .from('org_invites')
      .select('org_id, invited_by, role, expires_at, accepted_at')
      .eq('token', token)
      .maybeSingle()

    if (inviteError) {
      console.error(`[invites/info] [${requestId}]`, inviteError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }
    if (!invite) {
      return NextResponse.json(
        { error: 'Lời mời không tồn tại hoặc đã hết hạn.', requestId },
        { status: 404 },
      )
    }
    if (invite.accepted_at !== null) {
      return NextResponse.json(
        { error: 'Lời mời đã được sử dụng.', requestId },
        { status: 410 },
      )
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Lời mời đã hết hạn.', requestId },
        { status: 410 },
      )
    }

    const [{ data: org }, { data: inviter }] = await Promise.all([
      admin
        .from('organizations')
        .select('name, industry')
        .eq('id', invite.org_id)
        .maybeSingle(),
      admin
        .from('profiles')
        .select('full_name')
        .eq('id', invite.invited_by)
        .maybeSingle(),
    ])

    if (!org) {
      return NextResponse.json(
        { error: 'Tổ chức không còn tồn tại.', requestId },
        { status: 404 },
      )
    }

    // Optional session check for already_member flag
    let alreadyMember = false
    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: existing } = await admin
          .from('org_members')
          .select('user_id')
          .eq('org_id', invite.org_id)
          .eq('user_id', user.id)
          .maybeSingle()
        alreadyMember = !!existing
      }
    } catch {
      // Session check is best-effort; default to false
    }

    const info: InvitePublicInfo = {
      org_name: org.name,
      org_industry: org.industry,
      role: invite.role,
      invited_by_name: inviter?.full_name ?? 'Một thành viên',
      expires_at: invite.expires_at,
      already_member: alreadyMember,
    }

    return NextResponse.json(info)
  } catch (err) {
    console.error(`[invites/info] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}
