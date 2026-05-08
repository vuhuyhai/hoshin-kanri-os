'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useCanEdit, useCanvas } from './state/CanvasContext'
import { useCanvasValidation } from './state/useCanvasValidation'
import { postJson } from '@/lib/http/fetch-json'
import { trackXMatrixCompleted } from '@/lib/analytics/events'
import type { XMatrixData } from '@/lib/x-matrix/types'

interface SubmitBarProps {
  orgId: string
}

export function SubmitBar({ orgId }: SubmitBarProps) {
  const canEdit = useCanEdit()
  const { state } = useCanvas()
  const router = useRouter()
  const { errors, warnings, completeness, canSubmit } = useCanvasValidation(
    state.data,
    state.ui.correlations,
  )
  const [errorsExpanded, setErrorsExpanded] = useState(false)
  const [warningsExpanded, setWarningsExpanded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!canEdit) return null

  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0
  const showErrorsPanel = errorsExpanded && hasErrors
  const showWarningsPanel = warningsExpanded && hasWarnings

  const handleSubmit = async () => {
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }
    setIsSaving(true)
    try {
      // XMatrixCanvasData.yearGoals are objects; the API/validateXMatrix
      // contract still uses string[]. Map titles before POST.
      const payload: XMatrixData = {
        vision: state.data.vision,
        yearGoals: state.data.yearGoals.map((g) => g.title),
        hoshins: state.data.hoshins,
      }

      const json = await postJson<{ kpisCreated: number; xMatrixId: string }>(
        '/api/x-matrix/create',
        {
          data: payload,
          year: new Date().getFullYear(),
          orgId,
        },
      )

      trackXMatrixCompleted({
        hoshinCount: state.data.hoshins.length,
        kpisCreated: json.kpisCreated,
        initiativesCount: state.data.hoshins.reduce(
          (sum, h) => sum + (h.initiatives?.length ?? 0),
          0,
        ),
        hasPrefill: false,
      })

      toast.success(`X-Matrix đã lưu! ${json.kpisCreated} KPIs tự động tạo.`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="sticky bottom-0 z-20 border-t-[3px] border-ink bg-[var(--bg)]">
      {showWarningsPanel && (
        <div className="border-b-2 border-ink bg-[var(--accent-yellow)] px-4 py-3 lg:px-8">
          <ul className="max-h-40 space-y-2 overflow-y-auto font-mono text-xs">
            {warnings.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span aria-hidden>⚠</span>
                <div>
                  <p className="font-bold">{w.targetLabel}</p>
                  <p className="mt-0.5 italic text-text-2">{w.message}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showErrorsPanel && (
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
            {hasWarnings && (
              <button
                type="button"
                onClick={() => setWarningsExpanded((v) => !v)}
                className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-amber-600 hover:underline"
                aria-expanded={warningsExpanded}
              >
                <AlertTriangle className="h-4 w-4" aria-hidden />
                {warnings.length} cảnh báo
                {warningsExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSaving}
              className="btn-brutal-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu X-Matrix'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
