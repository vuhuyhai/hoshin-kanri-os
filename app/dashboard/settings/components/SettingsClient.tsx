'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'

interface OrgData {
  name: string
  industry: string
  headcount: string
  city: string
}

interface Member {
  userId: string
  email: string
  fullName: string | null
  role: string
  joinedAt: string
}

interface SettingsClientProps {
  org: OrgData
  members: Member[]
  currentUserId: string
  isCeo: boolean
}

export function SettingsClient({
  org,
  members,
  currentUserId,
  isCeo,
}: SettingsClientProps) {
  const router = useRouter()
  const [form, setForm] = useState<OrgData>(org)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const isDirty =
    form.name !== org.name ||
    form.industry !== org.industry ||
    form.headcount !== org.headcount ||
    form.city !== org.city

  const handleSave = async () => {
    if (!isDirty || !isCeo) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/settings/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error)
      }
      toast.success('Đã cập nhật thông tin công ty')
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể cập nhật'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/login`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Đã copy link mời')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Không thể copy')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-8">
      {/* Org info */}
      <section className="space-y-4">
        <div className="border-b-2 border-border pb-2">
          <h2 className="font-display text-lg font-bold">Thông tin công ty</h2>
          <p className="text-sm text-muted-foreground">
            {isCeo
              ? 'Cập nhật thông tin doanh nghiệp'
              : 'Chỉ CEO mới có thể chỉnh sửa'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider">
              Tên công ty
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!isCeo || isSaving}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider">
              Ngành
            </label>
            <Input
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              disabled={!isCeo || isSaving}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider">
                Quy mô
              </label>
              <Input
                value={form.headcount}
                onChange={(e) =>
                  setForm({ ...form, headcount: e.target.value })
                }
                disabled={!isCeo || isSaving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider">
                Thành phố
              </label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                disabled={!isCeo || isSaving}
              />
            </div>
          </div>

          {isCeo && (
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              variant="outline"
              className="w-full"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          )}
        </div>
      </section>

      {/* Members */}
      <section className="space-y-4">
        <div className="border-b-2 border-border pb-2">
          <h2 className="font-display text-lg font-bold">
            Thành viên ({members.length})
          </h2>
        </div>

        <div className="border divide-y">
          {members.map((m) => {
            const isMe = m.userId === currentUserId
            const initial = (m.fullName ?? m.email).charAt(0).toUpperCase()
            return (
              <div
                key={m.userId}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary text-primary-foreground font-display text-sm font-black">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {m.fullName ?? m.email}
                    {isMe && (
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        (bạn)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.email}
                  </p>
                </div>
                <Badge
                  variant={m.role === 'CEO' ? 'default' : 'outline'}
                  className="text-xs uppercase shrink-0"
                >
                  {m.role}
                </Badge>
              </div>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyInvite}
          className="w-full"
        >
          {copied ? 'Đã copy!' : 'Copy link mời thành viên'}
        </Button>
      </section>

      {/* Account */}
      <section className="space-y-4">
        <div className="border-b-2 border-border pb-2">
          <h2 className="font-display text-lg font-bold">Tài khoản</h2>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Đăng xuất
        </button>
      </section>
    </div>
  )
}
