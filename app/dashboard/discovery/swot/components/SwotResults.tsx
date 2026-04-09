'use client'

import { useRouter } from 'next/navigation'
import type { SwotItem } from '@/lib/swot/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SwotResultsProps {
  items: SwotItem[]
  isSaved: boolean
}

const QUADRANT_CONFIG = {
  S: {
    label: 'Điểm Mạnh',
    emoji: '💪',
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
  },
  W: {
    label: 'Điểm Yếu',
    emoji: '⚠️',
    bg: 'bg-orange-50 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
  },
  O: {
    label: 'Cơ Hội',
    emoji: '🚀',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
  },
  T: {
    label: 'Thách Thức',
    emoji: '🛡️',
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
  },
} as const

export function SwotResults({ items, isSaved }: SwotResultsProps) {
  const router = useRouter()

  const getItemsByQuadrant = (q: 'S' | 'W' | 'O' | 'T') =>
    items.filter((item) => item.quadrant === q)

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="text-3xl">🎯</div>
        <h2 className="text-xl font-semibold">SWOT Analysis hoàn thành</h2>
        <p className="text-sm text-muted-foreground">
          {items.length} insights · CEO input + nghiên cứu thị trường
          {isSaved && ' · ✅ Đã lưu'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(['S', 'W', 'O', 'T'] as const).map((q) => {
          const config = QUADRANT_CONFIG[q]
          const qItems = getItemsByQuadrant(q)
          return (
            <div
              key={q}
              className={`space-y-3 rounded-xl border p-4 ${config.bg} ${config.border}`}
            >
              <h3 className="flex items-center gap-2 font-semibold">
                <span>{config.emoji}</span>
                <span>{config.label}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {qItems.length}
                </Badge>
              </h3>
              <div className="space-y-3">
                {qItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 rounded-lg bg-background/70 p-3"
                  >
                    <p className="text-sm font-medium leading-relaxed">
                      {item.statement}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {item.evidence.map((ev, eidx) => (
                        <span
                          key={eidx}
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            ev.source === 'CEO'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {ev.source === 'CEO' ? '👤 CEO' : '🌐 Web'}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs italic text-muted-foreground">
                      → {item.implication}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 pt-4 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/discovery')}
          className="flex-1"
        >
          ← Về Discovery
        </Button>
        <Button
          onClick={() => router.push('/dashboard')}
          className="flex-1"
        >
          Tiếp theo →
        </Button>
      </div>
    </div>
  )
}
