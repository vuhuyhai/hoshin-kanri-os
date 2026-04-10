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
      (event) => {
        if (event === 'SIGNED_IN') {
          router.refresh()
        }
        if (event === 'SIGNED_OUT') {
          // Admin pages handle their own sign-out redirect
          if (pathname.startsWith('/admin')) return
          router.push('/login')
        }
      }
    )

    // Handle hash fragment from magic link (implicit flow)
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      router.push('/auth/callback' + window.location.hash)
    }

    return () => subscription.unsubscribe()
  }, [router])

  return null
}
