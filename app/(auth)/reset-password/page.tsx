'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { postJson } from '@/lib/http/fetch-json'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Vui lòng nhập email hợp lệ')
      return
    }

    setIsLoading(true)
    try {
      await postJson('/api/auth/forgot-password', { email })
      setIsSent(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi link. Vui lòng thử lại sau.'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
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
              Đã gửi link đặt lại mật khẩu
            </h1>
            <p className="font-body text-sm text-text-2">
              Kiểm tra hộp thư <span className="font-display font-bold text-ink">{email}</span> và nhấn vào link để tiếp tục.
              <br />Link có hiệu lực trong 1 giờ.
            </p>
            <Link href="/login" className="inline-block font-display text-xs font-semibold uppercase tracking-wider text-accent-brand hover:underline min-h-[44px] leading-[44px]">
              ← Quay lại đăng nhập
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
          <h1 className="font-display text-xl font-black uppercase tracking-wider text-ink">Quên mật khẩu</h1>
          <p className="font-body text-sm text-text-2 mt-1">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-display text-sm font-bold uppercase tracking-wider">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} autoComplete="email" className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base" />
            {error && <p className="font-body text-xs text-red-600">{error}</p>}
          </div>

          <Button type="submit" className="btn-brutal-primary w-full min-h-[44px] text-sm" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang gửi...</> : 'Gửi link đặt lại mật khẩu'}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link href="/login" className="font-display text-xs font-semibold uppercase tracking-wider text-accent-brand hover:underline">← Quay lại đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}
