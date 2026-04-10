import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Supabase returned an error in the URL (e.g. expired link)
  if (error) {
    console.error('[auth/callback] Supabase error param:', error, errorDescription)
    return NextResponse.redirect(`${origin}/login?error=link_expired`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
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
            // Route Handlers can always write cookies — this catch is a safety net
          }
        },
      },
    }
  )

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] exchangeCodeForSession failed:', exchangeError.message, exchangeError.name)

    // PKCE verifier missing = link was opened in a different browser than where login was initiated
    if (
      exchangeError.name === 'AuthPKCECodeVerifierMissingError' ||
      exchangeError.message.toLowerCase().includes('pkce') ||
      exchangeError.message.toLowerCase().includes('code verifier')
    ) {
      return NextResponse.redirect(`${origin}/login?error=wrong_browser`)
    }

    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Session is now set in cookies — get the user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[auth/callback] getUser failed after exchange:', userError?.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Upsert user record into public.users — non-fatal if it fails (RLS, duplicate, etc.)
  const { error: upsertError } = await supabase.from('users').upsert(
    { id: user.id, email: user.email! },
    { onConflict: 'id' }
  )
  if (upsertError) {
    // Log but don't fail — session is valid, user can still access the app
    console.error('[auth/callback] users upsert error:', upsertError.message, upsertError.code)
  }

  // Check if user has an org membership
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
