'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Loader2, Check, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface OrgSwitcherProps {
  currentOrg: {
    id: string
    name: string
  }
  memberships: Array<{
    org_id: string
    org_name: string
    role: string
  }>
}

export function OrgSwitcher({ currentOrg, memberships }: OrgSwitcherProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const orgInitial = currentOrg.name.charAt(0).toUpperCase()

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrg.id) return
    setLoading(true)
    try {
      const response = await fetch('/api/orgs/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(data.error ?? 'Không thể đổi tổ chức')
      }
      // Q4 γ — full reload bypasses JWT cookie staleness; layout's
      // auth.getUser() is a network call that returns fresh metadata.
      window.location.href = '/dashboard'
    } catch (error) {
      setLoading(false)
      toast.error(
        error instanceof Error ? error.message : 'Có lỗi xảy ra',
      )
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={loading}
        aria-label={`Đổi tổ chức (đang chọn: ${currentOrg.name})`}
        className={cn(
          'flex w-full items-center border-b border-white/20 px-4 py-3 text-left',
          'transition-colors hover:bg-white/5 focus:bg-white/5 focus:outline-none',
          loading && 'cursor-wait opacity-70',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-accent-brand font-display text-sm font-bold text-white">
          {orgInitial}
        </div>
        <span className="ml-3 max-w-[140px] truncate font-body text-[15px] text-white">
          {currentOrg.name}
        </span>
        <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center text-white/50">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="min-w-[220px] border-2 border-ink bg-bg-warm shadow-brutal-md"
      >
        {memberships.map((m) => {
          const isCurrent = m.org_id === currentOrg.id
          return (
            <DropdownMenuItem
              key={m.org_id}
              disabled={loading}
              onClick={() => handleSwitch(m.org_id)}
              className="flex cursor-pointer items-center gap-2 px-2 py-2"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-accent-brand font-display text-[11px] font-bold text-white">
                {m.org_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm text-ink">
                  {m.org_name}
                </p>
                <p className="font-body text-[11px] text-text-2">{m.role}</p>
              </div>
              {isCurrent && (
                <Check className="h-4 w-4 shrink-0 text-accent-brand" />
              )}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator className="h-0.5 bg-ink" />

        <DropdownMenuItem
          onClick={() => router.push('/onboarding/setup-org')}
          className="flex cursor-pointer items-center gap-2 px-2 py-2"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-ink bg-bg-warm">
            <Plus className="h-3.5 w-3.5 text-ink" />
          </span>
          <span className="font-display text-xs font-semibold uppercase tracking-wider text-ink">
            Tạo org mới
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
