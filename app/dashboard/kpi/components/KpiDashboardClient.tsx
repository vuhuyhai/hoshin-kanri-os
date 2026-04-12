'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { KpiCard } from './KpiCard'
import { Button } from '@/components/ui/button'
import { trackKpiDashboardViewed } from '@/lib/analytics/events'
import type { KpiWithEntries } from '@/app/api/kpi/list/route'
import { cn } from '@/lib/utils'
import { fetchJson } from '@/lib/http/fetch-json'

type ViewTab = 'company' | 'dept'

export function KpiDashboardClient() {
  const router = useRouter()
  const [kpis, setKpis] = useState<KpiWithEntries[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ViewTab>('company')

  const loadKpis = useCallback(async () => {
    try {
      const { kpis: data } = await fetchJson<{ kpis: KpiWithEntries[] }>(
        '/api/kpi/list'
      )
      setKpis(data)
    } catch {
      toast.error('Không thể tải KPIs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKpis()
    trackKpiDashboardViewed()
  }, [loadKpis])

  const handleEntryAdded = (
    kpiId: string,
    newValue: number,
    date: string
  ) => {
    setKpis((prev) =>
      prev.map((kpi) => {
        if (kpi.id !== kpiId) return kpi

        const newEntry = { value: newValue, periodDate: date, note: null }
        const updatedEntries = [...kpi.entries, newEntry].slice(-8)

        return {
          ...kpi,
          entries: updatedEntries,
          latestValue: newValue,
          latestDate: date,
        }
      })
    )
  }

  const companyKpis = kpis.filter((k) => k.deptLevel === 'company')
  const deptKpis = kpis.filter((k) => k.deptLevel === 'dept')
  const activeKpis = activeTab === 'company' ? companyKpis : deptKpis

  const redCount = kpis.filter((k) => {
    if (k.latestValue === null) return true
    return k.latestValue / k.targetValue < 0.7
  }).length

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border rounded-xl p-4 h-28 animate-pulse bg-muted/40"
          />
        ))}
      </div>
    )
  }

  if (kpis.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-5xl">📊</div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Chưa có KPI nào</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            KPIs sẽ tự động tạo khi bạn hoàn thành X-Matrix Builder.
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/x-matrix/new')}
          className="bg-primary hover:bg-primary/90"
        >
          Tạo X-Matrix →
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {kpis.length} KPIs đang theo dõi
          </span>
          {redCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {redCount} cần chú ý
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadKpis}
          className="h-7 text-xs"
        >
          ↻ Làm mới
        </Button>
      </div>

      {/* Tabs */}
      {companyKpis.length > 0 && deptKpis.length > 0 && (
        <div className="flex gap-2">
          {(['company', 'dept'] as ViewTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm transition-all',
                activeTab === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {tab === 'company' ? 'Toàn công ty' : 'Phòng ban'}
              <span className="ml-1.5 text-xs opacity-75">
                ({tab === 'company' ? companyKpis.length : deptKpis.length})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* KPI cards — red first, responsive grid */}
      {activeKpis.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...activeKpis]
            .sort((a, b) => {
              const pctA =
                a.latestValue !== null ? a.latestValue / a.targetValue : 0
              const pctB =
                b.latestValue !== null ? b.latestValue / b.targetValue : 0
              return pctA - pctB
            })
            .map((kpi) => (
              <KpiCard
                key={kpi.id}
                kpi={kpi}
                onEntryAdded={handleEntryAdded}
              />
            ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Không có KPI{' '}
          {activeTab === 'company' ? 'cấp công ty' : 'cấp phòng ban'}.
        </p>
      )}
    </div>
  )
}
