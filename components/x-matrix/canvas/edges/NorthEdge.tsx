'use client'

import { LIMITS } from '@/lib/x-matrix/types'
import { useCanvas } from '../state/CanvasContext'
import { YearGoalCard } from '../cards/YearGoalCard'

export function NorthEdge() {
  const { state } = useCanvas()
  const yearGoals = state.data.yearGoals
  const slots = Array.from({ length: LIMITS.MAX_YEAR_GOALS }, (_, i) =>
    yearGoals[i] ?? null
  )

  return (
    <section className="flex h-full flex-col gap-1">
      <h2 className="heading-overline text-xs">🎯 Mục tiêu năm</h2>
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        {slots.map((goal, i) => (
          <YearGoalCard key={i} goal={goal} slotIndex={i} />
        ))}
      </div>
    </section>
  )
}
