'use client'

const QUADRANTS = [
  { label: 'Mục tiêu', filled: true },
  { label: 'Hoshins', filled: true },
  { label: 'KPIs', filled: false },
  { label: 'Owners', filled: false },
] as const

export function CanvasMiniMap() {
  return (
    <nav
      aria-label="X-Matrix mini-map"
      className="sticky top-0 z-30 border-b-[3px] border-ink bg-[var(--bg)] px-4 py-2 md:hidden"
    >
      <div className="grid grid-cols-2 gap-1.5">
        {QUADRANTS.map((q) => (
          <div
            key={q.label}
            className="flex items-center justify-between border-2 border-ink bg-[var(--bg-paper)] px-2 py-1.5"
          >
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
              {q.label}
            </span>
            <span
              aria-label={q.filled ? 'Đã điền' : 'Chưa điền'}
              className={`h-2 w-2 ${q.filled ? 'bg-[var(--brand)]' : 'bg-[var(--text-3)]'}`}
            />
          </div>
        ))}
      </div>
    </nav>
  )
}
