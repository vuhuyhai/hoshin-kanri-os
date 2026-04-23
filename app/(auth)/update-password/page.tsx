'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Phiên đã hết hạn. Vui lòng gửi lại link đặt lại mật khẩu.')
        router.push('/reset-password')
      } else {
        setIsChecking(false)
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}
    if (password.length < 8) newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự'
    if (confirmPassword !== password) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setIsLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Đặt lại mật khẩu thành công!')
    router.push('/dashboard')
  }

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-muted-warm">
        <Loader2 className="h-8 w-8 animate-spin text-text-3" />
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
          <h1 className="font-display text-xl font-black uppercase tracking-wider text-ink">Đặt lại mật khẩu</h1>
          <p className="font-body text-sm text-text-2 mt-1">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-display text-sm font-bold uppercase tracking-wider">Mật khẩu mới</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Tối thiểu 8 ký tự" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base pr-11" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-ink" tabIndex={-1} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="font-body text-xs text-red-600">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="font-display text-sm font-bold uppercase tracking-wider">Xác nhận mật khẩu</Label>
            <Input id="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="Nhập lại mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isLoading} autoComplete="new-password" className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base" />
            {errors.confirmPassword && <p className="font-body text-xs text-red-600">{errors.confirmPassword}</p>}
          </div>

          <Button type="submit" className="btn-brutal-primary w-full min-h-[44px] text-sm" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang cập nhật...</> : 'Đặt lại mật khẩu'}
          </Button>
        </form>
      </div>
    </div>
  )
}
