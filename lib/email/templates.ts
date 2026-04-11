function safeHref(url: string): string {
  try {
    const parsed = new URL(url)
    if (!['https:', 'http:'].includes(parsed.protocol)) return '#'
    return url.replace(/"/g, '&quot;')
  } catch {
    return '#'
  }
}

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border:2px solid #1a1a1a;max-width:480px;width:100%">
        <tr><td style="padding:32px 28px;border-bottom:2px solid #1a1a1a;text-align:center">
          <strong style="font-size:18px;letter-spacing:2px;text-transform:uppercase;color:#1a1a1a">HOSHIN KANRI OS</strong>
        </td></tr>
        <tr><td style="padding:32px 28px">
          ${content}
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:2px solid #1a1a1a;text-align:center">
          <span style="font-size:12px;color:#888">© ${new Date().getFullYear()} Hoshin Kanri OS — Biến chiến lược thành hành động</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string) {
  const safe = safeHref(href)
  return `<table cellpadding="0" cellspacing="0" style="margin:24px auto">
  <tr><td style="background:#1a1a1a;border:2px solid #1a1a1a;padding:12px 32px;text-align:center">
    <a href="${safe}" style="color:#fff;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase">${label}</a>
  </td></tr>
</table>`
}

export function verificationEmailTemplate(link: string) {
  const safe = safeHref(link)
  const subject = 'Xác nhận tài khoản Hoshin Kanri OS'
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#1a1a1a">
      Xác nhận email của bạn
    </h2>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#444">
      Cảm ơn bạn đã đăng ký Hoshin Kanri OS. Nhấn nút bên dưới để xác nhận email và kích hoạt tài khoản.
    </p>
    ${ctaButton(link, 'Xác nhận tài khoản')}
    <p style="margin:16px 0 0;font-size:12px;color:#888">
      Link có hiệu lực trong 24 giờ. Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email này.
    </p>
    <p style="margin:12px 0 0;font-size:11px;color:#aaa;word-break:break-all">
      Nếu nút không hoạt động, sao chép link sau:<br>${safe}
    </p>
  `)
  return { subject, html }
}

export function resetPasswordEmailTemplate(link: string) {
  const safe = safeHref(link)
  const subject = 'Đặt lại mật khẩu — Hoshin Kanri OS'
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#1a1a1a">
      Đặt lại mật khẩu
    </h2>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#444">
      Bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tạo mật khẩu mới.
    </p>
    ${ctaButton(link, 'Đặt lại mật khẩu')}
    <p style="margin:16px 0 0;font-size:12px;color:#888">
      Link có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
    </p>
    <p style="margin:12px 0 0;font-size:11px;color:#aaa;word-break:break-all">
      Nếu nút không hoạt động, sao chép link sau:<br>${safe}
    </p>
  `)
  return { subject, html }
}
