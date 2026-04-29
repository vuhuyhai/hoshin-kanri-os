'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'
import { postJson, FetchJsonError } from '@/lib/http/fetch-json'
import {
  GEMBA_BODY_MIN,
  GEMBA_BODY_MAX,
  type GembaTargetType,
} from '@/lib/gemba/types'

interface Props {
  targetType: GembaTargetType
  targetId: string
  targetLabel: string
  onSuccess?: () => void
}

export function GembaCommentForm({
  targetType,
  targetId,
  targetLabel,
  onSuccess,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedLen = body.trim().length
  const tooShort = trimmedLen < GEMBA_BODY_MIN
  const tooLong = trimmedLen > GEMBA_BODY_MAX
  const canSubmit = !submitting && !tooShort && !tooLong

  const handleCancel = () => {
    setExpanded(false)
    setBody('')
    setError(null)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await postJson('/api/gemba/create', {
        target_type: targetType,
        target_id: targetId,
        body: body.trim(),
      })
      toast.success('Đã gửi góp ý')
      setBody('')
      setExpanded(false)
      onSuccess?.()
    } catch (err) {
      if (err instanceof FetchJsonError) {
        const errBody = err.body as
          | { error?: string; retryAfter?: number }
          | null
        if (err.status === 429 && errBody?.retryAfter) {
          setError(`Quá nhiều góp ý. Thử lại sau ${errBody.retryAfter}s`)
        } else {
          setError(errBody?.error ?? err.message ?? 'Lỗi khi gửi góp ý')
        }
      } else {
        setError(err instanceof Error ? err.message : 'Lỗi không xác định')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-ink/70 hover:text-ink transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        Góp ý
      </button>
    )
  }

  return (
    <div
      className="border-2 border-ink p-3 space-y-2"
      style={{
        borderRadius: 'var(--radius-md)',
        background: 'var(--white)',
      }}
    >
      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink">
        Góp ý cho {targetLabel}
      </h4>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={submitting}
        placeholder="Quan sát của em — điều gì có thể cải thiện?"
        className="input-brutal w-full min-h-[90px] resize-y font-body text-sm"
        maxLength={GEMBA_BODY_MAX}
      />
      <div className="flex justify-between text-xs">
        <span
          style={{
            color: tooLong
              ? 'var(--brand)'
              : tooShort
                ? 'var(--text-3)'
                : 'var(--text-2)',
          }}
        >
          {tooShort
            ? `Cần ít nhất ${GEMBA_BODY_MIN} ký tự (${trimmedLen}/${GEMBA_BODY_MIN})`
            : `${trimmedLen}/${GEMBA_BODY_MAX} ký tự`}
        </span>
      </div>

      {error && (
        <p
          className="text-xs font-body"
          style={{ color: 'var(--brand)' }}
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-brutal-primary text-xs"
        >
          {submitting ? 'Đang gửi...' : 'Gửi góp ý'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="btn-brutal-secondary text-xs"
        >
          Hủy
        </button>
      </div>
    </div>
  )
}
