import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// DEV ONLY — auto-login without email verification.
// Gated by ENABLE_DEV_LOGIN env var (only set in .env.local, never in Vercel).
export async function GET(request: NextRequest) {
  if (process.env.ENABLE_DEV_LOGIN !== 'true') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  const email = request.nextUrl.searchParams.get('email') ?? 'fitnessviet@gmail.com'

  // Use admin client to get/create user and generate session
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Get user by email
  const { data: userList } = await adminClient.auth.admin.listUsers()
  const user = userList?.users?.find((u) => u.email === email)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Generate a magic link and extract the token
  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

  if (linkError || !linkData) {
    return NextResponse.json(
      { error: linkError?.message ?? 'Cannot generate link' },
      { status: 500 }
    )
  }

  // Extract the token hash from the action_link
  const actionLink = linkData.properties?.action_link
  if (!actionLink) {
    return NextResponse.json({ error: 'No action link' }, { status: 500 })
  }

  const url = new URL(actionLink)
  const token = url.searchParams.get('token')
  const type = url.searchParams.get('type')

  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 500 })
  }

  // Verify the OTP token to create a session
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: verifyData, error: verifyError } =
    await supabase.auth.verifyOtp({
      token_hash: token,
      type: (type as 'magiclink') ?? 'magiclink',
    })

  if (verifyError || !verifyData.session) {
    return NextResponse.json(
      { error: verifyError?.message ?? 'Verify failed' },
      { status: 500 }
    )
  }

  // Upsert user in public.users table
  await supabase.from('users').upsert(
    { id: verifyData.user!.id, email: verifyData.user!.email! },
    { onConflict: 'id' }
  )

  // Check org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', verifyData.user!.id)
    .single()

  const redirectUrl = membership
    ? new URL('/dashboard', request.url)
    : new URL('/onboarding/setup-org', request.url)

  return NextResponse.redirect(redirectUrl)
}
