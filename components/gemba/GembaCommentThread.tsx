'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { fetchJson, FetchJsonError } from '@/lib/http/fetch-json'
import type {
  GembaCommentWithAuthor,
  GembaStatus,
  GembaTargetType,
} from '@/lib/gemba/types'
import {
  trackGembaCommentAcknowledged,
  trackGembaCommentResolved,
} from '@/lib/analytics/events'

interface Props {
  targetType: GembaTargetType
  targetId: string
  initialComments: GembaCommentWithAuthor[]
  canModerate: boolean
  onUpdate?: () => void
}

const STATUS_LABELS: Record<GembaStatus, string> = {
  open: 'Mới',
  acknowledged: 'Đã ghi nhận',
  resolved: 'Đã xử lý',
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function statusStyle(status: GembaStatus): React.CSSProperties {
  if (status === 'open') {
    return {
      background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
      color: 'var(--brand)',
      borderColor: 'var(--brand)',
    }
  }
  if (status === 'acknowledged') {
    return {
      background: 'var(--accent-yellow)',
      color: 'var(--ink)',
      borderColor: 'var(--ink)',
    }
  }
  return {
    background: '#dcfce7',
    color: '#166534',
    borderColor: '#86efac',
  }
}

export function GembaCommentThread({
  targetType,
  targetId,
  initialComments,
  canModerate,
  onUpdate,
}: Props) {
  const [comments, setComments] =
    useState<GembaCommentWithAuthor[]>(initialComments)
  const [expanded, setExpanded] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (comments.length === 0) return null

  const openCount = comments.filter((c) => c.status === 'open').length

  const handleStatusChange = async (
    commentId: string,
    newStatus: 'acknowledged' | 'resolved',
  ) => {
    setLoadingId(commentId)
    try {
      // postJson không nhận method override (Omit<RequestInit, 'method'|'body'>)
      // nên dùng fetchJson trực tiếp cho PATCH.
      await fetchJson(`/api/gemba/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const nowIso = new Date().toISOString()
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                status: newStatus,
                ...(newStatus === 'acknowledged'
                  ? { acknowledged_at: nowIso }
                  : { resolved_at: nowIso }),
              }
            : c,
        ),
      )
      const eventProps = {
        target_type: targetType,
        target_id: targetId,
        comment_id: commentId,
      }
      if (newStatus === 'acknowledged') {
        trackGembaCommentAcknowledged(eventProps)
      } else {
        trackGembaCommentResolved(eventProps)
      }
      toast.success(
        newStatus === 'acknowledged' ? 'Đã ghi nhận' : 'Đã đánh dấu xử lý',
      )
      onUpdate?.()
    } catch (err) {
      const message =
        err instanceof FetchJsonError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Lỗi cập nhật trạng thái'
      toast.error(message)
    } finally {
      setLoadingId(null)
    }
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-ink/70 hover:text-ink transition-colors"
      >
        💬 {comments.length} góp ý
        {openCount > 0 && (
          <span
            className="badge-brutal text-[10px]"
            style={statusStyle('open')}
          >
            {openCount} mới
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-xs uppercase tracking-wider text-ink">
          {comments.length} góp ý
        </span>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-ink/60 hover:text-ink"
        >
          Đóng
        </button>
      </div>
      <ul className="space-y-2">
        {comments.map((comment) => {
          const status = comment.status as GembaStatus
          const isLoading = loadingId === comment.id
          return (
            <li
              key={comment.id}
              className="border-2 border-ink p-3 space-y-2"
              style={{
                borderRadius: 'var(--radius-md)',
                background: 'var(--white)',
              }}
            >
              <p className="font-body text-sm text-ink whitespace-pre-wrap">
                {comment.body}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-text-3">
                  {comment.author_name ?? 'Người dùng'} ·{' '}
                  {formatDate(comment.created_at)}
                </span>
                <span
                  className="badge-brutal text-[10px]"
                  style={statusStyle(status)}
                >
                  {STATUS_LABELS[status]}
                </span>
              </div>
              {canModerate && status !== 'resolved' && (
                <div className="flex gap-2 pt-1">
                  {status === 'open' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(comment.id, 'acknowledged')
                      }
                      disabled={isLoading}
                      className="btn-brutal-secondary text-xs"
                    >
                      {isLoading ? 'Đang lưu...' : 'Đã ghi nhận'}
                    </button>
                  )}
                  {status === 'acknowledged' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(comment.id, 'resolved')
                      }
                      disabled={isLoading}
                      className="btn-brutal-primary text-xs"
                    >
                      {isLoading ? 'Đang lưu...' : 'Đã xử lý'}
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
