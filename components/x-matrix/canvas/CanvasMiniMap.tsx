'use client'

import { useCanvas } from './state/CanvasContext'

interface Quadrant {
  label: string
  filled: boolean
  targetId: string
}

export function CanvasMiniMap() {
  const { state } = useCanvas()
  const { yearGoals, hoshins } = state.data

  const hasYearGoals = yearGoals.length > 0
  const hasHoshins = hoshins.length > 0
  const hasKpis = hoshins.some((h) => h.kpis.length > 0)
  const hasOwners = hoshins.some(
    (h) => h.owner_name && h.owner_name.trim().length > 0
  )

  const quadrants: Quadrant[] = [
    { label: 'Mục tiêu', filled: hasYearGoals, targetId: 'canvas-edge-north' },
    { label: 'Hoshins', filled: hasHoshins, targetId: 'canvas-edge-south' },
    { label: 'KPIs', filled: hasKpis, targetId: 'canvas-edge-east' },
    { label: 'Owners', filled: hasOwners, targetId: 'canvas-edge-west' },
  ]

  const handleScrollTo = (targetId: string) => {
    const element = document.getElementById(targetId)
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="X-Matrix mini-map"
      className="sticky top-0 z-20 border-b-[3px] border-ink bg-[var(--bg)] px-4 py-2 md:hidden"
    >
      <div className="grid grid-cols-2 gap-1.5">
        {quadrants.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => handleScrollTo(q.targetId)}
            className="flex items-center justify-between border-2 border-ink bg-[var(--bg-paper)] px-2 py-1.5 transition-colors hover:bg-[var(--accent-cyan)] active:bg-[var(--accent-cyan)]"
          >
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
              {q.label}
            </span>
            <span
              aria-label={q.filled ? 'Đã điền' : 'Chưa điền'}
              className={`h-2 w-2 ${q.filled ? 'bg-[var(--brand)]' : 'bg-[var(--text-3)]'}`}
            />
          </button>
        ))}
      </div>
    </nav>
  )
}
