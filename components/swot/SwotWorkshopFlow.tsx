'use client'

import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { SwotContextForm } from './SwotContextForm'
import { SwotWorkshop } from './SwotWorkshop'
import { SwotFinalizeList } from './SwotFinalizeList'
import type { SwotWorkshopStep } from '@/lib/swot/types'

interface SwotWorkshopFlowProps {
  orgData: { industry: string; headcount: string; city: string }
  orgId: string
  analysisId: string
}

const STEPS: { key: SwotWorkshopStep; label: string }[] = [
  { key: 'context', label: 'Bối cảnh' },
  { key: 'workshop', label: 'Phân tích' },
  { key: 'finalize', label: 'Hoàn thiện' },
]

function stepIndex(step: SwotWorkshopStep): number {
  return STEPS.findIndex((s) => s.key === step)
}

function ProgressIndicator({ current }: { current: SwotWorkshopStep }) {
  const currentIdx = stepIndex(current)
  return (
    <div className="flex items-center justify-center gap-2 border-b-2 border-ink bg-bg-warm px-4 py-3">
      {STEPS.map((s, i) => {
        const done = i < currentIdx
        const active = i === currentIdx
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 border-2 border-ink px-3 py-1 font-body font-bold uppercase text-[11px] tracking-wider ${active ? 'bg-ink text-white' : done ? 'bg-kpi-healthy-strong text-white' : 'bg-card text-text-3'}`}>
              {done ? (
                <Check className="w-3 h-3" />
              ) : (
                <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-text-3/40'}`} />
              )}
              {s.label}
            </div>
            {i < STEPS.length - 1 && <div className="w-6 h-0.5 bg-ink" />}
          </div>
        )
      })}
    </div>
  )
}

export function SwotWorkshopFlow({ orgData, orgId, analysisId }: SwotWorkshopFlowProps) {
  const router = useRouter()
  const workshopStep = useSwotStore((s) => s.workshopStep)
  const setWorkshopStep = useSwotStore((s) => s.setWorkshopStep)

  const goToWorkshop = () => setWorkshopStep('workshop')
  const goToFinalize = () => setWorkshopStep('finalize')
  const goToTows = () => router.push('/dashboard/discovery/swot/strategy')

  return (
    <div className="flex flex-col h-full min-h-0">
      <ProgressIndicator current={workshopStep} />
      <div className="flex-1 min-h-0">
        {workshopStep === 'context' && (
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <SwotContextForm orgData={orgData} onComplete={goToWorkshop} />
          </div>
        )}
        {workshopStep === 'workshop' && (
          <SwotWorkshop
            analysisId={analysisId}
            orgId={orgId}
            onComplete={goToFinalize}
          />
        )}
        {workshopStep === 'finalize' && (
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <SwotFinalizeList
              analysisId={analysisId}
              orgId={orgId}
              onComplete={goToTows}
            />
          </div>
        )}
      </div>
    </div>
  )
}
