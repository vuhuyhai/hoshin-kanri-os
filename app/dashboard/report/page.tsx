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
          <p className="text-xs text-muted-foreground">{kpi.ownerName}</p>
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

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/report/monthly?month=${selectedMonth}`)
      .then((r) => r.json())
      .then(({ report: data }) => setReport(data))
      .catch(() => toast.error('Không thể tải báo cáo'))
      .finally(() => setIsLoading(false))
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

      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="no-print flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Báo cáo KPI tháng</h1>
            <p className="text-muted-foreground text-sm">
              Tổng hợp hiệu suất và phân tích xu hướng
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm bg-background"
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
              className="bg-primary hover:bg-primary/90"
            >
              In / Tải PDF
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && report && report.kpis.length > 0 && (
          <div className="space-y-6">
            {/* Report header */}
            <div className="text-center space-y-1 py-4">
              <h2 className="text-xl font-bold">{report.orgName}</h2>
              <p className="text-muted-foreground">
                Báo cáo KPI {report.monthLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                Tạo lúc{' '}
                {new Date(report.generatedAt).toLocaleString('vi-VN')}
              </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3 print-card rounded-xl p-4 border">
              {[
                {
                  label: 'Đạt',
                  value: report.summary.green,
                  class: 'text-green-600',
                },
                {
                  label: 'Gần đạt',
                  value: report.summary.yellow,
                  class: 'text-yellow-600',
                },
                {
                  label: 'Chưa đạt',
                  value: report.summary.red,
                  class: 'text-red-600',
                },
                {
                  label: 'Không có data',
                  value: report.summary.noData,
                  class: 'text-muted-foreground',
                },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      s.class
                    )}
                  >
                    {s.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {report.summary.avgAchievement !== null && (
              <div className="text-center">
                <span className="text-3xl font-bold">
                  {report.summary.avgAchievement}%
                </span>
                <span className="text-muted-foreground text-sm ml-2">
                  hoàn thành trung bình
                </span>
              </div>
            )}

            {/* Wins */}
            {report.wins.length > 0 && (
              <div className="print-card border border-green-200 dark:border-green-900 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-sm text-green-700 dark:text-green-300">
                  Điểm sáng tháng này
                </p>
                {report.wins.map((w, i) => (
                  <p
                    key={i}
                    className="text-sm text-green-600 dark:text-green-400"
                  >
                    • {w}
                  </p>
                ))}
              </div>
            )}

            {/* Risks */}
            {report.risks.length > 0 && (
              <div className="print-card border border-red-200 dark:border-red-900 rounded-xl p-4 space-y-2">
                <p className="font-semibold text-sm text-red-700 dark:text-red-300">
                  Cần chú ý tháng tới
                </p>
                {report.risks.map((r, i) => (
                  <p
                    key={i}
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    • {r}
                  </p>
                ))}
              </div>
            )}

            {/* KPI table */}
            <div className="print-card border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30">
                <p className="font-semibold text-sm">Chi tiết KPIs</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2.5 px-4 font-medium">
                        KPI
                      </th>
                      <th className="text-right py-2.5 pr-4 font-medium">
                        Target
                      </th>
                      <th className="text-right py-2.5 pr-4 font-medium">
                        Thực tế
                      </th>
                      <th className="text-right py-2.5 pr-4 font-medium">
                        Đạt %
                      </th>
                      <th className="text-center py-2.5 pr-2 font-medium">
                        Status
                      </th>
                      <th className="text-center py-2.5 font-medium">
                        Xu hướng
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
            <div className="text-center text-xs text-muted-foreground py-4 border-t">
              Hoshin Kanri OS · Báo cáo được tạo tự động
            </div>
          </div>
        )}

        {!isLoading && (!report || report.kpis.length === 0) && (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">📭</div>
            <p className="text-muted-foreground text-sm">
              Không có dữ liệu KPI cho tháng này.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
