'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Phase1Coaching } from '../../components/Phase1Coaching'
import type { CoachingState, OrgContext } from '@/lib/swot/types'

interface CoachingClientProps {
  orgContext: OrgContext
}

const initialState: CoachingState = {
  messages: [],
  currentFramework: 'sw',
  isComplete: false,
  isLoading: false,
  summary: null,
}

export function CoachingClient({ orgContext }: CoachingClientProps) {
  const router = useRouter()
  const [state, setState] = useState<CoachingState>(initialState)

  const handlePhaseComplete = () => {
    toast.success('AI Coaching hoàn thành!')
    router.push('/dashboard/discovery/swot')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/dashboard/discovery/swot')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 block"
        >
          ← Phân tích SWOT
        </button>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">AI Coaching</h1>
            <p className="text-sm text-muted-foreground">
              Phân tích nội tại và ngoại cảnh qua hội thoại với AI
            </p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            Bước 1/4
          </Badge>
        </div>
      </div>

      {/* Chat container */}
      <div className="border overflow-hidden" style={{ height: '650px' }}>
        <Phase1Coaching
          orgContext={orgContext}
          state={state}
          onStateChange={setState}
          onPhaseComplete={handlePhaseComplete}
        />
      </div>
    </div>
  )
}
