'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthListener() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user
          const meta = user.user_metadata ?? {}

          // Sync user data to users table (non-blocking)
          const userData: Record<string, unknown> = {
            id: user.id,
            email: user.email,
            full_name: (meta.full_name as string) ?? (meta.name as string) ?? null,
            phone: (meta.phone as string) ?? null,
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabase.from('users').upsert(userData as any, { onConflict: 'id' })
            .then(({ error }) => {
              if (error) console.error('[auth-listener] user sync error:', error.message)
            })

          router.refresh()
        }

        if (event === 'PASSWORD_RECOVERY') {
          router.push('/update-password')
        }

        if (event === 'SIGNED_OUT') {
          if (pathname.startsWith('/admin')) return
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, pathname])

  return null
}
