'use client'

import { useState } from 'react'
import { VisionGuide } from './VisionGuide'
import { VisionEditor } from './VisionEditor'
import type { VisionAnswers, VisionDraft } from '@/lib/discovery/types'

type WorkshopStage = 'guide' | 'editor'

interface VisionWorkshopClientProps {
  orgContext: {
    orgName: string
    industry: string
    headcount: string
  }
  existingData: {
    answers?: VisionAnswers
    draft?: VisionDraft
    finalVision?: string
    finalGoals?: string[]
  } | null
}

export function VisionWorkshopClient({
  orgContext,
  existingData,
}: VisionWorkshopClientProps) {
  const [stage, setStage] = useState<WorkshopStage>(
    existingData?.draft ? 'editor' : 'guide'
  )
  const [answers, setAnswers] = useState<VisionAnswers>(
    existingData?.answers ?? {}
  )
  const [draft, setDraft] = useState<VisionDraft | null>(
    existingData?.draft ?? null
  )

  const handleDraftReady = (newAnswers: VisionAnswers, newDraft: VisionDraft) => {
    setAnswers(newAnswers)
    setDraft(newDraft)
    setStage('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToGuide = () => {
    setStage('guide')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="border rounded-xl p-6">
      {/* Stage indicator */}
      <div className="flex gap-2 mb-6">
        {(['guide', 'editor'] as const).map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              s === stage || s === 'guide'
                ? 'bg-primary'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {stage === 'guide' && (
        <VisionGuide
          orgContext={orgContext}
          initialAnswers={answers}
          onDraftReady={handleDraftReady}
        />
      )}

      {stage === 'editor' && draft && (
        <VisionEditor
          answers={answers}
          draft={draft}
          initialVision={existingData?.finalVision ?? draft.visionStatement}
          initialGoals={existingData?.finalGoals ?? draft.yearGoals}
          onBack={handleBackToGuide}
        />
      )}
    </div>
  )
}
