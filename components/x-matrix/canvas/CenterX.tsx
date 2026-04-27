'use client'

import { Fragment } from 'react'

export function CenterX() {
  return (
    <div className="flex h-full flex-col">
      <p className="heading-overline text-center text-xs mb-2">
        Ma trận liên kết
      </p>
      <div className="flex-1 grid grid-cols-[40px_1fr_1fr_1fr] grid-rows-[24px_1fr_1fr_1fr_1fr_1fr] gap-px bg-ink p-px">
        <div className="bg-[var(--bg-paper)]" />
        <div className="bg-[var(--bg-paper)] text-center text-xs font-mono py-1">
          Y1
        </div>
        <div className="bg-[var(--bg-paper)] text-center text-xs font-mono py-1">
          Y2
        </div>
        <div className="bg-[var(--bg-paper)] text-center text-xs font-mono py-1">
          Y3
        </div>

        {[1, 2, 3, 4, 5].map((h) => (
          <Fragment key={h}>
            <div className="bg-[var(--bg-paper)] text-center text-xs font-mono py-1 self-center">
              H{h}
            </div>
            {[1, 2, 3].map((y) => (
              <button
                key={y}
                type="button"
                disabled
                aria-label={`H${h} × Y${y} correlation (M-Hoshin-2)`}
                className="bg-[var(--bg)] hover:bg-[var(--accent-cyan)]/20 transition-colors flex items-center justify-center text-[var(--text-3)] text-sm"
              >
                ·
              </button>
            ))}
          </Fragment>
        ))}
      </div>
      <p className="text-xs text-[var(--text-3)] text-center mt-1 italic">
        Ma trận tương quan — sẽ active ở M-Hoshin-2
      </p>
    </div>
  )
}
