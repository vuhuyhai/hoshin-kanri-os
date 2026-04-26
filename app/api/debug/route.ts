import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  if (process.env.ENABLE_DEBUG_ROUTE !== 'true') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ step: 'auth', error: authError?.message ?? 'no user' })
    }

    const { data: membership, error: memberError } = await supabase
      .from('org_members')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ step: 'membership', error: memberError?.message ?? 'no membership', userId: user.id })
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', membership.org_id)
      .single()

    return NextResponse.json({
      step: 'complete',
      user: { id: user.id, email: user.email },
      membership: { org_id: membership.org_id, role: membership.role },
      org: org ? { name: org.name, industry: org.industry } : null,
      orgError: orgError?.message ?? null,
    })
  } catch (error) {
    return NextResponse.json({
      step: 'crash',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
