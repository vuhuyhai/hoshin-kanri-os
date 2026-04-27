import Link from 'next/link'

export default function HeroNB() {
  const cells: { active: boolean; color?: string }[] = [
    { active: true, color: 'bg-accent-yellow' },
    { active: false },
    { active: false },
    { active: false },
    { active: true, color: 'bg-accent-cyan' },
    { active: false },
    { active: false },
    { active: false },
    { active: true, color: 'bg-accent-pink' },
  ]

  return (
    <section className="w-full bg-bg-warm">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-12 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12">
          {/* LEFT — Copy */}
          <div>
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.08em] text-text-3">
              HOSHIN KANRI · POLICY DEPLOYMENT · AI
            </p>

            <h1 className="font-display leading-[1.05] text-ink">
              <span
                className="block font-bold"
                style={{ fontSize: 'clamp(40px, 5vw, 56px)', letterSpacing: '-0.02em' }}
              >
                Chiến lược
              </span>
              <span
                className="mt-1 block font-bold"
                style={{ fontSize: 'clamp(64px, 9vw, 88px)', letterSpacing: '-0.03em' }}
              >
                1 trang.
              </span>
              <span
                className="mt-4 block font-bold"
                style={{ fontSize: 'clamp(28px, 4vw, 38px)', letterSpacing: '-0.02em' }}
              >
                Hành động <span className="nb-highlight">đo được</span> trong
              </span>
              <span className="mt-2 block">
                <span
                  className="inline-block font-bold text-accent-brand"
                  style={{
                    fontSize: 'clamp(80px, 12vw, 128px)',
                    letterSpacing: '-0.03em',
                    transform: 'rotate(-2deg)',
                  }}
                >
                  90 ngày
                </span>
              </span>
            </h1>

            <p className="mt-8 max-w-[560px] font-body text-base leading-relaxed text-text-2 lg:text-lg">
              Biến tầm nhìn của CEO thành KPI cụ thể, theo dõi hằng tuần, và
              báo cáo tự động — bằng phương pháp Toyota đã dùng 200+ năm và AI
              hiểu doanh nghiệp Việt.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link href="/x-ray" className="w-full sm:w-auto">
                <span className="btn-brutal-primary block px-8 py-3.5 text-center text-sm sm:inline-block">
                  Chẩn đoán miễn phí · 5 phút →
                </span>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <span className="btn-brutal-secondary block px-8 py-3.5 text-center text-sm sm:inline-block">
                  Đã có tài khoản
                </span>
              </Link>
            </div>
          </div>

          {/* RIGHT — Decorative X-Matrix grid */}
          <div
            className="relative mx-auto w-full max-w-[480px] lg:ml-auto lg:mr-0"
            aria-hidden="true"
          >
            <div
              className="relative aspect-square border-[3px] border-ink bg-bg-warm p-4"
              style={{
                transform: 'rotate(-1deg)',
                borderRadius: '6px',
                boxShadow: '6px 6px 0 var(--ink)',
              }}
            >
              <div className="grid h-full grid-cols-3 grid-rows-3 gap-3">
                {cells.map((cell, i) => (
                  <div
                    key={i}
                    className={`border-2 border-ink ${
                      cell.active ? cell.color : 'bg-bg-paper'
                    }`}
                    style={{
                      borderRadius: '4px',
                      boxShadow: cell.active
                        ? '6px 6px 0 var(--ink)'
                        : '2px 2px 0 var(--ink)',
                    }}
                  />
                ))}
              </div>

              {/* Floating stickers — controlled chaos */}
              <span
                className="absolute -left-2 -top-3 inline-block border-2 border-ink bg-accent-yellow px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink"
                style={{
                  transform: 'rotate(-3deg)',
                  boxShadow: '2px 2px 0 var(--ink)',
                }}
              >
                VISION
              </span>
              <span
                className="absolute right-[-12px] top-6 inline-block border-2 border-ink bg-accent-cyan px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink"
                style={{
                  transform: 'rotate(2deg)',
                  boxShadow: '2px 2px 0 var(--ink)',
                }}
              >
                GOALS
              </span>
              <span
                className="absolute bottom-[-16px] left-1/2 inline-block border-2 border-ink bg-accent-pink px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.08em] text-ink"
                style={{
                  transform: 'translateX(-50%) rotate(-2deg)',
                  boxShadow: '2px 2px 0 var(--ink)',
                }}
              >
                KPIs
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
