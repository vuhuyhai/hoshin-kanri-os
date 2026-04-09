'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AuthListener() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          router.refresh()
        }
        if (event === 'SIGNED_OUT') {
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
