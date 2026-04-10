'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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

    // Use window.location.origin so the redirect URL always matches the current
    // deployment (works on localhost, preview deployments, and production)
    // without relying on NEXT_PUBLIC_APP_URL being correctly set at build time.
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <CardTitle className="text-xl">Kiểm tra email của bạn</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi link đăng nhập đến{' '}
            <span className="font-medium text-foreground">{email}</span>.
            Link có hiệu lực trong 1 giờ.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            variant="ghost"
            onClick={() => setIsEmailSent(false)}
            className="text-sm"
          >
            Gửi lại link đăng nhập
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2">
          <Logo size="lg" showText={false} className="justify-center" />
        </div>
        <CardTitle className="text-xl">Đăng nhập</CardTitle>
        <CardDescription>
          Nhập email để nhận link đăng nhập
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Đang gửi...' : 'Gửi link đăng nhập'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
