import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseBody, createOrgSchema, updateOrgSchema } from '@/lib/validation'

// POST: Create new org + add user as CEO (onboarding)
// Uses service role to bypass RLS (new user has no org_members yet)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
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

    const parsed = await parseBody(request, createOrgSchema)
    if (!parsed.ok) return parsed.response
    const { name, industry, headcount, city } = parsed.data

    // Use service role to bypass RLS for atomic org + member creation
    const adminDb = createAdminClient()

    const { data: org, error: orgError } = await adminDb
      .from('organizations')
      .insert({ name, industry, headcount, city })
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

    const parsed = await parseBody(request, updateOrgSchema)
    if (!parsed.ok) return parsed.response
    const updates = parsed.data

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
