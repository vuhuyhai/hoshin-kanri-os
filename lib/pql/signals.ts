import { createClient } from '@/lib/supabase/server'

export interface PqlSignal {
  orgId: string
  orgName: string
  triggeredAt: string
  signals: {
    activeWeeks: number
    memberCount: number
    redKpiCount: number
    redKpiNames: string[]
  }
}

export async function checkOrgPql(orgId: string): Promise<PqlSignal | null> {
  const supabase = await createClient()

  // Signal 1: Active ≥3 weeks
  const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const { data: recentEntries } = await supabase
    .from('kpi_entries')
    .select('period_date, kpis!inner(org_id)')
    .eq('kpis.org_id', orgId)
    .gte('period_date', threeWeeksAgo)

  const weekSet = new Set(
    (recentEntries ?? []).map((e) => {
      const d = new Date(e.period_date)
      const jan1 = new Date(d.getFullYear(), 0, 1)
      return Math.ceil(
        ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7
      )
    })
  )
  const activeWeeks = weekSet.size
  if (activeWeeks < 3) return null

  // Signal 2: ≥2 members
  const { count: memberCount } = await supabase
    .from('org_members')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if ((memberCount ?? 0) < 2) return null

  // Signal 3: ≥1 KPI red for 2+ consecutive weeks
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const { data: kpis } = await supabase
    .from('kpis')
    .select('id, name, target_value')
    .eq('org_id', orgId)
    .eq('is_active', true)

  const redKpiNames: string[] = []

  for (const kpi of kpis ?? []) {
    const { data: entries } = await supabase
      .from('kpi_entries')
      .select('value, period_date')
      .eq('kpi_id', kpi.id)
      .gte('period_date', twoWeeksAgo)
      .order('period_date', { ascending: false })

    if (!entries || entries.length < 2) continue

    const allRed = entries.every(
      (e) => Number(e.value) < Number(kpi.target_value) * 0.7
    )
    if (allRed) {
      redKpiNames.push(kpi.name)
    }
  }

  if (redKpiNames.length === 0) return null

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  return {
    orgId,
    orgName: org?.name ?? orgId,
    triggeredAt: new Date().toISOString(),
    signals: {
      activeWeeks,
      memberCount: memberCount ?? 0,
      redKpiCount: redKpiNames.length,
      redKpiNames,
    },
  }
}

export function formatPqlEmail(signal: PqlSignal): {
  subject: string
  html: string
} {
  const subject = `PQL Alert: ${signal.orgName} sẵn sàng cho Consulting`

  const html = `
    <h2>Product-Qualified Lead Detected</h2>
    <p><strong>Org:</strong> ${signal.orgName}</p>
    <p><strong>Triggered:</strong> ${new Date(signal.triggeredAt).toLocaleString('vi-VN')}</p>

    <h3>Signals đạt ngưỡng:</h3>
    <ul>
      <li>Active ${signal.signals.activeWeeks} tuần liên tiếp (threshold: ≥3)</li>
      <li>${signal.signals.memberCount} thành viên (threshold: ≥2)</li>
      <li>${signal.signals.redKpiCount} KPI đỏ >2 tuần: <strong>${signal.signals.redKpiNames.join(', ')}</strong></li>
    </ul>

    <h3>Action được đề xuất:</h3>
    <p>Liên hệ CEO trong 24-48h để tư vấn Consulting package.</p>

    <hr/>
    <p style="color:#666;font-size:12px">
      Hoshin Kanri OS · PQL Engine · ${new Date().toLocaleDateString('vi-VN')}
    </p>
  `

  return { subject, html }
}
