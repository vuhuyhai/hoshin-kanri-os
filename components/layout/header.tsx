'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/logo'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { MobileSidebarContent, type SidebarProps } from '@/components/layout/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, Sun, Moon } from 'lucide-react'

/** Map pathname segments to Vietnamese breadcrumb labels */
const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  discovery: 'Khám phá',
  swot: 'SWOT Analysis',
  'pain-mapper': 'Pain Mapper',
  'vision-workshop': 'Vision Workshop',
  synthesis: 'Tổng hợp',
  benchmark: 'Benchmark',
  'xray-history': 'X-Ray History',
  'x-matrix': 'X-Matrix',
  kpi: 'KPI Tracker',
  report: 'Báo cáo tháng',
  settings: 'Cài đặt',
  new: 'Tạo mới',
  coaching: 'Coaching',
  strategy: 'Chiến lược',
}

function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  // Skip "dashboard" as root, show the rest
  const crumbs = segments.slice(1).map((seg) => BREADCRUMB_MAP[seg] || seg)

  if (crumbs.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="font-body text-sm text-text-3">/</span>
          )}
          <span className="font-body text-sm text-text-2">{crumb}</span>
        </span>
      ))}
    </nav>
  )
}

interface HeaderProps extends SidebarProps {
  orgName: string
  userEmail: string
}

export function Header({
  orgName,
  userEmail,
  userRole,
  orgIndustry,
  userName,
}: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [sheetOpen, setSheetOpen] = useState(false)

  const initials = (userName || userEmail.split('@')[0])
    .slice(0, 2)
    .toUpperCase()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-[var(--header-height)] shrink-0 items-center border-b-[3px] border-ink bg-bg-warm">
      {/* Mobile: hamburger + logo + avatar */}
      {/* Tablet/Mobile left: hamburger */}
      <div className="flex items-center gap-3 px-4 lg:hidden">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex h-11 w-11 items-center justify-center border-2 border-ink bg-bg-warm shadow-brutal-sm btn-brutal hover:shadow-brutal-md"
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Mobile center: logo icon only */}
      <div className="flex flex-1 items-center justify-center lg:hidden">
        <Logo size="sm" showText={false} />
      </div>

      {/* Desktop left: breadcrumb */}
      <div className="hidden flex-1 items-center px-6 lg:flex">
        <Breadcrumb />
      </div>

      {/* Right side: theme toggle + avatar */}
      <div className="flex items-center gap-2 px-4 lg:px-6">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark mode"
          className="hidden h-9 w-9 items-center justify-center border-2 border-ink bg-bg-warm shadow-brutal-sm btn-brutal hover:shadow-brutal-md md:flex"
        >
          <Sun
            size={16}
            className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          />
          <Moon
            size={16}
            className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          />
        </button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-accent-brand text-white font-display text-xs font-black shadow-brutal-sm btn-brutal hover:shadow-brutal-md">
            {initials}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-2 border-ink bg-bg-warm shadow-brutal-md"
          >
            <div className="px-3 py-2">
              <p className="font-display text-sm font-bold text-ink">
                {userName || userEmail}
              </p>
              <p className="font-body text-xs text-text-2">{orgName}</p>
            </div>
            <DropdownMenuSeparator className="bg-ink h-0.5" />
            <DropdownMenuItem
              onClick={() => router.push('/dashboard/settings')}
              className="font-display text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-ink h-0.5" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="font-display text-xs font-semibold uppercase tracking-wider text-destructive cursor-pointer"
            >
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sheet sidebar for tablet/mobile */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[85vw] max-w-[280px] p-0 border-r-[3px] border-ink bg-bg-warm md:max-w-[280px]"
        >
          <MobileSidebarContent
            userRole={userRole}
            orgName={orgName}
            orgIndustry={orgIndustry}
            userName={userName}
            userEmail={userEmail}
            onNavigate={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  )
}
