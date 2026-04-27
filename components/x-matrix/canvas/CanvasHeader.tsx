'use client'

import { AlertTriangle, Check, Circle, Loader2, Trash2 } from 'lucide-react'
import { useCanvas } from './state/CanvasContext'

interface CanvasHeaderProps {
  storageKey: string
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CanvasHeader({ storageKey }: CanvasHeaderProps) {
  const { state, dispatch } = useCanvas()
  const { saveStatus, lastSavedAt } = state.ui

  const indicator = (() => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" aria-hidden />,
          text: 'Đang lưu...',
          className: 'text-[var(--text-2)]',
        }
      case 'saved':
        return {
          icon: <Check className="h-4 w-4 text-[var(--brand)]" aria-hidden />,
          text: lastSavedAt ? `Đã lưu lúc ${formatTime(lastSavedAt)}` : 'Đã lưu',
          className: 'text-[var(--text-2)]',
        }
      case 'error':
        return {
          icon: (
            <AlertTriangle
              className="h-4 w-4 text-[var(--destructive)]"
              aria-hidden
            />
          ),
          text: 'Lỗi lưu nháp',
          className: 'text-[var(--destructive)]',
        }
      case 'idle':
      default:
        return {
          icon: <Circle className="h-4 w-4 text-[var(--text-3)]" aria-hidden />,
          text: 'Chưa có thay đổi',
          className: 'text-[var(--text-3)]',
        }
    }
  })()

  const handleClearDraft = () => {
    if (typeof window === 'undefined') return
    const confirmed = window.confirm(
      'Xóa toàn bộ bản nháp? Không thể hoàn tác.'
    )
    if (!confirmed) return
    try {
      localStorage.removeItem(storageKey)
    } catch (err) {
      console.warn('[Canvas] Failed to remove localStorage draft:', err)
    }
    dispatch({ type: 'CLEAR_DRAFT' })
  }

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
        <div className="flex flex-wrap items-center gap-4">
          <div className={`flex items-center gap-2 ${indicator.className}`}>
            {indicator.icon}
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              {indicator.text}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--text-3)] underline-offset-2 transition-colors hover:text-[var(--destructive)] hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Xóa nháp
          </button>
        </div>
      </div>
    </header>
  )
}
