import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { VisionSaveRequest } from '@/lib/discovery/types'
import type { Json } from '@/lib/supabase/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: VisionSaveRequest = await request.json()

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

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
      data_json: {
        answers: body.answers,
        draft: body.draft,
        finalVision: body.finalVision,
        finalGoals: body.finalGoals,
      } as unknown as Json,
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
