'use client'

import type { MockHoshin } from '../XMatrixCanvasPage'

interface HoshinCardProps {
  hoshin: MockHoshin | null
  slotIndex: number
}

const PASTEL_CLASSES = [
  'card-yellow',
  'card-cyan',
  'card-pink',
  'card-lime',
  'card-peach',
] as const

export function HoshinCard({ hoshin, slotIndex }: HoshinCardProps) {
  const pastel = PASTEL_CLASSES[slotIndex % PASTEL_CLASSES.length]

  const handleClick = () => {
    console.log('HoshinCard clicked, will open modal in Task 3', { slotIndex })
  }

  if (!hoshin) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex h-[110px] w-full items-center justify-center border-2 border-dashed border-[var(--text-3)] bg-[var(--bg)]/40 p-2 transition-colors hover:bg-[var(--bg)]/70"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
          + Hoshin #{slotIndex + 1}
        </span>
      </button>
    )
  }

  const initCount = hoshin.initiatives.length
  const kpiCount = hoshin.kpis.length

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${pastel} flex h-[110px] w-full cursor-pointer flex-col gap-1 p-2 text-left transition-shadow hover:shadow-[var(--shadow-lg)]`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink">
          H{slotIndex + 1}
        </span>
        {hoshin.owner_name && (
          <span className="badge-brutal tag-brand text-[10px]">
            {hoshin.owner_name}
          </span>
        )}
      </div>
      <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-ink">
        {hoshin.title}
      </h3>
      <div className="mt-auto font-mono text-[10px] uppercase tracking-wider text-[var(--text-2)]">
        {initCount} INI · {kpiCount} KPI
      </div>
    </button>
  )
}
