'use client'

import { useState, useCallback } from 'react'
import { HanseiBanner } from '@/components/hansei/HanseiBanner'
import { HanseiForm } from '@/components/hansei/HanseiForm'
import { HanseiHistoryList } from '@/components/hansei/HanseiHistoryList'
import type { RedStreakKpi } from '@/lib/hansei/types'

interface Props {
  initialRedStreaks: RedStreakKpi[]
}

export function KpiHanseiSection({ initialRedStreaks }: Props) {
  const [redStreaks, setRedStreaks] =
    useState<RedStreakKpi[]>(initialRedStreaks)
  const [expandedKpiId, setExpandedKpiId] = useState<string | null>(null)
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0)

  const expandedRedStreak =
    redStreaks.find((r) => r.kpi_id === expandedKpiId) ?? null

  const handleSelectKpi = useCallback((kpiId: string) => {
    setExpandedKpiId(kpiId)
  }, [])

  const handleCancel = useCallback(() => {
    setExpandedKpiId(null)
  }, [])

  // Optimistic: drop the just-submitted KPI from local banner so it
  // disappears without a refetch. The streak/last_hansei_week stay
  // accurate on the server; a fresh page load will recompute should_prompt
  // (banner re-appears only if streak extends past RE_PROMPT_INTERVAL_WEEKS).
  const handleSubmitted = useCallback(() => {
    setRedStreaks((prev) => prev.filter((r) => r.kpi_id !== expandedKpiId))
    setExpandedKpiId(null)
    setHistoryRefreshTrigger((t) => t + 1)
  }, [expandedKpiId])

  const weekStart = getMondayOfCurrentWeekIso()

  if (redStreaks.length === 0 && !expandedRedStreak) return null

  return (
    <div className="space-y-4">
      <HanseiBanner
        redStreaks={redStreaks}
        onSelectKpi={handleSelectKpi}
        expandedKpiId={expandedKpiId}
      />
      {expandedRedStreak && (
        <div className="space-y-4">
          <HanseiForm
            redStreak={expandedRedStreak}
            weekStart={weekStart}
            onSubmitted={handleSubmitted}
            onCancel={handleCancel}
          />
          <HanseiHistoryList
            kpiId={expandedRedStreak.kpi_id}
            refreshTrigger={historyRefreshTrigger}
          />
        </div>
      )}
    </div>
  )
}

function getMondayOfCurrentWeekIso(): string {
  const date = new Date()
  date.setUTCHours(0, 0, 0, 0)
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setUTCDate(date.getUTCDate() + diff)
  return date.toISOString().split('T')[0]
}
