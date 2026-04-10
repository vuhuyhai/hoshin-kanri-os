'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type {
  SwotModuleState,
  CoachingState,
  CoachingSummary,
  EvidenceItemV2,
  OrgContext,
  CoachingItem,
  SynthesizedSwotItem,
  SynthesisResult,
  TowsResult,
} from '@/lib/swot/types'
import type { EvidenceRunningResult } from './EvidenceRunning'
import { Phase1Coaching } from './Phase1Coaching'
import SwotReviewBridge from './SwotReviewBridge'
import EvidenceRunning from './EvidenceRunning'
import EvidenceResults from './EvidenceResults'
import SynthesisReviewGrid from './SynthesisReviewGrid'
import TowsMatrix from './TowsMatrix'
import HoshinCandidateList from './HoshinCandidateList'

type SwotStep =
  | 'coaching'           // Phase 1: AI coaching conversation
  | 'bridge'             // Bridge: CEO review + confirm items
  | 'evidence_running'   // Step 2a: Market research đang chạy
  | 'evidence_results'   // Step 2b: Kết quả evidence
  | 'synthesis_loading'  // Step 3a: AI đang synthesis
  | 'synthesis_review'   // Step 3b: CEO review SWOT grid
  | 'strategy_loading'   // Step 4a: AI đang tạo TOWS
  | 'strategy_review'    // Step 4b: CEO chọn Hoshin

interface SwotContainerProps {
  orgContext: OrgContext
}

const initialCoachingState: CoachingState = { messages: [], currentFramework: 'sw', isComplete: false, isLoading: false, summary: null }
const initialState: SwotModuleState = {
  phase: 'coaching', coaching: initialCoachingState,
  evidence: { batches: [], totalBatches: 4, completedBatches: 0, isComplete: false },
  synthesisOutput: null, isSaved: false, sessionId: null,
}


