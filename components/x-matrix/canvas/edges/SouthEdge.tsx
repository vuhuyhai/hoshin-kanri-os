'use client'

import { LIMITS } from '@/lib/x-matrix/types'
import { useCanvas } from '../state/CanvasContext'
import { HoshinCard } from '../cards/HoshinCard'
import { EducationalTooltip } from '../EducationalTooltip'

export function SouthEdge() {
  const { state } = useCanvas()
  const hoshins = state.data.hoshins
  const slots = Array.from({ length: LIMITS.MAX_HOSHINS }, (_, i) =>
    hoshins[i] ?? null
  )

  return (
    <section id="canvas-edge-south" className="flex h-full flex-col gap-1">
      <div className="flex items-center gap-1">
        <h2 className="heading-overline text-xs">🚀 Hoshins (năm nay)</h2>
        <EducationalTooltip
          title="Hoshin là gì?"
          content={
            <>
              <p className="mb-2">
                Hoshin là <strong>&quot;breakthrough&quot;</strong> — không phải việc bình thường hàng ngày.
              </p>
              <p className="italic text-text-2">
                &quot;Nếu không làm điều này, năm sau công ty còn ở đây không?&quot; — câu hỏi để phân biệt Hoshin với việc lặt vặt.
              </p>
              <p className="mt-2 text-[11px] text-text-3">— Tối đa 5 Hoshins/năm. Vital few rule.</p>
            </>
          }
        />
      </div>
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
