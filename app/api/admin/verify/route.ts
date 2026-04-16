import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ isSuperAdmin: false })
  }

  // Use service role to bypass RLS
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.json({ isSuperAdmin: profile?.is_super_admin === true })
}
