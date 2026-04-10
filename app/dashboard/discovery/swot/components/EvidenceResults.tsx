'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CoachingItem, EvidenceResult, EvidenceItemV2 } from '@/lib/swot/types'

interface EvidenceResultsProps {
  validated: Array<{ item: CoachingItem; evidence: EvidenceResult }>
  not_found: string[]
  cache_hits: number
  onContinue: (evidenceItems: EvidenceItemV2[]) => void
}

const Q_COLORS = {
  S: 'bg-green-100 text-green-700',
  W: 'bg-orange-100 text-orange-700',
  O: 'bg-blue-100 text-blue-700',
  T: 'bg-red-100 text-red-700',
} as const

const CONF = {
  high: { label: 'Cao', cls: 'bg-green-100 text-green-700' },
  medium: { label: 'Trung bình', cls: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Thấp', cls: 'bg-orange-100 text-orange-700' },
  not_found: { label: 'N/A', cls: 'bg-gray-100 text-gray-500' },
} as const

export default function EvidenceResults({ validated, not_found, cache_hits, onContinue }: EvidenceResultsProps) {
  const [showNotFound, setShowNotFound] = useState(false)

  const handleContinue = () => {
    const evidenceItems: EvidenceItemV2[] = validated.map((v) => ({
      id: crypto.randomUUID(),
      quadrant: v.item.quadrant,
      text: v.item.text,
      is_new_discovery: false,
      evidence_text: v.evidence.evidence_text,
      data_point: v.evidence.data_point,
      source_name: v.evidence.source_name,
      source_url: v.evidence.source_url,
      published_year: v.evidence.published_year,
      confidence: v.evidence.confidence,
      credibility_score: v.evidence.credibility_score,
    }))
    onContinue(evidenceItems)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex gap-4 border-b-2 border-ink pb-4 flex-wrap">
        <span className="text-green-700 font-bold text-sm">✅ {validated.length} xác minh được</span>
        {not_found.length > 0 && <span className="text-orange-600 font-bold text-sm">❓ {not_found.length} chưa tìm thấy</span>}
        {cache_hits > 0 && <span className="text-blue-600 font-bold text-sm">⚡ {cache_hits} từ cache</span>}
      </div>

      <div className="space-y-3">
        <h3 className="font-heading text-lg font-bold text-ink">Đã xác minh</h3>
        {validated.map((v) => {
          const conf = CONF[v.evidence.confidence]
          return (
            <Card key={v.item.id} className="border-2 shadow-brutal-sm rounded-none">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${Q_COLORS[v.item.quadrant]} text-xs h-5`}>{v.item.quadrant}</Badge>
                    <span className="font-medium text-sm">{v.item.text}</span>
                  </div>
                  <Badge className={`${conf.cls} text-xs h-5`}>{conf.label}</Badge>
                </div>
                {v.evidence.evidence_text && <p className="text-sm">📊 {v.evidence.evidence_text}</p>}
                {v.evidence.data_point && <p className="text-sm font-bold">🔢 {v.evidence.data_point}</p>}
                {v.evidence.source_name && (
                  <p className="text-xs text-muted-foreground">
                    🔗{' '}
                    {v.evidence.source_url ? (
                      <a href={v.evidence.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
                        {v.evidence.source_name}
                      </a>
                    ) : v.evidence.source_name}
                    {v.evidence.published_year && ` · ${v.evidence.published_year}`}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {not_found.length > 0 && (
        <div className="border-2 border-dashed border-orange-300 p-4">
          <button onClick={() => setShowNotFound(!showNotFound)} className="font-heading text-sm font-bold text-orange-700 w-full text-left">
            {showNotFound ? '▼' : '▶'} Chưa tìm thấy bằng chứng ({not_found.length})
          </button>
          {showNotFound && (
            <div className="mt-3 space-y-1">
              {not_found.map((text, i) => <p key={i} className="text-sm">❓ {text}</p>)}
              <p className="text-xs text-muted-foreground mt-2 italic">
                Các nguyên liệu này vẫn được giữ lại dựa trên đánh giá của bạn trong bước trước
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t-2 border-ink">
        <Button onClick={handleContinue}>Sang bước Tổng hợp →</Button>
      </div>
    </div>
  )
}
