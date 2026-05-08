import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { parseBody } from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'

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

    const rl = await checkRateLimit({
      key: `orgs:switch:${user.id}`,
      limit: RATE_LIMIT,
      windowSeconds: RATE_WINDOW_SECONDS,
    })
    if (!rl.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000),
      )
      return NextResponse.json(
        { error: 'Quá nhiều request', retryAfter, requestId },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }

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

    // Decision Q4 γ — write metadata only; client triggers full reload so
    // layout's auth.getUser() (network call) reads fresh metadata next request,
    // bypassing JWT cookie staleness. See plans/M-Auth-MultiOrg-1-plan.md.
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
