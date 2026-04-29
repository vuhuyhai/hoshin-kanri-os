import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { RedStreakKpi, HanseiEntry } from './types'
import {
  RED_THRESHOLD,
  MIN_STREAK_WEEKS,
  RE_PROMPT_INTERVAL_WEEKS,
} from './types'

type SB = SupabaseClient<Database>

/**
 * Lấy tất cả KPIs của org có streak red >= 2 tuần liên tiếp.
 *
 * Logic:
 * 1. Filter kpis WHERE org_id = orgId AND is_active = true AND frequency IN ('weekly', 'daily')
 * 2. Cho mỗi KPI, query kpi_entries 42 ngày (6 tuần) gần nhất — đủ buffer để display streak dài
 * 3. Group entries theo tuần (Monday-Sunday, ISO week)
 * 4. Tính LAST VALUE per tuần (entry có period_date lớn nhất trong tuần)
 * 5. Compare với target: < 70% target = red week
 * 6. Đếm streak red liên tiếp tính từ tuần hiện tại lùi về
 * 7. Nếu streak >= 2 → include trong result
 *
 * Implementation note (M-Hoshin-3 lesson #2):
 * Dùng kpis.id làm reference key, KHÔNG dùng vision_json kpi.id (regenerate on save).
 *
 * Performance note: với org < 50 KPIs, query realtime OK. Future scale > 100 → migrate materialized view.
 */
export async function getRedStreaks(
  supabase: SB,
  orgId: string,
): Promise<RedStreakKpi[]> {
  const { data: kpis, error: kpisError } = await supabase
    .from('kpis')
    .select('id, name, unit, target_value, frequency')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .in('frequency', ['daily', 'weekly'])

  if (kpisError || !kpis || kpis.length === 0) return []

  const kpiIds = kpis.map((k) => k.id)

  const sixWeeksAgo = new Date()
  sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
  const sixWeeksAgoIso = sixWeeksAgo.toISOString().split('T')[0]

  const { data: entries, error: entriesError } = await supabase
    .from('kpi_entries')
    .select('kpi_id, period_date, value')
    .in('kpi_id', kpiIds)
    .gte('period_date', sixWeeksAgoIso)
    .order('period_date', { ascending: true })

  if (entriesError) return []

  const { data: hanseiRows } = await supabase
    .from('weekly_hansei')
    .select('kpi_id, week_start')
    .in('kpi_id', kpiIds)
    .order('week_start', { ascending: false })

  const lastHanseiByKpi = new Map<string, string>()
  hanseiRows?.forEach((row) => {
    if (!lastHanseiByKpi.has(row.kpi_id)) {
      lastHanseiByKpi.set(row.kpi_id, row.week_start)
    }
  })

  const entriesByKpiByWeek = new Map<
    string,
    Map<string, { value: number; period_date: string }>
  >()

  entries?.forEach((entry) => {
    const weekStart = getMondayOfWeek(entry.period_date)
    if (!entriesByKpiByWeek.has(entry.kpi_id)) {
      entriesByKpiByWeek.set(entry.kpi_id, new Map())
    }
    const weekMap = entriesByKpiByWeek.get(entry.kpi_id)!
    const existing = weekMap.get(weekStart)
    if (!existing || entry.period_date > existing.period_date) {
      weekMap.set(weekStart, {
        value: entry.value,
        period_date: entry.period_date,
      })
    }
  })

  const results: RedStreakKpi[] = []
  const currentWeekStart = getMondayOfWeek(
    new Date().toISOString().split('T')[0],
  )

  for (const kpi of kpis) {
    const weekMap = entriesByKpiByWeek.get(kpi.id)
    if (!weekMap || weekMap.size === 0) continue

    const sortedWeeks = Array.from(weekMap.entries()).sort((a, b) =>
      b[0].localeCompare(a[0]),
    )

    let streak = 0
    let currentWeekValue = 0
    for (const [, { value }] of sortedWeeks) {
      const isRed = value < RED_THRESHOLD * kpi.target_value
      if (streak === 0) {
        currentWeekValue = value
      }
      if (isRed) {
        streak++
      } else {
        break
      }
    }

    if (streak < MIN_STREAK_WEEKS) continue

    const lastHanseiWeek = lastHanseiByKpi.get(kpi.id) ?? null
    let weeksSinceLastHansei: number | null = null
    let shouldPrompt = true

    if (lastHanseiWeek) {
      weeksSinceLastHansei = weekDiff(lastHanseiWeek, currentWeekStart)
      shouldPrompt = weeksSinceLastHansei >= RE_PROMPT_INTERVAL_WEEKS
    }

    results.push({
      kpi_id: kpi.id,
      kpi_name: kpi.name,
      kpi_unit: kpi.unit,
      kpi_target: kpi.target_value,
      kpi_frequency: kpi.frequency as 'daily' | 'weekly',
      streak_weeks: streak,
      current_week_value: currentWeekValue,
      last_hansei_week: lastHanseiWeek,
      weeks_since_last_hansei: weeksSinceLastHansei,
      should_prompt: shouldPrompt,
    })
  }

  return results
}

/**
 * Lấy hansei history của 1 KPI (sorted DESC by week_start).
 */
export async function getKpiHanseiHistory(
  supabase: SB,
  kpiId: string,
): Promise<HanseiEntry[]> {
  const { data, error } = await supabase
    .from('weekly_hansei')
    .select('*')
    .eq('kpi_id', kpiId)
    .order('week_start', { ascending: false })

  if (error || !data) return []
  return data
}

/**
 * Logic Q6: streak >= 2 AND (chưa hansei OR streak extend >= 2 tuần kể từ hansei trước).
 * Public helper to centralize the rule — re-used inline in getRedStreaks above and exposed
 * for callers (banner UI, API guards) that already know streakWeeks + lastHanseiWeek.
 */
export function shouldPromptHansei(
  streakWeeks: number,
  lastHanseiWeek: string | null,
  currentWeekStart: string = getMondayOfWeek(
    new Date().toISOString().split('T')[0],
  ),
): boolean {
  if (streakWeeks < MIN_STREAK_WEEKS) return false
  if (!lastHanseiWeek) return true
  return weekDiff(lastHanseiWeek, currentWeekStart) >= RE_PROMPT_INTERVAL_WEEKS
}

// Monday of the ISO week containing isoDate. Sunday rolls back 6 days.
function getMondayOfWeek(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00Z')
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diff)
  return date.toISOString().split('T')[0]
}

function weekDiff(fromMonday: string, toMonday: string): number {
  const from = new Date(fromMonday + 'T00:00:00Z').getTime()
  const to = new Date(toMonday + 'T00:00:00Z').getTime()
  const diffMs = to - from
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000))
}
