'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { HoshinCandidate } from '@/lib/swot/types'

interface HoshinCandidateListProps {
  candidates: HoshinCandidate[]
  aiRecommendation: string
  onSelect: (selectedRanks: number[]) => Promise<void>
  onProceed: () => void
  isLoading?: boolean
}

const TYPE_BADGE = {
  SO: 'bg-green-100 text-green-800',
  ST: 'bg-blue-100 text-blue-800',
  WO: 'bg-orange-100 text-orange-800',
  WT: 'bg-red-100 text-red-800',
} as const

const TIMEFRAME: Record<string, string> = { '90_days': '90 ngày', '6_months': '6 tháng', '12_months': '12 tháng' }

export default function HoshinCandidateList({ candidates, aiRecommendation, onSelect, onProceed, isLoading }: HoshinCandidateListProps) {
  const [selectedRanks, setSelectedRanks] = useState<number[]>(() =>
    candidates.filter((c) => c.selected).map((c) => c.rank)
  )
  const [showRec, setShowRec] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedSelect = useCallback((ranks: number[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setIsSaving(true)
      try { await onSelect(ranks) } finally { setIsSaving(false) }
    }, 500)
  }, [onSelect])

  const toggleCandidate = (rank: number) => {
    setSelectedRanks((prev) => {
      if (prev.includes(rank)) {
        const next = prev.filter((r) => r !== rank)
        debouncedSelect(next)
        return next
      }
      if (prev.length >= 5) {
        toast.error('Hoshin Kanri giới hạn tối đa 5 mục tiêu đột phá')
        return prev
      }
      const next = [...prev, rank]
      debouncedSelect(next)
      return next
    })
  }

  const countColor = selectedRanks.length < 3 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-ink">Chọn Hoshin cho X-Matrix</h2>
        <p className="text-sm text-muted-foreground mt-1">Hoshin Kanri giới hạn tối đa 5 mục tiêu đột phá</p>
        <div className="flex items-center gap-3 mt-2">
          <Badge className={`${countColor} text-xs`}>Đã chọn {selectedRanks.length}/5</Badge>
          {isSaving && <span className="text-xs text-muted-foreground animate-pulse">Đang lưu...</span>}
        </div>
      </div>

      <button onClick={() => setShowRec(!showRec)} className="text-sm text-blue-600 hover:underline font-medium">
        🤖 Tại sao AI chọn vậy?
      </button>
      {showRec && (
        <div className="bg-blue-50 border-2 border-blue-200 p-4 text-sm italic text-blue-800">{aiRecommendation}</div>
      )}

      <div className="space-y-3">
        {candidates.map((c) => {
          const isSelected = selectedRanks.includes(c.rank)
          return (
            <div
              key={c.rank}
              className={`p-4 transition-all ${
                isSelected ? 'border-2 border-ink shadow-brutal-sm bg-bg-warm' : 'border border-gray-200 bg-white opacity-70'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Checkbox checked={isSelected} onCheckedChange={() => toggleCandidate(c.rank)} />
                <Badge className="bg-ink text-bg-warm text-xs h-5">#{c.rank}</Badge>
                <Badge className={`${TYPE_BADGE[c.type]} text-xs h-5`}>{c.type}</Badge>
                <Badge className="bg-gray-100 text-xs h-5">{c.score.toFixed(1)}/10</Badge>
              </div>
              <p className="font-semibold text-base mb-1">{c.title}</p>
              <p className="text-sm text-muted-foreground mb-2">{c.rationale}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Impact {c.score_breakdown.impact} · Feasibility {c.score_breakdown.feasibility} · Evidence {c.score_breakdown.evidence}</span>
                <span>⏱ {TIMEFRAME[c.timeframe] ?? c.timeframe}</span>
                <span>📊 KPI: {c.kpi_suggestion}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t-2 border-ink">
        <Button onClick={onProceed} disabled={selectedRanks.length === 0 || isLoading}>
          {isLoading ? <><Loader2 className="size-4 animate-spin" /> Đang xử lý...</> : 'Đưa vào X-Matrix →'}
        </Button>
      </div>
    </div>
  )
}
