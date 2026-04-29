'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KpiSparkline } from './KpiSparkline'
import { KpiUpdateForm } from './KpiUpdateForm'
import { GembaCommentForm } from '@/components/gemba/GembaCommentForm'
import type { KpiWithEntries } from '@/app/api/kpi/list/route'
import { cn } from '@/lib/utils'

type TrafficLight = 'green' | 'yellow' | 'red'

function getTrafficLight(latest: number | null, target: number): TrafficLight {
  if (latest === null) return 'red'
  const pct = (latest / target) * 100
  if (pct >= 90) return 'green'
  if (pct >= 70) return 'yellow'
  return 'red'
}

const LIGHT_CONFIG: Record<
  TrafficLight,
  { label: string; badgeClass: string; dotClass: string }
> = {
  green: {
    label: '≥90%',
    badgeClass:
      'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-200',
    dotClass: 'bg-green-500',
  },
  yellow: {
    label: '70–90%',
    badgeClass:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-200',
    dotClass: 'bg-yellow-500',
  },
  red: {
    label: '<70%',
    badgeClass:
      'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200',
    dotClass: 'bg-red-500',
  },
}

function formatValue(v: number, unit: string): string {
  if (unit.includes('%')) return `${v}%`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M ${unit}`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K ${unit}`
  return `${v} ${unit}`
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

interface KpiCardProps {
  kpi: KpiWithEntries
  onEntryAdded: (kpiId: string, value: number, date: string) => void
}

export function KpiCard({ kpi, onEntryAdded }: KpiCardProps) {
  const [showForm, setShowForm] = useState(false)

  const light = getTrafficLight(kpi.latestValue, kpi.targetValue)
  const config = LIGHT_CONFIG[light]
  const sparkValues = kpi.entries.map((e) => e.value)
  const pct =
    kpi.latestValue !== null
      ? Math.round((kpi.latestValue / kpi.targetValue) * 100)
      : null

  const handleSaved = (newValue: number, date: string) => {
    onEntryAdded(kpi.id, newValue, date)
    setShowForm(false)
  }

  return (
    <div
      className={cn(
        'border rounded-xl p-4 space-y-3 transition-all',
        light === 'red' && 'border-red-200 dark:border-red-900'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full shrink-0',
                config.dotClass
              )}
            />
            <p className="font-medium text-sm leading-snug truncate">
              {kpi.name}
            </p>
          </div>
          {kpi.ownerName && (
            <p className="text-xs text-muted-foreground mt-0.5 pl-4">
              {kpi.ownerName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={cn('text-xs border', config.badgeClass)}>
            {config.label}
          </Badge>
          {!showForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(true)}
              className="h-6 text-xs px-2"
            >
              Cập nhật
            </Button>
          )}
        </div>
      </div>

      {/* Value + Sparkline row */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <p
            className={cn('text-2xl font-bold tabular-nums', {
              'text-green-600 dark:text-green-400': light === 'green',
              'text-yellow-600 dark:text-yellow-400': light === 'yellow',
              'text-red-600 dark:text-red-400': light === 'red',
            })}
          >
            {kpi.latestValue !== null
              ? formatValue(kpi.latestValue, kpi.unit)
              : '—'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground">
              target {formatValue(kpi.targetValue, kpi.unit)}
            </p>
            {pct !== null && (
              <span className="text-xs font-medium text-muted-foreground">
                ({pct}%)
              </span>
            )}
          </div>
          {kpi.latestDate && (
            <p className="text-xs text-muted-foreground">
              Cập nhật {formatDate(kpi.latestDate)}
            </p>
          )}
        </div>

        <div className="shrink-0">
          <KpiSparkline
            values={sparkValues}
            target={kpi.targetValue}
            color={light}
            width={100}
            height={36}
          />
          <p className="text-xs text-muted-foreground text-center mt-0.5">
            8 kỳ
          </p>
        </div>
      </div>

      {/* Inline update form */}
      {showForm && (
        <KpiUpdateForm
          kpiId={kpi.id}
          kpiName={kpi.name}
          unit={kpi.unit}
          currentValue={kpi.latestValue}
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Gemba comment form — Member primary writer (M-Hoshin-5).
          onSuccess defer Task 7B (thread display refresh). */}
      <div className="pt-3 border-t border-ink/10">
        <GembaCommentForm
          targetType="kpi"
          targetId={kpi.id}
          targetLabel={`KPI: ${kpi.name}`}
        />
      </div>
    </div>
  )
}
