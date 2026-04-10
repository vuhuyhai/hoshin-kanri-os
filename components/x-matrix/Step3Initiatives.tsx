'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LIMITS } from '@/lib/x-matrix/types'
import { genInitId } from '@/lib/x-matrix/utils'
import type { XMatrixData, XMatrixInitiative } from '@/lib/x-matrix/types'
import { cn } from '@/lib/utils'

interface Step3InitiativesProps {
  data: XMatrixData
  onChange: (data: XMatrixData) => void
  onNext: () => void
  onBack: () => void
}

const TIMEFRAMES: { value: XMatrixInitiative['timeframe']; label: string }[] = [
  { value: '30d', label: '30d' },
  { value: '60d', label: '60d' },
  { value: '90d', label: '90d' },
]

export function Step3Initiatives({
  data,
  onChange,
  onNext,
  onBack,
}: Step3InitiativesProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const activeHoshin = data.hoshins[activeIdx]

  const setHoshinInits = (hIdx: number, inits: XMatrixInitiative[]) => {
    onChange({
      ...data,
      hoshins: data.hoshins.map((h, i) =>
        i === hIdx ? { ...h, initiatives: inits } : h
      ),
    })
  }

  const addInit = () => {
    if (
      !activeHoshin ||
      activeHoshin.initiatives.length >= LIMITS.MAX_INITIATIVES_PER_HOSHIN
    )
      return
    setHoshinInits(activeIdx, [
      ...activeHoshin.initiatives,
      {
        id: genInitId(activeIdx, activeHoshin.initiatives.length),
        title: '',
        timeframe: '90d',
      },
    ])
  }

  const updateInit = (
    iIdx: number,
    field: keyof XMatrixInitiative,
    value: string
  ) => {
    setHoshinInits(
      activeIdx,
      activeHoshin.initiatives.map((init, i) =>
        i === iIdx ? { ...init, [field]: value } : init
      )
    )
  }

  const removeInit = (iIdx: number) => {
    setHoshinInits(
      activeIdx,
      activeHoshin.initiatives.filter((_, i) => i !== iIdx)
    )
  }

  const atLimit =
    activeHoshin?.initiatives.length >= LIMITS.MAX_INITIATIVES_PER_HOSHIN

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Q3 — Initiatives 90 ngày</h2>
        <p className="text-sm text-muted-foreground">
          Hành động cụ thể cho từng Hoshin. Tối đa{' '}
          {LIMITS.MAX_INITIATIVES_PER_HOSHIN} initiatives/Hoshin.
        </p>
      </div>

      {/* Hoshin tabs */}
      <div className="flex gap-2 flex-wrap">
        {data.hoshins.map((h, idx) => (
          <button
            key={h.id}
            onClick={() => setActiveIdx(idx)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs transition-all',
              activeIdx === idx
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            H{idx + 1}
            <Badge
              variant="outline"
              className={cn(
                'ml-1.5 text-xs py-0',
                activeIdx === idx ? 'border-primary-foreground/40' : ''
              )}
            >
              {h.initiatives.length}/{LIMITS.MAX_INITIATIVES_PER_HOSHIN}
            </Badge>
          </button>
        ))}
      </div>

      {activeHoshin && (
        <p className="text-sm font-medium text-muted-foreground border-l-2 border-primary pl-3">
          {activeHoshin.title}
        </p>
      )}

      {activeHoshin && (
        <div className="space-y-3">
          {activeHoshin.initiatives.map((init, iIdx) => (
            <div key={init.id} className="flex gap-2 items-center">
              <span className="text-muted-foreground text-sm w-4 shrink-0">
                {iIdx + 1}.
              </span>
              <Input
                value={init.title}
                onChange={(e) => updateInit(iIdx, 'title', e.target.value)}
                placeholder="Hành động cụ thể, bắt đầu bằng động từ..."
                className="flex-1 text-sm"
              />
              <div className="flex gap-1 shrink-0">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => updateInit(iIdx, 'timeframe', tf.value)}
                    className={cn(
                      'px-2 py-1 rounded text-xs transition-colors',
                      init.timeframe === tf.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => removeInit(iIdx)}
                className="text-muted-foreground hover:text-destructive text-sm shrink-0"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              onClick={addInit}
              disabled={atLimit}
            >
              + Thêm Initiative
            </Button>
            {atLimit && (
              <p className="text-xs text-muted-foreground">
                Tối đa {LIMITS.MAX_INITIATIVES_PER_HOSHIN} initiatives/Hoshin
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          ← Hoshins
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          KPIs →
        </Button>
      </div>
    </div>
  )
}
