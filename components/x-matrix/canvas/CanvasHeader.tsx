'use client'

import { Check } from 'lucide-react'

export function CanvasHeader() {
  return (
    <header className="w-full border-b-[3px] border-ink bg-[var(--bg)] px-4 py-4 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="overline">X-Matrix Canvas</span>
          <div className="flex items-center gap-2 border-2 border-ink bg-[var(--accent-cyan)] px-3 py-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              Năm 2026
            </span>
          </div>
          <span className="badge-brutal tag-brand">Bản nháp</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-2)]">
          <Check className="h-4 w-4 text-[var(--brand)]" aria-hidden />
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            Đã lưu
          </span>
        </div>
      </div>
    </header>
  )
}
