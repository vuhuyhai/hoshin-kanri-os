'use client'

import { LIMITS } from '@/lib/x-matrix/types'
import { useCanvas } from '../state/CanvasContext'
import { HoshinCard } from '../cards/HoshinCard'

export function SouthEdge() {
  const { state } = useCanvas()
  const hoshins = state.data.hoshins
  const slots = Array.from({ length: LIMITS.MAX_HOSHINS }, (_, i) =>
    hoshins[i] ?? null
  )

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
