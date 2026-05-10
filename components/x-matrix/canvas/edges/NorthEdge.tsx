'use client'

import { LIMITS } from '@/lib/x-matrix/types'
import { useCanvas } from '../state/CanvasContext'
import { YearGoalCard } from '../cards/YearGoalCard'
import { EducationalTooltip } from '../EducationalTooltip'

export function NorthEdge() {
  const { state } = useCanvas()
  const yearGoals = state.data.yearGoals
  const slots = Array.from({ length: LIMITS.MAX_YEAR_GOALS }, (_, i) =>
    yearGoals[i] ?? null
  )

  return (
    <section id="canvas-edge-north" className="flex h-full flex-col gap-1">
      <div className="flex items-center gap-1">
        <h2 className="overline text-xs">🎯 Mục tiêu năm (3-5 năm)</h2>
        <EducationalTooltip
          title="Mục tiêu năm là gì?"
          content={
            <>
              <p className="mb-2">3 điều quan trọng nhất bạn muốn đạt được trong 1 năm tới.</p>
              <p className="italic text-text-2">
                &quot;Nếu chỉ đạt được 1 trong 3 mục tiêu, bạn vẫn hài lòng?&quot; — đó là cách để biết mục tiêu đã đủ ưu tiên chưa.
              </p>
              <p className="mt-2 text-[11px] text-text-3">— Theo phương pháp Hoshin Kanri (Toyota)</p>
            </>
          }
        />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
        {slots.map((goal, i) => (
          <YearGoalCard key={i} goal={goal} slotIndex={i} />
        ))}
      </div>
    </section>
  )
}
