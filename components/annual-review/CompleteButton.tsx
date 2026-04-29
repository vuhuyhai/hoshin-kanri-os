'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { fetchJson, FetchJsonError } from '@/lib/http/fetch-json'
import type {
  A3Reflection,
  KpiActualEntry,
  CarryOverEntry,
  ReviewStatus,
} from '@/lib/annual-review/types'
import type { ReviewKpi } from '@/lib/annual-review/queries'
import type { HoshinFlag } from '@/lib/annual-review/flagging'
import { TransitionPreviewModal } from './TransitionPreviewModal'

interface Props {
  reviewId: string
  a3: A3Reflection
  kpiActuals: KpiActualEntry[]
  kpis: ReviewKpi[]
  flags: HoshinFlag[]
  carryOvers: CarryOverEntry[]
  status: ReviewStatus
  matrixYear: number
}

interface ValidationError {
  field: string
  message: string
}

const MIN_A3_CHARS = 50

function validate(
  props: Pick<
    Props,
    'a3' | 'kpiActuals' | 'kpis' | 'flags' | 'carryOvers'
  >,
): ValidationError[] {
  const errors: ValidationError[] = []

  const a3Fields: Array<[keyof A3Reflection, string]> = [
    ['background', 'Bối cảnh'],
    ['currentState', 'Hiện trạng'],
    ['targetGap', 'Khoảng cách target'],
    ['nextAction', 'Hành động tiếp theo'],
  ]
  for (const [field, label] of a3Fields) {
    if (props.a3[field].trim().length < MIN_A3_CHARS) {
      errors.push({
        field,
        message: `${label} cần ít nhất ${MIN_A3_CHARS} ký tự`,
      })
    }
  }

  const actualMap = new Map(props.kpiActuals.map((a) => [a.kpiId, a]))
  for (const kpi of props.kpis) {
    if (!actualMap.has(kpi.id)) {
      errors.push({
        field: `kpi-${kpi.id}`,
        message: `KPI "${kpi.name}" chưa có actual value`,
      })
    }
  }

  const decisionMap = new Map(
    props.carryOvers.map((c) => [c.sourceHoshinId, c]),
  )
  for (const flag of props.flags) {
    if (!flag.shouldCarryOver) continue
    const decision = decisionMap.get(flag.hoshinId)
    if (!decision || decision.decision === 'pending') {
      errors.push({
        field: `hoshin-${flag.hoshinId}`,
        message: `Hoshin "${flag.hoshinTitle}" có KPI red — cần quyết định carry/modify/drop`,
      })
    }
    if (decision?.decision === 'modify' && !decision.modifiedTitle?.trim()) {
      errors.push({
        field: `hoshin-${flag.hoshinId}-title`,
        message: `Hoshin "${flag.hoshinTitle}" chọn modify nhưng chưa có title mới`,
      })
    }
  }

  return errors
}

export function CompleteButton(props: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [transitionOpen, setTransitionOpen] = useState(false)
  const router = useRouter()

  if (props.status === 'transitioned') {
    return (
      <div className="card-yellow p-4 text-center">
        <p className="font-display font-bold text-ink">
          Review đã chuyển năm
        </p>
      </div>
    )
  }

  if (props.status === 'completed') {
    return (
      <>
        <div className="card-brutal p-6 sticky bottom-4 bg-white">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg text-ink">
                ✓ Review hoàn tất
              </h3>
              <p className="text-text-2 text-sm mt-1">
                Sẵn sàng chuyển sang năm {props.matrixYear + 1}. Hoshins
                carry-over sẽ migrate, matrix cũ archive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTransitionOpen(true)}
              className="btn-brutal-primary whitespace-nowrap shrink-0"
            >
              Chuyển sang năm {props.matrixYear + 1} →
            </button>
          </div>
        </div>

        <TransitionPreviewModal
          open={transitionOpen}
          onOpenChange={setTransitionOpen}
          reviewId={props.reviewId}
          oldYear={props.matrixYear}
          flags={props.flags}
          carryOvers={props.carryOvers}
        />
      </>
    )
  }

  const errors = validate({
    a3: props.a3,
    kpiActuals: props.kpiActuals,
    kpis: props.kpis,
    flags: props.flags,
    carryOvers: props.carryOvers,
  })

  const canComplete = errors.length === 0

  const handleComplete = async () => {
    if (!canComplete) {
      toast.error(`Còn ${errors.length} mục cần hoàn tất`)
      return
    }

    if (
      !window.confirm(
        `Hoàn tất review năm ${props.matrixYear}? Sau khi complete, bạn có thể chuyển sang năm mới (archive matrix cũ).`,
      )
    ) {
      return
    }

    setSubmitting(true)
    try {
      await fetchJson(`/api/annual-review/${props.reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      toast.success('Review đã hoàn tất')
      router.refresh()
    } catch (err) {
      const msg =
        err instanceof FetchJsonError ? err.message : 'Hoàn tất thất bại'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card-brutal p-6 sticky bottom-4 bg-white">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-ink">
            Hoàn tất review
          </h3>
          {errors.length > 0 ? (
            <details className="mt-2">
              <summary className="text-red-700 text-sm font-medium cursor-pointer">
                Còn {errors.length} mục cần hoàn tất (click xem)
              </summary>
              <ul className="mt-2 space-y-1 text-xs text-text-2">
                {errors.slice(0, 5).map((e, i) => (
                  <li key={i}>• {e.message}</li>
                ))}
                {errors.length > 5 && (
                  <li className="italic">
                    ...và {errors.length - 5} mục khác
                  </li>
                )}
              </ul>
            </details>
          ) : (
            <p className="text-green-700 text-sm mt-1">✓ Sẵn sàng hoàn tất</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleComplete}
          disabled={!canComplete || submitting}
          className="btn-brutal-primary whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Đang lưu...' : 'Hoàn tất review →'}
        </button>
      </div>
    </div>
  )
}
