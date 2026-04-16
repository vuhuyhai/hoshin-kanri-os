import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import { verificationEmailTemplate } from '@/lib/email/templates'
import { parseBody, registerSchema } from '@/lib/validation'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// 5 signup attempts per IP per 15 minutes. Tight enough to block
// Resend-quota-burning spam, loose enough that a user who mistypes
// the form a few times won't get locked out.
const REGISTER_LIMIT = 5
const REGISTER_WINDOW_SECONDS = 900

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers)
    const rl = await checkRateLimit({
      key: `auth:register:${ip}`,
      limit: REGISTER_LIMIT,
      windowSeconds: REGISTER_WINDOW_SECONDS,
    })
    if (!rl.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000),
      )
      return NextResponse.json(
        {
          error: `Quá nhiều lần đăng ký. Vui lòng thử lại sau ${Math.ceil(retryAfter / 60)} phút.`,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      )
    }

    const parsed = await parseBody(request, registerSchema)
    if (!parsed.ok) return parsed.response
    const { email, password, full_name, phone } = parsed.data

    const admin = createAdminClient()
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Generate signup link — this creates the user in Supabase
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        data: { full_name: full_name?.trim(), phone },
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      // User already exists
      if (error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already been registered')) {
        return NextResponse.json(
          { error: 'Email này đã được đăng ký' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: 'Không thể tạo tài khoản. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    // Rewrite the Supabase-hosted link to our app's callback URL
    const supabaseLink = data.properties?.action_link
    if (!supabaseLink) {
      return NextResponse.json(
        { error: 'Lỗi hệ thống. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    const linkUrl = new URL(supabaseLink)
    const tokenHash = linkUrl.searchParams.get('token') ?? linkUrl.searchParams.get('token_hash')
    const type = linkUrl.searchParams.get('type') ?? 'signup'

    if (!tokenHash) {
      return NextResponse.json(
        { error: 'Lỗi hệ thống. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    const callbackUrl = `${origin}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`

    // Send verification email via Resend
    const { subject, html } = verificationEmailTemplate(callbackUrl)
    const emailResult = await sendEmail({ to: email, subject, html })

    if (emailResult.error) {
      // User was created but email failed — still return success
      // They can use "resend" or login directly (auto-confirmed)
      return NextResponse.json({
        success: true,
        emailSent: false,
        message: 'Tài khoản đã được tạo nhưng không gửi được email xác nhận.',
      })
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: 'Đã gửi email xác nhận',
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Lỗi hệ thống. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
