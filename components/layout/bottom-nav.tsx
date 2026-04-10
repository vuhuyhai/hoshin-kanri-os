'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Compass, LayoutGrid, BarChart3, FileText, Settings } from 'lucide-react'

interface BottomNavItem {
  label: string
  href: string
  icon: React.ElementType
}

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Khám phá', href: '/dashboard/discovery', icon: Compass },
  { label: 'X-Matrix', href: '/dashboard/x-matrix', icon: LayoutGrid },
  { label: 'KPI', href: '/dashboard/kpi', icon: BarChart3 },
  { label: 'Báo cáo', href: '/dashboard/report', icon: FileText },
  { label: 'Cài đặt', href: '/dashboard/settings', icon: Settings },
]

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Menu di động"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40',
        'flex h-[60px] items-stretch border-t-[3px] border-ink bg-bg-warm',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1',
              'transition-colors duration-100',
              isActive ? 'text-accent-brand' : 'text-text-3'
            )}
          >
            <Icon size={22} strokeWidth={2} />
            <span className="font-display text-[9px] font-semibold uppercase">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
