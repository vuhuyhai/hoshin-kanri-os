'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchJson } from '@/lib/http/fetch-json'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      setIsLoading(false)
      toast.error('Email hoặc mật khẩu không đúng')
      return
    }

    // Check is_super_admin via server API (bypasses RLS)
    try {
      const { isSuperAdmin } = await fetchJson<{ isSuperAdmin: boolean }>(
        '/api/admin/verify'
      )
      if (!isSuperAdmin) {
        await supabase.auth.signOut()
        setIsLoading(false)
        toast.error('Không có quyền truy cập')
        return
      }
      router.push('/admin')
    } catch {
      await supabase.auth.signOut()
      setIsLoading(false)
      toast.error('Không có quyền truy cập')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-muted-warm px-4">
      <div className="card-brutal w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="font-display text-xl font-black uppercase tracking-wider text-ink">
            Hoshin Kanri OS
          </h1>
          <p className="font-body text-sm text-text-2 mt-1">Admin</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="font-display text-sm font-bold uppercase tracking-wider"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@hoshinkanri.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
              className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="font-display text-sm font-bold uppercase tracking-wider"
            >
              Mật khẩu
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="current-password"
              className="min-h-[44px] border-2 border-ink bg-bg-warm font-body text-base"
            />
          </div>

          <Button
            type="submit"
            className="btn-brutal-primary w-full min-h-[44px] text-sm"
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </Button>
        </form>
      </div>
    </div>
  )
}
