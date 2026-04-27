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

  if (!hoshin) {
    return (
      <div
        role="presentation"
        className="flex min-h-[160px] w-full items-center justify-center border-2 border-dashed border-[var(--text-3)] bg-[var(--bg)]/40 p-4"
      >
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-3)]">
          + Hoshin #{slotIndex + 1}
        </span>
      </div>
    )
  }

  const initCount = hoshin.initiatives.length
  const kpiCount = hoshin.kpis.length

  return (
    <article className={`${pastel} flex min-h-[160px] flex-col gap-3 p-4`}>
      <div className="flex items-center justify-between gap-2">
        <span className="overline text-ink">H{slotIndex + 1}</span>
        {hoshin.owner_name && (
          <span className="badge-brutal tag-brand">{hoshin.owner_name}</span>
        )}
      </div>
      <h3 className="text-base font-bold leading-tight text-ink">
        {hoshin.title}
      </h3>
      <div className="mt-auto flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-ink">
        <span>
          {initCount} initiative{initCount !== 1 ? 's' : ''}
        </span>
        <span aria-hidden>·</span>
        <span>
          {kpiCount} KPI{kpiCount !== 1 ? 's' : ''}
        </span>
      </div>
    </article>
  )
}
