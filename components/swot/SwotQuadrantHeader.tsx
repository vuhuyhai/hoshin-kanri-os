'use client'

import { useState } from 'react'
import { SwotSuggestMoreDialog } from './SwotSuggestMoreDialog'
import type { QuadrantKey, SwotDraftItem, SwotContextInput } from '@/lib/swot/coaching-types'

interface SwotQuadrantHeaderProps {
  quadrant: QuadrantKey
  label: string
  icon: string
  itemCount: number
  maxItems?: number
  existingItems: SwotDraftItem[]
  contextInput: SwotContextInput
  onAddItem: () => void
  onSuggestSuccess: (newItems: SwotDraftItem[]) => void
}

export function SwotQuadrantHeader({
  quadrant,
  label,
  icon,
  itemCount,
  maxItems = 8,
  existingItems,
  contextInput,
  onAddItem,
  onSuggestSuccess,
}: SwotQuadrantHeaderProps) {
  const [showSuggest, setShowSuggest] = useState(false)
  const isOverLimit = itemCount >= maxItems

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm flex items-center gap-1.5">
          {icon} {label}
          <span className="text-xs font-normal text-muted-foreground">
            ({itemCount})
          </span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onAddItem}
            className="text-xs px-2 py-1 border border-black/30 hover:border-black hover:bg-white/50 transition-colors font-medium"
          >
            + Thêm
          </button>
          <button
            type="button"
            onClick={() => setShowSuggest(true)}
            title={isOverLimit ? 'Đã có nhiều items, cân nhắc trước khi thêm' : undefined}
            className="text-xs px-2 py-1 border border-black/30 hover:border-black hover:bg-white/50 transition-colors font-medium"
          >
            🤖 AI
          </button>
        </div>
      </div>

      {showSuggest && (
        <SwotSuggestMoreDialog
          quadrant={quadrant}
          existingItems={existingItems}
          contextInput={contextInput}
          onSuccess={onSuggestSuccess}
          onClose={() => setShowSuggest(false)}
        />
      )}
    </div>
  )
}
