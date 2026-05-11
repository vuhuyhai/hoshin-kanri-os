'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, X, AlertTriangle } from 'lucide-react'
import { fetchJson, FetchJsonError } from '@/lib/http/fetch-json'
import type { CarryOverEntry } from '@/lib/annual-review/types'
import type { HoshinFlag } from '@/lib/annual-review/flagging'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewId: string
  oldYear: number
  flags: HoshinFlag[]
  carryOvers: CarryOverEntry[]
}

export function TransitionPreviewModal({
  open,
  onOpenChange,
  reviewId,
  oldYear,
  flags,
  carryOvers,
}: Props) {
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const newYear = oldYear + 1

  const decisionMap = new Map(carryOvers.map((c) => [c.sourceHoshinId, c]))

  const carriedHoshins = flags
    .map((flag) => {
      const decision = decisionMap.get(flag.hoshinId)
      const action = decision?.decision ?? 'pending'

      if (action === 'drop' || action === 'pending') return null

      return {
        hoshinId: flag.hoshinId,
        originalTitle: flag.hoshinTitle,
        newTitle:
          action === 'modify' && decision?.modifiedTitle
            ? decision.modifiedTitle
            : flag.hoshinTitle,
        action: action as 'carry' | 'modify',
        rationale: decision?.rationale,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)

  const droppedHoshins = flags.filter((f) => {
    const d = decisionMap.get(f.hoshinId)
    return d?.decision === 'drop'
  })

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const result = await fetchJson<{
        newXMatrixId: string
        oldXMatrixId: string
        year: number
      }>(`/api/annual-review/${reviewId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newYear }),
      })

      toast.success(`Đã chuyển sang năm ${result.year}`)
      onOpenChange(false)
      router.push('/dashboard/x-matrix')
      router.refresh()
    } catch (err) {
      const msg =
        err instanceof FetchJsonError ? err.message : 'Chuyển năm thất bại'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-ink/60 z-50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-bg w-[90vw] max-w-3xl max-h-[90vh] border-2 border-ink shadow-[8px_8px_0_var(--ink)] flex flex-col">
          <header className="flex items-start justify-between gap-4 p-6 border-b-2 border-ink">
            <div>
              <span className="nb-sticker">YEAR TRANSITION</span>
              <Dialog.Title className="font-display font-bold text-2xl text-ink mt-2">
                Chuyển từ {oldYear} → {newYear}
              </Dialog.Title>
              <p className="text-text-2 text-sm mt-1">
                Preview các Hoshins sẽ carry sang năm mới. Sau khi confirm,
                matrix {oldYear} archive, matrix {newYear} active.
              </p>
            </div>
            <Dialog.Close className="p-1 hover:bg-bg-paper transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {carriedHoshins.length > 0 ? (
              <section>
                <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-kpi-healthy-strong" />
                  Carry sang {newYear} ({carriedHoshins.length})
                </h3>
                <div className="space-y-3">
                  {carriedHoshins.map((h) => (
                    <div
                      key={h.hoshinId}
                      className="border-2 border-ink p-3 bg-accent-yellow"
                    >
                      {h.action === 'modify' ? (
                        <div>
                          <div className="text-text-3 text-xs line-through">
                            {h.originalTitle}
                          </div>
                          <div className="font-display font-bold text-ink">
                            {h.newTitle}
                          </div>
                          <span className="inline-block mt-1 text-xs bg-accent-cyan border border-ink px-2 py-0.5">
                            MODIFIED
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="font-display font-bold text-ink">
                            {h.newTitle}
                          </div>
                          <span className="inline-block mt-1 text-xs bg-card border border-ink px-2 py-0.5">
                            CARRY AS-IS
                          </span>
                        </div>
                      )}
                      {h.rationale && (
                        <p className="text-text-2 text-xs mt-2 italic">
                          &ldquo;{h.rationale}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="card-brutal p-4 bg-bg-paper">
                <p className="text-text-2 text-sm">
                  Không có Hoshin nào carry sang năm mới. Matrix {newYear} sẽ
                  blank, bạn xây mới từ đầu.
                </p>
              </section>
            )}

            {droppedHoshins.length > 0 && (
              <section>
                <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                  <X className="w-5 h-5 text-text-3" />
                  Drop ({droppedHoshins.length})
                </h3>
                <div className="space-y-2">
                  {droppedHoshins.map((h) => (
                    <div
                      key={h.hoshinId}
                      className="border-2 border-ink p-2 bg-bg-paper opacity-60"
                    >
                      <div className="text-text-2 text-sm line-through">
                        {h.hoshinTitle}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="card-brutal p-4 bg-accent-pink">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-ink shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-ink text-sm">
                    Lưu ý
                  </p>
                  <ul className="text-text-2 text-xs mt-1 space-y-0.5 list-disc pl-4">
                    <li>Matrix {oldYear} chuyển sang archived (read-only)</li>
                    <li>KPIs của {oldYear} deactivate (giữ history)</li>
                    <li>
                      Matrix {newYear} tạo mới với hoshins carry-over
                      (initiatives + KPIs reset, bạn cần điền lại)
                    </li>
                    <li>Year goals + vision không carry — bạn xây mới cho {newYear}</li>
                    <li>Action không thể undo — chỉ làm khi chắc chắn</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <footer className="flex items-center justify-end gap-3 p-6 border-t-2 border-ink bg-bg-paper">
            <Dialog.Close
              className="btn-brutal-secondary"
              disabled={submitting}
            >
              Quay lại
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="btn-brutal-primary disabled:opacity-50"
            >
              {submitting ? 'Đang chuyển...' : `Confirm → chuyển sang ${newYear}`}
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
