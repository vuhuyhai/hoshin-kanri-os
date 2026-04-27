import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HeroNB from '@/components/landing/HeroNB'
import MarqueeStrip from '@/components/landing/MarqueeStrip'
import FeatureCardNB from '@/components/landing/FeatureCardNB'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="flex min-h-screen flex-col">
      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-bg-warm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-12">
          <Link href="/" aria-label="Trang chủ Hoshin Kanri OS" className="flex items-center gap-2">
            <Image src="/images/logo-light.png" alt="Hoshin Kanri OS" width={40} height={40} priority />
            <span className="font-display font-black text-sm uppercase tracking-wider">Hoshin Kanri OS</span>
          </Link>
          <nav aria-label="Menu chính" className="flex items-center gap-3">
            <Link
              href="/blog"
              className="hidden font-display text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:text-accent-brand md:inline-block"
            >
              Blog
            </Link>
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

      <main>
        {/* ─── [1] HERO ─── */}
        <HeroNB />

        {/* ─── [2] MARQUEE STRIP ─── */}
        <MarqueeStrip
          items={[
            '5 PHÚT CHẨN ĐOÁN MIỄN PHÍ',
            '7 TRỤ CỘT OPEX',
            'AI HIỂU SME VIỆT',
            'X-MATRIX TỰ ĐỘNG',
            'KPI THEO DÕI HẰNG TUẦN',
            'BÁO CÁO THÁNG AI',
            'HOSHIN KANRI · FORTUNE 500',
            '100% TIẾNG VIỆT',
          ]}
          accentColor="yellow"
          speed="normal"
        />

        {/* ─── [3] HOW IT WORKS ─── */}
        <section className="w-full bg-bg-muted-warm">
          <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-12 lg:py-24">
            <div className="mb-12 text-center">
              <p className="heading-overline mb-2">Quy trình</p>
              <h2 className="font-display text-3xl font-black uppercase text-ink md:text-4xl">
                3 bước tới chiến lược rõ ràng
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
              {[
                {
                  num: '01',
                  title: 'Khám phá',
                  desc: 'Business X-Ray + SWOT + Pain Mapper. AI giúp bạn hiểu rõ doanh nghiệp trong 30 phút.',
                },
                {
                  num: '02',
                  title: 'Lập kế hoạch',
                  desc: 'AI tổng hợp Discovery → tạo X-Matrix với Vision, Hoshins, Initiatives, KPIs.',
                },
                {
                  num: '03',
                  title: 'Theo dõi',
                  desc: 'KPI Tracker hàng tuần + Báo cáo tháng tự động. Biết ngay đâu cần can thiệp.',
                },
              ].map((step) => (
                <div key={step.num} className="relative pl-20 md:pl-0 md:text-center">
                  <span
                    className="absolute left-0 top-0 font-display font-black text-ink/10 md:static md:block md:mb-4"
                    style={{ fontSize: 'clamp(60px, 8vw, 80px)' }}
                  >
                    {step.num}
                  </span>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wider text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 font-body text-[18px] leading-[1.75] text-text-2">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── [4] FEATURES ─── */}
        <section className="w-full bg-bg-warm">
          <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-12 lg:py-24">
            <div className="mb-12 text-center">
              <p className="heading-overline mb-2">Tính năng</p>
              <h2 className="font-display text-3xl font-black uppercase text-ink md:text-4xl">
                Mọi thứ bạn cần
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <FeatureCardNB
                icon="🔍"
                title="Business X-Ray"
                desc="Chẩn đoán sức khỏe doanh nghiệp theo 7 trụ cột OPEX. Nhận báo cáo chi tiết ngay lập tức."
                variant="yellow"
                stickerLabel="01"
                tilt={true}
                tiltDirection="left"
              />
              <FeatureCardNB
                icon="🧠"
                title="AI SWOT Coach"
                desc="AI Coach hướng dẫn phân tích 8Ms, Porter, PESTEL. Có nghiên cứu thị trường tự động."
                variant="cyan"
                stickerLabel="02"
              />
              <FeatureCardNB
                icon="🎯"
                title="X-Matrix Builder"
                desc="Tạo kế hoạch chiến lược Hoshin Kanri. AI pre-fill 70% từ Discovery data."
                variant="pink"
                stickerLabel="03"
                tilt={true}
                tiltDirection="right"
              />
              <FeatureCardNB
                icon="📈"
                title="KPI Tracker"
                desc="Cập nhật số liệu hàng tuần. Dashboard trực quan với sparkline và traffic light."
                variant="lime"
                stickerLabel="04"
              />
              <FeatureCardNB
                icon="📄"
                title="Báo cáo tháng"
                desc="AI tổng hợp hiệu suất, wins/risks, xu hướng. Export PDF cho ban lãnh đạo."
                variant="peach"
                stickerLabel="05"
              />
              <FeatureCardNB
                icon="🔭"
                title="Vision Workshop"
                desc="AI giúp bạn xây dựng tầm nhìn và mục tiêu năm. Chỉ cần trả lời 5 câu hỏi."
                variant="lavender"
                stickerLabel="06"
              />
            </div>
          </div>
        </section>

        {/* ─── [5] CTA BANNER ─── */}
        <section className="w-full bg-accent-brand">
          <div className="mx-auto max-w-[1440px] px-6 py-16 text-center lg:px-12 lg:py-20">
            <h2 className="font-display text-3xl font-black uppercase text-white md:text-4xl">
              Bắt đầu miễn phí ngay
            </h2>
            <p className="mx-auto mt-4 max-w-prose font-body text-lg text-white/80">
              Business X-Ray chỉ mất 5 phút. Không cần đăng ký, không cần thẻ
              tín dụng.
            </p>
            <div className="mt-8">
              <Link href="/x-ray">
                <span className="inline-block bg-white text-ink border-2 border-white font-display text-sm font-bold uppercase tracking-wider px-8 py-3.5 shadow-[5px_5px_0_var(--accent-dark)] btn-brutal">
                  Chẩn đoán miễn phí →
                </span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── [6] FOOTER ─── */}
      <footer className="w-full bg-bg-dark">
        <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-12 lg:py-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <Image src="/images/logo-dark.png" alt="Hoshin Kanri OS" width={40} height={40} priority />
                <span className="font-display font-black text-sm uppercase tracking-wider text-white">Hoshin Kanri OS</span>
              </div>
              <p className="mt-3 font-body text-[15px] text-white/50">
                Công cụ quản lý chiến lược Hoshin Kanri cho SME Việt Nam.
              </p>
            </div>

            {/* Product */}
            <nav aria-label="Sản phẩm">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
                Sản phẩm
              </p>
              <ul className="space-y-2">
                {[
                  { label: 'Business X-Ray', href: '/x-ray' },
                  { label: 'Discovery Hub', href: '/login' },
                  { label: 'X-Matrix Builder', href: '/login' },
                  { label: 'KPI Tracker', href: '/login' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Resources */}
            <nav aria-label="Tài nguyên">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
                Tài nguyên
              </p>
              <ul className="space-y-2">
                <li>
                  <span aria-disabled="true" className="font-body text-sm cursor-not-allowed text-text-3 opacity-60">
                    Hoshin Kanri là gì? <span className="text-xs">(sắp ra mắt)</span>
                  </span>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="font-body text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <span aria-disabled="true" className="font-body text-sm cursor-not-allowed text-text-3 opacity-60">
                    Case Studies <span className="text-xs">(sắp ra mắt)</span>
                  </span>
                </li>
              </ul>
            </nav>

            {/* Legal */}
            <nav aria-label="Pháp lý">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
                Pháp lý
              </p>
              <ul className="space-y-2">
                {[
                  { label: 'Điều khoản sử dụng', href: '/dieu-khoan' },
                  { label: 'Chính sách bảo mật', href: '/chinh-sach-bao-mat' },
                  { label: 'Liên hệ', href: '/lien-he' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
