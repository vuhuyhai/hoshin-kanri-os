'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import type { SynthesizedSwotItem, SynthesisResult } from '@/lib/swot/types'

interface SynthesisReviewGridProps {
  result: SynthesisResult
  onConfirm: (finalItems: SynthesizedSwotItem[]) => void
  isLoading?: boolean
}

const Q_CFG = {
  S: { label: '💪 Điểm mạnh', border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700' },
  W: { label: '⚠️ Điểm yếu', border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' },
  O: { label: '🚀 Cơ hội', border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' },
  T: { label: '🛡️ Thách thức', border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-700' },
} as const

function priorityColor(p: number) { return p <= 2 ? 'bg-red-500' : p === 3 ? 'bg-yellow-500' : 'bg-green-500' }
function credColor(s: number) { return s >= 8 ? 'text-green-700' : s >= 5 ? 'text-yellow-700' : 'text-red-700' }

export default function SynthesisReviewGrid({ result, onConfirm, isLoading }: SynthesisReviewGridProps) {
  const [items, setItems] = useState<SynthesizedSwotItem[]>(() => [...result.swot_items])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<SynthesizedSwotItem>>({})

  const startEdit = (item: SynthesizedSwotItem) => { setEditingId(item.id); setEditDraft({ ...item }) }
  const cancelEdit = () => { setEditingId(null); setEditDraft({}) }

  const saveEdit = () => {
    if (!editingId) return
    setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...editDraft } as SynthesizedSwotItem : i)))
    setEditingId(null); setEditDraft({})
  }

  const deleteItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  const addItem = (quadrant: 'S' | 'W' | 'O' | 'T') => {
    const newItem: SynthesizedSwotItem = {
      id: crypto.randomUUID(), quadrant, statement: '', evidence: '',
      implication: '', priority: 3, credibility_score: 5,
    }
    setItems((prev) => [...prev, newItem])
    startEdit(newItem)
  }

  const { stats } = result

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-ink">Kết quả Tổng hợp SWOT</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {stats.total_output} items · {stats.merged_count} đã gộp · {stats.discarded_count} đã loại
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['S', 'W', 'O', 'T'] as const).map((q) => {
          const cfg = Q_CFG[q]
          const qItems = items.filter((i) => i.quadrant === q)
          return (
            <div key={q} className={`border-2 shadow-brutal-sm ${cfg.bg}`}>
              <div className={`border-b-2 ${cfg.border} px-4 py-3 flex items-center justify-between`}>
                <span className={`font-heading font-bold ${cfg.text}`}>{cfg.label} ({qItems.length})</span>
                <button onClick={() => addItem(q)} className={`text-xs font-bold ${cfg.text} hover:underline`}>＋ Thêm</button>
              </div>
              <div className="p-3 space-y-2">
                {qItems.length === 0 && <p className="text-sm text-muted-foreground italic">Chưa có item</p>}
                {qItems.map((item) => (
                  editingId === item.id ? (
                    <EditForm key={item.id} draft={editDraft} onChange={setEditDraft} onSave={saveEdit} onCancel={cancelEdit} />
                  ) : (
                    <ItemCard key={item.id} item={item} onEdit={() => startEdit(item)} onDelete={() => deleteItem(item.id)} />
                  )
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end pt-4 border-t-2 border-ink">
        <Button onClick={() => onConfirm(items)} disabled={items.length === 0 || isLoading}>
          {isLoading ? <><Loader2 className="size-4 animate-spin" /> Đang xử lý...</> : 'Xác nhận SWOT →'}
        </Button>
      </div>
    </div>
  )
}

function ItemCard({ item, onEdit, onDelete }: {
  item: SynthesizedSwotItem; onEdit: () => void; onDelete: () => void
}) {
  return (
    <div className="border-2 border-ink/15 bg-white p-3 space-y-1.5 relative">
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 size-2.5 rounded-full shrink-0 ${priorityColor(item.priority)}`} />
        <p className="font-medium text-sm flex-1">{item.statement}</p>
      </div>
      <div className="pl-4.5 space-y-1">
        <p className="text-sm">📊 {item.evidence}</p>
        {item.evidence_source && (
          <p className="text-xs text-muted-foreground">
            {item.evidence_source}{item.evidence_year ? ` · ${item.evidence_year}` : ''}
            <Badge className={`ml-2 bg-gray-100 text-xs h-4 ${credColor(item.credibility_score)}`}>
              {item.credibility_score}/10
            </Badge>
          </p>
        )}
        <p className="text-sm text-muted-foreground">→ {item.implication}</p>
      </div>
      <div className="flex justify-end gap-1 pt-1">
        <Button variant="ghost" size="xs" onClick={onEdit}>✏️ Sửa</Button>
        <Button variant="ghost" size="xs" onClick={onDelete} className="text-red-600 hover:text-red-700">🗑️ Xoá</Button>
      </div>
    </div>
  )
}

function EditForm({ draft, onChange, onSave, onCancel }: {
  draft: Partial<SynthesizedSwotItem>
  onChange: (d: Partial<SynthesizedSwotItem>) => void
  onSave: () => void; onCancel: () => void
}) {
  const set = (field: keyof SynthesizedSwotItem, value: string | number) => onChange({ ...draft, [field]: value })
  return (
    <div className="border-2 border-ink bg-white p-3 space-y-2">
      <textarea value={draft.statement ?? ''} onChange={(e) => set('statement', e.target.value)} placeholder="Nhận định..." rows={2} className="w-full text-sm border-2 border-ink/30 px-2 py-1 resize-none" />
      <textarea value={draft.evidence ?? ''} onChange={(e) => set('evidence', e.target.value)} placeholder="Bằng chứng..." rows={2} className="w-full text-sm border-2 border-ink/30 px-2 py-1 resize-none" />
      <textarea value={draft.implication ?? ''} onChange={(e) => set('implication', e.target.value)} placeholder="Hàm ý chiến lược..." rows={2} className="w-full text-sm border-2 border-ink/30 px-2 py-1 resize-none" />
      <div className="flex items-center gap-2">
        <label className="text-xs font-heading font-bold">Ưu tiên:</label>
        <select value={draft.priority ?? 3} onChange={(e) => set('priority', Number(e.target.value))} className="border-2 border-ink/30 px-2 py-0.5 text-sm">
          {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>P{p}</option>)}
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" onClick={onSave}>Lưu</Button>
        <Button variant="outline" size="sm" onClick={onCancel}>Huỷ</Button>
      </div>
    </div>
  )
}
