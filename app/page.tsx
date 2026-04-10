import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-bg-warm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 lg:px-12">
          <Link href="/" aria-label="Trang chủ Hoshin Kanri OS">
            <Logo size="sm" showText />
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

      <main>
        {/* ─── [1] HERO ─── */}
        <section className="w-full bg-bg-warm">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-8 px-6 py-16 md:py-24 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-32">
            {/* Text */}
            <div>
              <p className="overline mb-3">Chiến lược cho SME Việt Nam</p>
              <h1
                className="font-display font-black uppercase text-ink leading-[1.05]"
                style={{ fontSize: 'clamp(40px, 6vw, 72px)' }}
              >
                Biến chiến lược thành hành động đo được trong{' '}
                <span className="text-accent-brand">90 ngày</span>
              </h1>
              <p className="mt-6 max-w-prose font-body text-lg text-text-2">
                Hoshin Kanri OS — Công cụ quản lý chiến lược cho SME Việt Nam.
                AI hỗ trợ từ phân tích hiện trạng đến triển khai KPI.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/x-ray" className="w-full sm:w-auto">
                  <span className="btn-brutal-primary block text-center text-sm px-8 py-3.5 sm:inline-block">
                    Chẩn đoán miễn phí →
                  </span>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <span className="btn-brutal-secondary block text-center text-sm px-8 py-3.5 sm:inline-block">
                    Đăng nhập
                  </span>
                </Link>
              </div>
              <p className="mt-4 font-body text-sm text-text-3">
                Business X-Ray — 5 phút, miễn phí, không cần đăng ký
              </p>
            </div>

            {/* Visual — strategy matrix illustration */}
            <div className="hidden lg:flex items-center justify-center" aria-hidden="true">
              <div className="relative w-full max-w-[400px] aspect-square">
                {/* Decorative grid representing X-Matrix */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-3">
                  {[
                    'bg-accent-brand',
                    'bg-ink',
                    'bg-bg-muted-warm border-2 border-ink',
                    'bg-ink',
                    'bg-accent-brand',
                    'bg-ink',
                    'bg-bg-muted-warm border-2 border-ink',
                    'bg-ink',
                    'bg-accent-brand',
                  ].map((cls, i) => (
                    <div
                      key={i}
                      className={`${cls} shadow-brutal-sm transition-transform duration-300 hover:-translate-x-0.5 hover:-translate-y-0.5`}
                    />
                  ))}
                </div>
                {/* Floating labels */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 badge-brutal bg-bg-warm border-ink border-2 text-ink px-3 py-1">
                  Vision
                </div>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 badge-brutal bg-bg-warm border-ink border-2 text-ink px-3 py-1">
                  KPIs
                </div>
                <div className="absolute top-1/2 -left-4 -translate-y-1/2 -rotate-90 badge-brutal bg-bg-warm border-ink border-2 text-ink px-3 py-1">
                  Hoshins
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── [2] SOCIAL PROOF BAR ─── */}
        <section className="w-full bg-bg-dark">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {[
              { value: '5 phút', label: 'Chẩn đoán miễn phí' },
              { value: '7 trụ cột', label: 'OPEX framework' },
              { value: 'AI-powered', label: 'Phân tích thông minh' },
              { value: '100%', label: 'Tiếng Việt' },
            ].map((item) => (
              <div key={item.label} className="px-6 py-6 text-center">
                <p className="font-display text-2xl font-black text-white md:text-3xl">
                  {item.value}
                </p>
                <p className="mt-1 font-body text-sm text-white/60">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── [3] HOW IT WORKS ─── */}
        <section className="w-full bg-bg-muted-warm">
          <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-12 lg:py-24">
            <div className="mb-12 text-center">
              <p className="overline mb-2">Quy trình</p>
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
                  <p className="mt-2 font-body text-sm text-text-2">
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
              <p className="overline mb-2">Tính năng</p>
              <h2 className="font-display text-3xl font-black uppercase text-ink md:text-4xl">
                Mọi thứ bạn cần
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[
                {
                  icon: '🔍',
                  title: 'Business X-Ray',
                  desc: 'Chẩn đoán sức khỏe doanh nghiệp theo 7 trụ cột OPEX. Nhận báo cáo chi tiết ngay lập tức.',
                },
                {
                  icon: '🧠',
                  title: 'AI SWOT Coach',
                  desc: 'AI Coach hướng dẫn phân tích 8Ms, Porter, PESTEL. Có nghiên cứu thị trường tự động.',
                },
                {
                  icon: '🎯',
                  title: 'X-Matrix Builder',
                  desc: 'Tạo kế hoạch chiến lược Hoshin Kanri. AI pre-fill 70% từ Discovery data.',
                },
                {
                  icon: '📈',
                  title: 'KPI Tracker',
                  desc: 'Cập nhật số liệu hàng tuần. Dashboard trực quan với sparkline và traffic light.',
                },
                {
                  icon: '📄',
                  title: 'Báo cáo tháng',
                  desc: 'AI tổng hợp hiệu suất, wins/risks, xu hướng. Export PDF cho ban lãnh đạo.',
                },
                {
                  icon: '🔭',
                  title: 'Vision Workshop',
                  desc: 'AI giúp bạn xây dựng tầm nhìn và mục tiêu năm. Chỉ cần trả lời 5 câu hỏi.',
                },
              ].map((f) => (
                <div key={f.title} className="card-brutal p-6">
                  <span className="text-4xl" role="img" aria-label={f.title}>
                    {f.icon}
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold uppercase tracking-wider text-ink">
                    {f.title}
                  </h3>
                  <p className="mt-2 font-body text-sm text-text-2">
                    {f.desc}
                  </p>
                </div>
              ))}
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
              <Logo size="sm" showText className="[&_span]:text-white" />
              <p className="mt-3 font-body text-sm text-white/50">
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
                {[
                  { label: 'Hoshin Kanri là gì?', href: '#' },
                  { label: 'Blog', href: '#' },
                  { label: 'Case Studies', href: '#' },
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

            {/* Legal */}
            <nav aria-label="Pháp lý">
              <p className="font-display text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
                Pháp lý
              </p>
              <ul className="space-y-2">
                {[
                  { label: 'Điều khoản sử dụng', href: '#' },
                  { label: 'Chính sách bảo mật', href: '#' },
                  { label: 'Liên hệ', href: '#' },
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

          <div className="mt-12 border-t border-white/10 pt-6 text-center">
            <p className="font-body text-sm text-white/40">
              © 2026 Hoshin Kanri OS. Built for Vietnamese SMEs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
