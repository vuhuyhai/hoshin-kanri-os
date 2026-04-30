'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GembaCommentForm } from '@/components/gemba/GembaCommentForm'
import { GembaCommentThread } from '@/components/gemba/GembaCommentThread'
import type { GembaCommentWithAuthor } from '@/lib/gemba/types'

interface Props {
  open: boolean
  onClose: () => void
  hoshinId: string
  hoshinTitle: string
  // null khi org chưa save matrix lần đầu (canvas draft chỉ trong
  // localStorage). Comment cần target_id stable → gate form ở UI side
  // tránh orphan ngay từ nguồn (Q3 design audit V1 edge case).
  xMatrixId: string | null
  comments: GembaCommentWithAuthor[]
  canModerate: boolean
  // M-Hoshin-6.1 hotfix: hoshin.id có nằm trong vision_json đã save
  // chưa. Smart /new route load existing matrix → xMatrixId truthy
  // nhưng Hoshin mới (client-side ADD_HOSHIN) chưa persist → submit
  // sẽ orphan. Gate form ở đây thay vì chỉ check xMatrixId.
  isPersisted: boolean
}

export function GembaModal({
  open,
  onClose,
  hoshinId,
  hoshinTitle,
  xMatrixId,
  comments,
  canModerate,
  isPersisted,
}: Props) {
  const titleLabel = hoshinTitle.trim() || '(Chưa đặt tên)'
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl">
            Góp ý cho Hoshin
          </DialogTitle>
          <DialogDescription>{titleLabel}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {!isPersisted ? (
            <div
              className="border-2 border-ink p-3 text-sm font-body text-ink"
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-yellow)',
              }}
            >
              <p className="font-semibold">
                ⚠️ Hoshin này chưa được lưu vào X-Matrix
              </p>
              <p className="mt-1">
                Click <strong>‘Lưu X-Matrix’</strong> ở thanh dưới để có
                thể nhận góp ý cho Hoshin này.
              </p>
            </div>
          ) : xMatrixId === null ? (
            <div
              className="border-2 border-ink p-3 text-sm font-body text-ink"
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-yellow)',
              }}
            >
              Lưu X-Matrix trước khi thêm góp ý cho Hoshin này.
            </div>
          ) : (
            <GembaCommentForm
              targetType="hoshin"
              targetId={hoshinId}
              targetLabel={`Hoshin: ${titleLabel}`}
            />
          )}
          <GembaCommentThread
            targetType="hoshin"
            targetId={hoshinId}
            initialComments={comments}
            canModerate={canModerate}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
