'use client'

import { Loader2, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { XMatrixCanvasData } from './state/CanvasContext'

interface PrefillModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loading: boolean
  error: string | null
  data: XMatrixCanvasData | null
  source?: string
  onApply: () => void
  onRetry: () => void
}

function sourceLabel(source?: string): string | null {
  if (source === 'x_matrices_active') return 'Từ X-Matrix đang active'
  if (source === 'legacy_discovery_sessions')
    return 'Từ SWOT + Vision Workshop'
  return null
}

export function PrefillModal({
  open,
  onOpenChange,
  loading,
  error,
  data,
  source,
  onApply,
  onRetry,
}: PrefillModalProps) {
  const totalKpis = data
    ? data.hoshins.reduce((sum, h) => sum + h.kpis.length, 0)
    : 0
  const totalInits = data
    ? data.hoshins.reduce((sum, h) => sum + h.initiatives.length, 0)
    : 0
  const sourceText = sourceLabel(source)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl font-bold">
            <Sparkles className="h-5 w-5 text-[var(--brand)]" aria-hidden />
            Sensei gợi ý từ Discovery
          </DialogTitle>
          {sourceText && !loading && !error && (
            <DialogDescription>
              <span className="badge-brutal tag-brand">{sourceText}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2
                className="h-6 w-6 animate-spin text-[var(--brand)]"
                aria-hidden
              />
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-2)]">
                Sensei đang tổng hợp...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="border-2 border-[var(--destructive)] bg-[var(--bg)] p-4">
              <p className="font-mono text-sm text-[var(--destructive)]">
                {error}
              </p>
            </div>
          )}

          {!loading && !error && data && (
            <div className="flex flex-col gap-5">
              {data.vision.trim() !== '' && (
                <section>
                  <h3 className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                    🎯 Tầm nhìn
                  </h3>
                  <p className="border-l-4 border-[var(--brand)] bg-[var(--bg-muted)] px-3 py-2 italic text-[var(--ink)]">
                    {data.vision}
                  </p>
                </section>
              )}

              {data.yearGoals.length > 0 && (
                <section>
                  <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                    🎯 Mục tiêu năm ({data.yearGoals.length})
                  </h3>
                  <ul className="flex flex-col gap-1.5">
                    {data.yearGoals.map((g, i) => (
                      <li
                        key={i}
                        className="border-2 border-[var(--ink)] bg-[var(--bg)] px-3 py-2"
                      >
                        <span className="font-mono text-xs font-bold text-[var(--brand)]">
                          Y{i + 1}.
                        </span>{' '}
                        <span className="text-[var(--ink)]">{g.title}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.hoshins.length > 0 && (
                <section>
                  <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
                    🚀 Hoshins ({data.hoshins.length})
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {data.hoshins.map((h, i) => (
                      <li
                        key={h.id}
                        className="border-2 border-[var(--ink)] bg-[var(--bg)] p-3"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--brand)]">
                            H{i + 1}.
                          </span>
                          <span className="flex-1 font-display font-bold text-[var(--ink)]">
                            {h.title}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-wider text-[var(--text-3)]">
                          {h.owner_name && h.owner_name.trim() !== '' && (
                            <span>👤 {h.owner_name}</span>
                          )}
                          <span>⚡ {h.initiatives.length} hành động</span>
                          <span>📊 {h.kpis.length} KPI</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {(totalKpis > 0 || totalInits > 0) && (
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-2)]">
                  → {totalKpis} KPIs sẽ tự động tạo, {totalInits} hành động đề
                  xuất
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!loading && error && (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="btn-brutal-secondary"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={onRetry}
                className="btn-brutal-primary"
              >
                Thử lại
              </button>
            </>
          )}

          {!loading && !error && data && (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="btn-brutal-secondary"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={onApply}
                className="btn-brutal-primary"
              >
                Áp dụng
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
