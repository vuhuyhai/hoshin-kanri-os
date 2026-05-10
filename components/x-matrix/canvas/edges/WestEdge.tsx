'use client'

import { useCanvas } from '../state/CanvasContext'
import { EducationalTooltip } from '../EducationalTooltip'

export function WestEdge() {
  const { state } = useCanvas()
  const ownerCounts = new Map<string, number>()
  for (const h of state.data.hoshins) {
    const name = h.owner_name?.trim()
    if (!name) continue
    ownerCounts.set(name, (ownerCounts.get(name) ?? 0) + 1)
  }
  const owners = Array.from(ownerCounts.entries())

  return (
    <section id="canvas-edge-west" className="flex h-full flex-col gap-1">
      <div className="flex items-center gap-1">
        <h2 className="overline text-xs">👥 Owners</h2>
        <EducationalTooltip
          title="Owner là gì?"
          content={
            <>
              <p className="mb-2">Một người chịu trách nhiệm chính cho mỗi Hoshin.</p>
              <p className="font-semibold italic text-text-2">
                KHÔNG phải team. Nếu mọi người chịu = không ai chịu.
              </p>
              <p className="mt-2 text-[11px] text-text-3">— Catchball process: CEO ↔ Owner thảo luận từng tuần.</p>
            </>
          }
        />
      </div>
      <div className="flex-1 overflow-y-auto border-[3px] border-ink bg-[var(--bg)] p-2 shadow-[var(--shadow-md)]">
        {owners.length === 0 ? (
          <p className="flex h-full items-center justify-center text-center font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
            Chưa có owner
          </p>
        ) : (
          <ul className="space-y-1.5">
            {owners.map(([name, count]) => (
              <li
                key={name}
                className="flex items-baseline gap-1 border-b border-[var(--bg-muted)] pb-1.5 last:border-0 last:pb-0"
              >
                <span className="truncate text-sm font-medium text-ink">
                  {name}
                </span>
                <span className="font-mono text-xs text-[var(--text-2)]">·</span>
                <span className="font-mono text-xs text-[var(--text-2)]">
                  {count}H
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
