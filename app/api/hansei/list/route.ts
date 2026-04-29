import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createClient,
  requireOrgRole,
  ALL_ROLES,
} from '@/lib/supabase/server'
import { getKpiHanseiHistory } from '@/lib/hansei/queries'

const listQuerySchema = z.object({
  kpi_id: z.string().uuid('kpi_id phải là uuid'),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = listQuerySchema.safeParse({
      kpi_id: request.nextUrl.searchParams.get('kpi_id') ?? '',
    })
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'kpi_id không hợp lệ'
      return NextResponse.json(
        { error: message, issues: parsed.error.issues },
        { status: 400 },
      )
    }
    const { kpi_id } = parsed.data

    const { data: kpi, error: kpiError } = await supabase
      .from('kpis')
      .select('id, org_id')
      .eq('id', kpi_id)
      .maybeSingle()

    if (kpiError) {
      console.error('[/api/hansei/list]', kpiError)
      return NextResponse.json(
        { error: 'Không thể tải KPI' },
        { status: 500 },
      )
    }
    if (!kpi) {
      return NextResponse.json(
        { error: 'KPI không tồn tại' },
        { status: 404 },
      )
    }

    const check = await requireOrgRole(
      supabase,
      user.id,
      kpi.org_id,
      ALL_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error },
        { status: check.status },
      )
    }

    const entries = await getKpiHanseiHistory(supabase, kpi_id)
    return NextResponse.json({ entries })
  } catch (err) {
    console.error('[/api/hansei/list]', err)
    return NextResponse.json(
      { error: 'Không thể tải hansei' },
      { status: 500 },
    )
  }
}
