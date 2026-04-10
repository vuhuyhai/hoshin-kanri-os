'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ERROR_MESSAGES: Record<string, string> = {
  link_expired: 'Link đăng nhập đã hết hạn. Vui lòng gửi lại.',
  missing_code: 'Link đăng nhập không hợp lệ. Vui lòng thử lại.',
  auth_failed: 'Đăng nhập thất bại. Vui lòng thử lại.',
  wrong_browser:
    'Vui lòng mở link đăng nhập trên cùng trình duyệt bạn đã yêu cầu. Hoặc gửi lại link mới.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  useEffect(() => {
    const error = searchParams.get('error')
    if (error && ERROR_MESSAGES[error]) {
      toast.error(ERROR_MESSAGES[error])
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error('Vui lòng nhập email hợp lệ')
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    setIsLoading(false)

    if (error) {
      toast.error('Không thể gửi link đăng nhập. Thử lại sau.')
      return
    }

    setIsEmailSent(true)
    toast.success('Link đăng nhập đã gửi!')
  }

  if (isEmailSent) {
    return (
      <div className="card-brutal w-full max-w-md p-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-ink bg-accent-brand/10">
            <svg
              className="h-7 w-7 text-accent-brand"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h1 className="font-display text-xl font-black uppercase tracking-wider text-ink">
            Kiểm tra email
          </h1>
          <p className="font-body text-sm text-text-2">
            Chúng tôi đã gửi link đăng nhập đến{' '}
            <span className="font-display font-bold text-ink">{email}</span>.
            Link có hiệu lực trong 1 giờ.
          </p>
          <button
            onClick={() => setIsEmailSent(false)}
            className="font-display text-xs font-semibold uppercase tracking-wider text-accent-brand hover:underline min-h-[44px]"
          >
            Gửi lại link đăng nhập
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card-brutal w-full max-w-md p-8">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4">
          <Logo size="lg" showText={false} className="justify-center" />
        </div>
        <h1 className="font-display text-xl font-black uppercase tracking-wider text-ink">
          Đăng nhập
        </h1>
        <p className="font-body text-sm text-text-2 mt-1">
          Nhập email để nhận link đăng nhập
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="font-display text-xs font-semibold uppercase tracking-wider"
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="email"
            className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base"
          />
        </div>
        <Button
          type="submit"
          className="btn-brutal-primary w-full min-h-[44px] text-sm"
          disabled={isLoading}
        >
          {isLoading ? 'Đang gửi...' : 'Gửi link đăng nhập'}
        </Button>
      </form>

      <p className="mt-6 text-center font-body text-xs text-text-3">
        Chưa có tài khoản? Link đăng nhập sẽ tự động tạo tài khoản cho bạn.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-muted-warm px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
