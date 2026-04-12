'use client'

import { ArrowLeft, ArrowRight, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SynthesisLoading } from './synthesis/SynthesisLoading'
import { SynthesisError } from './synthesis/SynthesisError'
import { SynthesisQuadrantCard } from './synthesis/SynthesisQuadrantCard'
import { useSynthesisEngine } from './synthesis/useSynthesisEngine'
import type { OrgContext } from '@/lib/swot/types'

interface SynthesisPhaseProps {
  orgContext: OrgContext
  analysisId: string
  /** Wizard mode: called after save instead of router.push to /strategy */
  onComplete?: () => void | Promise<void>
}

export function SynthesisPhase({ orgContext, analysisId, onComplete }: SynthesisPhaseProps) {
  const engine = useSynthesisEngine(orgContext, analysisId, { onComplete })

  if (engine.status === 'loading') {
    return <SynthesisLoading isRecovering={engine.isRecovering} />
  }

  if (engine.status === 'error') {
    return (
      <SynthesisError
        hasDraft={!!engine.confirmedDraft}
        onRetry={engine.retryFromError}
        onBack={() => engine.backToPhase(2)}
        onRestart={() => engine.backToPhase(1)}
      />
    )
  }

  if (!engine.synthesis) return null

  const synthesis = engine.synthesis
  const totalItems =
    synthesis.S.length + synthesis.W.length + synthesis.O.length + synthesis.T.length

  return (
    <div className="space-y-6">
      <button
        onClick={() => engine.backToPhase(2)}
        className="inline-flex items-center gap-1 font-body text-sm text-text-2 hover:text-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Xem lại bối cảnh
      </button>

      <div className="text-center space-y-2">
        <div
          className="inline-flex items-center justify-center w-14 h-14 border-2 border-ink bg-white"
          style={{ boxShadow: '3px 3px 0 #2C2B2B' }}
        >
          <Target className="w-7 h-7 text-ink" />
        </div>
        <h2 className="font-display font-black text-xl uppercase text-ink">
          SWOT Analysis
        </h2>
        <p className="font-body text-sm text-text-2">
          {totalItems} insights · Bấm vào để chỉnh sửa, × để xoá
        </p>
        {synthesis.summary && (
          <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-relaxed text-text-3">
            {synthesis.summary}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(['S', 'W', 'O', 'T'] as const).map((q) => (
          <SynthesisQuadrantCard
            key={q}
            quadrant={q}
            items={synthesis[q]}
            editingId={engine.editingId}
            editText={engine.editText}
            onStartEdit={engine.handleStartEdit}
            onSaveEdit={() => engine.handleSaveEdit(q)}
            onCancelEdit={engine.handleCancelEdit}
            onEditTextChange={engine.setEditText}
            onDelete={(itemId) => engine.handleDeleteItem(q, itemId)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-4 sm:flex-row">
        <Button
          variant="outline"
          onClick={() => engine.backToPhase(2)}
          className="flex-1"
        >
          <ArrowLeft className="mr-1 w-4 h-4" /> Xem lại bối cảnh
        </Button>
        <Button
          onClick={engine.handleSaveAndContinue}
          disabled={engine.isSaving || totalItems === 0}
          className="flex-1"
        >
          {engine.isSaving ? (
            'Đang lưu...'
          ) : (
            <>
              Lưu và tiếp tục <ArrowRight className="ml-1 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
