import { NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  WRITE_ROLES,
} from '@/lib/supabase/server'
import type { SwotFactor } from '@/lib/swot/tows-types'

type UpdatableFields = Partial<
  Pick<SwotFactor, 'content' | 'evidence_text' | 'is_key_factor' | 'quality_score'>
>

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
  req: Request,
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

    const body = (await req.json()) as UpdatableFields

    const updates: {
      content?: string
      evidence_text?: string | null
      is_key_factor?: boolean
      quality_score?: number | null
    } = {}
    if (body.content !== undefined) updates.content = body.content
    if (body.evidence_text !== undefined) updates.evidence_text = body.evidence_text
    if (body.is_key_factor !== undefined) updates.is_key_factor = body.is_key_factor
    if (body.quality_score !== undefined) updates.quality_score = body.quality_score

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Không có trường nào để cập nhật' }, { status: 400 })
    }

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
