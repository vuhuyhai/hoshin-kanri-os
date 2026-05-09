import { NextRequest, NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  ADMIN_ROLES,
} from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const RATE_LIMIT = 60
const RATE_WINDOW_SECONDS = 300

export interface ArchivedKpi {
  id: string
  name: string
  unit: string
  target_value: number
  frequency: 'daily' | 'weekly' | 'monthly'
  dept_level: 'company' | 'dept' | null
  updated_at: string
  created_at: string
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
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
      key: `kpi:archived:list:${user.id}`,
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
          error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
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

    const { data, error } = await supabase
      .from('kpis')
      .select(
        'id, name, unit, target_value, frequency, dept_level, updated_at, created_at',
      )
      .eq('org_id', membership.org_id)
      .eq('is_active', false)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error(`[kpi-archived-list] [${requestId}] query error:`, error)
      return NextResponse.json(
        { error: 'Không thể tải danh sách KPI đã archived', requestId },
        { status: 500 },
      )
    }

    const kpis: ArchivedKpi[] = (data ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      unit: k.unit,
      target_value: Number(k.target_value),
      frequency: k.frequency as ArchivedKpi['frequency'],
      dept_level: k.dept_level as ArchivedKpi['dept_level'],
      updated_at: k.updated_at ?? k.created_at ?? new Date().toISOString(),
      created_at: k.created_at ?? new Date().toISOString(),
    }))

    try {
      console.log(
        '[audit:kpi-archived-list]',
        JSON.stringify({
          event: 'list',
          user_id: user.id,
          org_id: membership.org_id,
          role: membership.role,
          count: kpis.length,
          ip: getClientIp(request.headers),
          requestId,
          timestamp: new Date().toISOString(),
        }),
      )
    } catch {
      // never block response on audit failure
    }

    return NextResponse.json({ kpis, count: kpis.length, requestId })
  } catch (err) {
    console.error(`[kpi-archived-list] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Lỗi hệ thống', requestId },
      { status: 500 },
    )
  }
}
