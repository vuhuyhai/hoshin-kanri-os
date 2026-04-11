'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react'

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: 'Đăng nhập thất bại. Vui lòng thử lại.',
  invalid_credentials: 'Email hoặc mật khẩu không đúng.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const err = searchParams.get('error')
    if (err && ERROR_MESSAGES[err]) toast.error(ERROR_MESSAGES[err])
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !email.includes('@')) { setError('Vui lòng nhập email hợp lệ'); return }
    if (!password) { setError('Vui lòng nhập mật khẩu'); return }

    setIsLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setIsLoading(false)

    if (authError) {
      const msg = authError.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials')) {
        setError('Email hoặc mật khẩu không đúng')
      } else if (msg.includes('not confirmed') || msg.includes('email')) {
        setError('Vui lòng xác nhận email trước khi đăng nhập')
      } else {
        toast.error(authError.message)
      }
      return
    }
    setSent(true)
    router.push('/dashboard')
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (oauthError) {
      toast.error('Không thể đăng nhập bằng Google. Thử lại sau.')
      setIsGoogleLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="card-brutal p-8 text-center w-full max-w-md">
        <span className="text-4xl block mb-4">✉️</span>
        <h2 className="font-display font-bold text-xl text-ink">
          Kiểm tra email của bạn!
        </h2>
        <p className="font-body text-[18px] text-text-2 mt-2">
          Link đăng nhập đã được gửi. Hiệu lực 10 phút.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex justify-center">
          <Image src="/images/logo-light.png" alt="Hoshin Kanri OS" width={40} height={40} priority />
        </div>
        <h1 className="font-display text-xl font-black uppercase tracking-wider text-ink">
          Đăng nhập Hoshin Kanri OS
        </h1>
        <p className="font-body text-[18px] text-text-2 mt-1">
          Tiếp tục hành trình hoạch định chiến lược
        </p>
      </div>

      <span className="badge-brutal badge-accent mb-6 inline-block">
        ✉️ Magic Link — Không cần mật khẩu
      </span>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="label-brutal">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" className="input-brutal" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="label-brutal">Mật khẩu</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Nhập mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} autoComplete="current-password" className="input-brutal pr-11" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-ink" tabIndex={-1} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="text-right">
            <Link href="/reset-password" className="font-body text-xs text-accent-brand hover:underline">Quên mật khẩu?</Link>
          </div>
        </div>

        {error && <p className="font-body text-xs text-red-600">{error}</p>}

        <Button type="submit" className="btn-primary w-full justify-center" disabled={isLoading || isGoogleLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gửi...</> : 'Đăng nhập'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-ink/20" /></div>
        <div className="relative flex justify-center"><span className="bg-bg-warm px-3 font-body text-xs text-text-3 uppercase">hoặc</span></div>
      </div>

      {/* Google OAuth */}
      <button onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading} className="flex w-full items-center justify-center gap-3 min-h-[44px] border-2 border-ink bg-white font-display text-sm font-semibold uppercase tracking-wider text-ink shadow-[4px_4px_0px_var(--ink)] hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_var(--ink)] transition-all disabled:opacity-50">
        {isGoogleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
        Đăng nhập bằng Google
      </button>

      <p className="mt-6 text-center font-body text-xs text-text-3">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="font-display font-semibold text-accent-brand hover:underline">Đăng ký ngay</Link>
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-bg-dark px-12 py-16">
        <div className="flex flex-1 flex-col justify-center">
          <div className="flex items-center gap-3">
            <Image src="/images/logo-dark.png" alt="Hoshin Kanri OS" width={40} height={40} priority />
            <span className="font-display font-black text-2xl text-white uppercase">
              Hoshin Kanri OS
            </span>
          </div>
          <div className="w-12 h-[3px] bg-accent-brand my-6" />
          <ul className="space-y-4">
            {[
              'AI hỗ trợ từng bước',
              'X-Matrix tự động',
              'KPI Tracker thời gian thực',
            ].map((text) => (
              <li key={text} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-accent-brand shrink-0" />
                <span className="font-body text-[18px] text-white/70">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="font-body text-[15px] text-white/40">
          Hoshin Kanri — Phương pháp quản lý chiến lược của Toyota
        </p>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center min-h-screen bg-bg-warm px-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
