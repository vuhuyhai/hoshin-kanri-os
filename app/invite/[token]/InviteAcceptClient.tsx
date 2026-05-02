'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface InviteAcceptClientProps {
  token: string
  orgName: string
  orgIndustry: string
  role: 'Manager' | 'Member'
  invitedByName: string
  expiresAt: string
  alreadyMember: boolean
}

type Status = 'idle' | 'loading' | 'success' | 'error'

function formatExpires(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function InviteAcceptClient({
  token,
  orgName,
  orgIndustry,
  role,
  invitedByName,
  expiresAt,
  alreadyMember,
}: InviteAcceptClientProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    if (alreadyMember) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user)
    })
  }, [alreadyMember])

  const handleAccept = async () => {
    setStatus('loading')
    setErrorMessage('')
    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
      }
      if (res.ok) {
        setStatus('success')
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1500)
      } else {
        setStatus('error')
        setErrorMessage(data.error ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Không thể kết nối tới máy chủ. Vui lòng thử lại.')
    }
  }

  const roleTagClass =
    role === 'Manager' ? 'badge-brutal tag-cyan' : 'badge-brutal tag-lime'

  return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center px-4 py-16">
      <div className="card-brutal w-full max-w-md p-8">
        <p className="overline mb-3 text-center">Chiến Lược OS</p>

        <h1 className="font-display text-base font-bold uppercase tracking-wider text-text-2 text-center mb-2">
          Bạn được mời tham gia
        </h1>

        <p className="font-display text-3xl font-black tracking-tight text-ink text-center mb-4 break-words">
          {orgName}
        </p>

        <div className="flex items-center justify-center gap-3 mb-2">
          <span className={roleTagClass}>{role}</span>
          <span className="font-body text-sm text-text-3">{orgIndustry}</span>
        </div>

        <p className="font-body text-sm text-text-2 text-center">
          Bởi <span className="font-semibold text-ink">{invitedByName}</span>
        </p>

        <p className="font-body text-xs text-text-3 text-center mt-1 mb-6">
          Hết hạn {formatExpires(expiresAt)}
        </p>

        <div className="border-t-2 border-ink/20 pt-6">
          {alreadyMember ? (
            <div className="text-center">
              <p className="font-body text-sm text-text-2 mb-4">
                Bạn đã là thành viên của {orgName}.
              </p>
              <a
                href="/dashboard"
                className="btn-brutal-primary inline-block w-full text-center"
              >
                Đến Dashboard
              </a>
            </div>
          ) : status === 'success' ? (
            <div className="text-center">
              <p className="font-display text-lg font-bold text-ink mb-4">
                Chào mừng bạn đến {orgName}! 🎉
              </p>
              <a
                href="/dashboard"
                className="btn-brutal-primary inline-block w-full text-center"
              >
                Đến Dashboard
              </a>
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
              <p
                role="alert"
                className="font-body text-sm text-[var(--brand)] mb-4"
              >
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatus('idle')
                  setErrorMessage('')
                }}
                className="btn-brutal-secondary w-full"
              >
                Thử lại
              </button>
            </div>
          ) : hasSession === null ? (
            <div className="flex justify-center py-2">
              <Loader2
                aria-label="Đang tải"
                className="h-5 w-5 animate-spin text-text-3"
              />
            </div>
          ) : hasSession ? (
            <button
              type="button"
              onClick={handleAccept}
              disabled={status === 'loading'}
              className="btn-brutal-primary w-full inline-flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Chấp nhận lời mời'
              )}
            </button>
          ) : (
            <a
              href={`/login?redirect=/invite/${token}`}
              className="btn-brutal-primary inline-block w-full text-center"
            >
              Đăng nhập để chấp nhận
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
