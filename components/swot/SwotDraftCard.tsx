'use client'

import { useState, useRef, useEffect } from 'react'
import { SwotConflictBadge } from './SwotConflictBadge'
import type { SwotDraftItem, ConflictIssue } from '@/lib/swot/coaching-types'

const FRAMEWORK_BADGE: Record<string, { label: string; color: string }> = {
  '8Ms': { label: '8Ms', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  '5Forces': { label: '5F', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  PESTEL: { label: 'PESTEL', color: 'bg-green-100 text-green-800 border-green-300' },
}

const CONFIDENCE_BORDER: Record<string, string> = {
  high: 'border-l-green-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-gray-400',
}

interface SwotDraftCardProps {
  item: SwotDraftItem
  onEdit: (newStatement: string) => void
  onDelete: () => void
  conflictIssue?: ConflictIssue
  relatedItemStatement?: string
  onDismissConflict?: () => void
}

export function SwotDraftCard({ item, onEdit, onDelete, conflictIssue, relatedItemStatement, onDismissConflict }: SwotDraftCardProps) {
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
    if (trimmed && trimmed !== item.statement) {
      onEdit(trimmed)
    }
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
  const borderColor = CONFIDENCE_BORDER[item.confidence]

  return (
    <div
      data-item-id={item.id}
      className={`group border-2 border-black border-l-4 ${borderColor} bg-white p-3 transition-shadow hover:shadow-[2px_2px_0_#000]`}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="w-full text-sm border-2 border-black p-2 resize-none focus:outline-none"
          />
          <div className="flex gap-2 text-xs">
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-black text-white border-2 border-black font-medium"
            >
              Lưu
            </button>
            <button
              onClick={handleCancel}
              className="px-2 py-1 border-2 border-black font-medium"
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
                <span className={`text-[10px] px-1.5 py-0.5 border font-medium ${badge.color}`}>
                  {badge.label}
                </span>
              )}
              {item.isUserAdded && (
                <span className="text-[10px] px-1.5 py-0.5 border border-purple-300 bg-purple-100 text-purple-800 font-medium">
                  Tự thêm
                </span>
              )}
              <span className="text-sm">{item.statement}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm hover:bg-gray-100 px-1 rounded"
                title="Sửa"
              >
                ✏️
              </button>
              <button
                onClick={onDelete}
                className="text-sm hover:bg-red-50 px-1 rounded"
                title="Xoá"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 pl-0.5">
            AI: {item.rationale}
          </p>
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
