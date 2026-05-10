'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function LienHePage() {
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-bg-warm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-12">
          <Link href="/" aria-label="Trang chủ Hoshin Kanri OS" className="flex items-center gap-2">
            <Image src="/images/logo-light.png" alt="Hoshin Kanri OS" width={40} height={40} priority />
            <span className="font-display font-black text-sm uppercase tracking-wider">Hoshin Kanri OS</span>
          </Link>
          <nav aria-label="Menu chính" className="flex items-center gap-3">
            <Link
              href="/x-ray"
              className="hidden font-display text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:text-accent-brand md:inline-block"
            >
              Business X-Ray
            </Link>
            <Link href="/login">
              <span className="btn-brutal-secondary text-xs px-5 py-2.5 inline-block">
                Đăng nhập
              </span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="w-full bg-bg-warm">
        <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-12 lg:py-24 text-center">
          <p className="overline mb-3">Liên hệ</p>
          <h1 className="font-display text-3xl font-black uppercase text-ink md:text-4xl">
            Chúng tôi ở đây để lắng nghe
          </h1>
          <p className="mx-auto mt-4 max-w-prose font-body text-lg text-text-2">
            Dù bạn đang muốn tìm hiểu sản phẩm, cần hỗ trợ kỹ thuật, hay muốn thảo luận về một dự án tư vấn — hãy liên hệ với chúng tôi. Không chatbot, không form phức tạp.
          </p>
          <p className="mt-2 font-body text-sm text-text-3">
            Chúng tôi thường phản hồi trong vòng 24 giờ làm việc.
          </p>
        </div>
      </section>

      {/* Contact Channels */}
      <section className="w-full bg-bg-muted-warm">
        <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Hỗ trợ sản phẩm */}
            <div className="card-subtle border-2 border-ink p-6 shadow-brutal-sm">
              <h3 className="font-display text-base font-bold uppercase tracking-wider text-ink">
                Hỗ trợ sản phẩm
              </h3>
              <p className="mt-2 font-body text-[15px] text-text-2">
                Câu hỏi về tài khoản, tính năng, lỗi kỹ thuật
              </p>
              <p className="mt-4 font-body text-sm">
                <strong className="text-ink">support@chienluoc.org</strong>
              </p>
              <p className="mt-1 font-body text-sm text-text-3">
                Phản hồi trong 4–8 giờ (giờ hành chính)
              </p>
            </div>

            {/* Tư vấn & hợp tác */}
            <div className="card-subtle border-2 border-ink p-6 shadow-brutal-sm">
              <h3 className="font-display text-base font-bold uppercase tracking-wider text-ink">
                Tư vấn &amp; hợp tác
              </h3>
              <p className="mt-2 font-body text-[15px] text-text-2">
                Muốn tìm hiểu gói Consulting, Training hoặc hợp tác chiến lược
              </p>
              <p className="mt-4 font-body text-sm">
                <strong className="text-ink">hello@chienluoc.org</strong>
              </p>
              <p className="mt-1 font-body text-sm text-text-3">
                Phản hồi trong 24 giờ
              </p>
            </div>

            {/* Bảo mật & pháp lý */}
            <div className="card-subtle border-2 border-ink p-6 shadow-brutal-sm">
              <h3 className="font-display text-base font-bold uppercase tracking-wider text-ink">
                Bảo mật &amp; pháp lý
              </h3>
              <p className="mt-2 font-body text-[15px] text-text-2">
                Yêu cầu về dữ liệu cá nhân, báo cáo lỗ hổng bảo mật
              </p>
              <p className="mt-4 font-body text-sm">
                <strong className="text-ink">privacy@chienluoc.org</strong>
              </p>
              <p className="mt-1 font-body text-sm text-text-3">
                Phản hồi trong 3 ngày làm việc
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="w-full bg-bg-warm">
        <div className="mx-auto max-w-[640px] px-6 py-16 lg:py-24">
          <h2 className="font-display text-2xl font-black uppercase text-ink text-center">
            Gửi tin nhắn
          </h2>

          {submitted ? (
            <div className="mt-8 border-2 border-ink bg-bg-muted-warm p-8 shadow-brutal-sm text-center">
              <p className="font-display text-lg font-bold text-ink">
                Cảm ơn bạn đã liên hệ!
              </p>
              <p className="mt-2 font-body text-text-2">
                Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Họ và tên */}
              <div>
                <label htmlFor="name" className="block font-display text-sm font-bold uppercase tracking-wider text-ink mb-2">
                  Họ và tên <span className="text-accent-brand">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full border-2 border-ink bg-white px-4 py-3 font-body text-[15px] text-ink shadow-brutal-sm outline-none transition-shadow focus:shadow-brutal-accent"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block font-display text-sm font-bold uppercase tracking-wider text-ink mb-2">
                  Email doanh nghiệp <span className="text-accent-brand">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full border-2 border-ink bg-white px-4 py-3 font-body text-[15px] text-ink shadow-brutal-sm outline-none transition-shadow focus:shadow-brutal-accent"
                />
              </div>

              {/* Tên công ty */}
              <div>
                <label htmlFor="company" className="block font-display text-sm font-bold uppercase tracking-wider text-ink mb-2">
                  Tên công ty
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="w-full border-2 border-ink bg-white px-4 py-3 font-body text-[15px] text-ink shadow-brutal-sm outline-none transition-shadow focus:shadow-brutal-accent"
                />
              </div>

              {/* Chủ đề */}
              <div>
                <label htmlFor="subject" className="block font-display text-sm font-bold uppercase tracking-wider text-ink mb-2">
                  Chủ đề
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full border-2 border-ink bg-white px-4 py-3 font-body text-[15px] text-ink shadow-brutal-sm outline-none transition-shadow focus:shadow-brutal-accent appearance-none cursor-pointer"
                >
                  <option value="demo">Tìm hiểu sản phẩm / Demo</option>
                  <option value="support">Hỗ trợ kỹ thuật</option>
                  <option value="consulting">Gói Consulting / Training</option>
                  <option value="partnership">Hợp tác / Đối tác</option>
                  <option value="bug">Báo lỗi</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              {/* Nội dung */}
              <div>
                <label htmlFor="message" className="block font-display text-sm font-bold uppercase tracking-wider text-ink mb-2">
                  Nội dung <span className="text-accent-brand">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full border-2 border-ink bg-white px-4 py-3 font-body text-[15px] text-ink shadow-brutal-sm outline-none transition-shadow focus:shadow-brutal-accent resize-y"
                />
              </div>

              {/* Consent */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-5 w-5 border-2 border-ink accent-accent-brand cursor-pointer"
                />
                <span className="font-body text-sm text-text-2">
                  Tôi đồng ý để Hoshin Kanri OS liên hệ lại theo thông tin trên
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={!agreed}
                className="btn-brutal-primary w-full text-sm px-8 py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Gửi tin nhắn
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full bg-bg-muted-warm">
        <div className="mx-auto max-w-[800px] px-6 py-16 lg:py-24">
          <h2 className="font-display text-2xl font-black uppercase text-ink text-center mb-10">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Tôi có thể dùng thử trước khi trả tiền không?',
                a: 'Có. Business X-Ray hoàn toàn miễn phí và không cần đăng ký. Gói trả phí có 7 ngày hoàn tiền 100%.',
              },
              {
                q: 'Hoshin Kanri OS có phù hợp với doanh nghiệp của tôi không?',
                a: 'Sản phẩm được thiết kế cho SME Việt Nam có từ 10–200 nhân viên, doanh thu 10–200 tỷ VND. Nếu bạn không chắc, hãy liên hệ để được tư vấn miễn phí.',
              },
              {
                q: 'Tôi cần hỗ trợ onboarding không?',
                a: 'Với gói Business trở lên, chúng tôi hỗ trợ onboarding 1:1 trong 60 phút đầu tiên.',
              },
              {
                q: 'Dữ liệu chiến lược của tôi có an toàn không?',
                a: 'Có. Dữ liệu được mã hóa AES-256, lưu riêng biệt theo từng tổ chức và không bao giờ được chia sẻ hay bán cho bên thứ ba.',
              },
            ].map((faq) => (
              <details key={faq.q} className="group border-2 border-ink bg-bg-warm shadow-brutal-sm">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-display text-sm font-bold uppercase tracking-wider text-ink">
                  {faq.q}
                  <span className="ml-4 text-xl transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="border-t-2 border-ink px-6 py-4 font-body text-[15px] leading-[1.7] text-text-2">
                  {faq.a}
                  {faq.q.includes('an toàn') && (
                    <>
                      {' '}Xem chi tiết tại{' '}
                      <Link href="/chinh-sach-bao-mat" className="font-semibold text-accent-brand underline underline-offset-2 hover:text-accent-dark transition-colors">
                        Chính sách bảo mật
                      </Link>.
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="w-full bg-bg-warm">
        <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-12 text-center">
          <p className="font-display text-sm font-bold uppercase tracking-wider text-ink">Hoshin Kanri OS</p>
          <p className="mt-2 font-body text-[15px] text-text-2">Việt Nam</p>
          <p className="mt-1 font-body text-[15px] text-text-2">
            <strong className="text-ink">hello@chienluoc.org</strong>
          </p>
        </div>
      </section>
    </div>
  )
}
