import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import { resetPasswordEmailTemplate } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      )
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
      console.error('[api/auth/forgot-password] generateLink error:', error.message)
      return NextResponse.json({ success: true, message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.' })
    }

    const supabaseLink = data.properties?.action_link
    if (!supabaseLink) {
      console.error('[api/auth/forgot-password] No action_link in response')
      return NextResponse.json({ success: true, message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.' })
    }

    // Rewrite Supabase link to app callback URL
    const linkUrl = new URL(supabaseLink)
    const tokenHash = linkUrl.searchParams.get('token') ?? linkUrl.searchParams.get('token_hash')
    const type = linkUrl.searchParams.get('type') ?? 'recovery'

    if (!tokenHash) {
      console.error('[api/auth/forgot-password] No token in action_link:', supabaseLink)
      return NextResponse.json({ success: true, message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.' })
    }

    const callbackUrl = `${origin}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=/update-password`

    // Send password reset email via Resend
    const { subject, html } = resetPasswordEmailTemplate(callbackUrl)
    const emailResult = await sendEmail({ to: email, subject, html })

    if (emailResult.error) {
      console.error('[api/auth/forgot-password] Email send failed:', emailResult.error)
    }

    // Always return success (don't leak user existence)
    return NextResponse.json({
      success: true,
      message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.',
    })
  } catch (err) {
    console.error('[api/auth/forgot-password] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Lỗi hệ thống. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
