'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Check,
  Circle,
  Loader2,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  collectSuggestedFields,
  fetchAiPrefill,
  useCanvas,
  type XMatrixCanvasData,
} from './state/CanvasContext'
import { PrefillModal } from './PrefillModal'

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
  const { state, dispatch, xMatrixId } = useCanvas()
  const { saveStatus, lastSavedAt } = state.ui

  const [prefillModalOpen, setPrefillModalOpen] = useState(false)
  const [prefillData, setPrefillData] = useState<XMatrixCanvasData | null>(null)
  const [prefillSource, setPrefillSource] = useState<string | undefined>(
    undefined
  )
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [prefillError, setPrefillError] = useState<string | null>(null)

  const isBlank =
    state.data.vision === '' &&
    state.data.yearGoals.length === 0 &&
    state.data.hoshins.length === 0
  const canShowPrefillButton = isBlank

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

  const runPrefill = async () => {
    setPrefillLoading(true)
    setPrefillError(null)
    setPrefillData(null)
    setPrefillSource(undefined)

    const result = await fetchAiPrefill()

    if (!result.ok) {
      setPrefillError(result.error ?? 'Không thể tải gợi ý AI')
      setPrefillLoading(false)
      return
    }

    if (!result.hasPrefill || !result.data) {
      setPrefillModalOpen(false)
      setPrefillLoading(false)
      toast.warning(
        'Chưa có data Discovery để AI gợi ý. Hoàn thành SWOT + Vision Workshop trước.'
      )
      return
    }

    setPrefillData(result.data)
    setPrefillSource(result.source)
    setPrefillLoading(false)
  }

  const handlePrefillClick = () => {
    setPrefillModalOpen(true)
    void runPrefill()
  }

  const handleApplyPrefill = () => {
    if (!prefillData) return
    dispatch({
      type: 'SET_AI_PREFILL',
      payload: {
        data: prefillData,
        suggestedFields: collectSuggestedFields(prefillData),
      },
    })
    setPrefillModalOpen(false)
    setPrefillData(null)
    setPrefillSource(undefined)
    toast.success('AI gợi ý đã áp dụng. Bạn có thể edit từng phần.')
  }

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
          {canShowPrefillButton && (
            <button
              type="button"
              onClick={handlePrefillClick}
              disabled={prefillLoading}
              className="btn-yellow flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              AI gợi ý từ Discovery
            </button>
          )}
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

      <PrefillModal
        open={prefillModalOpen}
        onOpenChange={(open) => {
          setPrefillModalOpen(open)
          if (!open) {
            setPrefillData(null)
            setPrefillError(null)
            setPrefillSource(undefined)
          }
        }}
        loading={prefillLoading}
        error={prefillError}
        data={prefillData}
        source={prefillSource}
        onApply={handleApplyPrefill}
        onRetry={runPrefill}
      />
    </header>
  )
}
