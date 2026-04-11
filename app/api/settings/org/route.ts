import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// POST: Create new org + add user as CEO (onboarding)
// Uses service role to bypass RLS (new user has no org_members yet)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user already has an org
    const { data: existing } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (existing)
      return NextResponse.json({ error: 'Bạn đã có tổ chức' }, { status: 409 })

    const body = await request.json()
    const { name, industry, headcount, city } = body as {
      name: string; industry: string; headcount: string; city: string
    }

    if (!name?.trim() || !industry)
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })

    // Use service role to bypass RLS for atomic org + member creation
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: org, error: orgError } = await adminDb
      .from('organizations')
      .insert({ name: name.trim(), industry, headcount, city })
      .select('id')
      .single()

    if (orgError || !org)
      return NextResponse.json({ error: 'Không thể tạo công ty' }, { status: 500 })

    const { error: memberError } = await adminDb
      .from('org_members')
      .insert({ org_id: org.id, user_id: user.id, role: 'CEO' })

    if (memberError) {
      // Rollback: delete the org if member creation fails
      await adminDb.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: 'Lỗi thiết lập tài khoản' }, { status: 500 })
    }

    return NextResponse.json({ org })
  } catch (error) {
    console.error('Setup org error:', error)
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
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
