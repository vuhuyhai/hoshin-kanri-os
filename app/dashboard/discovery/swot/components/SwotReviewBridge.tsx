'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import type { CoachingItem } from '@/lib/swot/types'

interface SwotReviewBridgeProps {
  items: CoachingItem[]
  onConfirm: (confirmedItems: CoachingItem[]) => void
  isLoading?: boolean
}

const Q_CONFIG = {
  S: { label: '💪 Điểm mạnh', text: 'text-green-700', bg: 'bg-green-50' },
  W: { label: '⚠️ Điểm yếu', text: 'text-orange-700', bg: 'bg-orange-50' },
  O: { label: '🚀 Cơ hội', text: 'text-blue-700', bg: 'bg-blue-50' },
  T: { label: '🛡️ Thách thức', text: 'text-red-700', bg: 'bg-red-50' },
} as const

export default function SwotReviewBridge({ items, onConfirm, isLoading }: SwotReviewBridgeProps) {
  const [localItems, setLocalItems] = useState<CoachingItem[]>(() => [...items])
  const [selectedIds, setSelectedIds] = useState(() => new Set(items.map((i) => i.id)))
  const [editedIds, setEditedIds] = useState(() => new Set<string>())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddingManual, setIsAddingManual] = useState(false)
  const [manualText, setManualText] = useState('')
  const [manualQuadrant, setManualQuadrant] = useState<'S' | 'W' | 'O' | 'T'>('S')

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const editItemText = (id: string, newText: string) => {
    setLocalItems((prev) => prev.map((i) => (i.id === id ? { ...i, text: newText } : i)))
    setEditedIds((prev) => new Set(prev).add(id))
    setEditingId(null)
  }

  const addManualItem = () => {
    if (!manualText.trim()) return
    const newItem: CoachingItem = {
      id: crypto.randomUUID(),
      quadrant: manualQuadrant,
      text: manualText.trim(),
      source: 'user_added',
    }
    setLocalItems((prev) => [...prev, newItem])
    setSelectedIds((prev) => new Set(prev).add(newItem.id))
    setManualText('')
    setIsAddingManual(false)
  }

  const handleConfirm = () => {
    const confirmed = localItems
      .filter((i) => selectedIds.has(i.id))
      .map((i) => (editedIds.has(i.id) ? { ...i, source: 'ai_extracted_edited' as const } : i))
    onConfirm(confirmed)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-bg-warm">
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-ink">Xem lại nguyên liệu SWOT</h2>
        <p className="text-muted-foreground mt-1">
          AI đã trích xuất từ cuộc hội thoại của bạn.
          Bỏ chọn item không phù hợp, chỉnh sửa nếu cần, rồi xác nhận.
        </p>
        <Badge variant="secondary" className="mt-2">{localItems.length} nguyên liệu</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-24">
        {(['S', 'W', 'O', 'T'] as const).map((q) => {
          const cfg = Q_CONFIG[q]
          const qItems = localItems.filter((i) => i.quadrant === q)
          return (
            <Card key={q} className={`border-2 shadow-brutal-sm rounded-none ${cfg.bg}`}>
              <CardHeader>
                <CardTitle className={`${cfg.text} font-heading`}>
                  {cfg.label} ({qItems.filter((i) => selectedIds.has(i.id)).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {qItems.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Chưa có item nào</p>
                )}
                {qItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    checked={selectedIds.has(item.id)}
                    wasEdited={editedIds.has(item.id)}
                    isEditing={editingId === item.id}
                    onToggle={() => toggleItem(item.id)}
                    onStartEdit={() => setEditingId(item.id)}
                    onSaveEdit={(text) => editItemText(item.id, text)}
                  />
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {isAddingManual && (
        <div className="border-2 border-ink p-4 mb-24 bg-white space-y-3 shadow-brutal-sm">
          <div className="flex gap-3">
            <select value={manualQuadrant} onChange={(e) => setManualQuadrant(e.target.value as 'S' | 'W' | 'O' | 'T')} className="border-2 border-ink px-2 py-1 font-heading text-sm bg-white">
              <option value="S">Điểm mạnh (S)</option><option value="W">Điểm yếu (W)</option>
              <option value="O">Cơ hội (O)</option><option value="T">Thách thức (T)</option>
            </select>
            <input value={manualText} onChange={(e) => setManualText(e.target.value)} placeholder="Nhập nội dung..." className="border-2 border-ink px-3 py-1 flex-1 text-sm" onKeyDown={(e) => e.key === 'Enter' && addManualItem()} autoFocus />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addManualItem}>Thêm</Button>
            <Button variant="outline" size="sm" onClick={() => setIsAddingManual(false)}>Huỷ</Button>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-bg-warm border-t-2 border-ink py-4 px-6 flex items-center justify-between z-10">
        <span className="font-bold text-sm text-ink">
          Đã chọn {selectedIds.size}/{localItems.length}
        </span>
        <Button variant="outline" onClick={() => setIsAddingManual(!isAddingManual)}>
          ＋ Thêm thủ công
        </Button>
        <Button onClick={handleConfirm} disabled={selectedIds.size === 0 || isLoading}>
          {isLoading ? (
            <><Loader2 className="size-4 animate-spin" /> Đang xử lý...</>
          ) : (
            'Xác nhận & Tiếp tục →'
          )}
        </Button>
      </div>
    </div>
  )
}

function ItemRow({ item, checked, wasEdited, isEditing, onToggle, onStartEdit, onSaveEdit }: {
  item: CoachingItem; checked: boolean; wasEdited: boolean; isEditing: boolean
  onToggle: () => void; onStartEdit: () => void; onSaveEdit: (text: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [editText, setEditText] = useState(item.text)
  const isLow = item.ai_confidence === 'low'
  const source = wasEdited ? 'ai_extracted_edited' : item.source
  useEffect(() => { if (isEditing) { setEditText(item.text); ref.current?.focus() } }, [isEditing, item.text])

  const sourceBadge = source === 'ai_extracted'
    ? <Badge className="bg-purple-100 text-purple-700 text-[10px] h-4">AI</Badge>
    : source === 'user_added'
    ? <Badge className="bg-gray-100 text-gray-700 text-[10px] h-4">Bạn thêm</Badge>
    : <Badge className="bg-yellow-100 text-yellow-700 text-[10px] h-4">AI · Đã sửa</Badge>

  return (
    <div className={`flex items-start gap-2 p-2 border-2 ${isLow ? 'border-dashed border-orange-400' : 'border-solid border-ink/20'} bg-white/60`}>
      <Checkbox checked={checked} onCheckedChange={() => onToggle()} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <textarea ref={ref} value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={() => onSaveEdit(editText)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSaveEdit(editText) } }} rows={2} className="w-full text-sm border-2 border-ink px-2 py-1 resize-none" />
        ) : (
          <p className="text-sm cursor-pointer hover:bg-yellow-50 px-1 -mx-1" onClick={onStartEdit}>{item.text}</p>
        )}
        <div className="flex gap-1 mt-1 flex-wrap">
          {sourceBadge}
          {isLow && <Badge variant="outline" className="border-dashed border-orange-400 text-orange-600 text-[10px] h-4">Cần xác nhận</Badge>}
        </div>
      </div>
    </div>
  )
}
