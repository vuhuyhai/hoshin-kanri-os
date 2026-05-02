import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createClient,
  requireOrgRole,
  ADMIN_ROLES,
  ALL_ROLES,
} from '@/lib/supabase/server'
import { parseBody } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/send'
import { inviteEmailTemplate } from '@/lib/email/templates'
import { INVITE_MAX_PENDING } from '@/lib/invites/types'
import type { OrgInvite } from '@/lib/invites/types'

const createInviteSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  role: z.enum(['Manager', 'Member']),
})

// POST /api/invites — CEO tạo invite mới
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

    const parsed = await parseBody(request, createInviteSchema)
    if (!parsed.ok) return parsed.response
    const body = parsed.data

    // Resolve user's org
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
    const orgId = membership.org_id

    // CEO-only
    const check = await requireOrgRole(supabase, user.id, orgId, ADMIN_ROLES)
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    // Rate limit: 10 invites/hour per org
    const rate = await checkRateLimit({
      key: `invites:create:${orgId}`,
      limit: 10,
      windowSeconds: 3600,
    })
    if (!rate.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rate.resetAt.getTime() - Date.now()) / 1000),
      )
      return NextResponse.json(
        {
          error: 'Đang gửi lời mời quá nhanh. Vui lòng đợi.',
          retryAfter,
          requestId,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      )
    }

    const nowIso = new Date().toISOString()

    // Check pending count
    const { count: pendingCount, error: countError } = await supabase
      .from('org_invites')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('accepted_at', null)
      .gt('expires_at', nowIso)
    if (countError) {
      console.error(`[invites/post] [${requestId}]`, countError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }
    if ((pendingCount ?? 0) >= INVITE_MAX_PENDING) {
      return NextResponse.json(
        {
          error: 'Tổ chức đã có 5 lời mời đang chờ. Hủy bớt trước khi tạo mới.',
          requestId,
        },
        { status: 400 },
      )
    }

    // Check duplicate pending
    const { data: dup, error: dupError } = await supabase
      .from('org_invites')
      .select('id')
      .eq('org_id', orgId)
      .eq('email', body.email)
      .is('accepted_at', null)
      .gt('expires_at', nowIso)
      .maybeSingle()
    if (dupError) {
      console.error(`[invites/post] [${requestId}]`, dupError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }
    if (dup) {
      return NextResponse.json(
        { error: 'Email này đã có lời mời đang chờ.', requestId },
        { status: 400 },
      )
    }

    // Insert (token + expires_at từ DB default)
    const { data: invite, error: insertError } = await supabase
      .from('org_invites')
      .insert({
        org_id: orgId,
        invited_by: user.id,
        email: body.email,
        role: body.role,
      })
      .select('id, email, role, expires_at, token')
      .single()

    if (insertError || !invite) {
      console.error(`[invites/post] [${requestId}]`, insertError)
      return NextResponse.json(
        { error: 'Không thể tạo lời mời', requestId },
        { status: 500 },
      )
    }

    // Audit (no email/token leak)
    console.log('[audit:invite-create]', {
      org_id: orgId,
      invited_by: user.id,
      email: body.email,
      role: body.role,
    })

    // Lookup org name + inviter name for email body
    const [{ data: org }, { data: inviterProfile }] = await Promise.all([
      supabase.from('organizations').select('name').eq('id', orgId).maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle(),
    ])

    const orgName = org?.name ?? 'tổ chức'
    const inviterName =
      inviterProfile?.full_name ?? user.email ?? 'Một thành viên'
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://chienluoc.org'
    const inviteLink = `${appUrl}/invite/${invite.token}`

    const { subject, html } = inviteEmailTemplate({
      orgName,
      inviterName,
      role: invite.role,
      inviteLink,
    })

    // Fire-and-forget email send; failures don't roll back invite (CEO can resend).
    const emailResult = await sendEmail({ to: body.email, subject, html })
    if (emailResult.error) {
      console.error(`[invites/post] [${requestId}] email send failed`)
    }

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expires_at: invite.expires_at,
        token: invite.token,
      },
    })
  } catch (err) {
    console.error(`[invites/post] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}

// GET /api/invites — CEO/Manager xem invites pending của org
export async function GET() {
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

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!membership) {
      return NextResponse.json(
        { error: 'Bạn chưa thuộc tổ chức nào', requestId },
        { status: 403 },
      )
    }

    // CEO + Manager only — block plain Members from seeing invite list
    const check = await requireOrgRole(
      supabase,
      user.id,
      membership.org_id,
      ALL_ROLES.filter((r) => r !== 'Member'),
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from('org_invites')
      .select('*')
      .eq('org_id', membership.org_id)
      .is('accepted_at', null)
      .gt('expires_at', nowIso)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`[invites/get] [${requestId}]`, error)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }

    return NextResponse.json({ invites: (data ?? []) as OrgInvite[] })
  } catch (err) {
    console.error(`[invites/get] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}
