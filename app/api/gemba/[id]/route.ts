import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  WRITE_ROLES,
  ADMIN_ROLES,
} from '@/lib/supabase/server'
import {
  parseBody,
  updateGembaCommentStatusSchema,
} from '@/lib/validation'
import { checkRateLimit } from '@/lib/rate-limit'
import type { TablesUpdate } from '@/lib/supabase/types'

// PATCH: CEO+Manager update status (open → acknowledged → resolved).
// API attaches acknowledged_by/resolved_by + timestamps từ auth.uid()
// — client không control. CEO có thể skip ack → resolved trực tiếp.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID()
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401 },
      )
    }

    const bodyParsed = await parseBody(request, updateGembaCommentStatusSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const { status } = bodyParsed.data

    const { data: comment, error: lookupError } = await supabase
      .from('gemba_comments')
      .select('id, org_id')
      .eq('id', id)
      .maybeSingle()

    if (lookupError) {
      console.error(`[gemba/patch] [${requestId}]`, lookupError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }
    if (!comment) {
      return NextResponse.json(
        { error: 'Góp ý không tồn tại', requestId },
        { status: 404 },
      )
    }

    // Ownership defense-in-depth: requireOrgRole verifies user
    // belongs to comment.org_id with WRITE_ROLES. RLS gates the same,
    // nhưng explicit check tách 403 (role insufficient / cross-org) ra
    // khỏi 500 (raw 42501) cho UX rõ ràng hơn.
    const check = await requireOrgRole(
      supabase,
      user.id,
      comment.org_id,
      WRITE_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    const update: TablesUpdate<'gemba_comments'> = { status }
    const nowIso = new Date().toISOString()
    if (status === 'acknowledged') {
      update.acknowledged_by = user.id
      update.acknowledged_at = nowIso
    } else if (status === 'resolved') {
      update.resolved_by = user.id
      update.resolved_at = nowIso
    }

    const { data: updated, error: updateError } = await supabase
      .from('gemba_comments')
      .update(update)
      .eq('id', id)
      .select('id, status')
      .single()

    if (updateError || !updated) {
      console.error(`[gemba/patch] [${requestId}]`, updateError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }

    return NextResponse.json({ id: updated.id, status: updated.status })
  } catch (err) {
    console.error(`[gemba/patch] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}

// DELETE: CEO ONLY (ADMIN_ROLES) — moderation strict. Hard delete,
// không soft delete. API gắt hơn RLS migration 033 (CEO+Manager) —
// defense-in-depth tightening. Rate limit 10/5min vì destructive.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID()
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401 },
      )
    }

    const { data: comment, error: lookupError } = await supabase
      .from('gemba_comments')
      .select('id, org_id')
      .eq('id', id)
      .maybeSingle()

    if (lookupError) {
      console.error(`[gemba/delete] [${requestId}]`, lookupError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }
    if (!comment) {
      return NextResponse.json(
        { error: 'Góp ý không tồn tại', requestId },
        { status: 404 },
      )
    }

    const check = await requireOrgRole(
      supabase,
      user.id,
      comment.org_id,
      ADMIN_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    const rate = await checkRateLimit({
      key: `gemba:delete:${user.id}`,
      limit: 10,
      windowSeconds: 300,
    })
    if (!rate.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rate.resetAt.getTime() - Date.now()) / 1000),
      )
      return NextResponse.json(
        {
          error: 'Đang xoá quá nhanh. Vui lòng đợi vài phút.',
          retryAfter,
          requestId,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      )
    }

    const { error: deleteError } = await supabase
      .from('gemba_comments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error(`[gemba/delete] [${requestId}]`, deleteError)
      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 },
      )
    }

    return NextResponse.json({ id })
  } catch (err) {
    console.error(`[gemba/delete] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 },
    )
  }
}
