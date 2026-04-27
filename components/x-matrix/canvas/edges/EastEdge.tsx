'use client'

import { useCanvas } from '../state/CanvasContext'
import { EducationalTooltip } from '../EducationalTooltip'

export function EastEdge() {
  const { state } = useCanvas()
  const allKpis = state.data.hoshins.flatMap((h) => h.kpis)

  return (
    <section id="canvas-edge-east" className="flex h-full flex-col gap-1">
      <div className="flex items-center gap-1">
        <h2 className="heading-overline text-xs">📊 KPIs</h2>
        <EducationalTooltip
          title="KPI là gì?"
          align="right"
          content={
            <>
              <p className="mb-2">KPI là số đo cụ thể. Phải có target rõ ràng.</p>
              <p className="italic text-text-2">
                ✅ &quot;Doanh thu 5 tỷ trong Q1&quot;
                <br />
                ❌ &quot;Tăng doanh thu&quot; — không đo được, không phải KPI thật.
              </p>
              <p className="mt-2 text-[11px] text-text-3">— Mỗi Hoshin tối đa 2 KPIs để tập trung.</p>
            </>
          }
        />
      </div>
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
