'use client'

import { useRouter } from 'next/navigation'
import type { SwotSynthesisOutput, SwotQuadrant } from '@/lib/swot/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SwotResultsProps {
  synthesisOutput: SwotSynthesisOutput
  isSaved: boolean
}

const QUADRANT_CONFIG: Record<
  SwotQuadrant,
  { label: string; emoji: string; bg: string; border: string }
> = {
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
}

export function SwotResults({ synthesisOutput, isSaved }: SwotResultsProps) {
  const router = useRouter()

  const totalItems =
    synthesisOutput.S.length +
    synthesisOutput.W.length +
    synthesisOutput.O.length +
    synthesisOutput.T.length

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="text-3xl">🎯</div>
        <h2 className="text-xl font-semibold">SWOT Analysis hoàn thành</h2>
        <p className="text-sm text-muted-foreground">
          {totalItems} insights · CEO input + nghiên cứu thị trường
          {isSaved && ' · ✅ Đã lưu'}
        </p>
        {synthesisOutput.summary && (
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {synthesisOutput.summary}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(['S', 'W', 'O', 'T'] as const).map((q) => {
          const config = QUADRANT_CONFIG[q]
          const qItems = synthesisOutput[q]
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
                {qItems.map((item) => (
                  <div
                    key={item.id}
                    className="space-y-2 rounded-lg bg-background/70 p-3"
                  >
                    <p className="text-sm font-medium leading-relaxed">
                      {item.statement}
                    </p>
                    <p className="text-xs italic text-muted-foreground">
                      → {item.implication}
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {item.confidence < 0.7 && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        >
                          Cần xác nhận ({Math.round(item.confidence * 100)}%)
                        </Badge>
                      )}
                    </div>
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
