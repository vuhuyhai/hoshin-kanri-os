'use client'

export function SubmitBar() {
  return (
    <div className="sticky bottom-0 z-20 border-t-[3px] border-ink bg-[var(--bg)] px-4 py-3 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-2.5 w-32 overflow-hidden border-2 border-ink bg-[var(--bg-paper)]">
            <div className="h-full w-[60%] bg-[var(--brand)]" />
          </div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            60% hoàn thành
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-2)]">
            Đủ điều kiện submit
          </span>
          <button type="button" className="btn-brutal-primary" disabled>
            Lưu X-Matrix
          </button>
        </div>
      </div>
    </div>
  )
}
