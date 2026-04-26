'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { trackMonthlyReportGenerated } from '@/lib/analytics/events'
import type {
  MonthlyReportData,
  MonthlyReportKpi,
} from '@/app/api/report/monthly/route'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/http/fetch-json'

const LIGHT: Record<string, { emoji: string; class: string }> = {
  green: { emoji: '🟢', class: 'text-green-600 dark:text-green-400' },
  yellow: { emoji: '🟡', class: 'text-yellow-600 dark:text-yellow-400' },
  red: { emoji: '🔴', class: 'text-red-600 dark:text-red-400' },
}

const TREND: Record<string, string> = {
  up: '↑',
  down: '↓',
  flat: '→',
  no_data: '—',
}

function KpiRow({ kpi }: { kpi: MonthlyReportKpi }) {
  const light = LIGHT[kpi.trafficLight]
  const trend = TREND[kpi.trend]

  return (
    <tr className="border-b last:border-0">
      <td className="py-2.5 pr-4">
        <p className="text-sm font-medium">{kpi.name}</p>
        {kpi.ownerName && (
          <p className="text-xs text-text-3">{kpi.ownerName}</p>
        )}
      </td>
      <td className="py-2.5 pr-4 text-sm tabular-nums text-right">
        {kpi.targetValue} {kpi.unit}
      </td>
      <td className="py-2.5 pr-4 text-sm tabular-nums text-right">
        {kpi.latestValue !== null ? `${kpi.latestValue} ${kpi.unit}` : '—'}
      </td>
      <td
        className={cn(
          'py-2.5 pr-4 text-sm font-semibold text-right tabular-nums',
          light.class
        )}
      >
        {kpi.achievementPct !== null ? `${kpi.achievementPct}%` : '—'}
      </td>
      <td className="py-2.5 pr-2 text-center text-base">{light.emoji}</td>
      <td
        className={cn('py-2.5 text-center text-sm font-medium', {
          'text-green-600': kpi.trend === 'up',
          'text-red-600': kpi.trend === 'down',
          'text-muted-foreground':
            kpi.trend === 'flat' || kpi.trend === 'no_data',
        })}
      >
        {trend}
      </td>
    </tr>
  )
}

