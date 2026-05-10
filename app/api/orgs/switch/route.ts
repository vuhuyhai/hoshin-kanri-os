import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { parseBody } from '@/lib/validation'
import { requireRateLimit } from '@/lib/http/rate-limit-helper'

const RATE_LIMIT = 30
const RATE_WINDOW_SECONDS = 300

const switchOrgSchema = z.object({
  org_id: z.string().uuid(),
})

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

    const rl = await requireRateLimit(user.id, {
      bucket: 'orgs:switch',
      limit: RATE_LIMIT,
      windowSeconds: RATE_WINDOW_SECONDS,
      extras: { requestId },
    })
    if (!rl.ok) return rl.response

    const parsed = await parseBody(request, switchOrgSchema)
    if (!parsed.ok) return parsed.response
    const { org_id } = parsed.data

    // Verify membership of target org. Direct query (vs requireOrgRole helper)
    // so we can include role in the audit log without a second round-trip.
    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('org_id', org_id)
      .maybeSingle()

    if (membershipError) {
      console.error(`[orgs/switch] [${requestId}]`, membershipError)
      return NextResponse.json(
        { error: 'Lỗi hệ thống', requestId },
        { status: 500 },
      )
    }
    if (!membership) {
      try {
        console.log(
          '[audit:org-switch]',
          JSON.stringify({
            event: 'forbidden',
            user_id: user.id,
            target_org_id: org_id,
            timestamp: new Date().toISOString(),
          }),
        )
      } catch {
        // never block response on audit failure
      }
      return NextResponse.json(
        { error: 'Không có quyền truy cập tổ chức này', requestId },
        { status: 403 },
      )
    }

    const fromOrgId =
      (user.user_metadata?.last_org_id as string | undefined) ?? null

    // Decision Q4 γ refined — updateUser writes metadata to DB, then
    // refreshSession re-mints the JWT so its embedded user_metadata.last_org_id
    // matches DB. Without refresh, layout.tsx auth.getUser() returns the
    // JWT's stale claim → currentMembership falls back to memberships[0]
    // → CheckCircle indicator renders the wrong item (smoke test CASE 1).
    // Client still triggers a full reload after this returns.
    const { error: updateError } = await supabase.auth.updateUser({
      data: { last_org_id: org_id },
    })

    if (updateError) {
      console.error(`[orgs/switch] [${requestId}]`, updateError)
      return NextResponse.json(
        { error: 'Không thể đổi tổ chức', requestId },
        { status: 500 },
      )
    }

    const { error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      // DB write already succeeded; client full reload will mint a fresh JWT
      // on its own. Log + continue rather than fail the switch.
      console.error(
        '[org-switch] refreshSession failed:',
        JSON.stringify({
          error: refreshError.message,
          user_id: user.id,
          requestId,
          timestamp: new Date().toISOString(),
        }),
      )
    }

    try {
      console.log(
        '[audit:org-switch]',
        JSON.stringify({
          event: 'switch',
          user_id: user.id,
          from_org_id: fromOrgId,
          to_org_id: org_id,
          role: membership.role,
          timestamp: new Date().toISOString(),
        }),
      )
    } catch {
      // never block response on audit failure
    }

    return NextResponse.json({ success: true, org_id })
  } catch (err) {
    console.error(`[orgs/switch] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Lỗi hệ thống', requestId },
      { status: 500 },
    )
  }
}
