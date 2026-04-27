'use client'

import { Fragment } from 'react'
import { EducationalTooltip } from './EducationalTooltip'

export function CenterX() {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-center gap-1">
        <p className="heading-overline text-center text-xs">Ma trận liên kết</p>
        <EducationalTooltip
          title="Ma trận liên kết để làm gì?"
          content={
            <>
              <p className="mb-2">Bạn sẽ đánh dấu mức độ Hoshin liên kết với Year Goal.</p>
              <ul className="space-y-1 text-[11px]">
                <li>● <strong>Mạnh:</strong> Hoshin này đóng góp lớn cho Year Goal</li>
                <li>◐ <strong>Vừa:</strong> Đóng góp một phần</li>
                <li>○ <strong>Yếu:</strong> Liên quan ít</li>
                <li>- <strong>Không:</strong> Không liên quan</li>
              </ul>
              <p className="mt-2 text-[11px] italic text-text-3">
                Nếu một Hoshin không có ● với bất kỳ Year Goal nào → có thể đó không phải Hoshin thật.
              </p>
              <p className="mt-1 text-[11px] text-text-3">— Sẽ active ở M-Hoshin-2.</p>
            </>
          }
        />
      </div>
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
