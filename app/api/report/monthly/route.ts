import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface MonthlyReportKpi {
  id: string
  name: string
  unit: string
  targetValue: number
  deptLevel: 'company' | 'dept'
  ownerName: string | null
  entries: { value: number; periodDate: string }[]
  latestValue: number | null
  trend: 'up' | 'down' | 'flat' | 'no_data'
  trafficLight: 'green' | 'yellow' | 'red'
  achievementPct: number | null
}

export interface MonthlyReportData {
  orgName: string
  month: string
  monthLabel: string
  generatedAt: string
  kpis: MonthlyReportKpi[]
  summary: {
    total: number
    green: number
    yellow: number
    red: number
    noData: number
    avgAchievement: number | null
  }
  wins: string[]
  risks: string[]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')

    const now = new Date()
    const targetMonth =
      monthParam ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [year, month] = targetMonth.split('-').map(Number)

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, organizations(name)')
      .eq('user_id', user.id)
      .single()

    if (!membership)
      return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    const orgName =
      (membership.organizations as { name: string } | null)?.name ?? ''

    const { data: kpis } = await supabase
      .from('kpis')
      .select(
        'id, name, unit, target_value, dept_level, owner_user_id, users:owner_user_id(full_name, email)'
      )
      .eq('org_id', membership.org_id)
      .eq('is_active', true)

    const kpiIds = (kpis ?? []).map((k) => k.id)
    const { data: entries } =
      kpiIds.length > 0
        ? await supabase
            .from('kpi_entries')
            .select('kpi_id, value, period_date')
            .in('kpi_id', kpiIds)
            .gte('period_date', startDate)
            .lte('period_date', endDate)
            .order('period_date', { ascending: true })
        : { data: [] }

    const entriesByKpi: Record<
      string,
      { value: number; periodDate: string }[]
    > = {}
    for (const e of entries ?? []) {
      if (!entriesByKpi[e.kpi_id]) entriesByKpi[e.kpi_id] = []
      entriesByKpi[e.kpi_id].push({
        value: Number(e.value),
        periodDate: e.period_date,
      })
    }

    const reportKpis: MonthlyReportKpi[] = (kpis ?? []).map((kpi) => {
      const kpiEntries = entriesByKpi[kpi.id] ?? []
      const target = Number(kpi.target_value)
      const latest = kpiEntries.at(-1)?.value ?? null
      const owner = kpi.users as {
        full_name?: string | null
        email: string
      } | null

      let trafficLight: MonthlyReportKpi['trafficLight'] = 'red'
      let achievementPct: number | null = null
      if (latest !== null) {
        achievementPct = Math.round((latest / target) * 100)
        if (achievementPct >= 90) trafficLight = 'green'
        else if (achievementPct >= 70) trafficLight = 'yellow'
        else trafficLight = 'red'
      }

      let trend: MonthlyReportKpi['trend'] = 'no_data'
      if (kpiEntries.length >= 2) {
        const first = kpiEntries[0].value
        const last = kpiEntries.at(-1)!.value
        const delta = last - first
        if (Math.abs(delta) < target * 0.02) trend = 'flat'
        else trend = delta > 0 ? 'up' : 'down'
      } else if (kpiEntries.length === 1) {
        trend = 'flat'
      }

      return {
        id: kpi.id,
        name: kpi.name,
        unit: kpi.unit,
        targetValue: target,
        deptLevel: kpi.dept_level as MonthlyReportKpi['deptLevel'],
        ownerName: owner?.full_name ?? owner?.email ?? null,
        entries: kpiEntries,
        latestValue: latest,
        trend,
        trafficLight,
        achievementPct,
      }
    })

    const green = reportKpis.filter((k) => k.trafficLight === 'green').length
    const yellow = reportKpis.filter((k) => k.trafficLight === 'yellow').length
    const red = reportKpis.filter(
      (k) => k.trafficLight === 'red' && k.latestValue !== null
    ).length
    const noData = reportKpis.filter((k) => k.latestValue === null).length
    const achieved = reportKpis.filter((k) => k.achievementPct !== null)
    const avgAchievement =
      achieved.length > 0
        ? Math.round(
            achieved.reduce((s, k) => s + k.achievementPct!, 0) /
              achieved.length
          )
        : null

    const wins = reportKpis
      .filter((k) => k.achievementPct !== null && k.achievementPct >= 90)
      .map((k) => k.name)
    const risks = reportKpis
      .filter((k) => k.achievementPct !== null && k.achievementPct < 70)
      .map((k) => k.name)

    const monthNames = [
      '',
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ]
    const monthLabel = `${monthNames[month]}/${year}`

    const report: MonthlyReportData = {
      orgName,
      month: targetMonth,
      monthLabel,
      generatedAt: new Date().toISOString(),
      kpis: reportKpis,
      summary: { total: reportKpis.length, green, yellow, red, noData, avgAchievement },
      wins,
      risks,
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Monthly report error:', error)
    return NextResponse.json(
      { error: 'Không thể tạo báo cáo' },
      { status: 500 }
    )
  }
}
