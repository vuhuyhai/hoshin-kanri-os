'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type {
  ExtendedCellType,
  ExtendedSwotCell,
  SwotItem,
} from '@/lib/swot/swot-session-store'
import { cn } from '@/lib/utils'

const CELL_CONFIG: Record<
  ExtendedCellType,
  {
    title: string
    subtitle: string
    borderClass: string
    bgClass: string
    headerBg: string
  }
> = {
  SO: {
    title: 'SO — Tận dụng để phát triển',
    subtitle: 'Strengths + Opportunities',
    borderClass: 'border-green-500',
    bgClass: 'bg-green-50/50 dark:bg-green-950/20',
    headerBg: 'bg-green-100 dark:bg-green-950/40',
  },
  ST: {
    title: 'ST — Bảo vệ bằng điểm mạnh',
    subtitle: 'Strengths + Threats',
    borderClass: 'border-blue-500',
    bgClass: 'bg-blue-50/50 dark:bg-blue-950/20',
    headerBg: 'bg-blue-100 dark:bg-blue-950/40',
  },
  WO: {
    title: 'WO — Khắc phục để không bỏ lỡ',
    subtitle: 'Weaknesses + Opportunities',
    borderClass: 'border-yellow-500',
    bgClass: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    headerBg: 'bg-yellow-100 dark:bg-yellow-950/40',
  },
  WT: {
    title: '⚠️ WT — Ưu tiên cao nhất',
    subtitle: 'Weaknesses + Threats',
    borderClass: 'border-red-500',
    bgClass: 'bg-red-50/50 dark:bg-red-950/20',
    headerBg: 'bg-red-100 dark:bg-red-950/40',
  },
}

interface SwotCellProps {
  cell: ExtendedSwotCell
  items: SwotItem[]
  isGenerating: boolean
  onGenerate: () => void
  onSelectStrategy: (strategy: string) => void
}

export function SwotCell({
  cell,
  items,
  isGenerating,
  onGenerate,
  onSelectStrategy,
}: SwotCellProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState('')
  const config = CELL_CONFIG[cell.cellType]
  const isWT = cell.cellType === 'WT'

  // Linked items
  const linkedIds = [
    ...(cell.strengthIds ?? []),
    ...(cell.weaknessIds ?? []),
    ...(cell.opportunityIds ?? []),
    ...(cell.threatIds ?? []),
  ]
  const linkedItems = items.filter((i) => linkedIds.includes(i.id))

  return (
    <div
      className={cn(
        'border-2 space-y-3',
        config.borderClass,
        config.bgClass,
        isWT && 'border-4'
      )}
    >
      {/* Header */}
      <div className={cn('px-4 py-2.5', config.headerBg)}>
        <h4 className="font-display text-sm font-bold">{config.title}</h4>
        <p className="text-xs text-muted-foreground">{config.subtitle}</p>
      </div>

      {/* WT warning */}
      {isWT && (
        <div className="mx-4 px-3 py-2 bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          ⚠️ Ưu tiên cao nhất — điểm yếu kết hợp mối đe dọa
        </div>
      )}

      <div className="px-4 pb-4 space-y-3">
        {/* Linked items chips */}
        {linkedItems.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {linkedItems.map((item) => (
              <span
                key={item.id}
                className={cn('text-[10px] px-1.5 py-0.5 font-medium', {
                  'bg-green-200 text-green-800': item.category === 'S',
                  'bg-red-200 text-red-800': item.category === 'W',
                  'bg-blue-200 text-blue-800': item.category === 'O',
                  'bg-orange-200 text-orange-800': item.category === 'T',
                })}
              >
                {item.category}: {item.statement.slice(0, 40)}
                {item.statement.length > 40 ? '...' : ''}
              </span>
            ))}
          </div>
        )}

        {/* Loading state */}
        {isGenerating && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 bg-muted/60 animate-pulse"
              />
            ))}
            <p className="text-xs text-muted-foreground animate-pulse">
              AI đang phân tích ô {cell.cellType}...
            </p>
          </div>
        )}

        {/* No strategies yet — generate button */}
        {!isGenerating && cell.aiStrategies.length === 0 && (
          <Button
            size="sm"
            onClick={onGenerate}
            className="w-full font-display text-xs font-semibold uppercase tracking-wider"
          >
            Phân tích ô này →
          </Button>
        )}

        {/* Strategy options */}
        {!isGenerating && cell.aiStrategies.length > 0 && (
          <div className="space-y-2">
            {cell.aiStrategies.map((strategy, idx) => (
              <button
                key={idx}
                onClick={() => onSelectStrategy(strategy)}
                className={cn(
                  'w-full text-left px-3 py-2 border text-sm transition-all',
                  cell.selectedStrategy === strategy
                    ? cn('border-2', config.borderClass, config.bgClass)
                    : 'border-border hover:border-primary/50'
                )}
              >
                <span className="flex items-start gap-2">
                  <span
                    className={cn(
                      'mt-0.5 w-3 h-3 shrink-0 border-2',
                      cell.selectedStrategy === strategy
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                    )}
                  />
                  <span>{strategy}</span>
                </span>
              </button>
            ))}

            {/* Custom option */}
            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="w-full text-left px-3 py-2 border border-dashed text-sm text-muted-foreground hover:border-primary/50 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 shrink-0 border-2 border-dashed border-muted-foreground" />
                  Tùy chỉnh...
                </span>
              </button>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Nhập chiến lược tùy chỉnh..."
                  rows={2}
                  className="text-sm resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={!customText.trim()}
                    onClick={() => {
                      onSelectStrategy(customText.trim())
                      setShowCustom(false)
                    }}
                    className="flex-1 text-xs"
                  >
                    Chọn
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCustom(false)}
                    className="text-xs"
                  >
                    Huỷ
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected strategy highlight */}
        {cell.selectedStrategy &&
          !cell.aiStrategies.includes(cell.selectedStrategy) && (
            <div
              className={cn(
                'px-3 py-2 border-2 text-sm font-medium',
                config.borderClass,
                config.bgClass
              )}
            >
              ✓ {cell.selectedStrategy}
            </div>
          )}
      </div>
    </div>
  )
}
