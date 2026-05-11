'use client'

import type { ComponentType, CSSProperties } from 'react'
import { X, Zap, AlertTriangle, TrendingUp, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SwotItem, SwotQuadrant } from '@/lib/swot/types'

type IconComp = ComponentType<{ className?: string; style?: CSSProperties }>

const QUADRANT_CONFIG: Record<
  SwotQuadrant,
  { label: string; Icon: IconComp; accent: string }
> = {
  S: { label: 'Điểm Mạnh', Icon: Zap, accent: '#10b981' },
  W: { label: 'Điểm Yếu', Icon: AlertTriangle, accent: '#f59e0b' },
  O: { label: 'Cơ Hội', Icon: TrendingUp, accent: '#2563eb' },
  T: { label: 'Thách Thức', Icon: Shield, accent: '#c73937' },
}

interface SynthesisQuadrantCardProps {
  quadrant: SwotQuadrant
  items: SwotItem[]
  editingId: string | null
  editText: string
  onStartEdit: (item: SwotItem) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditTextChange: (value: string) => void
  onDelete: (itemId: string) => void
}

export function SynthesisQuadrantCard({
  quadrant,
  items,
  editingId,
  editText,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onDelete,
}: SynthesisQuadrantCardProps) {
  const config = QUADRANT_CONFIG[quadrant]
  const Icon = config.Icon

  return (
    <div
      className="space-y-3 bg-card border-2 border-ink p-4"
      style={{
        boxShadow: '4px 4px 0 #2C2B2B',
        borderLeft: `8px solid ${config.accent}`,
      }}
    >
      <h3 className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: config.accent }} />
        <span className="font-display font-black uppercase text-ink">
          {config.label}
        </span>
        <span className="ml-auto font-display font-bold text-xs px-2 py-0.5 border-2 border-ink bg-card text-ink">
          {items.length}
        </span>
      </h3>
      <div className="space-y-3">
        {items.map((item) => {
          const lowConfidence = item.confidence < 0.7
          const isEditing = editingId === item.id
          return (
            <div
              key={item.id}
              className="group relative space-y-2 bg-card border-2 p-3"
              style={{
                borderColor: lowConfidence ? '#f59e0b' : '#2C2B2B',
                boxShadow: '2px 2px 0 #2C2B2B',
              }}
            >
              <button
                onClick={() => onDelete(item.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-text-3 hover:text-destructive"
                title="Xoá"
              >
                <X className="w-4 h-4" />
              </button>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => onEditTextChange(e.target.value)}
                    className="w-full font-body text-sm border-2 border-ink bg-card p-2 resize-none focus:outline-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={onSaveEdit} className="text-xs">
                      Lưu
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onCancelEdit}
                      className="text-xs"
                    >
                      Huỷ
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className="font-body text-sm font-medium leading-relaxed text-ink cursor-pointer hover:bg-bg-warm transition-colors"
                  onClick={() => onStartEdit(item)}
                  title="Bấm để chỉnh sửa"
                >
                  {item.statement}
                </p>
              )}
              <p className="font-body text-xs italic text-text-3">
                → {item.implication}
              </p>
              {lowConfidence && (
                <span className="inline-block font-display font-bold text-[10px] uppercase px-2 py-0.5 border-2 border-ink bg-kpi-attention-strong text-white">
                  Cần xác nhận ({Math.round(item.confidence * 100)}%)
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
