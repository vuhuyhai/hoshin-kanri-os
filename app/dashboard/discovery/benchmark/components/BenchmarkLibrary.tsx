'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  INDUSTRY_BENCHMARKS,
  mapIndustryToId,
} from '@/lib/discovery/benchmark-data'
import type { IndustryId } from '@/lib/discovery/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface BenchmarkLibraryProps {
  currentIndustry: string
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
  return n.toString()
}

export function BenchmarkLibrary({ currentIndustry }: BenchmarkLibraryProps) {
  const router = useRouter()
  const currentId = mapIndustryToId(currentIndustry)
  const [activeIndustry, setActiveIndustry] = useState<IndustryId>(currentId)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const activeBenchmark = INDUSTRY_BENCHMARKS.find(
    (b) => b.id === activeIndustry
  )

  const toggleKpi = (kpiId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(kpiId)) next.delete(kpiId)
      else next.add(kpiId)
      return next
    })
  }

  const handleContinue = () => {
    const selectedKpis =
      activeBenchmark?.kpis
        .filter((k) => selected.has(k.id))
        .map((k) => ({
          kpiId: k.id,
          name: k.name,
          unit: k.unit,
          targetValue: k.top25,
          frequency: k.frequency,
          dept_level: k.dept_level,
        })) ?? []

    localStorage.setItem(
      'hoshin_selected_kpis',
      JSON.stringify(selectedKpis)
    )
    toast.success(
      selected.size > 0
        ? `Đã chọn ${selected.size} KPIs`
        : 'Tiếp tục không chọn KPI nào'
    )
    router.push('/dashboard/discovery/synthesis')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">📊 KPI Benchmark Library</h2>
        <p className="text-sm text-muted-foreground">
          Chọn KPI phù hợp. Target mặc định = Top 25% tại Việt Nam.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {INDUSTRY_BENCHMARKS.map((b) => (
          <button
            key={b.id}
            onClick={() => setActiveIndustry(b.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm transition-colors',
              activeIndustry === b.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            {b.icon} {b.name}
            {b.id === currentId && (
              <span className="ml-1 text-xs opacity-70">(ngành bạn)</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {activeBenchmark?.kpis.map((kpi) => {
          const isSelected = selected.has(kpi.id)
          return (
            <button
              key={kpi.id}
              onClick={() => toggleKpi(kpi.id)}
              className={cn(
                'w-full rounded-lg border p-4 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{kpi.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {kpi.description}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Badge variant="outline" className="text-xs">
                    {kpi.unit}
                  </Badge>
                  {isSelected && (
                    <Badge className="bg-primary text-xs text-primary-foreground">
                      ✓
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-muted-foreground">Median</div>
                  <div className="font-medium">
                    {formatNumber(kpi.median)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-yellow-600">Top 25%</div>
                  <div className="font-medium text-yellow-600">
                    {formatNumber(kpi.top25)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-green-600">Top 10%</div>
                  <div className="font-medium text-green-600">
                    {formatNumber(kpi.top10)}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/discovery')}
          className="flex-1"
        >
          ← Discovery Hub
        </Button>
        <Button onClick={handleContinue} className="flex-1">
          {selected.size > 0
            ? `Dùng ${selected.size} KPIs → AI Synthesis`
            : 'Bỏ qua → AI Synthesis'}
        </Button>
      </div>
    </div>
  )
}
