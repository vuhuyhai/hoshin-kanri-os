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
        'fixed bottom-0 left-0 right-0 z-30 lg:hidden',
        'grid grid-cols-5 h-16 border-t-2 border-ink bg-bg-warm',
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
              'relative flex flex-col items-center justify-center min-h-[64px] gap-1',
              'font-display font-semibold text-[10px] uppercase tracking-[0.08em]',
              'transition-colors duration-100',
              isActive ? 'text-accent-brand' : 'text-text-3'
            )}
          >
            {isActive && (
              <span className="absolute top-2 w-1 h-1 bg-accent-brand rounded-full" />
            )}
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
