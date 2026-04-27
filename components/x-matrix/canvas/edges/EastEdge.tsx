'use client'

import { useCanvas } from '../state/CanvasContext'

export function EastEdge() {
  const { state } = useCanvas()
  const allKpis = state.data.hoshins.flatMap((h) => h.kpis)

  return (
    <section className="flex h-full flex-col gap-1">
      <h2 className="heading-overline text-xs">📊 KPIs</h2>
      <div className="flex-1 overflow-y-auto border-[3px] border-ink bg-[var(--bg)] p-2 shadow-[var(--shadow-md)]">
        {allKpis.length === 0 ? (
          <p className="flex h-full items-center justify-center text-center font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
            Chưa có KPI
          </p>
        ) : (
          <ul className="space-y-1.5">
            {allKpis.map((kpi) => (
              <li
                key={kpi.id}
                className="border-b border-[var(--bg-muted)] pb-1.5 last:border-0 last:pb-0"
              >
                <p className="truncate text-sm font-medium leading-tight text-ink">
                  {kpi.name}
                </p>
                <p className="font-mono text-xs text-[var(--text-2)]">
                  {kpi.targetValue} {kpi.unit}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
