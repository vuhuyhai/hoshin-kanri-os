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
  CoachingItem,
  EvidenceItemV2,
  SynthesisResult,
} from '@/lib/swot/types'
import type { QuadrantKey, SwotDraft } from '@/lib/swot/coaching-types'

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

const QUADRANT_KEY_TO_CODE: Record<QuadrantKey, SwotQuadrant> = {
  strengths: 'S',
  weaknesses: 'W',
  opportunities: 'O',
  threats: 'T',
}

/** Convert confirmed draft items → CoachingItem[] for synthesis API */
function draftToCoachingItems(draft: SwotDraft): CoachingItem[] {
  const items: CoachingItem[] = []
  for (const [key, quadrant] of Object.entries(QUADRANT_KEY_TO_CODE)) {
    const qKey = key as QuadrantKey
    for (const item of draft[qKey]) {
      items.push({
        id: item.id,
        quadrant,
        text: item.statement,
        source: item.isUserAdded ? 'user_added' : 'ai_extracted',
        framework_source: item.frameworkSource,
        ai_confidence: item.confidence,
      })
    }
  }
  return items
}

/** Convert context cards → EvidenceItemV2[] for synthesis API */
function contextCardsToEvidence(
  cards: { id: string; title: string; insight: string; swot_quadrant: 'O' | 'T'; relevance_score: number }[]
): EvidenceItemV2[] {
  return cards.map((card) => ({
    id: card.id,
    quadrant: card.swot_quadrant,
    text: `${card.title}: ${card.insight}`,
    is_new_discovery: true,
    source_name: 'AI Context Analysis',
    confidence: card.relevance_score >= 0.7 ? 'high' as const : 'medium' as const,
    credibility_score: Math.round(card.relevance_score * 10),
  }))
}

/** Convert SynthesisResult → SwotSynthesisOutput for UI rendering */
function synthesisResultToOutput(result: SynthesisResult): SwotSynthesisOutput {
  const output: SwotSynthesisOutput = { S: [], W: [], O: [], T: [], summary: '' }
  for (const item of result.swot_items) {
    const swotItem: SwotItem = {
      id: item.id,
      statement: item.statement,
      implication: item.implication,
      confidence: Math.min(1, Math.max(0, (item.credibility_score ?? 5) / 10)),
      framework_source: item.evidence_source,
    }
    output[item.quadrant].push(swotItem)
  }
  const { stats } = result
  output.summary = `Tổng hợp ${stats.total_input} inputs → ${stats.total_output} items (${stats.merged_count} merged, ${stats.discarded_count} loại bỏ)`
  return output
}

/** Rebuild SwotSynthesisOutput from store items (for cached display) */
function storeItemsToOutput(
  items: import('@/lib/swot/swot-session-store').SwotItem[],
): SwotSynthesisOutput {
  const output: SwotSynthesisOutput = { S: [], W: [], O: [], T: [], summary: '' }
  for (const item of items) {
    output[item.category as SwotQuadrant]?.push({
      id: item.id,
      statement: item.statement,
      implication: item.implication,
      confidence: 0.8,
      framework_source: undefined,
    })
  }
  output.summary = `${items.length} insights từ phân tích trước đó`
  return output
}

export function SynthesisPhase({ orgContext }: SynthesisPhaseProps) {
  const router = useRouter()
  const setSwotPhase = useSwotStore((s) => s.setSwotPhase)
  const contextCards = useSwotStore((s) => s.evidence.contextCards)
  const confirmedDraft = useSwotStore((s) => s.confirmedDraft)
  const setSynthesisItems = useSwotStore((s) => s.setSynthesisItems)
  const completeSynthesis = useSwotStore((s) => s.completeSynthesis)
  const synthesisStatus = useSwotStore((s) => s.synthesis.status)
  const existingItems = useSwotStore((s) => s.synthesis.items)

  // If synthesis already completed in store, show cached results
  const hasCachedSynthesis = synthesisStatus === 'completed' && existingItems.length > 0

  const [status, setStatus] = useState<'loading' | 'complete' | 'error'>(
    hasCachedSynthesis ? 'complete' : 'loading'
  )
  const [synthesis, setSynthesis] = useState<SwotSynthesisOutput | null>(
    hasCachedSynthesis ? storeItemsToOutput(existingItems) : null
  )
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const started = useRef(hasCachedSynthesis)

  // Auto-trigger synthesis once confirmedDraft is available — skip if already completed
  useEffect(() => {
    if (!started.current && confirmedDraft) {
      started.current = true
      runSynthesis()
    }
  }, [confirmedDraft])

  const runSynthesis = async () => {
    setStatus('loading')

    // Guard: need coaching data to synthesize
    if (!confirmedDraft) {
      toast.error('Chưa có dữ liệu coaching. Quay lại bước 1.')
      setStatus('error')
      return
    }

    try {
      const coachingItems = draftToCoachingItems(confirmedDraft)
      const evidenceItems = contextCardsToEvidence(contextCards)

      const response = await fetch('/api/swot/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: orgContext.orgId,
          coaching_items: coachingItems,
          evidence_items: evidenceItems,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error || 'Synthesis failed')
      }

      // API returns flat SynthesisResult, not { synthesis: ... }
      const data: SynthesisResult = await response.json()
      const output = synthesisResultToOutput(data)

      setSynthesis(output)
      setStatus('complete')
    } catch (err) {
      console.error('[SynthesisPhase] error:', err)
      setStatus('error')
      toast.error(
        err instanceof Error ? err.message : 'Lỗi khi tổng hợp SWOT. Thử lại.'
      )
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

  const handleSaveAndContinue = async () => {
    if (!synthesis) return
    setIsSaving(true)
    try {
      // Convert SwotSynthesisOutput → store SwotItem[] format
      const storeItems = (['S', 'W', 'O', 'T'] as const).flatMap((q) =>
        synthesis[q].map((item) => ({
          id: item.id,
          category: q as import('@/lib/swot/swot-session-store').SwotCategory,
          statement: item.statement,
          evidence: { ceoInput: [], webSources: [] },
          implication: item.implication,
          rootCause: '',
          priority: 1 as const,
        }))
      )
      setSynthesisItems(storeItems)
      completeSynthesis()
      toast.success('SWOT đã lưu. Chuyển sang Strategy.')
      router.push('/dashboard/discovery/swot/strategy')
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
          onClick={handleSaveAndContinue}
          disabled={isSaving || totalItems === 0}
          className="flex-1"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu và tiếp tục →'}
        </Button>
      </div>
    </div>
  )
}
