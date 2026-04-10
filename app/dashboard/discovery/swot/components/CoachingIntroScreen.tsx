'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  // Internal: multi-select, all checked by default
  const [selectedInternal, setSelectedInternal] = useState<string[]>(
    () => [...DIMENSION_SEQUENCES['8M']]
  )

  // External: always include both (no framework selection exposed)
  const [selectedExternal, setSelectedExternal] = useState<string[]>(() => [
    ...DIMENSION_SEQUENCES.Porter,
    ...DIMENSION_SEQUENCES.PESTEL,
  ])

  const toggleInternal = (dim: string) => {
    setSelectedInternal((prev) =>
      prev.includes(dim)
        ? prev.filter((d) => d !== dim)
        : [...prev, dim]
    )
  }

  const toggleExternal = (dim: string) => {
    setSelectedExternal((prev) =>
      prev.includes(dim)
        ? prev.filter((d) => d !== dim)
        : [...prev, dim]
    )
  }

  const canStart = selectedInternal.length >= MIN_INTERNAL_DIMENSIONS && selectedExternal.length >= 2

  const handleStart = () => {
    if (!canStart) return

    // Map back to framework-scoped dimensions for internal tracking
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

  // Build display items for internal dimensions
  const internalDims = EIGHT_MS.map((dim) => ({
    key: dim.nameEn,
    label: DIMENSION_LABELS[dim.nameEn] ?? dim.name,
    description: dim.description,
  }))

  // Build display items for external dimensions
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
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: Internal analysis */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Noi bo (Diem manh &amp; Diem yeu)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Chon cac khia canh ban muon phan tich
            </p>
          </div>

          <div className="space-y-2">
            {internalDims.map((dim) => {
              const checked = selectedInternal.includes(dim.key)
              return (
                <label
                  key={dim.key}
                  className={`flex items-center gap-3 px-4 py-3 border-2 cursor-pointer transition-colors ${
                    checked
                      ? 'border-foreground bg-primary/5'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleInternal(dim.key)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-display font-semibold">
                      {dim.label}
                    </span>
                    <p className="text-xs text-muted-foreground truncate">
                      {dim.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>

          <p className="text-xs font-display font-semibold text-muted-foreground tabular-nums">
            Da chon: {selectedInternal.length}/{internalDims.length}
            {selectedInternal.length < MIN_INTERNAL_DIMENSIONS && (
              <span className="text-destructive ml-2">
                (toi thieu {MIN_INTERNAL_DIMENSIONS})
              </span>
            )}
          </p>
        </div>

        {/* RIGHT: External analysis */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Ben ngoai (Co hoi &amp; Thach thuc)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Chon cac yeu to thi truong can xem xet
            </p>
          </div>

          <div className="space-y-2">
            {externalDims.map((dim) => {
              const checked = selectedExternal.includes(dim.key)
              return (
                <label
                  key={dim.key}
                  className={`flex items-center gap-3 px-4 py-3 border-2 cursor-pointer transition-colors ${
                    checked
                      ? 'border-foreground bg-primary/5'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleExternal(dim.key)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-display font-semibold">
                      {dim.label}
                    </span>
                    <p className="text-xs text-muted-foreground truncate">
                      {dim.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </div>

          <p className="text-xs font-display font-semibold text-muted-foreground tabular-nums">
            Da chon: {selectedExternal.length}/{externalDims.length}
          </p>
        </div>
      </div>

      {/* Hint + CTA */}
      <div className="border-t-2 border-foreground pt-6 space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Goi y: Chon toi thieu 4 khia canh noi bo de co phan tich day du
        </p>
        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!canStart}
            onClick={handleStart}
            className="font-display text-sm font-bold uppercase tracking-wider px-12"
          >
            Bat dau phan tich &rarr;
          </Button>
        </div>
      </div>
    </div>
  )
}
