'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { EIGHT_MS, PORTER_FORCES, PESTEL_FACTORS } from '@/lib/swot/frameworks'
import { DIMENSION_SEQUENCES } from '@/lib/swot/coaching-tracker'
import type { FrameworkId, ExternalFrameworkChoice } from '@/lib/swot/types'

interface CoachingIntroScreenProps {
  onStart: (
    selectedDimensions: Record<FrameworkId, string[]>,
    selectedExternalFramework: ExternalFrameworkChoice
  ) => void
}

const MIN_8M_DIMENSIONS = 3

export function CoachingIntroScreen({ onStart }: CoachingIntroScreenProps) {
  // 8M: multi-select, all checked by default
  const [selected8M, setSelected8M] = useState<string[]>(
    () => [...DIMENSION_SEQUENCES['8M']]
  )

  // External: single-select radio, default "both"
  const [externalChoice, setExternalChoice] =
    useState<ExternalFrameworkChoice>('both')

  const toggle8M = (dim: string) => {
    setSelected8M((prev) =>
      prev.includes(dim)
        ? prev.filter((d) => d !== dim)
        : [...prev, dim]
    )
  }

  const canStart = selected8M.length >= MIN_8M_DIMENSIONS

  const handleStart = () => {
    if (!canStart) return

    const selectedDimensions: Record<FrameworkId, string[]> = {
      '8M': selected8M,
      Porter:
        externalChoice === 'PESTEL'
          ? []
          : [...DIMENSION_SEQUENCES.Porter],
      PESTEL:
        externalChoice === 'Porter'
          ? []
          : [...DIMENSION_SEQUENCES.PESTEL],
    }

    onStart(selectedDimensions, externalChoice)
  }

  const selectedExternalCount =
    externalChoice === 'both'
      ? PORTER_FORCES.length + PESTEL_FACTORS.length
      : externalChoice === 'Porter'
        ? PORTER_FORCES.length
        : PESTEL_FACTORS.length

  return (
    <div className="w-full space-y-8">
      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LEFT: Internal (8M) */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Phan tich noi bo (SW)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Framework: 8Ms
            </p>
          </div>

          <div className="space-y-2">
            {EIGHT_MS.map((dim) => {
              const checked = selected8M.includes(dim.nameEn)
              return (
                <label
                  key={dim.id}
                  className={`flex items-center gap-3 px-4 py-3 border-2 cursor-pointer transition-colors ${
                    checked
                      ? 'border-foreground bg-primary/5'
                      : 'border-border hover:border-foreground/30'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle8M(dim.nameEn)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-display font-semibold">
                      {dim.id.replace('_', ' ')} — {dim.name}
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
            Da chon: {selected8M.length}/8
            {selected8M.length < MIN_8M_DIMENSIONS && (
              <span className="text-destructive ml-2">
                (toi thieu {MIN_8M_DIMENSIONS})
              </span>
            )}
          </p>
        </div>

        {/* RIGHT: External (Porter/PESTEL) */}
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wider">
              Phan tich ngoai canh (OT)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Chon framework:
            </p>
          </div>

          <RadioGroup
            value={externalChoice}
            onValueChange={(val) =>
              setExternalChoice(val as ExternalFrameworkChoice)
            }
            className="space-y-3"
          >
            {[
              {
                value: 'Porter' as const,
                label: 'Porter 5 Forces',
                desc: `${PORTER_FORCES.length} forces: ${PORTER_FORCES.map((f) => f.name).join(', ')}`,
              },
              {
                value: 'PESTEL' as const,
                label: 'PESTEL',
                desc: `${PESTEL_FACTORS.length} factors: ${PESTEL_FACTORS.map((f) => f.name).join(', ')}`,
              },
              {
                value: 'both' as const,
                label: 'Ca hai (day du)',
                desc: `${PORTER_FORCES.length + PESTEL_FACTORS.length} dimensions tong cong`,
              },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 px-4 py-3 border-2 cursor-pointer transition-colors ${
                  externalChoice === opt.value
                    ? 'border-foreground bg-primary/5'
                    : 'border-border hover:border-foreground/30'
                }`}
              >
                <RadioGroupItem value={opt.value} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-display font-semibold">
                    {opt.label}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {opt.desc}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>

          <p className="text-xs font-display font-semibold text-muted-foreground tabular-nums">
            Da chon: {selectedExternalCount} dimensions
          </p>
        </div>
      </div>

      {/* Hint + CTA */}
      <div className="border-t-2 border-foreground pt-6 space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Goi y: Chon toi thieu 4 dimensions noi bo de co phan tich day du
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
