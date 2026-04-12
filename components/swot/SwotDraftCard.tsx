'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, X as XIcon } from 'lucide-react'
import { SwotConflictBadge } from './SwotConflictBadge'
import type { SwotDraftItem, ConflictIssue } from '@/lib/swot/coaching-types'

const FRAMEWORK_BADGE: Record<string, { label: string; accent: string }> = {
  '8Ms':     { label: '8Ms',    accent: '#2563eb' },
  '5Forces': { label: '5F',     accent: '#f59e0b' },
  PESTEL:    { label: 'PESTEL', accent: '#10b981' },
}

const CONFIDENCE_ACCENT: Record<string, string> = {
  high:   '#10b981',
  medium: '#f59e0b',
  low:    '#8A8787',
}

interface SwotDraftCardProps {
  item: SwotDraftItem
  onEdit: (newStatement: string) => void
  onDelete: () => void
  conflictIssue?: ConflictIssue
  relatedItemStatement?: string
  onDismissConflict?: () => void
}

export function SwotDraftCard({
  item, onEdit, onDelete, conflictIssue, relatedItemStatement, onDismissConflict,
}: SwotDraftCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.statement)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== item.statement) onEdit(trimmed)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(item.statement)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') handleCancel()
  }

  const badge = FRAMEWORK_BADGE[item.frameworkSource]
  const confidenceAccent = CONFIDENCE_ACCENT[item.confidence] ?? '#8A8787'

  return (
    <div
      data-item-id={item.id}
      className="group border-2 border-ink bg-white p-3 transition-shadow hover:shadow-[2px_2px_0_#2C2B2B]"
      style={{ borderLeft: `4px solid ${confidenceAccent}` }}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="w-full font-body text-sm border-2 border-ink bg-white p-2 resize-none focus:outline-none"
          />
          <div className="flex gap-2 text-xs">
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-ink text-white border-2 border-ink font-display font-bold"
            >
              Lưu
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 bg-white text-ink border-2 border-ink font-display font-bold"
            >
              Huỷ
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {badge && (
                <span
                  className="font-display font-bold text-[10px] px-1.5 py-0.5 border-2 border-ink text-white"
                  style={{ background: badge.accent }}
                >
                  {badge.label}
                </span>
              )}
              {item.isUserAdded && (
                <span className="font-display font-bold text-[10px] px-1.5 py-0.5 border-2 border-ink bg-white text-ink">
                  Tự thêm
                </span>
              )}
              <span className="font-body text-sm text-ink">{item.statement}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="text-text-2 hover:text-ink hover:bg-bg-warm p-1"
                title="Sửa"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={onDelete}
                className="text-text-2 hover:text-[#c73937] hover:bg-bg-warm p-1"
                title="Xoá"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
          <p className="font-body text-xs text-text-3 mt-1 pl-0.5 italic">AI: {item.rationale}</p>
          {conflictIssue && onDismissConflict && (
            <SwotConflictBadge
              issue={conflictIssue}
              relatedItemStatement={relatedItemStatement}
              onDismiss={onDismissConflict}
            />
          )}
        </div>
      )}
    </div>
  )
}
