import { NextRequest, NextResponse } from 'next/server'
import { parseBody } from '@/lib/validation'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { newsletterSubscribeSchema } from '@/lib/newsletter/schema'
import { addSubscriber } from '@/lib/newsletter/queries'

// Per-IP cap. Newsletter signup is lower-risk than password reset
// (no victim to bomb), so a single IP bucket is enough — confirming
// existence of an email is fine here.
const IP_LIMIT = 10
const WINDOW_SECONDS = 3600

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers)
    const rl = await checkRateLimit({
      key: `newsletter:subscribe:ip:${ip}`,
      limit: IP_LIMIT,
      windowSeconds: WINDOW_SECONDS,
    })
    if (!rl.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000)
      )
      return NextResponse.json(
        {
          error: `Quá nhiều yêu cầu. Thử lại sau ${Math.ceil(retryAfter / 60)} phút.`,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const parsed = await parseBody(request, newsletterSubscribeSchema)
    if (!parsed.ok) return parsed.response

    const result = await addSubscriber({
      email: parsed.data.email,
      source: parsed.data.source,
    })

    const message =
      result.status === 'created'
        ? 'Cảm ơn bạn đã đăng ký! Chúng tôi sẽ gửi bài mới nhất qua email.'
        : result.status === 'reactivated'
          ? 'Đã kích hoạt lại đăng ký của bạn.'
          : 'Email này đã đăng ký rồi. Hẹn bạn ở bài mới!'

    return NextResponse.json({ success: true, status: result.status, message })
  } catch (err) {
    console.error('[api/newsletter/subscribe] unexpected error:', err)
    return NextResponse.json(
      { error: 'Lỗi hệ thống. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
