import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership)
      return NextResponse.json({ error: 'Org not found' }, { status: 404 })

    if (membership.role !== 'CEO') {
      return NextResponse.json(
        { error: 'Chỉ CEO mới được thay đổi thông tin công ty' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, industry, headcount, city } = body as {
      name?: string
      industry?: string
      headcount?: string
      city?: string
    }

    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { error: 'Tên công ty không được trống' },
        { status: 400 }
      )
    }

    const updates: {
      name?: string
      industry?: string
      headcount?: string
      city?: string
    } = {}
    if (name !== undefined) updates.name = name.trim()
    if (industry !== undefined) updates.industry = industry
    if (headcount !== undefined) updates.headcount = headcount
    if (city !== undefined) updates.city = city

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Không có thay đổi' }, { status: 400 })
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', membership.org_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ org })
  } catch (error) {
    console.error('Settings org error:', error)
    return NextResponse.json(
      { error: 'Không thể cập nhật thông tin' },
      { status: 500 }
    )
  }
}
