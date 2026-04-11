'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Khách hàng', href: '/admin/customers', icon: Users },
] as const

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r-[3px] border-ink bg-bg-warm">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b-[3px] border-ink">
        <Image
          src="/images/logo-dark.png"
          alt="Hoshin Kanri OS"
          width={28}
          height={28}
          className="flex-shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-display font-black text-[13px] text-ink uppercase tracking-wider whitespace-nowrap">
            Hoshin Kanri OS
          </span>
          <span className="badge-brutal border-accent-brand text-accent-brand text-[10px] mt-1 w-fit">
            SUPER ADMIN
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link key={item.href} href={item.href}>
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

      {/* Logout — bottom */}
      <div className="mt-auto border-t-[3px] border-ink">
        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full min-h-[44px] items-center gap-3 px-4 py-3',
            'font-display text-[13px] font-semibold uppercase tracking-[.08em]',
            'text-text-2 transition-colors hover:bg-bg-muted-warm hover:text-ink'
          )}
        >
          <LogOut size={18} strokeWidth={2} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
