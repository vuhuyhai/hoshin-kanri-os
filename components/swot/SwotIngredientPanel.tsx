'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { SwotIngredientCard } from './SwotIngredientCard'
import type { SwotQuadrant } from '@/lib/swot/types'

interface SwotIngredientPanelProps {
  showCheckbox?: boolean
  onEvidenceSearch: (ingredientId: string) => void
}

interface QuadrantMeta {
  key: SwotQuadrant
  label: string
  addLabel: string
  boxCls: string
  headerCls: string
}

const QUADRANTS: QuadrantMeta[] = [
  { key: 'S', label: 'Điểm mạnh', addLabel: 'Thêm điểm mạnh', boxCls: 'bg-green-50 border-green-600', headerCls: 'bg-green-600 text-white' },
  { key: 'W', label: 'Điểm yếu', addLabel: 'Thêm điểm yếu', boxCls: 'bg-red-50 border-red-600', headerCls: 'bg-red-600 text-white' },
  { key: 'O', label: 'Cơ hội', addLabel: 'Thêm cơ hội', boxCls: 'bg-blue-50 border-blue-600', headerCls: 'bg-blue-600 text-white' },
  { key: 'T', label: 'Thách thức', addLabel: 'Thêm thách thức', boxCls: 'bg-orange-50 border-orange-600', headerCls: 'bg-orange-600 text-white' },
]

export function SwotIngredientPanel({ showCheckbox, onEvidenceSearch }: SwotIngredientPanelProps) {
  const ingredients = useSwotStore((s) => s.ingredients)
  const addIngredient = useSwotStore((s) => s.addIngredient)
  const updateIngredient = useSwotStore((s) => s.updateIngredient)
  const removeIngredient = useSwotStore((s) => s.removeIngredient)
  const toggleIngredientSelected = useSwotStore((s) => s.toggleIngredientSelected)

  const [addingQuadrant, setAddingQuadrant] = useState<SwotQuadrant | null>(null)
  const [addText, setAddText] = useState('')

  const cancelAdd = () => { setAddingQuadrant(null); setAddText('') }
  const commitAdd = () => {
    const trimmed = addText.trim()
    if (!trimmed || !addingQuadrant) { cancelAdd(); return }
    addIngredient({ id: nanoid(), quadrant: addingQuadrant, statement: trimmed, source: 'manual' })
    toast.success('Đã thêm nguyên liệu')
    cancelAdd()
  }
  const handleEdit = (id: string, newStatement: string) => updateIngredient(id, { statement: newStatement })
  const handleDelete = (id: string) => { removeIngredient(id); toast.success('Đã xóa nguyên liệu') }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {QUADRANTS.map((meta) => {
        const items = ingredients.filter((i) => i.quadrant === meta.key)
        const isAdding = addingQuadrant === meta.key
        return (
          <details
            key={meta.key}
            open
            className={`border-2 shadow-[4px_4px_0_#2C2B2B] [&>summary]:list-none [&>summary::-webkit-details-marker]:hidden ${meta.boxCls}`}
          >
            <summary className={`cursor-pointer px-3 py-2 font-body font-black uppercase text-sm tracking-wider flex items-center justify-between ${meta.headerCls}`}>
              <span>{meta.key} — {meta.label}</span>
              <span className="opacity-80">({items.length})</span>
            </summary>
            <div className="p-3 space-y-2">
              {items.map((item) => (
                <SwotIngredientCard
                  key={item.id}
                  ingredient={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSearchEvidence={onEvidenceSearch}
                  onToggleSelect={toggleIngredientSelected}
                  showCheckbox={showCheckbox}
                />
              ))}
              {isAdding ? (
                <div className="border-2 border-ink bg-white p-2 shadow-[3px_3px_0_#2C2B2B]">
                  <textarea
                    autoFocus
                    value={addText}
                    onChange={(e) => setAddText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                        e.preventDefault()
                        commitAdd()
                      }
                      else if (e.key === 'Escape') cancelAdd()
                    }}
                    rows={2}
                    placeholder="Nhập nội dung..."
                    className="w-full border-2 border-ink bg-white px-2 py-1 font-display text-sm text-ink focus:outline-none resize-none"
                  />
                  <div className="mt-1.5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={commitAdd}
                      className="border-2 border-ink bg-ink text-white font-body font-bold uppercase text-[11px] tracking-wider px-2 py-1 hover:bg-accent-brand transition-colors"
                    >
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={cancelAdd}
                      className="border-2 border-ink bg-white p-1 hover:bg-bg-warm transition-colors"
                      aria-label="Hủy"
                    >
                      <X className="w-3.5 h-3.5 text-ink" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setAddingQuadrant(meta.key); setAddText('') }}
                  className="w-full inline-flex items-center justify-center gap-1 border-2 border-dashed border-ink/40 bg-white/50 py-2 font-body font-bold uppercase text-[11px] tracking-wider text-ink hover:bg-white hover:border-ink transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {meta.addLabel}
                </button>
              )}
            </div>
          </details>
        )
      })}
    </div>
  )
}
