import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import { parseBody, updateSwotFactorSchema } from '@/lib/validation'

async function getFactorOrgId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  factorId: string,
): Promise<string | null> {
  const { data: factor } = await supabase
    .from('swot_factors')
    .select('org_id')
    .eq('id', factorId)
    .single()
  return factor?.org_id ?? null
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; factorId: string }> },
) {
  try {
    const { factorId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const factorOrgId = await getFactorOrgId(supabase, factorId)
    if (!factorOrgId) {
      return NextResponse.json({ error: 'Yếu tố không tồn tại' }, { status: 404 })
    }
    const check = await requireOrgRole(supabase, user.id, factorOrgId, WRITE_ROLES)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })
    const { orgId } = check

    const parsed = await parseBody(req, updateSwotFactorSchema)
    if (!parsed.ok) return parsed.response
    const updates = parsed.data

    const { data: updated, error } = await supabase
      .from('swot_factors')
      .update(updates)
      .eq('id', factorId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi cập nhật yếu tố'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; factorId: string }> },
) {
  try {
    const { factorId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const factorOrgId = await getFactorOrgId(supabase, factorId)
    if (!factorOrgId) {
      return NextResponse.json({ error: 'Yếu tố không tồn tại' }, { status: 404 })
    }
    const check = await requireOrgRole(supabase, user.id, factorOrgId, WRITE_ROLES)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })
    const { orgId } = check

    const { error } = await supabase
      .from('swot_factors')
      .delete()
      .eq('id', factorId)
      .eq('org_id', orgId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi xoá yếu tố'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
