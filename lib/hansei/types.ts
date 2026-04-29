import type { Database } from '@/lib/supabase/types'

export type WeeklyHanseiRow = Database['public']['Tables']['weekly_hansei']['Row']
export type WeeklyHanseiInsert = Database['public']['Tables']['weekly_hansei']['Insert']
export type WeeklyHanseiUpdate = Database['public']['Tables']['weekly_hansei']['Update']

export const RED_THRESHOLD = 0.7

export const MIN_STREAK_WEEKS = 2

export const RE_PROMPT_INTERVAL_WEEKS = 2

export type RedStreakKpi = {
  kpi_id: string
  kpi_name: string
  kpi_unit: string | null
  kpi_target: number
  kpi_frequency: 'daily' | 'weekly'
  streak_weeks: number
  current_week_value: number
  last_hansei_week: string | null
  weeks_since_last_hansei: number | null
  should_prompt: boolean
}

export type HanseiEntry = WeeklyHanseiRow & {
  kpi_name?: string
}
