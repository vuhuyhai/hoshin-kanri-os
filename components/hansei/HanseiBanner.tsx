'use client'

import type { RedStreakKpi } from '@/lib/hansei/types'
import { AlertCircle } from 'lucide-react'

interface HanseiBannerProps {
  redStreaks: RedStreakKpi[]
  onSelectKpi: (kpiId: string) => void
  expandedKpiId: string | null
}

export function HanseiBanner({
  redStreaks,
  onSelectKpi,
  expandedKpiId,
}: HanseiBannerProps) {
  const pendingStreaks = redStreaks.filter(
    (r) => r.should_prompt && r.kpi_id !== expandedKpiId,
  )

  if (pendingStreaks.length === 0) return null

  const maxStreak = pendingStreaks.reduce(
    (max, r) => Math.max(max, r.streak_weeks),
    0,
  )

  return (
    <section
      className="card-yellow p-5 mb-6"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <header className="flex items-start gap-3 mb-4">
        <AlertCircle
          className="w-6 h-6 shrink-0 mt-1"
          style={{ color: 'var(--brand)' }}
        />
        <div className="flex-1">
          <div className="mb-1">
            <span className="nb-sticker">HANSEI</span>
          </div>
          <h3 className="font-display font-bold text-xl text-ink">
            {pendingStreaks.length} KPI đỏ {maxStreak}+ tuần — cần hansei
          </h3>
          <p className="text-text-2 text-sm mt-1">
            Toyota gemba: KPI đỏ liên tiếp = signal cần dừng lại phản tỉnh. Tại
            sao đỏ? Tuần tới làm gì khác?
          </p>
        </div>
      </header>

      <ul className="flex flex-col gap-2">
        {pendingStreaks.map((streak) => {
          const pct = streak.kpi_target
            ? Math.round((streak.current_week_value / streak.kpi_target) * 100)
            : 0
          return (
            <li
              key={streak.kpi_id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 p-3 border-2 border-ink"
              style={{
                background: 'var(--white)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold text-ink truncate">
                    {streak.kpi_name}
                  </span>
                  <span
                    className="badge-brutal"
                    style={{
                      background: 'var(--brand)',
                      color: 'var(--white)',
                      borderColor: 'var(--brand)',
                    }}
                  >
                    {streak.streak_weeks} tuần đỏ
                  </span>
                </div>
                <p className="text-text-2 text-xs mt-1">
                  Tuần này: {streak.current_week_value}
                  {streak.kpi_unit ? ` ${streak.kpi_unit}` : ''} / target{' '}
                  {streak.kpi_target}
                  {streak.kpi_unit ? ` ${streak.kpi_unit}` : ''} = {pct}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectKpi(streak.kpi_id)}
                className="btn-brutal-primary whitespace-nowrap shrink-0 self-start md:self-auto"
              >
                Hansei →
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
