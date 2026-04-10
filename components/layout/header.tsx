'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  orgName: string
  userEmail: string
}

export function Header({ orgName, userEmail }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const initials = userEmail.split('@')[0].slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b-[3px] border-ink bg-bg-warm px-6">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-sm font-extrabold uppercase tracking-wider text-ink md:text-base">
          {orgName}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle dark mode"
          className="flex h-9 w-9 items-center justify-center border-2 border-ink bg-bg-warm shadow-brutal-sm btn-brutal hover:shadow-brutal-md"
        >
          {/* Sun icon */}
          <svg
            className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
            />
          </svg>
          {/* Moon icon */}
          <svg
            className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
            />
          </svg>
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
                {userEmail}
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
    </header>
  )
}
