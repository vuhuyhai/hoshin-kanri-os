import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'

export interface KpiWithEntries {
  id: string
  name: string
  unit: string
  targetValue: number
  frequency: 'daily' | 'weekly' | 'monthly'
  deptLevel: 'company' | 'dept'
  ownerUserId: string | null
  ownerName: string | null
  entries: { value: number; periodDate: string; note: string | null }[]
  latestValue: number | null
  latestDate: string | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
    const membership = await getActiveMembership(supabase, user.id, lastOrgId)

    if (!membership) {
      return NextResponse.json({ kpis: [], role: null })
    }

    const { data: kpis, error } = await supabase
      .from('kpis')
      .select(
        `id, name, unit, target_value, frequency, dept_level,
        owner_user_id,
        users:owner_user_id ( full_name, email )`
      )
      .eq('org_id', membership.org_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error

    const kpiIds = (kpis ?? []).map((k) => k.id)
    const { data: allEntries } =
      kpiIds.length > 0
        ? await supabase
            .from('kpi_entries')
            .select('kpi_id, value, period_date, note')
            .in('kpi_id', kpiIds)
            .order('period_date', { ascending: false })
            .limit(kpiIds.length * 8)
        : { data: [] }

    type EntryRow = { kpi_id: string; value: number; period_date: string; note: string | null }
    const entriesByKpi: Record<string, EntryRow[]> = {}
    for (const entry of (allEntries ?? []) as EntryRow[]) {
      if (!entriesByKpi[entry.kpi_id]) entriesByKpi[entry.kpi_id] = []
      if (entriesByKpi[entry.kpi_id].length < 8) {
        entriesByKpi[entry.kpi_id].push(entry)
      }
    }

    const result: KpiWithEntries[] = (kpis ?? []).map((kpi) => {
      const rawEntries = (entriesByKpi[kpi.id] ?? [])
        .slice(0, 8)
        .reverse()
        .map((e) => ({
          value: Number(e.value),
          periodDate: e.period_date,
          note: e.note,
        }))

      const latest = rawEntries.at(-1) ?? null
      const owner = kpi.users as {
        full_name?: string | null
        email: string
      } | null

      return {
        id: kpi.id,
        name: kpi.name,
        unit: kpi.unit,
        targetValue: Number(kpi.target_value),
        frequency: kpi.frequency as KpiWithEntries['frequency'],
        deptLevel: kpi.dept_level as KpiWithEntries['deptLevel'],
        ownerUserId: kpi.owner_user_id,
        ownerName: owner?.full_name ?? owner?.email ?? null,
        entries: rawEntries,
        latestValue: latest?.value ?? null,
        latestDate: latest?.periodDate ?? null,
      }
    })

    return NextResponse.json({ kpis: result, role: membership.role })
  } catch (error) {
    console.error('KPI list error:', error)
    return NextResponse.json(
      { error: 'Không thể tải KPIs' },
      { status: 500 }
    )
  }
}
