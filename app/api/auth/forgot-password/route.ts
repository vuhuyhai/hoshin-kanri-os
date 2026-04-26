import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import { resetPasswordEmailTemplate } from '@/lib/email/templates'
import { parseBody, forgotPasswordSchema } from '@/lib/validation'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Dual-key rate limit. IP bucket defends the infra (mass enumeration),
// email bucket defends a specific inbox from being bombed by an attacker
// rotating through proxies. A single compromised IP can still hit 3
// unique targets within 15 min, which matches normal user behavior.
const IP_LIMIT = 5
const EMAIL_LIMIT = 3
const WINDOW_SECONDS = 900

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers)
    const ipRl = await checkRateLimit({
      key: `auth:forgot-password:ip:${ip}`,
      limit: IP_LIMIT,
      windowSeconds: WINDOW_SECONDS,
    })
    if (!ipRl.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((ipRl.resetAt.getTime() - Date.now()) / 1000),
      )
      return NextResponse.json(
        {
          error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil(retryAfter / 60)} phút.`,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }

    const parsed = await parseBody(request, forgotPasswordSchema)
    if (!parsed.ok) return parsed.response
    const { email } = parsed.data

    // Per-email bucket defends a specific victim's inbox. Keyed on
    // lowercased email so case variants don't bypass the limit.
    const emailRl = await checkRateLimit({
      key: `auth:forgot-password:email:${email.toLowerCase()}`,
      limit: EMAIL_LIMIT,
      windowSeconds: WINDOW_SECONDS,
    })
    if (!emailRl.allowed) {
      // Don't reveal email existence — return the same fake-success
      // message the rest of this route uses. The attacker just learns
      // "slow down", not "this email is registered".
      return NextResponse.json({
        success: true,
        message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
      })
    }

    const admin = createAdminClient()
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Generate recovery link
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
      },
    })

    if (error) {
      // Don't reveal whether email exists — always return success
      return NextResponse.json({ success: true, message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.' })
    }

    const supabaseLink = data.properties?.action_link
    if (!supabaseLink) {
      return NextResponse.json({ success: true, message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.' })
    }

    // Rewrite Supabase link to app callback URL
    const linkUrl = new URL(supabaseLink)
    const tokenHash = linkUrl.searchParams.get('token') ?? linkUrl.searchParams.get('token_hash')
    const type = linkUrl.searchParams.get('type') ?? 'recovery'

    if (!tokenHash) {
      return NextResponse.json({ success: true, message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.' })
    }

    const callbackUrl = `${origin}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=/update-password`

    // Send password reset email via Resend
    const { subject, html } = resetPasswordEmailTemplate(callbackUrl)
    const emailResult = await sendEmail({ to: email, subject, html })

    if (emailResult.error) {
      // Swallow — don't reveal email existence via side-channels
    }

    // Always return success (don't leak user existence)
    return NextResponse.json({
      success: true,
      message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Lỗi hệ thống. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
