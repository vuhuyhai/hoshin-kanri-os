import { NextRequest, NextResponse } from 'next/server'
import {
  createClient,
  requireOrgRole,
  ADMIN_ROLES,
} from '@/lib/supabase/server'
import { parseBody, createAnnualReviewSchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
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

    const bodyParsed = await parseBody(request, createAnnualReviewSchema)
    if (!bodyParsed.ok) return bodyParsed.response
    const { xMatrixId } = bodyParsed.data

    const { data: xMatrix, error: lookupError } = await supabase
      .from('x_matrices')
      .select('id, org_id')
      .eq('id', xMatrixId)
      .maybeSingle()

    if (lookupError) {
      console.error(`[annual-review/create] [${requestId}]`, lookupError)
      return NextResponse.json(
        { error: 'Không thể tạo annual review', requestId },
        { status: 500 },
      )
    }
    if (!xMatrix) {
      return NextResponse.json(
        { error: 'X-Matrix không tồn tại', requestId },
        { status: 404 },
      )
    }

    const check = await requireOrgRole(
      supabase,
      user.id,
      xMatrix.org_id,
      ADMIN_ROLES,
    )
    if (!check.ok) {
      return NextResponse.json(
        { error: check.error, requestId },
        { status: check.status },
      )
    }

    // Idempotent: x_matrix_id has a UNIQUE constraint on annual_reviews.
    // If a draft already exists, return it instead of erroring on a
    // duplicate key — the CEO clicking "Start Review" twice should be safe.
    // A completed/transitioned review must not be re-created — surface 409.
    const { data: existing, error: existingError } = await supabase
      .from('annual_reviews')
      .select('id, status, x_matrix_id')
      .eq('x_matrix_id', xMatrixId)
      .maybeSingle()

    if (existingError) {
      console.error(`[annual-review/create] [${requestId}]`, existingError)
      return NextResponse.json(
        { error: 'Không thể tạo annual review', requestId },
        { status: 500 },
      )
    }

    if (existing) {
      if (existing.status === 'draft') {
        return NextResponse.json({
          id: existing.id,
          status: existing.status,
          x_matrix_id: existing.x_matrix_id,
          existing: true,
        })
      }
      return NextResponse.json(
        {
          error:
            existing.status === 'transitioned'
              ? 'X-Matrix này đã được chuyển giao sang năm mới'
              : 'Annual review đã hoàn thành — không thể tạo mới',
          requestId,
        },
        { status: 409 },
      )
    }

    const { data: created, error: insertError } = await supabase
      .from('annual_reviews')
      .insert({
        x_matrix_id: xMatrixId,
        org_id: xMatrix.org_id,
        reviewed_by: user.id,
        status: 'draft',
      })
      .select('id, status, x_matrix_id')
      .single()

    if (insertError || !created) {
      console.error(`[annual-review/create] [${requestId}]`, insertError)
      return NextResponse.json(
        { error: 'Không thể tạo annual review', requestId },
        { status: 500 },
      )
    }

    return NextResponse.json({
      id: created.id,
      status: created.status,
      x_matrix_id: created.x_matrix_id,
    })
  } catch (err) {
    console.error(`[annual-review/create] [${requestId}]`, err)
    return NextResponse.json(
      { error: 'Không thể tạo annual review', requestId },
      { status: 500 },
    )
  }
}
