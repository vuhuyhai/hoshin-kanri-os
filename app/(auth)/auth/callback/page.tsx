'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const handleAuth = async () => {
      const supabase = createClient()

      // Check for error in URL params
      const error = searchParams.get('error')
      if (error) {
        router.push('/login?error=link_expired')
        return
      }

      // Check for PKCE code flow
      const code = searchParams.get('code')
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          router.push('/login?error=auth_failed')
          return
        }
      }

      // Wait for session (handles both PKCE and implicit hash flow)
      // Supabase client auto-detects #access_token from URL hash
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !data.session) {
        // Retry once after a short delay (session might still be processing)
        await new Promise((r) => setTimeout(r, 1000))
        const retry = await supabase.auth.getSession()
        if (!retry.data.session) {
          router.push('/login?error=auth_failed')
          return
        }
      }

      const session = (await supabase.auth.getSession()).data.session
      if (!session) {
        router.push('/login?error=auth_failed')
        return
      }

      // Upsert user record
      await supabase.from('users').upsert(
        { id: session.user.id, email: session.user.email! },
        { onConflict: 'id' }
      )

      // Check if user has an org
      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', session.user.id)
        .single()

      if (!membership) {
        router.push('/onboarding/setup-org')
      } else {
        router.push('/dashboard')
      }
    }

    handleAuth()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-2 text-center">
        <div
          className="text-4xl animate-spin"
          style={{ animationDuration: '2s' }}
        >
          ⏳
        </div>
        <p className="text-sm text-muted-foreground">Đang đăng nhập...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  )
}
