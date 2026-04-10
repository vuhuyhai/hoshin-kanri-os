'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Logo } from '@/components/ui/logo'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Khám phá', href: '/dashboard/discovery', icon: '🔍' },
  { label: 'X-Matrix', href: '/dashboard/x-matrix', icon: '📊' },
  { label: 'KPI Tracker', href: '/dashboard/kpi', icon: '📈' },
  { label: 'Báo cáo tháng', href: '/dashboard/report', icon: '📄' },
  { label: 'Cài đặt', href: '/dashboard/settings', icon: '⚙️' },
]

function NavLinks({ userRole }: { userRole: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + '/')

        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 font-display text-xs font-semibold uppercase tracking-widest transition-all duration-100 border-l-4',
                isActive
                  ? 'bg-ink text-white border-l-accent-brand'
                  : 'text-ink border-l-transparent hover:bg-bg-muted-warm hover:border-l-accent-brand'
              )}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </div>
          </Link>
        )
      })}

      {/* Divider */}
      <div className="border-t-2 border-ink my-3 mx-0" />

      <a
        href="/x-ray"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2.5 font-display text-xs font-semibold uppercase tracking-widest text-text-3 border-l-4 border-l-transparent hover:bg-bg-muted-warm hover:border-l-accent-brand transition-all duration-100"
      >
        <span className="text-sm">🔗</span>
        Chia sẻ X-Ray
      </a>

      {userRole === 'CEO' && (
        <p className="mt-4 px-3 font-display text-[10px] font-semibold uppercase tracking-widest text-text-3">
          Vai trò: CEO
        </p>
      )}
    </nav>
  )
}

export function Sidebar({ userRole }: { userRole: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r-[3px] border-ink bg-bg-warm md:flex md:flex-col">
        <div className="flex h-16 items-center px-4">
          <Link href="/dashboard" className="btn-brutal">
            <Logo size="sm" showText />
          </Link>
        </div>
        <div className="border-t-2 border-ink" />
        <div className="mt-3 flex-1">
          <NavLinks userRole={userRole} />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center border-2 border-ink bg-bg-warm shadow-brutal-sm btn-brutal hover:shadow-brutal-md md:hidden">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </SheetTrigger>
        <SheetContent side="left" className="w-60 p-0 border-r-[3px] border-ink bg-bg-warm">
          <div className="flex h-16 items-center px-4">
            <Logo size="sm" showText />
          </div>
          <div className="border-t-2 border-ink" />
          <div className="mt-3">
            <NavLinks userRole={userRole} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
