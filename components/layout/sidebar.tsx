'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Compass,
  Search,
  LayoutGrid,
  BarChart3,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Khám phá',
    items: [
      { label: 'Discovery Hub', href: '/dashboard/discovery', icon: Compass },
      { label: 'Business X-Ray', href: '/x-ray', icon: Search },
    ],
  },
  {
    label: 'Chiến lược',
    items: [
      { label: 'X-Matrix', href: '/dashboard/x-matrix', icon: LayoutGrid },
      { label: 'KPI Tracker', href: '/dashboard/kpi', icon: BarChart3 },
    ],
  },
  {
    label: 'Báo cáo',
    items: [
      { label: 'Monthly Report', href: '/dashboard/report', icon: FileText },
    ],
  },
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
  orgName,
  userName,
  userEmail,
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname()
  const initials = (userName || userEmail.split('@')[0])
    .slice(0, 2)
    .toUpperCase()
  const orgInitial = orgName.charAt(0).toUpperCase()

  return (
    <div className="flex h-full flex-col bg-bg-dark">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/20 px-6">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-2">
          <Image src="/images/logo-dark.png" alt="Hoshin Kanri OS" width={40} height={40} priority />
          <span className="font-display font-black text-lg text-white uppercase tracking-wider">
            Hoshin Kanri OS
          </span>
          <span className="badge-brutal border-white/40 text-white/60 text-[10px] ml-2">
            BETA
          </span>
        </Link>
      </div>

      {/* Org info */}
      <div className="flex items-center border-b border-white/20 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-accent-brand font-display font-bold text-sm text-white">
          {orgInitial}
        </div>
        <span className="font-body text-[15px] text-white ml-3 truncate">
          {orgName}
        </span>
      </div>

      {/* Nav groups */}
      <nav aria-label="Menu chính" className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.label}>
            <p
              className={cn(
                'font-display font-semibold text-[11px] uppercase tracking-[0.15em] text-white/30 px-3 mb-2',
                groupIdx === 0 ? 'mt-0' : 'mt-4'
              )}
            >
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href} onClick={onNavigate}>
                  <div
                    className={cn(
                      'flex min-h-[44px] items-center gap-3 px-3 py-2.5',
                      'font-body text-[16px]',
                      'cursor-pointer transition-all duration-150',
                      isActive
                        ? 'bg-accent-brand text-white font-medium'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </div>
                </Link>
              )
            })}
          </div>
        ))}

        {/* Settings — separated */}
        <div className="my-4 border-t border-white/20" />
        <Link href="/dashboard/settings" onClick={onNavigate}>
          <div
            className={cn(
              'flex min-h-[44px] items-center gap-3 px-3 py-2.5',
              'font-body text-[16px]',
              'cursor-pointer transition-all duration-150',
              pathname === '/dashboard/settings' ||
                pathname.startsWith('/dashboard/settings/')
                ? 'bg-accent-brand text-white font-medium'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            )}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            Cài đặt
          </div>
        </Link>
      </nav>

      {/* User area */}
      <div className="mt-auto border-t border-white/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent-brand font-display font-bold text-sm text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-[15px] text-white">
              {userName || userEmail.split('@')[0]}
            </p>
            <p className="truncate font-body text-[11px] text-white/40">
              {userEmail}
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            onClick={onNavigate}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
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
