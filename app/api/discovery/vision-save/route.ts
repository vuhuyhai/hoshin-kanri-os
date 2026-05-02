import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { toJson } from '@/lib/utils'
import { parseBody, visionSaveSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, visionSaveSchema)
    if (!parsed.ok) return parsed.response
    const body = parsed.data

    const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
    const membership = await getActiveMembership(supabase, user.id, lastOrgId)

    if (!membership) {
      return NextResponse.json({ error: 'Org not found' }, { status: 404 })
    }

    // Delete existing vision session to avoid duplicates on re-save
    await supabase
      .from('discovery_sessions')
      .delete()
      .eq('org_id', membership.org_id)
      .eq('step_completed', 'vision')

    await supabase.from('discovery_sessions').insert({
      org_id: membership.org_id,
      user_id: user.id,
      step_completed: 'vision',
      data_json: toJson({
        answers: body.answers,
        draft: body.draft,
        finalVision: body.finalVision,
        finalGoals: body.finalGoals,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vision save error:', error)
    return NextResponse.json(
      { error: 'Không thể lưu Vision.' },
      { status: 500 }
    )
  }
}
