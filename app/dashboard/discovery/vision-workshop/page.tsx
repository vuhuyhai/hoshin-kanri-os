'use client'

import { useState } from 'react'
import type { VisionAnswers, VisionDraft } from '@/lib/discovery/types'
import { VisionGuide } from './components/VisionGuide'
import { VisionEditor } from './components/VisionEditor'

export default function VisionWorkshopPage() {
  const [draftData, setDraftData] = useState<{
    answers: VisionAnswers
    draft: VisionDraft
  } | null>(null)

  const orgContext = { industry: '', orgName: '', headcount: '' }

  if (draftData) {
    return (
      <div className="mx-auto max-w-2xl py-4">
        <VisionEditor answers={draftData.answers} draft={draftData.draft} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vision Workshop</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xây dựng tầm nhìn và mục tiêu năm cho doanh nghiệp
        </p>
      </div>
      <VisionGuide
        orgContext={orgContext}
        onDraftReady={(answers, draft) => setDraftData({ answers, draft })}
      />
    </div>
  )
}