export function SwotContainer({ orgContext }: SwotContainerProps) {
  const router = useRouter()
  const orgId = orgContext.orgId
  const [state, setState] = useState<SwotModuleState>(initialState)

  // Step tracking (new 4-step pipeline)
  const [currentStep, setCurrentStep] = useState<SwotStep>('coaching')

  // Data pipeline — mỗi bước truyền data cho bước sau
  const [coachingItems, setCoachingItems] = useState<CoachingItem[]>([])
  const [evidenceResult, setEvidenceResult] = useState<EvidenceRunningResult | null>(null)
  const [synthesisResult, setSynthesisResult] = useState<SynthesisResult | null>(null)
  const [towsResult, setTowsResult] = useState<TowsResult | null>(null)

  // Error state
  const [stepError, setStepError] = useState<string | null>(null)

  const extractSummary = async (
    messages: CoachingState['messages'],
    ctx: OrgContext
  ): Promise<CoachingSummary> => {
    try {
      const response = await fetch('/api/swot/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              role: 'user' as const,
              content:
                'Hãy tóm tắt toàn bộ thành JSON: { "strengths": [{"source": "M1_Man", "content": "..."}], "weaknesses": [...], "opportunities": [...], "threats": [...] }. Chỉ trả về JSON.',
            },
          ],
          orgContext: ctx,
          currentFramework: 'ot',
        }),
      })
      const data = await response.json()
      const clean = data.message.content
        .replace(/```json|```/g, '')
        .trim()
      return JSON.parse(clean)
    } catch {
      return { strengths: [], weaknesses: [], opportunities: [], threats: [] }
    }
  }

  const handleCoachingComplete = async () => {
    const summary = await extractSummary(state.coaching.messages, orgContext)
    setState((prev) => ({ ...prev, coaching: { ...prev.coaching, summary } }))

    const toItems = (arr: CoachingSummary['strengths'], q: 'S' | 'W' | 'O' | 'T'): CoachingItem[] =>
      arr.map((s) => ({ id: crypto.randomUUID(), quadrant: q, text: s.content, source: 'ai_extracted' as const, framework_source: s.source }))
    const items = [...toItems(summary.strengths, 'S'), ...toItems(summary.weaknesses, 'W'), ...toItems(summary.opportunities, 'O'), ...toItems(summary.threats, 'T')]
    setCoachingItems(items)
    setCurrentStep('bridge')
  }

  // ─── New pipeline handlers ─────────────────────────────────────

  const handleBridgeConfirm = (confirmedItems: CoachingItem[]) => {
    setCoachingItems(confirmedItems)
    setCurrentStep('evidence_running')
  }

  const handleNewEvidenceComplete = (result: EvidenceRunningResult) => {
    setEvidenceResult(result)
    setCurrentStep('evidence_results')
  }

  const handleEvidenceContinue = async (evidenceItems: EvidenceItemV2[]) => {
    setCurrentStep('synthesis_loading')
    setStepError(null)
    try {
      const res = await fetch('/api/swot/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, coaching_items: coachingItems, evidence_items: evidenceItems }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'Lỗi tổng hợp SWOT') }
      const result: SynthesisResult = await res.json()
      setSynthesisResult(result)
      setCurrentStep('synthesis_review')
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Lỗi không xác định')
      setCurrentStep('evidence_results')
    }
  }

  const handleSynthesisConfirm = async (finalItems: SynthesizedSwotItem[]) => {
    if (!synthesisResult) return
    setSynthesisResult({ ...synthesisResult, swot_items: finalItems })
    setCurrentStep('strategy_loading')
    setStepError(null)
    try {
      const res = await fetch('/api/swot/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, swot_items: finalItems }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? 'Lỗi tạo chiến lược') }
      const result: TowsResult = await res.json()
      setTowsResult(result)
      setCurrentStep('strategy_review')
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Lỗi không xác định')
      setCurrentStep('synthesis_review')
    }
  }

  const handleHoshinSelect = async (selectedRanks: number[]) => {
    try {
      await fetch('/api/swot/strategy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, selected_candidate_ranks: selectedRanks }),
      })
    } catch { /* Silent fail — selection saved locally, PUT is best effort */ }
  }

  const handleProceedToXMatrix = async () => {
    try {
      const res = await fetch('/api/x-matrix/prefill')
      if (!res.ok) throw new Error('Không thể tạo dữ liệu X-Matrix')
      const prefillData = await res.json()
      sessionStorage.setItem('xmatrix_prefill', JSON.stringify(prefillData))
      toast.success('Đã tạo X-Matrix từ SWOT! Đang chuyển hướng...')
      router.push('/dashboard/x-matrix/new?from=swot')
    } catch (err) {
      setStepError(err instanceof Error ? err.message : 'Lỗi tạo X-Matrix')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {stepError && (
        <div className="border-2 border-red-400 bg-red-50 p-3 mb-4 flex items-center justify-between">
          <span className="text-red-700 text-sm">{stepError}</span>
          <button onClick={() => setStepError(null)} className="text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      <StepIndicator currentStep={currentStep} />

      {currentStep === 'coaching' && (
        <div className="overflow-hidden rounded-xl border">
          <Phase1Coaching
            orgContext={orgContext}
            state={state.coaching}
            onStateChange={(coaching) => setState((prev) => ({ ...prev, coaching }))}
            onPhaseComplete={handleCoachingComplete}
          />
        </div>
      )}

      {currentStep === 'bridge' && (
        <SwotReviewBridge items={coachingItems} onConfirm={handleBridgeConfirm} />
      )}

      {currentStep === 'evidence_running' && (
        <EvidenceRunning items={coachingItems} org_id={orgId} onComplete={handleNewEvidenceComplete} />
      )}

      {currentStep === 'evidence_results' && evidenceResult && (
        <EvidenceResults
          validated={evidenceResult.validated}
          not_found={evidenceResult.not_found}
          cache_hits={evidenceResult.cache_hits}
          onContinue={handleEvidenceContinue}
        />
      )}

      {currentStep === 'synthesis_loading' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg font-bold">AI đang tổng hợp SWOT...</p>
          <p className="text-sm text-muted-foreground">Quá trình này mất 15-30 giây</p>
        </div>
      )}

      {currentStep === 'synthesis_review' && synthesisResult && (
        <SynthesisReviewGrid result={synthesisResult} onConfirm={handleSynthesisConfirm} />
      )}

      {currentStep === 'strategy_loading' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-8 h-8 border-4 border-ink border-t-transparent rounded-full animate-spin" />
          <p className="font-heading text-lg font-bold">AI đang tạo chiến lược TOWS...</p>
          <p className="text-sm text-muted-foreground">Phân tích cross-matrix SO · ST · WO · WT</p>
        </div>
      )}

      {currentStep === 'strategy_review' && towsResult && (
        <div className="space-y-8">
          <TowsMatrix strategies={towsResult.tows_strategies} />
          <HoshinCandidateList
            candidates={towsResult.hoshin_candidates}
            aiRecommendation={towsResult.ai_recommendation}
            onSelect={handleHoshinSelect}
            onProceed={handleProceedToXMatrix}
          />
        </div>
      )}
    </div>
  )
}

// ─── Step Indicator (new 5-step pipeline) ────────────────────────

const STEP_DEFS = [
  { key: 'coaching',  label: 'Khám phá',  shortLabel: '1' },
  { key: 'bridge',    label: 'Xác nhận',   shortLabel: '2' },
  { key: 'evidence',  label: 'Nghiên cứu', shortLabel: '3' },
  { key: 'synthesis', label: 'Tổng hợp',   shortLabel: '4' },
  { key: 'strategy',  label: 'Chiến lược', shortLabel: '5' },
] as const

function stepToIndex(step: SwotStep): number {
  switch (step) {
    case 'coaching': return 0
    case 'bridge': return 1
    case 'evidence_running': case 'evidence_results': return 2
    case 'synthesis_loading': case 'synthesis_review': return 3
    case 'strategy_loading': case 'strategy_review': return 4
  }
}

function StepIndicator({ currentStep }: { currentStep: SwotStep }) {
  const activeIdx = stepToIndex(currentStep)
  return (
    <div className="border-b-2 pb-4 mb-6">
      <div className="flex items-center">
        {STEP_DEFS.map((step, idx) => {
          const done = idx < activeIdx, active = idx === activeIdx
          const nodeCls = done ? 'bg-ink text-bg-warm border-ink' : active ? 'bg-accent-brand border-ink text-ink' : 'bg-white border-gray-300 text-gray-400'
          const labelCls = done || active ? 'text-ink font-bold' : 'text-gray-400'
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div className={`size-8 flex items-center justify-center text-xs font-bold border-2 rounded-full transition-colors ${nodeCls}`}>
                  {done ? '✓' : step.shortLabel}
                </div>
                <span className={`text-xs font-heading ${labelCls}`}>{step.label}</span>
              </div>
              {idx < STEP_DEFS.length - 1 && <div className={`h-0.5 w-full mx-1 ${idx < activeIdx ? 'bg-ink' : 'bg-gray-200'}`} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
