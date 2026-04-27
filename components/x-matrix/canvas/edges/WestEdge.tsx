'use client'

import type { MockHoshin } from '../XMatrixCanvasPage'

interface WestEdgeProps {
  hoshins: MockHoshin[]
}

export function WestEdge({ hoshins }: WestEdgeProps) {
  const ownerCounts = new Map<string, number>()
  for (const h of hoshins) {
    const name = h.owner_name?.trim()
    if (!name) continue
    ownerCounts.set(name, (ownerCounts.get(name) ?? 0) + 1)
  }
  const owners = Array.from(ownerCounts.entries())

  return (
    <section className="space-y-3">
      <h2 className="heading-overline">👥 AI CHỊU TRÁCH NHIỆM</h2>
      <div className="border-[3px] border-ink bg-[var(--bg)] p-4 shadow-[var(--shadow-md)]">
        {owners.length === 0 ? (
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
            Chưa giao
          </p>
        ) : (
          <ul className="space-y-2">
            {owners.map(([name, count]) => (
              <li
                key={name}
                className="flex items-center justify-between gap-2 border-b border-[var(--bg-muted)] pb-2 last:border-0 last:pb-0"
              >
                <span className="text-sm font-bold text-ink">{name}</span>
                <span className="font-mono text-xs text-[var(--text-2)]">
                  {count} Hoshin{count > 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
