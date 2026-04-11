import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import { verificationEmailTemplate } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      )
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' }, { status: 400 })
    }
    if (full_name && full_name.trim().length < 2) {
      return NextResponse.json({ error: 'Họ và tên phải có ít nhất 2 ký tự' }, { status: 400 })
    }
    if (phone && !/^0[0-9]{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Số điện thoại không hợp lệ' }, { status: 400 })
    }

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
      console.error('[api/auth/register] generateLink error:', error.message)
      return NextResponse.json(
        { error: 'Không thể tạo tài khoản. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    // Rewrite the Supabase-hosted link to our app's callback URL
    const supabaseLink = data.properties?.action_link
    if (!supabaseLink) {
      console.error('[api/auth/register] No action_link in response')
      return NextResponse.json(
        { error: 'Lỗi hệ thống. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    const linkUrl = new URL(supabaseLink)
    const tokenHash = linkUrl.searchParams.get('token') ?? linkUrl.searchParams.get('token_hash')
    const type = linkUrl.searchParams.get('type') ?? 'signup'

    if (!tokenHash) {
      console.error('[api/auth/register] No token in action_link:', supabaseLink)
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
      console.error('[api/auth/register] Email send failed:', emailResult.error)
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
    console.error('[api/auth/register] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Lỗi hệ thống. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
