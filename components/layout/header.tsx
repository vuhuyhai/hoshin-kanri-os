'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { MobileSidebarContent, type SidebarProps } from '@/components/layout/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, Sun, Moon, Monitor } from 'lucide-react'

/** Map pathname segments to Vietnamese page titles */
const PAGE_TITLE_MAP: Record<string, string> = {
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

function PageTitle() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const crumbs = segments.slice(1).map((seg) => PAGE_TITLE_MAP[seg] || seg)
  const title = crumbs[crumbs.length - 1] || 'Dashboard'

  return (
    <h1 className="font-display font-extrabold text-lg text-ink">{title}</h1>
  )
}

interface HeaderProps extends SidebarProps {
  orgName: string
  userEmail: string
}

export function Header({
  orgId,
  orgName,
  userEmail,
  userRole,
  orgIndustry,
  userName,
  memberships,
}: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center border-b-2 border-ink bg-bg-warm">
      {/* Mobile left: hamburger */}
      <div className="flex items-center gap-3 px-4 lg:hidden">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex h-11 w-11 items-center justify-center border-2 border-ink bg-bg-warm shadow-brutal-sm btn-brutal hover:shadow-brutal-md"
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Mobile center: logo */}
      <div className="flex flex-1 items-center justify-center lg:hidden">
        <Image src="/images/logo-light.png" alt="Hoshin Kanri OS" width={40} height={40} priority />
      </div>

      {/* Desktop left: page title */}
      <div className="hidden flex-1 items-center px-6 lg:flex">
        <PageTitle />
      </div>

      {/* Right side: theme toggle + avatar */}
      <div className="flex items-center gap-3 px-4 lg:px-6">
        {/* Theme toggle 3-option (M-Design-Dark-1 Commit 6 Q7 α) */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Đổi giao diện (hiện tại: ${theme === 'dark' ? 'Tối' : theme === 'system' ? 'Hệ thống' : 'Sáng'})`}
            className="relative hidden h-9 w-9 items-center justify-center border-2 border-ink bg-bg-warm shadow-brutal-sm btn-brutal hover:shadow-brutal-md md:flex focus:outline-none"
          >
            <Sun
              size={16}
              className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            />
            <Moon
              size={16}
              className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 border-2 border-ink bg-bg-warm shadow-brutal-md"
          >
            <DropdownMenuItem
              onClick={() => setTheme('light')}
              className="font-display text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              <Sun size={14} className="mr-2" />
              Sáng
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('dark')}
              className="font-display text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              <Moon size={14} className="mr-2" />
              Tối
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme('system')}
              className="font-display text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              <Monitor size={14} className="mr-2" />
              Hệ thống
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Mở menu tài khoản của ${userName || userEmail}`}
            className="flex h-9 items-center justify-center border-2 border-ink bg-accent-brand px-3 font-display text-sm font-bold uppercase tracking-wider text-white shadow-brutal-sm btn-brutal hover:shadow-brutal-md focus:outline-none"
          >
            {userName || userEmail.split('@')[0]}
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

      {/* Sheet sidebar for mobile */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[85vw] max-w-[280px] p-0 border-r-[3px] border-ink bg-bg-dark md:max-w-[280px]"
        >
          <MobileSidebarContent
            userRole={userRole}
            orgId={orgId}
            orgName={orgName}
            orgIndustry={orgIndustry}
            userName={userName}
            userEmail={userEmail}
            memberships={memberships}
            onNavigate={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  )
}
