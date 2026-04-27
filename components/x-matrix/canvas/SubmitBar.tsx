'use client'

import { useState } from 'react'
import { AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useCanvas } from './state/CanvasContext'
import { useCanvasValidation } from './state/useCanvasValidation'

export function SubmitBar() {
  const { state } = useCanvas()
  const { errors, completeness, canSubmit } = useCanvasValidation(state.data)
  const [errorsExpanded, setErrorsExpanded] = useState(false)

  const hasErrors = errors.length > 0
  const showPanel = errorsExpanded && hasErrors

  const handleSubmit = () => {
    console.log('[T3c] Submit placeholder, will wire API in Task 6', state.data)
  }

  return (
    <div className="sticky bottom-0 z-20 border-t-[3px] border-ink bg-[var(--bg)]">
      {showPanel && (
        <div className="border-b-2 border-ink bg-[var(--bg-paper)] px-4 py-3 lg:px-8">
          <ul className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs text-[var(--destructive)]">
            {errors.map((err, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span aria-hidden>•</span>
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-4 py-3 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-2.5 w-32 overflow-hidden border-2 border-ink bg-[var(--bg-paper)]">
              <div
                className="h-full bg-[var(--brand)] transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              {completeness}% hoàn thành
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasErrors ? (
              <button
                type="button"
                onClick={() => setErrorsExpanded((v) => !v)}
                className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--destructive)] hover:underline"
                aria-expanded={errorsExpanded}
              >
                <AlertCircle className="h-4 w-4" aria-hidden />
                {errors.length} lỗi cần sửa
                {errorsExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            ) : (
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--brand)]">
                <Check className="h-4 w-4" aria-hidden />
                Đủ điều kiện submit
              </span>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-brutal-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Lưu X-Matrix
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
