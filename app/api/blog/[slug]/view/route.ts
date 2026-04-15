import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// POST /api/blog/[slug]/view — increment views_count for a published post.
// Rate-limited per IP+slug at 1 view / 30 min to blunt trivial spam.
// No auth: this is a public endpoint fired from the client ViewTracker.

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!slug || slug.length > 120) {
    return NextResponse.json({ error: 'Slug không hợp lệ' }, { status: 400 })
  }

  const ip = getClientIp(request.headers)
  const rate = await checkRateLimit({
    key: `blog-view:${ip}:${slug}`,
    limit: 1,
    windowSeconds: 1800,
  })
  if (!rate.allowed) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Fail-soft: a broken view counter should never break the page.
  // Log and return 200 so the client's fire-and-forget fetch doesn't
  // surface errors in DevTools.
  try {
    const db = createAdminClient()
    const { error } = await db.rpc('increment_blog_post_views', {
      p_slug: slug,
    })
    if (error) console.error('increment_blog_post_views failed:', error)
  } catch (e) {
    console.error('/api/blog/view unexpected error:', e)
  }

  return NextResponse.json({ ok: true })
}