export default function ReportPage() {
  const [report, setReport] = useState<MonthlyReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [prevMonth, setPrevMonth] = useState(selectedMonth)

  // Reset loading state synchronously when month changes — avoids cascading
  // render from setIsLoading(true) inside the fetch effect (React docs:
  // "Adjusting state on prop change").
  if (prevMonth !== selectedMonth) {
    setPrevMonth(selectedMonth)
    setIsLoading(true)
    setReport(null)
  }

  useEffect(() => {
    let cancelled = false
    fetchJson<{ report: MonthlyReportData }>(`/api/report/monthly?month=${selectedMonth}`)
      .then(({ report: data }) => { if (!cancelled) setReport(data) })
      .catch(() => { if (!cancelled) toast.error('Không thể tải báo cáo') })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [selectedMonth])

  const handlePrint = () => {
    if (report) trackMonthlyReportGenerated()
    window.print()
  }

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('vi-VN', { month: 'long', year: 'numeric' })
    return { value: val, label }
  })

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-card { border: 1px solid #e2e8f0 !important; break-inside: avoid; }
          @page { margin: 20mm; }
        }
      `}</style>

      <div className="w-full min-h-full p-6 lg:p-8">
        {/* Page header */}
        <div className="no-print mb-8 pb-6 border-b-[3px] border-ink">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="overline mb-1">Analytics</p>
              <h1 className="font-display font-black text-3xl md:text-4xl text-ink uppercase">
                Báo cáo KPI tháng
              </h1>
              <p className="font-body text-text-2 mt-1 text-base">
                Tổng hợp hiệu suất và phân tích xu hướng
              </p>
            </div>
            <div className="flex gap-2 items-center shrink-0">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Chọn tháng báo cáo"
                className="border-2 border-ink px-3 py-1.5 font-body text-sm bg-bg-warm min-h-[44px]"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Button
                onClick={handlePrint}
                disabled={isLoading || !report}
                className="btn-brutal-primary text-xs py-2 px-4"
              >
                In / Tải PDF
              </Button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-32 bg-bg-muted-warm animate-pulse border-2 border-ink/10"
                />
              ))}
            </div>
            <div className="lg:col-span-2">
              <div className="h-64 bg-bg-muted-warm animate-pulse border-2 border-ink/10" />
            </div>
          </div>
        )}

        {!isLoading && report && report.kpis.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Report content (60%) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Report header */}
              <div className="card-brutal p-6 text-center space-y-1">
                <h2 className="font-display text-xl font-black uppercase tracking-wider text-ink">
                  {report.orgName}
                </h2>
                <p className="font-body text-text-2">
                  Báo cáo KPI {report.monthLabel}
                </p>
                <p className="font-body text-xs text-text-3">
                  Tạo lúc{' '}
                  {new Date(report.generatedAt).toLocaleString('vi-VN')}
                </p>
              </div>

              {/* Wins */}
              {report.wins.length > 0 && (
                <div className="card-brutal border-green-600 p-5 space-y-2">
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-green-700 dark:text-green-300">
                    Điểm sáng tháng này
                  </p>
                  {report.wins.map((w, i) => (
                    <p
                      key={i}
                      className="font-body text-sm text-green-600 dark:text-green-400"
                    >
                      ▸ {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Risks */}
              {report.risks.length > 0 && (
                <div className="card-brutal border-red-600 p-5 space-y-2">
                  <p className="font-display text-sm font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
                    Cần chú ý tháng tới
                  </p>
                  {report.risks.map((r, i) => (
                    <p
                      key={i}
                      className="font-body text-sm text-red-600 dark:text-red-400"
                    >
                      ▸ {r}
                    </p>
                  ))}
                </div>
              )}

              {/* KPI table */}
              <div className="card-brutal overflow-hidden">
                <div className="px-4 py-3 border-b-2 border-ink bg-bg-muted-warm">
                  <p className="font-display text-sm font-bold uppercase tracking-wider">
                    Chi tiết KPIs
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-ink/10 text-xs text-text-3">
                        <th className="text-left py-2.5 px-4 font-display font-semibold uppercase tracking-wider">
                          KPI
                        </th>
                        <th className="text-right py-2.5 pr-4 font-display font-semibold uppercase tracking-wider">
                          Target
                        </th>
                        <th className="text-right py-2.5 pr-4 font-display font-semibold uppercase tracking-wider">
                          Thực tế
                        </th>
                        <th className="text-right py-2.5 pr-4 font-display font-semibold uppercase tracking-wider">
                          Đạt %
                        </th>
                        <th className="text-center py-2.5 pr-2 font-display font-semibold uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-center py-2.5 font-display font-semibold uppercase tracking-wider">
                          Trend
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.kpis
                        .sort((a, b) => {
                          const order = { red: 0, yellow: 1, green: 2 }
                          return (
                            (order[a.trafficLight] ?? 3) -
                            (order[b.trafficLight] ?? 3)
                          )
                        })
                        .map((kpi) => (
                          <KpiRow key={kpi.id} kpi={kpi} />
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center font-body text-xs text-text-3 py-4 border-t-2 border-ink/10">
                Hoshin Kanri OS · Báo cáo được tạo tự động
              </div>
            </div>

            {/* Right: Summary stats (40%) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary cards */}
              <div className="card-brutal bg-bg-dark p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white/70 mb-4">
                  Tổng quan
                </h3>
                {report.summary.avgAchievement !== null && (
                  <div className="text-center mb-6">
                    <span className="font-display text-5xl font-black text-white">
                      {report.summary.avgAchievement}%
                    </span>
                    <p className="font-body text-sm text-white/60 mt-1">
                      hoàn thành trung bình
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Đạt',
                      value: report.summary.green,
                      class: 'text-green-400',
                    },
                    {
                      label: 'Gần đạt',
                      value: report.summary.yellow,
                      class: 'text-yellow-400',
                    },
                    {
                      label: 'Chưa đạt',
                      value: report.summary.red,
                      class: 'text-red-400',
                    },
                    {
                      label: 'Không data',
                      value: report.summary.noData,
                      class: 'text-white/40',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="text-center border border-white/10 p-3"
                    >
                      <p
                        className={cn(
                          'font-display text-2xl font-black tabular-nums',
                          s.class
                        )}
                      >
                        {s.value}
                      </p>
                      <p className="font-body text-xs text-white/50">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick KPI status list */}
              <div className="card-brutal p-5 lg:sticky lg:top-24">
                <h3 className="font-display text-sm font-bold uppercase tracking-widest text-accent-brand mb-3">
                  KPI Status
                </h3>
                <div className="space-y-2">
                  {report.kpis
                    .sort((a, b) => {
                      const order = { red: 0, yellow: 1, green: 2 }
                      return (
                        (order[a.trafficLight] ?? 3) -
                        (order[b.trafficLight] ?? 3)
                      )
                    })
                    .map((kpi) => {
                      const light = LIGHT[kpi.trafficLight]
                      return (
                        <div
                          key={kpi.id}
                          className="flex items-center gap-2 font-body text-sm"
                        >
                          <span>{light.emoji}</span>
                          <span className="flex-1 truncate text-ink">
                            {kpi.name}
                          </span>
                          <span
                            className={cn(
                              'font-display text-xs font-bold tabular-nums',
                              light.class
                            )}
                          >
                            {kpi.achievementPct !== null
                              ? `${kpi.achievementPct}%`
                              : '—'}
                          </span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && (!report || report.kpis.length === 0) && (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">📭</div>
            <p className="font-body text-text-2 text-sm">
              Không có dữ liệu KPI cho tháng này.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
