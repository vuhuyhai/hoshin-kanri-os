'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import {
  Compass,
  LayoutGrid,
  BarChart3,
  FileText,
  Settings,
  ExternalLink,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Khám phá', href: '/dashboard/discovery', icon: Compass },
  { label: 'X-Matrix', href: '/dashboard/x-matrix', icon: LayoutGrid },
  { label: 'KPI Tracker', href: '/dashboard/kpi', icon: BarChart3 },
  { label: 'Báo cáo tháng', href: '/dashboard/report', icon: FileText },
  { label: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
]

interface SidebarContentProps {
  userRole: string
  orgName: string
  orgIndustry: string
  userName: string
  userEmail: string
  onNavigate?: () => void
}

function SidebarContent({
  userRole,
  orgName,
  orgIndustry,
  userName,
  userEmail,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname()
  const initials = (userName || userEmail.split('@')[0])
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="px-4 py-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo size="sm" showText />
        </Link>
      </div>

      <div className="border-t-[3px] border-ink" />

      {/* Org info */}
      <div className="px-4 py-3">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-accent-brand">
          {orgName}
        </p>
        <p className="font-body text-[13px] text-text-3">
          {orgIndustry} · {userRole}
        </p>
      </div>

      <div className="border-t-2 border-ink/10" />

      {/* Navigation */}
      <nav aria-label="Menu chính" className="mt-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}>
              <div
                className={cn(
                  'flex min-h-[44px] items-center gap-3 border-l-[3px] px-4 py-2.5',
                  'font-display text-[13px] font-semibold uppercase tracking-[.08em]',
                  'cursor-pointer transition-all duration-100',
                  isActive
                    ? 'border-l-accent-brand bg-bg-muted-warm text-accent-brand'
                    : 'border-l-transparent text-ink hover:bg-bg-muted-warm'
                )}
              >
                <Icon size={18} strokeWidth={2} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Tools divider */}
      <div className="mx-4 my-3 flex items-center gap-2">
        <div className="h-[2px] flex-1 bg-ink/10" />
        <span className="font-body text-[11px] uppercase tracking-widest text-text-3">
          Tools
        </span>
        <div className="h-[2px] flex-1 bg-ink/10" />
      </div>

      <a
        href="/x-ray"
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={cn(
          'flex min-h-[44px] items-center gap-3 border-l-[3px] border-l-transparent px-4 py-2.5',
          'font-display text-[13px] font-semibold uppercase tracking-[.08em]',
          'text-text-3 transition-all duration-100 hover:bg-bg-muted-warm'
        )}
      >
        <ExternalLink size={18} strokeWidth={2} />
        Chia sẻ X-Ray
      </a>

      {/* User profile — pushed to bottom */}
      <div className="mt-auto border-t-[3px] border-ink">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-ink bg-accent-brand font-display text-xs font-black text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[13px] font-bold text-ink">
              {userName || userEmail.split('@')[0]}
            </p>
            <p className="font-body text-[11px] text-text-3">
              {userRole} · Free Plan
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-text-3 transition-colors hover:text-ink"
            aria-label="Settings"
          >
            <LogOut size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  )
}

export interface SidebarProps {
  userRole: string
  orgName: string
  orgIndustry: string
  userName: string
  userEmail: string
}

/** Desktop sidebar — rendered inside layout's fixed aside */
export function Sidebar(props: SidebarProps) {
  return <SidebarContent {...props} />
}

/** Mobile/Tablet sidebar content — rendered inside Sheet */
export function MobileSidebarContent(
  props: SidebarProps & { onNavigate: () => void }
) {
  return <SidebarContent {...props} onNavigate={props.onNavigate} />
}
