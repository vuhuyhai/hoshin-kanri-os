'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { postJson, FetchJsonError } from '@/lib/http/fetch-json'

// Whitelist redirect targets to prevent open-redirect attacks via ?redirect=.
// Anything outside the allowlist falls back to /dashboard.
function safeRedirect(redirectParam: string | null): string {
  if (!redirectParam) return '/dashboard'
  const inviteUuidPattern = /^\/invite\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (inviteUuidPattern.test(redirectParam)) return redirectParam
  if (redirectParam === '/dashboard' || redirectParam.startsWith('/dashboard/')) return redirectParam
  return '/dashboard'
}

function loginHref(redirect: string): string {
  if (redirect === '/dashboard') return '/login'
  return `/login?redirect=${encodeURIComponent(redirect)}`
}

interface FormErrors {
  full_name?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
}

function validate(full_name: string, email: string, phone: string, password: string, confirmPassword: string): FormErrors {
  const errors: FormErrors = {}
  if (full_name.trim().length < 2) errors.full_name = 'Họ và tên phải có ít nhất 2 ký tự'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email không hợp lệ'
  if (!/^0[0-9]{9}$/.test(phone)) errors.phone = 'Số điện thoại phải đúng 10 số, bắt đầu bằng 0'
  if (password.length < 8) errors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
  if (confirmPassword !== password) errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
  return errors
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const searchParams = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate(fullName, email, phone, password, confirmPassword)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsLoading(true)
    try {
      const data = await postJson<{ success: boolean; emailSent?: boolean }>(
        '/api/auth/register',
        { email, password, full_name: fullName.trim(), phone },
      )

      if (data.success && !data.emailSent) {
        toast.warning('Tài khoản đã tạo nhưng không gửi được email. Hãy thử đăng nhập.')
      }
      setIsSuccess(true)
    } catch (err) {
      if (err instanceof FetchJsonError && err.status === 409) {
        setErrors({ email: 'Email này đã được đăng ký. Đăng nhập?' })
      } else {
        const msg = err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.'
        toast.error(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-muted-warm px-4">
        <div className="card-brutal w-full max-w-md p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-ink bg-accent-brand/10">
              <svg className="h-7 w-7 text-accent-brand" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="font-display text-xl font-black uppercase tracking-wider text-ink">
              Kiểm tra hộp thư của bạn
            </h1>
            <p className="font-body text-sm text-text-2">
              Chúng tôi đã gửi link xác nhận đến{' '}
              <span className="font-display font-bold text-ink">{email}</span>.
              <br />Nhấn vào link trong email để kích hoạt tài khoản.
            </p>
            <Link
              href={loginHref(redirect)}
              className="inline-block font-display text-xs font-semibold uppercase tracking-wider text-accent-brand hover:underline min-h-[44px] leading-[44px]"
            >
              Quay về đăng nhập
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-muted-warm px-4">
      <div className="card-brutal w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4">
            <Logo size="lg" showText={false} className="justify-center" />
          </div>
          <h1 className="font-display text-xl font-black uppercase tracking-wider text-ink">
            Tạo tài khoản Hoshin Kanri OS
          </h1>
          <p className="font-body text-sm text-text-2 mt-1">
            Bắt đầu hành trình hoạch định chiến lược
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup label="Họ và tên" id="full_name" error={errors.full_name}>
            <Input id="full_name" placeholder="Nguyễn Văn A" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base" />
          </FieldGroup>

          <FieldGroup label="Email" id="email" error={errors.email}>
            <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base" />
          </FieldGroup>

          <FieldGroup label="Số điện thoại" id="phone" error={errors.phone}>
            <Input id="phone" type="tel" placeholder="0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isLoading} autoComplete="tel" className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base" />
          </FieldGroup>

          <FieldGroup label="Mật khẩu" id="password" error={errors.password}>
            <Input id="password" type="password" placeholder="Tối thiểu 8 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base" />
          </FieldGroup>

          <FieldGroup label="Xác nhận mật khẩu" id="confirmPassword" error={errors.confirmPassword}>
            <Input id="confirmPassword" type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base" />
          </FieldGroup>

          <Button type="submit" className="btn-brutal-primary w-full min-h-[44px] text-sm" disabled={isLoading}>
            {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </Button>
        </form>

        <p className="mt-6 text-center font-body text-xs text-text-3">
          Đã có tài khoản?{' '}
          <Link href={loginHref(redirect)} className="font-display font-semibold text-accent-brand hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  )
}

function FieldGroup({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-display text-sm font-bold uppercase tracking-wider">{label}</Label>
      {children}
      {error && <p className="font-body text-xs text-destructive">{error}</p>}
    </div>
  )
}
