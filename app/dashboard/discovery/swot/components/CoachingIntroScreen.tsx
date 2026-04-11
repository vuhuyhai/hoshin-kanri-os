'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { EIGHT_MS, PORTER_FORCES, PESTEL_FACTORS, DIMENSION_LABELS } from '@/lib/swot/frameworks'
import { DIMENSION_SEQUENCES } from '@/lib/swot/coaching-tracker'
import type { FrameworkId, ExternalFrameworkChoice } from '@/lib/swot/types'

interface CoachingIntroScreenProps {
  onStart: (
    selectedDimensions: Record<FrameworkId, string[]>,
    selectedExternalFramework: ExternalFrameworkChoice
  ) => void
}

const MIN_INTERNAL_DIMENSIONS = 3

export function CoachingIntroScreen({ onStart }: CoachingIntroScreenProps) {
  const [selectedInternal, setSelectedInternal] = useState<string[]>(
    () => [...DIMENSION_SEQUENCES['8M']]
  )

  const [selectedExternal, setSelectedExternal] = useState<string[]>(() => [
    ...DIMENSION_SEQUENCES.Porter,
    ...DIMENSION_SEQUENCES.PESTEL,
  ])

  const toggleInternal = (dim: string) => {
    setSelectedInternal((prev) =>
      prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]
    )
  }

  const toggleExternal = (dim: string) => {
    setSelectedExternal((prev) =>
      prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]
    )
  }

  const canStart = selectedInternal.length >= MIN_INTERNAL_DIMENSIONS && selectedExternal.length >= 2

  const handleStart = () => {
    if (!canStart) return

    const porterDims = DIMENSION_SEQUENCES.Porter.filter((d) =>
      selectedExternal.includes(d)
    )
    const pestelDims = DIMENSION_SEQUENCES.PESTEL.filter((d) =>
      selectedExternal.includes(d)
    )

    const selectedDimensions: Record<FrameworkId, string[]> = {
      '8M': selectedInternal,
      Porter: porterDims,
      PESTEL: pestelDims,
    }

    onStart(selectedDimensions, 'both')
  }

  const internalDims = EIGHT_MS.map((dim) => ({
    key: dim.nameEn,
    label: DIMENSION_LABELS[dim.nameEn] ?? dim.name,
    description: dim.description,
  }))

  const externalDims = [
    ...PORTER_FORCES.map((dim) => ({
      key: dim.nameEn,
      label: DIMENSION_LABELS[dim.nameEn] ?? dim.name,
      description: dim.description,
    })),
    ...PESTEL_FACTORS.map((dim) => ({
      key: dim.nameEn,
      label: DIMENSION_LABELS[dim.nameEn] ?? dim.name,
      description: dim.description,
    })),
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Internal analysis */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="badge-brutal badge-ink">Nội bộ</span>
          <span className="font-body text-[14px] text-[var(--text-3)]">
            Điểm mạnh &amp; Điểm yếu
          </span>
        </div>

        <div className="space-y-1">
          {internalDims.map((dim) => {
            const checked = selectedInternal.includes(dim.key)
            return (
              <div
                key={dim.key}
                onClick={() => toggleInternal(dim.key)}
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleInternal(dim.key) } }}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-100 select-none',
                  checked
                    ? 'bg-[var(--bg-muted)] border-2 border-[var(--ink)] shadow-[var(--shadow-sm)]'
                    : 'bg-white border border-[var(--bg-muted)] hover:bg-[var(--bg-muted)] hover:border-[color:var(--ink)]/30',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center border-2 transition-all duration-100',
                    checked
                      ? 'bg-[var(--accent)] border-[var(--accent)]'
                      : 'bg-white border-[var(--ink)]',
                  ].join(' ')}
                >
                  {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-display font-semibold text-[13px] text-[var(--ink)]">
                    {dim.label}
                  </span>
                  <span className="font-body text-[12px] text-[var(--text-3)] ml-2">
                    {dim.description}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <p className="font-display font-semibold text-[12px] uppercase tracking-wider text-[var(--text-3)] mt-3">
          Đã chọn: <span className="text-[var(--accent)] font-bold">{selectedInternal.length}</span>/{internalDims.length}
          {selectedInternal.length < MIN_INTERNAL_DIMENSIONS && (
            <span className="text-destructive ml-2">
              (tối thiểu {MIN_INTERNAL_DIMENSIONS})
            </span>
          )}
        </p>
      </div>

      {/* RIGHT: External analysis */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className="badge-brutal badge-accent">Bên ngoài</span>
          <span className="font-body text-[14px] text-[var(--text-3)]">
            Cơ hội &amp; Thách thức
          </span>
        </div>

        <div className="space-y-1">
          {externalDims.map((dim) => {
            const checked = selectedExternal.includes(dim.key)
            return (
              <div
                key={dim.key}
                onClick={() => toggleExternal(dim.key)}
                role="checkbox"
                aria-checked={checked}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleExternal(dim.key) } }}
                className={[
                  'flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-100 select-none',
                  checked
                    ? 'bg-[var(--bg-muted)] border-2 border-[var(--ink)] shadow-[var(--shadow-sm)]'
                    : 'bg-white border border-[var(--bg-muted)] hover:bg-[var(--bg-muted)] hover:border-[color:var(--ink)]/30',
                ].join(' ')}
              >
                <div
                  className={[
                    'w-[18px] h-[18px] flex-shrink-0 flex items-center justify-center border-2 transition-all duration-100',
                    checked
                      ? 'bg-[var(--accent)] border-[var(--accent)]'
                      : 'bg-white border-[var(--ink)]',
                  ].join(' ')}
                >
                  {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-display font-semibold text-[13px] text-[var(--ink)]">
                    {dim.label}
                  </span>
                  <span className="font-body text-[12px] text-[var(--text-3)] ml-2">
                    {dim.description}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <p className="font-display font-semibold text-[12px] uppercase tracking-wider text-[var(--text-3)] mt-3">
          Đã chọn: <span className="text-[var(--accent)] font-bold">{selectedExternal.length}</span>/{externalDims.length}
        </p>
      </div>

      {/* CTA */}
      <div className="lg:col-span-2 flex justify-center mt-4">
        <button
          disabled={!canStart}
          onClick={handleStart}
          className="btn-primary px-8"
        >
          Tiếp theo &rarr;
        </button>
      </div>
    </div>
  )
}
