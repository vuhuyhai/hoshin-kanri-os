'use client'

import { useState } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import { SwotSuggestMoreDialog } from './SwotSuggestMoreDialog'
import type { QuadrantKey, SwotDraftItem, SwotContextInput } from '@/lib/swot/coaching-types'

interface SwotQuadrantHeaderProps {
  quadrant: QuadrantKey
  label: string
  /** @deprecated emoji icon no longer rendered */
  icon?: string
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
        <h3 className="font-display font-bold text-sm flex items-center gap-1.5 text-ink">
          {label}
          <span className="font-body text-xs font-normal text-text-3">({itemCount})</span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onAddItem}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 border-2 border-ink bg-card hover:bg-bg-warm transition-colors font-display font-bold text-ink"
          >
            <Plus className="w-3 h-3" /> Thêm
          </button>
          <button
            type="button"
            onClick={() => setShowSuggest(true)}
            title={isOverLimit ? 'Đã có nhiều items, cân nhắc trước khi thêm' : undefined}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 border-2 border-ink bg-card hover:bg-bg-warm transition-colors font-display font-bold text-ink"
          >
            <Sparkles className="w-3 h-3" /> AI
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
