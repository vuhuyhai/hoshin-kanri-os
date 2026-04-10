'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  INDUSTRY_BENCHMARKS,
  mapIndustryToId,
} from '@/lib/discovery/benchmark-data'
import type { IndustryId, SelectedBenchmarkKpi } from '@/lib/discovery/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================
// HELPER: format số lớn cho dễ đọc
// ============================================================
function formatValue(n: number, unit: string): string {
  const isMonetary =
    unit.toLowerCase().includes('vnd') || unit.toLowerCase().includes('triệu')

  if (isMonetary) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toString()
  }

  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n % 1 === 0 ? n.toString() : n.toFixed(1)
}

// ============================================================
// SUB-COMPONENT: 1 KPI card
// ============================================================
interface KpiCardProps {
  kpiId: string
  name: string
  description: string
  unit: string
  median: number
  top25: number
  top10: number
  isSelected: boolean
  onToggle: (kpiId: string) => void
}

function KpiCard({
  kpiId,
  name,
  description,
  unit,
  median,
  top25,
  top10,
  isSelected,
  onToggle,
}: KpiCardProps) {
  return (
    <button
      onClick={() => onToggle(kpiId)}
      className={cn(
        'w-full text-left rounded-lg border p-4 transition-all duration-150',
        'hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:bg-muted/30'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug">{name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {description}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className="text-xs">
            {unit}
          </Badge>
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">
                ✓
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Benchmark row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center bg-muted/50 rounded-md py-2">
          <p className="text-xs text-muted-foreground mb-0.5">Trung vị</p>
          <p className="text-sm font-medium">{formatValue(median, unit)}</p>
        </div>
        <div className="text-center bg-yellow-50 dark:bg-yellow-950/40 rounded-md py-2">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-0.5">
            Top 25%
          </p>
          <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
            {formatValue(top25, unit)}
          </p>
        </div>
        <div className="text-center bg-green-50 dark:bg-green-950/40 rounded-md py-2">
          <p className="text-xs text-green-600 dark:text-green-400 mb-0.5">
            Top 10%
          </p>
          <p className="text-sm font-semibold text-green-700 dark:text-green-300">
            {formatValue(top10, unit)}
          </p>
        </div>
      </div>
    </button>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
interface BenchmarkLibraryProps {
  currentIndustry: string
}

export function BenchmarkLibrary({ currentIndustry }: BenchmarkLibraryProps) {
  const router = useRouter()

  const defaultId = mapIndustryToId(currentIndustry)
  const [activeId, setActiveId] = useState<IndustryId>(defaultId)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const activeBenchmark = INDUSTRY_BENCHMARKS.find((b) => b.id === activeId)

  const toggleKpi = (kpiId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(kpiId)) {
        next.delete(kpiId)
      } else {
        next.add(kpiId)
      }
      return next
    })
  }

  const handleContinue = () => {
    // Build SelectedBenchmarkKpi from ALL industries (not just active tab)
    const selectedKpis: SelectedBenchmarkKpi[] = []

    for (const benchmark of INDUSTRY_BENCHMARKS) {
      for (const kpi of benchmark.kpis) {
        if (selected.has(kpi.id)) {
          selectedKpis.push({
            kpiId: kpi.id,
            name: kpi.name,
            unit: kpi.unit,
            targetValue: kpi.top25,
            frequency: kpi.frequency,
            dept_level: kpi.dept_level,
          })
        }
      }
    }

    try {
      localStorage.setItem(
        'hoshin_selected_kpis',
        JSON.stringify(selectedKpis)
      )
    } catch {
      // localStorage not available — continue anyway
    }

    if (selectedKpis.length > 0) {
      toast.success(`Đã chọn ${selectedKpis.length} KPI cho X-Matrix`)
    } else {
      toast.info('Tiếp tục không chọn KPI — có thể thêm thủ công sau')
    }

    router.push('/dashboard/discovery/synthesis')
  }

  return (
    <div className="space-y-6">
      {/* Industry tabs */}
      <div className="flex flex-wrap gap-2">
        {INDUSTRY_BENCHMARKS.map((b) => {
          const isActive = activeId === b.id
          const isCurrentOrg = b.id === defaultId
          return (
            <button
              key={b.id}
              onClick={() => setActiveId(b.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              )}
            >
              {b.icon} {b.name}
              {isCurrentOrg && (
                <span
                  className={cn(
                    'ml-1 text-xs',
                    isActive ? 'opacity-80' : 'opacity-60'
                  )}
                >
                  (của bạn)
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selection counter */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-sm text-primary font-medium">
            ✓ Đã chọn {selected.size} KPI
          </span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-muted-foreground hover:text-destructive ml-auto"
          >
            Bỏ chọn tất cả
          </button>
        </div>
      )}

      {/* KPI cards for active industry */}
      {activeBenchmark && (
        <div className="space-y-3">
          {activeBenchmark.kpis.map((kpi) => (
            <KpiCard
              key={kpi.id}
              kpiId={kpi.id}
              name={kpi.name}
              description={kpi.description}
              unit={kpi.unit}
              median={kpi.median}
              top25={kpi.top25}
              top10={kpi.top10}
              isSelected={selected.has(kpi.id)}
              onToggle={toggleKpi}
            />
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="bg-muted/40 rounded-lg px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Target mặc định = Top 25%</strong> tại Việt Nam. Bạn có thể
          chỉnh target trong X-Matrix Builder.
        </p>
        <p>
          Benchmark được tổng hợp từ báo cáo ngành 2023–2024. Dùng làm tham
          khảo, không phải chuẩn tuyệt đối.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/discovery')}
          className="flex-1"
        >
          ← Discovery Hub
        </Button>
        <Button
          onClick={handleContinue}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {selected.size > 0
            ? `Dùng ${selected.size} KPIs → AI Synthesis →`
            : 'Bỏ qua → AI Synthesis →'}
        </Button>
      </div>
    </div>
  )
}
