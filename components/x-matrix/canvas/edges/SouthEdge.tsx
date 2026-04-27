'use client'

import { HoshinCard } from '../cards/HoshinCard'
import type { MockHoshin } from '../XMatrixCanvasPage'

interface SouthEdgeProps {
  hoshins: MockHoshin[]
}

export function SouthEdge({ hoshins }: SouthEdgeProps) {
  const slots = Array.from({ length: 5 }, (_, i) => hoshins[i] ?? null)

  return (
    <section className="flex h-full flex-col gap-1">
      <h2 className="heading-overline text-xs">🚀 Hoshins (năm nay)</h2>
      <div className="flex flex-1 flex-col gap-2 md:flex-row md:gap-2 md:overflow-x-auto md:pb-1">
        {slots.map((hoshin, i) => (
          <div key={i} className="md:w-[200px] md:shrink-0">
            <HoshinCard hoshin={hoshin} slotIndex={i} />
          </div>
        ))}
      </div>
    </section>
  )
}
