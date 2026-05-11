'use client'

import { useRouter } from 'next/navigation'
import type { HoshinCandidate } from '@/lib/discovery/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HoshinCandidatesProps {
  candidates: HoshinCandidate[]
}

const PRIORITY_CONFIG = {
  high: {
    label: 'Ưu tiên cao',
    className:
      'bg-accent-pink text-destructive',
  },
  medium: {
    label: 'Trung bình',
    className:
      'bg-accent-yellow text-kpi-attention-strong',
  },
  low: {
    label: 'Thấp',
    className:
      'bg-accent-lime text-kpi-healthy-strong',
  },
}

export function HoshinCandidates({ candidates }: HoshinCandidatesProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          🎯 Hoshin Candidates từ Pain Points
        </h2>
        <p className="text-sm text-muted-foreground">
          AI đã dịch pain points thành {candidates.length} mục tiêu chiến
          lược. Bạn sẽ chọn tối đa 5 trong X-Matrix Builder.
        </p>
      </div>

      <div className="space-y-3">
        {candidates.map((c, idx) => (
          <div key={c.id} className="space-y-2 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="flex-1 text-sm font-medium leading-relaxed">
                {idx + 1}. {c.hoshin}
              </p>
              <Badge
                className={cn(
                  'shrink-0 text-xs',
                  PRIORITY_CONFIG[c.priority].className
                )}
              >
                {PRIORITY_CONFIG[c.priority].label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{c.rationale}</p>
            <p className="text-xs italic text-muted-foreground/70">
              Từ pain: &ldquo;{c.painSource}&rdquo;
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/discovery')}
          className="flex-1"
        >
          ← Discovery Hub
        </Button>
        <Button
          onClick={() =>
            router.push('/dashboard/discovery/vision-workshop')
          }
          className="flex-1"
        >
          Tiếp theo: Vision Workshop →
        </Button>
      </div>
    </div>
  )
}
