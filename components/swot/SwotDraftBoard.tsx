'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSwotCoachingStore } from '@/lib/swot/coaching-store'
import { SwotDraftCard } from './SwotDraftCard'
import { SwotQuadrantHeader } from './SwotQuadrantHeader'
import { SwotConfirmButton } from './SwotConfirmButton'
import type {
  SwotDraft, SwotDraftItem, QuadrantKey, SwotContextInput, ConflictIssue,
} from '@/lib/swot/coaching-types'

interface QuadrantConfig {
  key: QuadrantKey; label: string; icon: string; bgColor: string; borderColor: string
}

const QUADRANTS: QuadrantConfig[] = [
  { key: 'strengths', label: 'Điểm mạnh', icon: '💪', bgColor: 'bg-green-50', borderColor: 'border-green-600' },
  { key: 'weaknesses', label: 'Điểm yếu', icon: '⚠️', bgColor: 'bg-red-50', borderColor: 'border-red-600' },
  { key: 'opportunities', label: 'Cơ hội', icon: '🚀', bgColor: 'bg-blue-50', borderColor: 'border-blue-600' },
  { key: 'threats', label: 'Thách thức', icon: '🛡️', bgColor: 'bg-orange-50', borderColor: 'border-orange-600' },
]

function getIssueForItem(issues: ConflictIssue[], quadrant: QuadrantKey, itemId: string) {
  const index = issues.findIndex((issue) =>
    issue.affectedItems.some((ai) => ai.quadrant === quadrant && ai.itemId === itemId)
  )
  return index >= 0 ? { issue: issues[index], index } : null
}

function getRelatedStatement(issue: ConflictIssue, currentItemId: string, draft: SwotDraft) {
  const other = issue.affectedItems.find((ai) => ai.itemId !== currentItemId)
  if (!other) return undefined
  const items = draft[other.quadrant]
  return items.find((i) => i.id === other.itemId)?.statement
}

interface SwotDraftBoardProps {
  draft: SwotDraft
  onUpdateItem: (quadrant: QuadrantKey, itemId: string, newStatement: string) => void
  onAddItem: (quadrant: QuadrantKey) => void
  onRemoveItem: (quadrant: QuadrantKey, itemId: string) => void
  onSaveDraft: () => Promise<void>
  onConfirm: () => Promise<void>
  orgId: string
}

export function SwotDraftBoard({
  draft, onUpdateItem, onAddItem, onRemoveItem, onSaveDraft, onConfirm,
}: SwotDraftBoardProps) {
  const contextInput = useSwotCoachingStore((s) => s.contextInput)
  const appendSuggestedItems = useSwotCoachingStore((s) => s.appendSuggestedItems)
  const conflictResult = useSwotCoachingStore((s) => s.conflictResult)
  const dismissConflict = useSwotCoachingStore((s) => s.dismissConflict)
  const [isConfirming, setIsConfirming] = useState(false)
  const issues = conflictResult?.issues ?? []

  const handleConfirm = async () => {
    setIsConfirming(true)
    try { await onConfirm() } finally { setIsConfirming(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-extrabold text-xl">Bản nháp SWOT</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Xem lại, chỉnh sửa hoặc thêm mới — sau đó xác nhận để tiếp tục
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((q) => (
          <QuadrantSection key={q.key} config={q} items={draft[q.key]}
            contextInput={contextInput} draft={draft} issues={issues}
            onEdit={(id, s) => onUpdateItem(q.key, id, s)}
            onDelete={(id) => onRemoveItem(q.key, id)}
            onAdd={() => onAddItem(q.key)}
            onSuggestSuccess={(items) => appendSuggestedItems(q.key, items)}
            onDismissConflict={dismissConflict} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-black">
        <Button variant="outline" onClick={onSaveDraft}
          className="border-2 border-black font-display font-bold text-sm shadow-[2px_2px_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
          Lưu nháp
        </Button>
        <SwotConfirmButton draft={draft} onConfirm={handleConfirm} isConfirming={isConfirming} />
      </div>
    </div>
  )
}

// ─── Quadrant sub-component ─────────────────────────────────

interface QuadrantSectionProps {
  config: QuadrantConfig; items: SwotDraftItem[]; contextInput: SwotContextInput | null
  draft: SwotDraft; issues: ConflictIssue[]
  onEdit: (id: string, stmt: string) => void; onDelete: (id: string) => void
  onAdd: () => void; onSuggestSuccess: (items: SwotDraftItem[]) => void
  onDismissConflict: (index: number) => void
}

function QuadrantSection({
  config, items, contextInput, draft, issues, onEdit, onDelete, onAdd, onSuggestSuccess, onDismissConflict,
}: QuadrantSectionProps) {
  return (
    <div className={`border-2 ${config.borderColor} ${config.bgColor} p-4 relative`}>
      {contextInput ? (
        <SwotQuadrantHeader quadrant={config.key} label={config.label} icon={config.icon}
          itemCount={items.length} existingItems={items} contextInput={contextInput}
          onAddItem={onAdd} onSuggestSuccess={onSuggestSuccess} />
      ) : (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-sm flex items-center gap-1.5">
            {config.icon} {config.label}
            <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
          </h3>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item) => {
          const match = getIssueForItem(issues, config.key, item.id)
          return (
            <SwotDraftCard key={item.id} item={item}
              onEdit={(s) => onEdit(item.id, s)} onDelete={() => onDelete(item.id)}
              conflictIssue={match?.issue}
              relatedItemStatement={match ? getRelatedStatement(match.issue, item.id, draft) : undefined}
              onDismissConflict={match ? () => onDismissConflict(match.index) : undefined} />
          )
        })}
      </div>
      {!contextInput && (
        <button type="button" onClick={onAdd}
          className="mt-2 w-full py-2 text-xs font-medium border-2 border-dashed border-black/30 hover:border-black hover:bg-white/50 transition-colors">
          + Thêm
        </button>
      )}
    </div>
  )
}
