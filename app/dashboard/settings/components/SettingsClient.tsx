'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { fetchJson } from '@/lib/http/fetch-json'
import { ArchivedKpisSection } from './ArchivedKpisSection'

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

interface PendingInvite {
  id: string
  email: string
  role: 'Manager' | 'Member'
  token: string
  expiresAt: string
  createdAt: string
}

interface SettingsClientProps {
  org: OrgData
  members: Member[]
  invites: PendingInvite[]
  currentUserId: string
  isCeo: boolean
}

export function SettingsClient({
  org,
  members,
  invites,
  currentUserId,
  isCeo,
}: SettingsClientProps) {
  const router = useRouter()
  const [form, setForm] = useState<OrgData>(org)
  const [isSaving, setIsSaving] = useState(false)

  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Manager' | 'Member'>('Member')
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>(invites)

  const isDirty =
    form.name !== org.name ||
    form.industry !== org.industry ||
    form.headcount !== org.headcount ||
    form.city !== org.city

  const handleSave = async () => {
    if (!isDirty || !isCeo) return
    setIsSaving(true)
    try {
      await fetchJson('/api/settings/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
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

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim() || !isCeo) return
    setIsCreatingInvite(true)
    try {
      const data = await fetchJson<{
        invite: {
          id: string
          email: string
          role: 'Manager' | 'Member'
          token: string
          expires_at: string
        }
      }>('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })
      toast.success('Đã tạo lời mời và gửi email')
      setPendingInvites([
        {
          id: data.invite.id,
          email: data.invite.email,
          role: data.invite.role,
          token: data.invite.token,
          expiresAt: data.invite.expires_at,
          createdAt: new Date().toISOString(),
        },
        ...pendingInvites,
      ])
      setInviteEmail('')
      setInviteRole('Member')
      setShowInviteForm(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể tạo lời mời',
      )
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const handleCopyInviteLink = async (token: string) => {
    const url = `${window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      toast.success('Đã copy link mời')
      setTimeout(() => setCopiedToken(null), 2000)
    } catch {
      toast.error('Không thể copy')
    }
  }

  const handleRevokeInvite = async (token: string) => {
    if (!isCeo) return
    try {
      await fetchJson(`/api/invites/${token}`, { method: 'DELETE' })
      toast.success('Đã hủy lời mời')
      setPendingInvites(pendingInvites.filter((i) => i.token !== token))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể hủy')
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
            <label className="text-sm font-bold uppercase tracking-wider">
              Tên công ty
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!isCeo || isSaving}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold uppercase tracking-wider">
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
              <label className="text-sm font-bold uppercase tracking-wider">
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
              <label className="text-sm font-bold uppercase tracking-wider">
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

        {isCeo && (
          <div className="space-y-3 pt-4 border-t-2 border-border">
            {!showInviteForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInviteForm(true)}
                className="w-full"
              >
                + Mời thành viên
              </Button>
            ) : (
              <div className="space-y-3 p-4 border-2 border-border bg-muted">
                <div className="space-y-1">
                  <label className="text-sm font-bold uppercase tracking-wider">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="ten@congty.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isCreatingInvite}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold uppercase tracking-wider">
                    Vai trò
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteRole('Member')}
                      disabled={isCreatingInvite}
                      className={`flex-1 px-3 py-2 border-2 text-sm font-bold uppercase ${
                        inviteRole === 'Member'
                          ? 'border-ink bg-ink text-bg'
                          : 'border-border bg-bg text-text-2'
                      }`}
                    >
                      Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole('Manager')}
                      disabled={isCreatingInvite}
                      className={`flex-1 px-3 py-2 border-2 text-sm font-bold uppercase ${
                        inviteRole === 'Manager'
                          ? 'border-ink bg-ink text-bg'
                          : 'border-border bg-bg text-text-2'
                      }`}
                    >
                      Manager
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateInvite}
                    disabled={!inviteEmail.trim() || isCreatingInvite}
                    className="flex-1"
                  >
                    {isCreatingInvite ? 'Đang gửi...' : 'Gửi lời mời'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowInviteForm(false)
                      setInviteEmail('')
                      setInviteRole('Member')
                    }}
                    disabled={isCreatingInvite}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            )}

            {pendingInvites.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lời mời đang chờ ({pendingInvites.length})
                </p>
                <div className="border divide-y">
                  {pendingInvites.map((inv) => {
                    const expiresIn = Math.ceil(
                      (new Date(inv.expiresAt).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24),
                    )
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {inv.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {inv.role} · Hết hạn sau {expiresIn} ngày
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopyInviteLink(inv.token)}
                          className="text-xs font-bold uppercase tracking-wider px-3 py-1 border-2 border-border hover:bg-muted"
                        >
                          {copiedToken === inv.token ? 'Đã copy!' : 'Copy link'}
                        </button>
                        <button
                          onClick={() => handleRevokeInvite(inv.token)}
                          className="text-xs font-bold uppercase tracking-wider px-3 py-1 border-2 border-destructive text-destructive hover:bg-destructive/10"
                        >
                          Hủy
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!isCeo && (
          <p className="text-xs text-muted-foreground">
            Chỉ CEO mới có thể mời thành viên.
          </p>
        )}
      </section>

      {/* Archived KPIs — CEO-only restore self-service (M-KPI-Restore-1) */}
      {isCeo && <ArchivedKpisSection />}

      {/* Data & sessions */}
      <section className="space-y-4">
        <div className="border-b-2 border-border pb-2">
          <h2 className="font-display text-lg font-bold">
            Dữ liệu &amp; Phiên làm việc
          </h2>
          <p className="text-sm text-muted-foreground">
            Quản lý phiên phân tích chiến lược
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                className="w-full border-destructive text-destructive hover:bg-destructive/10"
              />
            }
          >
            Bắt đầu lại phân tích SWOT
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xoá dữ liệu SWOT?</AlertDialogTitle>
              <AlertDialogDescription>
                Tất cả dữ liệu coaching, bối cảnh thị trường, và kết quả tổng
                hợp SWOT sẽ bị xoá. Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  useSwotStore.getState().resetSession()
                  toast.success('Đã xoá dữ liệu SWOT')
                  router.push('/dashboard/discovery/swot')
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xoá và bắt đầu lại
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
