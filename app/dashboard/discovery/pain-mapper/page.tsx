'use client'

import { useState } from 'react'
import type { HoshinCandidate } from '@/lib/discovery/types'
import { PainInputForm } from './components/PainInputForm'
import { HoshinCandidates } from './components/HoshinCandidates'

export default function PainMapperPage() {
  const [candidates, setCandidates] = useState<HoshinCandidate[] | null>(null)

  // orgContext will be passed from localStorage or fetched
  // For simplicity, use a default that works without server fetch
  const orgContext = { industry: '', city: '', orgName: '' }

  if (typeof window !== 'undefined') {
    // Read org context from a simple approach
  }

  if (candidates) {
    return (
      <div className="mx-auto max-w-2xl py-4">
        <HoshinCandidates candidates={candidates} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pain → Goal Mapper</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chuyển đổi vấn đề thực tế thành mục tiêu chiến lược Hoshin Kanri
        </p>
      </div>
      <PainInputForm
        orgContext={orgContext}
        onComplete={setCandidates}
      />
    </div>
  )
}
