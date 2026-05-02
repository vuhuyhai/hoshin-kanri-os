import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
    const membership = await getActiveMembership(supabase, user.id, lastOrgId)

    if (!membership) {
      return NextResponse.json({ error: 'No org' }, { status: 403 })
    }

    const { data: history, count } = await supabase
      .from('xray_results')
      .select('id, overall_score, overall_level, result_json, created_at', { count: 'exact' })
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ history: history ?? [], total: count ?? 0 })
  } catch (error) {
    console.error('X-Ray history error:', error)
    return NextResponse.json(
      { error: 'Không thể tải lịch sử' },
      { status: 500 }
    )
  }
}
