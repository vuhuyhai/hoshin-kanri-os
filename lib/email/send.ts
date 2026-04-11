const RESEND_API_URL = 'https://api.resend.com/emails'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY is not configured')
    return { error: 'Email service not configured' }
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'Hoshin Kanri OS <noreply@resend.dev>',
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[email] Resend error:', res.status, body)
    return { error: `Email send failed: ${res.status}` }
  }

  return { error: null }
}
