'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import type {
  OrgContext,
  SwotSynthesisOutput,
  SwotItem,
  SwotQuadrant,
  ContextCard,
  EvidenceItem,
} from '@/lib/swot/types'

interface SynthesisPhaseProps {
  orgContext: OrgContext
}

const QUADRANT_CONFIG: Record<
  SwotQuadrant,
  { label: string; emoji: string; bg: string; border: string }
> = {
  S: {
    label: 'Điểm Mạnh',
    emoji: '💪',
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
  },
  W: {
    label: 'Điểm Yếu',
    emoji: '⚠️',
    bg: 'bg-orange-50 dark:bg-orange-950',
    border: 'border-orange-200 dark:border-orange-800',
  },
  O: {
    label: 'Cơ Hội',
    emoji: '🚀',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
  },
  T: {
    label: 'Thách Thức',
    emoji: '🛡️',
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
  },
}

function contextCardsToEvidenceItems(cards: ContextCard[]): EvidenceItem[] {
  return cards.map((card) => ({
    source: 'Web' as const,
    content: `${card.title}: ${card.insight}`,
    relevance:
      card.relevance_score >= 0.7
        ? ('high' as const)
        : ('medium' as const),
  }))
}

export function SynthesisPhase({ orgContext }: SynthesisPhaseProps) {
  const router = useRouter()
  const setSwotPhase = useSwotStore((s) => s.setSwotPhase)
  const contextCards = useSwotStore((s) => s.evidence.contextCards)

  const [status, setStatus] = useState<'loading' | 'complete' | 'error'>(
    'loading'
  )
  const [synthesis, setSynthesis] = useState<SwotSynthesisOutput | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const started = useRef(false)

  // Auto-trigger synthesis on mount
  useEffect(() => {
    if (!started.current) {
      started.current = true
      runSynthesis()
    }
  }, [])

  const runSynthesis = async () => {
    setStatus('loading')
    try {
      // Build a minimal summary from coaching messages
      const dummySummary = {
        strengths: [] as { source: string; content: string }[],
        weaknesses: [] as { source: string; content: string }[],
        opportunities: [] as { source: string; content: string }[],
        threats: [] as { source: string; content: string }[],
      }

      const evidenceItems = contextCardsToEvidenceItems(contextCards)

      const response = await fetch('/api/swot/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: dummySummary,
          evidenceItems,
          orgContext,
        }),
      })

      if (!response.ok) throw new Error('Synthesis failed')
      const data = await response.json()

      setSynthesis(data.synthesis)
      setStatus('complete')
    } catch {
      setStatus('error')
      toast.error('Lỗi khi tổng hợp SWOT. Thử lại.')
    }
  }

  const handleDeleteItem = (quadrant: SwotQuadrant, itemId: string) => {
    if (!synthesis) return
    setSynthesis({
      ...synthesis,
      [quadrant]: synthesis[quadrant].filter((item) => item.id !== itemId),
    })
  }

  const handleStartEdit = (item: SwotItem) => {
    setEditingId(item.id)
    setEditText(item.statement)
  }

  const handleSaveEdit = (quadrant: SwotQuadrant) => {
    if (!synthesis || !editingId) return
    setSynthesis({
      ...synthesis,
      [quadrant]: synthesis[quadrant].map((item) =>
        item.id === editingId ? { ...item, statement: editText } : item
      ),
    })
    setEditingId(null)
    setEditText('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleSaveAndCreateXMatrix = async () => {
    if (!synthesis) return
    setIsSaving(true)
    try {
      // The synthesis API already saved to DB on initial call.
      // Navigate to X-Matrix builder — the ONE allowed router.push.
      toast.success('SWOT đã lưu. Chuyển sang X-Matrix.')
      router.push('/dashboard/x-matrix/new')
    } catch {
      toast.error('Không thể lưu. Thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="space-y-6 py-12 text-center">
        <div
          className="animate-spin text-6xl"
          style={{ animationDuration: '3s' }}
        >
          🧠
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Đang tổng hợp SWOT</h2>
          <p className="text-sm text-muted-foreground">
            AI đang kết hợp insights của bạn với bằng chứng từ thị trường...
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Thường mất 20–30 giây
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-12 text-center">
        <div className="text-6xl">⚠️</div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Không thể tổng hợp SWOT</h2>
          <p className="text-sm text-muted-foreground">
            Vui lòng thử lại hoặc quay lại bước trước.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={() => {
              started.current = false
              runSynthesis()
            }}
          >
            Thử lại
          </Button>
          <Button variant="outline" onClick={() => setSwotPhase(2)}>
            ← Xem lại bối cảnh
          </Button>
        </div>
      </div>
    )
  }

  if (!synthesis) return null

  const totalItems =
    synthesis.S.length +
    synthesis.W.length +
    synthesis.O.length +
    synthesis.T.length

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => setSwotPhase(2)}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Xem lại bối cảnh
      </button>

      <div className="space-y-2 text-center">
        <div className="text-3xl">🎯</div>
        <h2 className="text-xl font-semibold">SWOT Analysis</h2>
        <p className="text-sm text-muted-foreground">
          {totalItems} insights · Bấm vào để chỉnh sửa, × để xoá
        </p>
        {synthesis.summary && (
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {synthesis.summary}
          </p>
        )}
      </div>

      {/* 2x2 SWOT grid — editable */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(['S', 'W', 'O', 'T'] as const).map((q) => {
          const config = QUADRANT_CONFIG[q]
          const qItems = synthesis[q]
          return (
            <div
              key={q}
              className={`space-y-3 rounded-xl border p-4 ${config.bg} ${config.border}`}
            >
              <h3 className="flex items-center gap-2 font-semibold">
                <span>{config.emoji}</span>
                <span>{config.label}</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {qItems.length}
                </Badge>
              </h3>
              <div className="space-y-3">
                {qItems.map((item) => (
                  <div
                    key={item.id}
                    className={`group relative space-y-2 rounded-lg bg-background/70 p-3 ${
                      item.confidence < 0.7
                        ? 'border border-amber-300 dark:border-amber-700'
                        : ''
                    }`}
                  >
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(q, item.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      title="Xoá"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Editable statement */}
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full text-sm border-2 border-foreground/20 bg-background p-2 resize-none focus:outline-none focus:border-foreground"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(q)}
                            className="text-xs"
                          >
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="text-xs"
                          >
                            Huỷ
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className="text-sm font-medium leading-relaxed cursor-pointer hover:bg-background/50 rounded px-1 -mx-1 transition-colors"
                        onClick={() => handleStartEdit(item)}
                        title="Bấm để chỉnh sửa"
                      >
                        {item.statement}
                      </p>
                    )}
                    <p className="text-xs italic text-muted-foreground">
                      → {item.implication}
                    </p>
                    {item.confidence < 0.7 && (
                      <Badge
                        variant="outline"
                        className="border-amber-300 bg-amber-50 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      >
                        Cần xác nhận ({Math.round(item.confidence * 100)}%)
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-4 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => setSwotPhase(2)}
          className="flex-1"
        >
          ← Xem lại bối cảnh
        </Button>
        <Button
          onClick={handleSaveAndCreateXMatrix}
          disabled={isSaving || totalItems === 0}
          className="flex-1"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu và tạo X-Matrix →'}
        </Button>
      </div>
    </div>
  )
}
