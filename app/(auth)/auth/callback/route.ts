import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'magiclink' | 'email' | null
  const error = searchParams.get('error')

  // Supabase returned an error (e.g. expired link)
  if (error) {
    console.error('[auth/callback] error:', error, searchParams.get('error_description'))
    return NextResponse.redirect(`${origin}/login?error=link_expired`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // safety net
          }
        },
      },
    }
  )

  // Flow 1: token_hash — direct verification, no PKCE needed
  if (tokenHash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })

    if (verifyError) {
      console.error('[auth/callback] verifyOtp failed:', verifyError.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }
  // Flow 2: PKCE code exchange (fallback)
  else if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[auth/callback] exchangeCode failed:', exchangeError.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }
  }
  // No valid params
  else {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Upsert user record (non-fatal)
  await supabase.from('users').upsert(
    { id: user.id, email: user.email! },
    { onConflict: 'id' }
  ).then(({ error: e }) => {
    if (e) console.error('[auth/callback] upsert error:', e.message)
  })

  // Check org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.redirect(`${origin}/onboarding/setup-org`)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
