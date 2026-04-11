'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics/events'
import { SwotFactorInput } from './SwotFactorInput'
import { TowsCanvas } from './TowsCanvas'
import { StrategyReviewTable } from './StrategyReviewTable'
import type { SwotQuadrant } from '@/lib/swot/types'
import type { SwotFactor, TowsStrategyWithFactorsRecord, StrategyStatus, BscPerspective } from '@/lib/swot/tows-types'

interface TowsOrchestratorProps {
  analysisId: string
  orgId: string
  onComplete?: (strategies: TowsStrategyWithFactorsRecord[]) => void
}

const PHASES = [
  { num: 1, label: 'SWOT & Evidence' },
  { num: 2, label: 'TOWS Matrix' },
  { num: 3, label: 'Review & Export' },
] as const

export function TowsOrchestrator({ analysisId, orgId, onComplete }: TowsOrchestratorProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1)
  const [factors, setFactors] = useState<Record<SwotQuadrant, SwotFactor[]>>({ S: [], W: [], O: [], T: [] })
  const [strategies, setStrategies] = useState<TowsStrategyWithFactorsRecord[]>([])

  const keyFactorCount = Object.values(factors).flat().filter((f) => f.is_key_factor).length

  return (
    <div>
      {/* Phase Stepper */}
      <div className="flex mb-6">
        {PHASES.map((p, i) => {
          const isActive = p.num === phase
          const isCompleted = p.num < phase
          let bg = 'white'
          let color = '#2C2B2B'
          let cursor = 'default'
          if (isActive) { bg = '#2C2B2B'; color = 'white' }
          if (isCompleted) { bg = '#c73937'; color = 'white'; cursor = 'pointer' }

          return (
            <button
              key={p.num}
              onClick={() => isCompleted && setPhase(p.num as 1 | 2 | 3)}
              disabled={!isCompleted}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-display font-bold border-2 border-ink transition-colors disabled:cursor-default"
              style={{
                background: bg,
                color,
                cursor,
                borderRight: i < PHASES.length - 1 ? 'none' : undefined,
                boxShadow: isActive ? '4px 4px 0 #2C2B2B' : 'none',
              }}
            >
              <span className="size-5 flex items-center justify-center border-2 text-[11px] font-bold"
                style={{ borderColor: color, background: isCompleted ? 'white' : 'transparent', color: isCompleted ? '#c73937' : color }}>
                {isCompleted ? '✓' : p.num}
              </span>
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Phase Content */}
      {phase === 1 && (
        <>
          <SwotFactorInput
            analysisId={analysisId}
            orgId={orgId}
            onFactorsChange={setFactors}
          />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm font-body text-ink/60">
              {keyFactorCount < 2
                ? 'Cần ít nhất 2 yếu tố chủ chốt (tick ✓) để tiếp tục'
                : `${keyFactorCount} yếu tố chủ chốt đã chọn`}
            </p>
            <button
              disabled={keyFactorCount < 2}
              onClick={() => {
                trackEvent('tows_phase_completed', { phase: 1, org_id: orgId })
                setPhase(2)
              }}
              className="px-4 py-2 text-sm font-display font-bold border-2 border-ink text-white disabled:opacity-40 transition-colors"
              style={{ background: keyFactorCount >= 2 ? '#2C2B2B' : '#888' }}
            >
              Tiếp tục → TOWS Matrix
            </button>
          </div>
        </>
      )}

      {phase === 2 && (
        <>
          <TowsCanvas
            analysisId={analysisId}
            orgId={orgId}
            factors={factors}
            onStrategiesChange={setStrategies}
          />
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setPhase(1)}
              className="px-4 py-2 text-sm font-display font-bold border-2 border-ink bg-white hover:bg-ink hover:text-white transition-colors"
            >
              ← Quay lại
            </button>
            <div className="flex items-center gap-3">
              <p className="text-sm font-body text-ink/60">
                {strategies.length === 0
                  ? 'Cần tạo ít nhất 1 chiến lược để tiếp tục'
                  : `${strategies.length} chiến lược đã tạo`}
              </p>
              <button
                disabled={strategies.length === 0}
                onClick={() => {
                  trackEvent('tows_phase_completed', { phase: 2, org_id: orgId })
                  setPhase(3)
                }}
                className="px-4 py-2 text-sm font-display font-bold border-2 border-ink text-white disabled:opacity-40 transition-colors"
                style={{ background: strategies.length > 0 ? '#2C2B2B' : '#888' }}
              >
                Tiếp tục → Review
              </button>
            </div>
          </div>
        </>
      )}

      {phase === 3 && (
        <>
          <StrategyReviewTable
            analysisId={analysisId}
            strategies={strategies}
            onStatusChange={(id: string, status: StrategyStatus) => {
              setStrategies((prev) => prev.map((s) => s.id === id ? { ...s, status } : s))
            }}
            onBscChange={(id: string, bsc: BscPerspective) => {
              setStrategies((prev) => prev.map((s) => s.id === id ? { ...s, bsc_perspective: bsc } : s))
            }}
            onSendToXMatrix={(selected) => {
              trackEvent('tows_phase_completed', { phase: 3, count: selected.length, org_id: orgId })
              onComplete?.(selected)
            }}
          />
          <div className="mt-4">
            <button
              onClick={() => setPhase(2)}
              className="px-4 py-2 text-sm font-display font-bold border-2 border-ink bg-white hover:bg-ink hover:text-white transition-colors"
            >
              ← Quay lại
            </button>
          </div>
        </>
      )}
    </div>
  )
}
