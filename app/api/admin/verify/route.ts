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
    .from('profiles' as 'organizations')
    .select('is_super_admin' as 'id')
    .eq('id' as 'id', user.id)
    .single()

  const flag = (profile as unknown as { is_super_admin: boolean } | null)
    ?.is_super_admin

  return NextResponse.json({ isSuperAdmin: flag === true })
}
