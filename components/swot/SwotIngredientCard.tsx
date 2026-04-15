'use client'

import { useState } from 'react'
import { Search, Pencil, Trash2, Paperclip, Loader2 } from 'lucide-react'
import type { SwotIngredient, IngredientSource } from '@/lib/swot/types'

interface SwotIngredientCardProps {
  ingredient: SwotIngredient
  onEdit: (id: string, newStatement: string) => void
  onDelete: (id: string) => void
  onSearchEvidence: (id: string) => void
  onToggleSelect?: (id: string) => void
  showCheckbox?: boolean
}

const SOURCE_CLS: Record<IngredientSource, { label: string; cls: string }> = {
  ai_draft: { label: 'AI', cls: 'bg-blue-100 text-blue-800 border-blue-600' },
  manual: { label: 'Manual', cls: 'bg-green-100 text-green-800 border-green-600' },
  chat_extract: { label: 'Chat', cls: 'bg-purple-100 text-purple-800 border-purple-600' },
}

export function SwotIngredientCard({
  ingredient, onEdit, onDelete, onSearchEvidence, onToggleSelect, showCheckbox,
}: SwotIngredientCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(ingredient.statement)

  const commitEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== ingredient.statement) onEdit(ingredient.id, trimmed)
    else setEditText(ingredient.statement)
    setIsEditing(false)
  }
  const cancelEdit = () => { setEditText(ingredient.statement); setIsEditing(false) }

  const source = SOURCE_CLS[ingredient.source]
  const hasEvidence = ingredient.evidence.length > 0

  return (
    <div className="border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#2C2B2B]">
      <div className="flex items-start gap-2">
        {showCheckbox && onToggleSelect && (
          <input
            type="checkbox"
            checked={ingredient.selected}
            onChange={() => onToggleSelect(ingredient.id)}
            className="mt-1 w-4 h-4 border-2 border-ink accent-accent-brand"
            aria-label="Chọn nguyên liệu"
          />
        )}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() }
                else if (e.key === 'Escape') cancelEdit()
              }}
              rows={2}
              className="w-full border-2 border-ink bg-white px-2 py-1 font-display text-sm text-ink focus:outline-none resize-none"
            />
          ) : (
            <p className="font-display text-sm text-ink break-words">{ingredient.statement}</p>
          )}
          <span className={`mt-1.5 inline-block border font-body font-bold uppercase text-[10px] tracking-wider px-1.5 py-0.5 ${source.cls}`}>
            {source.label}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSearchEvidence(ingredient.id)}
          disabled={ingredient.isSearching}
          className="inline-flex items-center gap-1 border-2 border-ink bg-bg-warm px-2 py-1 font-body font-bold uppercase text-[11px] tracking-wider text-ink hover:bg-accent-brand hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {ingredient.isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
          Tìm dữ liệu
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="border-2 border-ink bg-white p-1 hover:bg-bg-warm transition-colors"
          aria-label="Sửa"
        >
          <Pencil className="w-3.5 h-3.5 text-ink" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(ingredient.id)}
          className="border-2 border-ink bg-white p-1 hover:bg-red-50 transition-colors"
          aria-label="Xóa"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-600" />
        </button>
        {hasEvidence && (
          <button
            type="button"
            onClick={() => onSearchEvidence(ingredient.id)}
            className="ml-auto inline-flex items-center gap-1 border-2 border-ink bg-green-100 px-2 py-1 font-body font-bold uppercase text-[11px] tracking-wider text-green-800 hover:bg-green-200 transition-colors"
          >
            <Paperclip className="w-3 h-3" />
            {ingredient.evidence.length} nguồn
          </button>
        )}
      </div>
    </div>
  )
}
