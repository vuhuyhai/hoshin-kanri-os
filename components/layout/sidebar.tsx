'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
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
  { label: 'Cài đặt', href: '/dashboard/settings', icon: '⚙️' },
]

function NavLinks({ userRole }: { userRole: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + '/')
        const isDashboard = pathname === '/dashboard'
        const isDiscovery = item.href === '/dashboard/discovery'

        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDashboard && isDiscovery
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {isDashboard && isDiscovery && (
                <span className="ml-auto text-xs font-normal text-primary">
                  Bắt đầu
                </span>
              )}
            </div>
          </Link>
        )
      })}
      <Separator className="mx-3 my-3" />
      <a
        href="/x-ray"
        target="_blank"
        rel="noopener noreferrer"
        className="mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <span className="text-base">🔗</span>
        Chia sẻ X-Ray
      </a>
      {userRole === 'CEO' && (
        <p className="mt-4 px-3 text-xs text-muted-foreground">
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
      <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard" className="text-xl font-bold text-primary">
            Hoshin Kanri OS
          </Link>
        </div>
        <Separator />
        <div className="mt-4 flex-1">
          <NavLinks userRole={userRole} />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent md:hidden">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center px-6">
            <span className="text-xl font-bold text-primary">
              Hoshin Kanri OS
            </span>
          </div>
          <Separator />
          <div className="mt-4">
            <NavLinks userRole={userRole} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
