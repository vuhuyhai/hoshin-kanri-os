'use client'

import { useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import type { GembaUnreadSummary } from '@/lib/gemba/types'
import { trackGembaBannerViewed } from '@/lib/analytics/events'

interface Props {
  summary: GembaUnreadSummary
  canModerate: boolean
}

export function GembaBanner({ summary, canModerate }: Props) {
  // useRef guard tránh fire 2 lần do StrictMode double-effect.
  // Hooks gọi unconditional TRƯỚC early return null.
  const tracked = useRef(false)
  const distinctTargets = summary.by_target.length

  useEffect(() => {
    if (tracked.current) return
    if (!canModerate || summary.total_open === 0) return
    tracked.current = true
    trackGembaBannerViewed({
      total_open: summary.total_open,
      distinct_targets: distinctTargets,
    })
  }, [summary.total_open, canModerate, distinctTargets])

  if (!canModerate || summary.total_open === 0) return null

  return (
    <section
      className="card-yellow p-5 mb-6"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <header className="flex items-start gap-3">
        <MessageCircle
          className="w-6 h-6 shrink-0 mt-1"
          style={{ color: 'var(--brand)' }}
        />
        <div className="flex-1">
          <div className="mb-1">
            <span className="nb-sticker">GÓP Ý</span>
          </div>
          <h3 className="font-display font-bold text-xl text-ink">
            {summary.total_open} góp ý chưa xử lý
          </h3>
          <p className="text-text-2 text-sm mt-1">
            Trên {distinctTargets} mục. Mở comment thread tại từng KPI để ghi
            nhận hoặc đánh dấu xử lý.
          </p>
        </div>
      </header>
    </section>
  )
}
