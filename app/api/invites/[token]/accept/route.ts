import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/invites/[token]/accept — authed user chấp nhận invite
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const requestId = crypto.randomUUID()
  try {
    const { token } = await params

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

    // UUID format guard
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(token)) {
      return NextResponse.json(
        { error: 'Lời mời không tồn tại hoặc đã hết hạn.', requestId },
        { status: 410 },
      )
    }

    const admin = createAdminClient()

    // Bypass RLS — invite holder needs to read invite they don't yet "own"
    const { data: invite, error: inviteError } = await admin
      .from('org_invites')
      .select('id, org_id, role, expires_at, accepted_at')
      .eq('token', token)
      .maybeSingle()

    if (inviteError) {
      console.error(`[invites/accept] [${requestId}]`, inviteError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }
    if (!invite) {
      return NextResponse.json(
        { error: 'Lời mời không tồn tại hoặc đã hết hạn.', requestId },
        { status: 410 },
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

    // Already-member guard
    const { data: existing } = await admin
      .from('org_members')
      .select('user_id')
      .eq('org_id', invite.org_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) {
      return NextResponse.json(
        { error: 'Bạn đã là thành viên của tổ chức này.', requestId },
        { status: 400 },
      )
    }

    // Self-heal public.users row (mirrors POST /api/settings/org pattern)
    const { error: userUpsertError } = await admin
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name ?? null,
          phone: user.user_metadata?.phone ?? null,
        },
        { onConflict: 'id' },
      )
    if (userUpsertError) {
      console.error(`[invites/accept] [${requestId}]`, userUpsertError)
      return NextResponse.json(
        { error: 'Lỗi thiết lập tài khoản', requestId },
        { status: 500 },
      )
    }

    const { error: insertError } = await admin
      .from('org_members')
      .insert({
        org_id: invite.org_id,
        user_id: user.id,
        role: invite.role,
      })

    if (insertError) {
      console.error(`[invites/accept] [${requestId}]`, insertError)
      return NextResponse.json(
        { error: 'Không thể tham gia tổ chức', requestId },
        { status: 500 },
      )
    }

    // Set last_org_id in user metadata so dashboard layout picks correct org
    await supabase.auth.updateUser({
      data: { last_org_id: invite.org_id },
    })

    const { error: updateError } = await admin
      .from('org_invites')
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq('id', invite.id)

    if (updateError) {
      console.error(`[invites/accept] [${requestId}]`, updateError)
      // Member already inserted — log but don't fail UX
    }

    return NextResponse.json({
      success: true,
      org_id: invite.org_id,
      role: invite.role,
    })
  } catch (err) {
    console.error(`[invites/accept] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}
