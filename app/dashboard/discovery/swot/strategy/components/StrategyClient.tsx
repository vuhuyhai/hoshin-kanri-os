'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExtendedSwotMatrix } from '@/components/swot/ExtendedSwotMatrix'
import {
  useSwotStore,
  type SwotItem,
  type SwotCategory,
  type ExtendedCellType,
  type HoshinCandidate,
} from '@/lib/swot/swot-session-store'
import { cn } from '@/lib/utils'

interface StrategyClientProps {
  orgId: string
  orgContext: { name: string; industry: string; headcount: number }
}

const CATEGORY_CONFIG: Record<
  SwotCategory,
  { label: string; chipClass: string }
> = {
  S: {
    label: 'Strengths',
    chipClass: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  },
  W: {
    label: 'Weaknesses',
    chipClass: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
  O: {
    label: 'Opportunities',
    chipClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  T: {
    label: 'Threats',
    chipClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  },
}

export function StrategyClient({ orgId, orgContext }: StrategyClientProps) {
  const router = useRouter()
  const started = useRef(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [isGeneratingCandidates, setIsGeneratingCandidates] = useState(false)

  const isLoading = useSwotStore((s) => s.isLoading)
  const synthesis = useSwotStore((s) => s.synthesis)
  const strategy = useSwotStore((s) => s.strategy)
  const initSession = useSwotStore((s) => s.initSession)
  const setHoshinCandidates = useSwotStore((s) => s.setHoshinCandidates)
  const toggleCandidateForXMatrix = useSwotStore(
    (s) => s.toggleCandidateForXMatrix
  )
  const completeStrategy = useSwotStore((s) => s.completeStrategy)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      initSession(orgId)
    }
  }, [orgId, initSession])

  const items = synthesis.items
  const matrix = strategy.matrix
  const candidates = strategy.candidates

  // All 4 cells have selected strategy?
  const allCellsSelected =
    !!matrix.SO.selectedStrategy &&
    !!matrix.ST.selectedStrategy &&
    !!matrix.WO.selectedStrategy &&
    !!matrix.WT.selectedStrategy

  // Generate candidates when all cells selected and no candidates yet
  const handleGenerateCandidates = async () => {
    setIsGeneratingCandidates(true)
    try {
      const res = await fetch('/api/swot/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'synthesize_candidates',
          selectedStrategies: {
            SO: matrix.SO.selectedStrategy ?? '',
            ST: matrix.ST.selectedStrategy ?? '',
            WO: matrix.WO.selectedStrategy ?? '',
            WT: matrix.WT.selectedStrategy ?? '',
          },
          allSwotItems: items,
          orgContext,
        }),
      })
      if (!res.ok) throw new Error('API error')
      const { candidates: result } = (await res.json()) as {
        candidates: HoshinCandidate[]
      }
      setHoshinCandidates(result)
      toast.success(`${result.length} Hoshin Candidates đã được tạo`)
    } catch {
      toast.error('Không thể tạo Hoshin Candidates')
    } finally {
      setIsGeneratingCandidates(false)
    }
  }

  const selectedCount = candidates.filter(
    (c) => c.isSelectedForXMatrix
  ).length

  const handleComplete = () => {
    if (selectedCount === 0) return
    completeStrategy()
    toast.success('Hoshin Strategy hoàn thành!')
    router.push('/dashboard/discovery/swot')
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 border bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (synthesis.status !== 'completed') {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-5xl">⚠️</p>
        <h2 className="text-lg font-bold">
          Cần hoàn thành Tổng hợp SWOT trước
        </h2>
        <Button
          onClick={() => router.push('/dashboard/discovery/swot')}
          variant="outline"
        >
          ← Về SWOT Hub
        </Button>
      </div>
    )
  }

  // Group items by category
  const grouped: Record<SwotCategory, SwotItem[]> = { S: [], W: [], O: [], T: [] }
  for (const item of items) {
    grouped[item.category].push(item)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard/discovery/swot')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 block"
        >
          ← Phân tích SWOT
        </button>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">
              Hoshin Strategy — Extended SWOT
            </h1>
            <p className="text-sm text-muted-foreground">
              Kết hợp nội tại và ngoại cảnh để xác định định hướng chiến lược
            </p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            Bước 4/4
          </Badge>
        </div>
      </div>

      {/* Section 1 — SWOT Summary (collapsible) */}
      <div className="border">
        <button
          onClick={() => setSummaryOpen(!summaryOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        >
          <span className="text-sm font-semibold">
            SWOT Summary ({items.length} items)
          </span>
          <span className="text-xs text-muted-foreground">
            {summaryOpen ? 'Thu gọn ▲' : 'Mở rộng ▼'}
          </span>
        </button>
        {summaryOpen && (
          <div className="px-4 pb-4 space-y-3 border-t">
            {(['S', 'W', 'O', 'T'] as SwotCategory[]).map((cat) => (
              <div key={cat} className="space-y-1">
                <span
                  className={cn(
                    'text-[10px] font-display font-bold uppercase tracking-wider px-1.5 py-0.5 inline-block',
                    CATEGORY_CONFIG[cat].chipClass
                  )}
                >
                  {CATEGORY_CONFIG[cat].label} ({grouped[cat].length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {grouped[cat].map((item) => (
                    <span
                      key={item.id}
                      className={cn(
                        'text-xs px-2 py-1',
                        CATEGORY_CONFIG[cat].chipClass
                      )}
                    >
                      {item.statement.slice(0, 50)}
                      {item.statement.length > 50 ? '...' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2 — Extended SWOT Matrix */}
      <ExtendedSwotMatrix items={items} orgContext={orgContext} />

      {/* Generate candidates CTA */}
      {allCellsSelected && candidates.length === 0 && (
        <div className="text-center py-4">
          <Button
            onClick={handleGenerateCandidates}
            disabled={isGeneratingCandidates}
            size="lg"
            className="font-display text-xs font-semibold uppercase tracking-wider"
          >
            {isGeneratingCandidates
              ? 'AI đang tạo Hoshin Candidates...'
              : 'Tạo Hoshin Candidates →'}
          </Button>
        </div>
      )}

      {/* Section 3 — Hoshin Candidates */}
      {candidates.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">
              Hoshin Candidates cho X-Matrix
            </h2>
            <p className="text-sm text-muted-foreground">
              AI tổng hợp 4 ô thành {candidates.length} Hoshin Candidates. Bạn
              review và chọn những candidates sẽ vào X-Matrix.
            </p>
          </div>

          <div className="space-y-3">
            {candidates.map((c) => (
              <div
                key={c.id}
                className={cn(
                  'border p-4 space-y-2 transition-all',
                  c.priority === 1 && 'border-yellow-500 border-2',
                  c.isSelectedForXMatrix && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {c.priority === 1 && '★ '}P{c.priority}
                  </Badge>
                  <span
                    className={cn(
                      'text-[10px] font-display font-bold uppercase tracking-wider px-1.5 py-0.5',
                      {
                        'bg-green-100 text-green-700':
                          c.sourceCellType === 'SO',
                        'bg-blue-100 text-blue-700':
                          c.sourceCellType === 'ST',
                        'bg-yellow-100 text-yellow-700':
                          c.sourceCellType === 'WO',
                        'bg-red-100 text-red-700': c.sourceCellType === 'WT',
                      }
                    )}
                  >
                    {c.sourceCellType}
                  </span>
                  {c.sourceCellType === 'WT' && (
                    <span className="text-[10px] font-bold text-red-600">
                      Ưu tiên
                    </span>
                  )}
                </div>

                <p className="font-semibold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.description}
                </p>

                {c.suggestedKpis.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.suggestedKpis.map((kpi, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground"
                      >
                        {kpi}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => toggleCandidateForXMatrix(c.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 border text-sm font-medium transition-all',
                    c.isSelectedForXMatrix
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {c.isSelectedForXMatrix
                    ? '✓ Đã thêm vào X-Matrix'
                    : 'Thêm vào X-Matrix'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 4 — CTA Footer */}
      {candidates.length > 0 && (
        <div className="sticky bottom-0 bg-background border-t py-4 flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedCount}/{candidates.length} candidates đã chọn cho X-Matrix
          </span>
          <Button
            onClick={handleComplete}
            disabled={selectedCount === 0}
            className="font-display text-xs font-semibold uppercase tracking-wider"
          >
            Hoàn thành →
          </Button>
        </div>
      )}
    </div>
  )
}
