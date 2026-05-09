import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createClient,
  requireOrgRole,
  ADMIN_ROLES,
} from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const paramsSchema = z.object({
  id: z.string().uuid({ message: 'KPI ID phải là UUID hợp lệ' }),
})

const RATE_LIMIT = 30
const RATE_WINDOW_SECONDS = 300

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID()

  try {
    const resolvedParams = await params
    const parseResult = paramsSchema.safeParse(resolvedParams)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'KPI ID không hợp lệ',
          details: parseResult.error.flatten(),
          requestId,
        },
        { status: 400 },
      )
    }
    const { id: kpiId } = parseResult.data

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401 },
      )
    }

    const rl = await checkRateLimit({
      key: `kpi:restore:${user.id}`,
      limit: RATE_LIMIT,
      windowSeconds: RATE_WINDOW_SECONDS,
    })
    if (!rl.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000),
      )
      return NextResponse.json(
        {
          error: 'Quá nhiều yêu cầu khôi phục KPI. Vui lòng thử lại sau.',
          retryAfter,
          requestId,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }

    const lastOrgId =
      (user.user_metadata?.last_org_id as string | undefined) ?? null
    const membership = await getActiveMembership(supabase, user.id, lastOrgId)
    if (!membership) {
      return NextResponse.json(
        { error: 'Không có tổ chức đang hoạt động', requestId },
        { status: 403 },
      )
    }

    const { data: kpi, error: kpiError } = await supabase
      .from('kpis')
      .select('id, org_id, name, is_active')
      .eq('id', kpiId)
      .maybeSingle()

    if (kpiError) {
      console.error(`[kpi-restore] [${requestId}] fetch error:`, kpiError)
      return NextResponse.json(
        { error: 'Lỗi hệ thống', requestId },
        { status: 500 },
      )
    }

    // Cross-org or non-existent → 404 ambiguous (security: don't expose existence)
    if (!kpi || kpi.org_id !== membership.org_id) {
      return NextResponse.json(
        { error: 'KPI không tồn tại', requestId },
        { status: 404 },
      )
    }

    // Idempotent: already-active path returns success early without re-update
    if (kpi.is_active) {
      return NextResponse.json({
        success: true,
        kpi_id: kpiId,
        already_active: true,
        requestId,
      })
    }

    const roleCheck = await requireOrgRole(
      supabase,
      user.id,
      membership.org_id,
      ADMIN_ROLES,
    )
    if (!roleCheck.ok) {
      return NextResponse.json(
        { error: roleCheck.error, requestId },
        { status: roleCheck.status },
      )
    }

    const { error: updateError } = await supabase
      .from('kpis')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', kpiId)
      .eq('org_id', membership.org_id)

    if (updateError) {
      console.error(`[kpi-restore] [${requestId}] update error:`, updateError)
      return NextResponse.json(
        { error: 'Không thể khôi phục KPI', requestId },
        { status: 500 },
      )
    }

    try {
      console.log(
        '[audit:kpi-restore]',
        JSON.stringify({
          event: 'restore',
          user_id: user.id,
          org_id: membership.org_id,
          role: membership.role,
          kpi_id: kpiId,
          kpi_name: kpi.name.slice(0, 50),
          ip: getClientIp(request.headers),
          requestId,
          timestamp: new Date().toISOString(),
        }),
      )
    } catch {
      // never block response on audit failure
    }

    return NextResponse.json({
      success: true,
      kpi_id: kpiId,
      restored: true,
      requestId,
    })
  } catch (err) {
    console.error(`[kpi-restore] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Lỗi hệ thống', requestId },
      { status: 500 },
    )
  }
}
