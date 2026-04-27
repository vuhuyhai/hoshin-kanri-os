'use client'

import { HoshinCard } from '../cards/HoshinCard'
import type { MockHoshin } from '../XMatrixCanvasPage'

interface SouthEdgeProps {
  hoshins: MockHoshin[]
}

export function SouthEdge({ hoshins }: SouthEdgeProps) {
  const slots = Array.from({ length: 5 }, (_, i) => hoshins[i] ?? null)

  return (
    <section className="space-y-3">
      <h2 className="heading-overline">
        🚀 NĂM NAY LÀM GÌ (HOSHINS — TỐI ĐA 5)
      </h2>
      <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:overflow-x-auto md:pb-2">
        {slots.map((hoshin, i) => (
          <div key={i} className="md:w-[260px] md:shrink-0">
            <HoshinCard hoshin={hoshin} slotIndex={i} />
          </div>
        ))}
      </div>
    </section>
  )
}
