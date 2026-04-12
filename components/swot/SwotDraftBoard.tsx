'use client'

import { useState } from 'react'
import type { ComponentType, CSSProperties } from 'react'
import { Zap, AlertTriangle, TrendingUp, Shield, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { SwotDraftCard } from './SwotDraftCard'
import { SwotQuadrantHeader } from './SwotQuadrantHeader'
import { SwotConfirmButton } from './SwotConfirmButton'
import type {
  SwotDraft, SwotDraftItem, QuadrantKey, SwotContextInput, ConflictIssue,
} from '@/lib/swot/coaching-types'

type IconComp = ComponentType<{ className?: string; style?: CSSProperties }>

interface QuadrantConfig {
  key: QuadrantKey
  label: string
  Icon: IconComp
  accent: string
}

const QUADRANTS: QuadrantConfig[] = [
  { key: 'strengths',     label: 'Điểm mạnh',   Icon: Zap,            accent: '#10b981' },
  { key: 'weaknesses',    label: 'Điểm yếu',    Icon: AlertTriangle,  accent: '#f59e0b' },
  { key: 'opportunities', label: 'Cơ hội',      Icon: TrendingUp,     accent: '#2563eb' },
  { key: 'threats',       label: 'Thách thức',  Icon: Shield,         accent: '#c73937' },
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
  return draft[other.quadrant].find((i) => i.id === other.itemId)?.statement
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
  const contextInput = useSwotStore((s) => s.coachingWizard.contextInput)
  const appendSuggestedItems = useSwotStore((s) => s.appendCoachingSuggestedItems)
  const conflictResult = useSwotStore((s) => s.coachingWizard.conflictResult)
  const dismissConflict = useSwotStore((s) => s.dismissCoachingConflict)
  const [isConfirming, setIsConfirming] = useState(false)
  const issues = conflictResult?.issues ?? []

  const handleConfirm = async () => {
    setIsConfirming(true)
    try { await onConfirm() } finally { setIsConfirming(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-black text-xl uppercase text-ink">Bản nháp SWOT</h2>
        <p className="font-body text-sm text-text-3 mt-1">
          Xem lại, chỉnh sửa hoặc thêm mới — sau đó xác nhận để tiếp tục
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((q) => (
          <QuadrantSection
            key={q.key}
            config={q}
            items={draft[q.key]}
            contextInput={contextInput}
            draft={draft}
            issues={issues}
            onEdit={(id, s) => onUpdateItem(q.key, id, s)}
            onDelete={(id) => onRemoveItem(q.key, id)}
            onAdd={() => onAddItem(q.key)}
            onSuggestSuccess={(items) => appendSuggestedItems(q.key, items)}
            onDismissConflict={dismissConflict}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-ink">
        <Button
          variant="outline"
          onClick={onSaveDraft}
          className="border-2 border-ink font-display font-bold text-sm shadow-[2px_2px_0_#2C2B2B] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Lưu nháp
        </Button>
        <SwotConfirmButton draft={draft} onConfirm={handleConfirm} isConfirming={isConfirming} />
      </div>
    </div>
  )
}

interface QuadrantSectionProps {
  config: QuadrantConfig
  items: SwotDraftItem[]
  contextInput: SwotContextInput | null
  draft: SwotDraft
  issues: ConflictIssue[]
  onEdit: (id: string, stmt: string) => void
  onDelete: (id: string) => void
  onAdd: () => void
  onSuggestSuccess: (items: SwotDraftItem[]) => void
  onDismissConflict: (index: number) => void
}

function QuadrantSection({
  config, items, contextInput, draft, issues, onEdit, onDelete, onAdd, onSuggestSuccess, onDismissConflict,
}: QuadrantSectionProps) {
  const Icon = config.Icon
  return (
    <div
      className="border-2 border-ink bg-white p-4 relative"
      style={{ boxShadow: '4px 4px 0 #2C2B2B', borderLeft: `8px solid ${config.accent}` }}
    >
      {contextInput ? (
        <SwotQuadrantHeader
          quadrant={config.key}
          label={config.label}
          itemCount={items.length}
          existingItems={items}
          contextInput={contextInput}
          onAddItem={onAdd}
          onSuggestSuccess={onSuggestSuccess}
        />
      ) : (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-sm flex items-center gap-1.5 text-ink">
            <Icon className="w-4 h-4" style={{ color: config.accent }} />
            {config.label}
            <span className="font-body text-xs font-normal text-text-3">({items.length})</span>
          </h3>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item) => {
          const match = getIssueForItem(issues, config.key, item.id)
          return (
            <SwotDraftCard
              key={item.id}
              item={item}
              onEdit={(s) => onEdit(item.id, s)}
              onDelete={() => onDelete(item.id)}
              conflictIssue={match?.issue}
              relatedItemStatement={match ? getRelatedStatement(match.issue, item.id, draft) : undefined}
              onDismissConflict={match ? () => onDismissConflict(match.index) : undefined}
            />
          )
        })}
      </div>
      {!contextInput && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 w-full py-2 text-xs font-display font-bold border-2 border-dashed border-ink/30 hover:border-ink hover:bg-bg-warm transition-colors text-ink inline-flex items-center justify-center gap-1"
        >
          <Plus className="w-3 h-3" /> Thêm
        </button>
      )}
    </div>
  )
}
