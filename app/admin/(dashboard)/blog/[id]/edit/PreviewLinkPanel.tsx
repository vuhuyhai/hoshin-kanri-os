'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  ensurePreviewTokenAction,
  rotatePreviewTokenAction,
  revokePreviewTokenAction,
} from '../../_actions'

type Props = {
  postId: string
  initialToken: string | null
  status: 'draft' | 'published'
}

function buildUrl(token: string): string {
  if (typeof window === 'undefined') return `/blog/preview/${token}`
  return `${window.location.origin}/blog/preview/${token}`
}

export function PreviewLinkPanel({ postId, initialToken, status }: Props) {
  const [token, setToken] = useState<string | null>(initialToken)
  const [pending, startTransition] = useTransition()

  const generate = () => {
    startTransition(async () => {
      const result = await ensurePreviewTokenAction(postId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setToken(result.token)
      toast.success('Đã tạo preview link')
    })
  }

  const rotate = () => {
    if (!confirm('Tạo link mới? Link cũ sẽ bị vô hiệu hoá.')) return
    startTransition(async () => {
      const result = await rotatePreviewTokenAction(postId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setToken(result.token)
      toast.success('Đã xoay token — link cũ hết hiệu lực')
    })
  }

  const revoke = () => {
    if (!confirm('Thu hồi preview link?')) return
    startTransition(async () => {
      const result = await revokePreviewTokenAction(postId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setToken(null)
      toast.success('Đã thu hồi preview link')
    })
  }

  const copy = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(buildUrl(token))
      toast.success('Đã copy link')
    } catch {
      toast.error('Không copy được, copy thủ công nhé')
    }
  }

  return (
    <div className="card-brutal bg-bg-muted-warm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-wider text-text-3">
            Preview link
          </p>
          <p className="mt-1 font-body text-[13px] text-text-2">
            {status === 'published'
              ? 'Bài đã publish, link này để xem phiên bản đang có token.'
              : 'Chia sẻ bản nháp với người khác mà không cần publish.'}
          </p>
        </div>
        {!token ? (
          <button
            type="button"
            onClick={generate}
            disabled={pending}
            className="btn-brutal-primary px-4 py-2 text-[11px] disabled:opacity-50"
          >
            {pending ? 'Đang tạo…' : '+ Tạo preview link'}
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={copy}
              disabled={pending}
              className="btn-brutal-primary px-4 py-2 text-[11px] disabled:opacity-50"
            >
              Copy link
            </button>
            <button
              type="button"
              onClick={rotate}
              disabled={pending}
              className="btn-brutal-secondary px-4 py-2 text-[11px] disabled:opacity-50"
            >
              Xoay token
            </button>
            <button
              type="button"
              onClick={revoke}
              disabled={pending}
              className="font-display text-[11px] font-semibold uppercase tracking-wider text-accent-brand hover:underline disabled:opacity-50"
            >
              Thu hồi
            </button>
          </div>
        )}
      </div>
      {token && (
        <div className="mt-3 border-t-[2px] border-ink/20 pt-3">
          <p className="break-all font-mono text-[11px] text-text-2">
            {buildUrl(token)}
          </p>
        </div>
      )}
    </div>
  )
}
