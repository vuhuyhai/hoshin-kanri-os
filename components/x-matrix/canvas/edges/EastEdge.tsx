'use client'

import type { MockHoshin } from '../XMatrixCanvasPage'

interface EastEdgeProps {
  hoshins: MockHoshin[]
}

export function EastEdge({ hoshins }: EastEdgeProps) {
  const allKpis = hoshins.flatMap((h) => h.kpis)

  return (
    <section className="space-y-3">
      <h2 className="heading-overline">📊 ĐO BẰNG GÌ</h2>
      <div className="border-[3px] border-ink bg-[var(--bg)] p-4 shadow-[var(--shadow-md)]">
        {allKpis.length === 0 ? (
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
            Chưa có KPI
          </p>
        ) : (
          <ul className="space-y-2">
            {allKpis.map((kpi) => (
              <li
                key={kpi.id}
                className="border-b border-[var(--bg-muted)] pb-2 last:border-0 last:pb-0"
              >
                <p className="text-sm font-bold leading-tight text-ink">
                  {kpi.name}
                </p>
                <p className="font-mono text-xs text-[var(--text-2)]">
                  Mục tiêu: {kpi.targetValue} {kpi.unit}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
