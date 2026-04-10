import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'No org' }, { status: 403 })
    }

    const { data: history } = await supabase
      .from('xray_results')
      .select('id, overall_score, overall_level, result_json, created_at')
      .eq('org_id', membership.org_id)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ history: history ?? [] })
  } catch (error) {
    console.error('X-Ray history error:', error)
    return NextResponse.json(
      { error: 'Không thể tải lịch sử' },
      { status: 500 }
    )
  }
}
