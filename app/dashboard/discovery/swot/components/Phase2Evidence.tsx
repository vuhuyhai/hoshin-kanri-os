'use client'

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'
import type {
  CoachingSummary,
  OrgContext,
  SearchQuery,
  EvidenceItem,
} from '@/lib/swot/types'

interface Phase2EvidenceProps {
  summary: CoachingSummary
  orgContext: OrgContext
  onComplete: (allEvidence: EvidenceItem[]) => void
}

export function Phase2Evidence({
  summary,
  orgContext,
  onComplete,
}: Phase2EvidenceProps) {
  const [status, setStatus] = useState<
    'generating-queries' | 'searching' | 'complete' | 'error'
  >('generating-queries')
  const [completedBatches, setCompletedBatches] = useState(0)
  const [totalBatches, setTotalBatches] = useState(4)
  const [currentMessage, setCurrentMessage] = useState(
    'Đang chuẩn bị câu hỏi nghiên cứu...'
  )
  const [allEvidence, setAllEvidence] = useState<EvidenceItem[]>([])
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      runEvidenceEngine()
    }
  }, [])

  const runEvidenceEngine = async () => {
    try {
      setCurrentMessage('Đang tạo câu hỏi nghiên cứu...')
      const queriesResponse = await fetch('/api/swot/generate-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, orgContext }),
      })

      if (!queriesResponse.ok) throw new Error('Cannot generate queries')
      const { queries } = await queriesResponse.json()

      const BATCH_SIZE = 5
      const batches: SearchQuery[][] = []
      for (let i = 0; i < queries.length; i += BATCH_SIZE) {
        batches.push(queries.slice(i, i + BATCH_SIZE))
      }
      setTotalBatches(batches.length)
      setStatus('searching')

      const evidenceAccumulator: EvidenceItem[] = []
      for (let i = 0; i < batches.length; i++) {
        setCurrentMessage(
          `Đang nghiên cứu thị trường... (${i + 1}/${batches.length})`
        )

        const evidenceResponse = await fetch('/api/swot/evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ queries: batches[i], orgContext }),
        })

        if (evidenceResponse.ok) {
          const { results } = await evidenceResponse.json()
          evidenceAccumulator.push(...results)
        }

        setCompletedBatches(i + 1)
        setAllEvidence([...evidenceAccumulator])
      }

      setStatus('complete')
      setCurrentMessage(
        `Đã tìm được ${evidenceAccumulator.length} bằng chứng từ thị trường`
      )
      setTimeout(() => onComplete(evidenceAccumulator), 1500)
    } catch {
      setStatus('error')
      toast.error(
        'Gặp lỗi khi nghiên cứu thị trường. Tiếp tục với dữ liệu CEO.'
      )
      setTimeout(() => onComplete([]), 2000)
    }
  }

  const progress =
    totalBatches > 0
      ? Math.round((completedBatches / totalBatches) * 100)
      : 0

  return (
    <div className="mx-auto max-w-lg space-y-8 py-12 text-center">
      <div className="animate-pulse text-6xl">
        {status === 'generating-queries' && '🔍'}
        {status === 'searching' && '🌐'}
        {status === 'complete' && '✅'}
        {status === 'error' && '⚠️'}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Đang nghiên cứu thị trường</h2>
        <p className="text-sm text-muted-foreground">{currentMessage}</p>
      </div>

      {status === 'searching' && (
        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {completedBatches}/{totalBatches} nhóm câu hỏi
          </p>
        </div>
      )}

      {allEvidence.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Đã tìm thấy <strong>{allEvidence.length}</strong> bằng chứng
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Quá trình này tự động — bạn không cần làm gì thêm
      </p>
    </div>
  )
}
