import Link from 'next/link'

interface CtaBannerNBProps {
  overline?: string
  title: string
  subtitle?: string
  ctaLabel: string
  ctaHref: string
  variant?: 'brand' | 'dark' | 'yellow'
  showDotPattern?: boolean
}

export default function CtaBannerNB({
  overline,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  variant = 'brand',
  showDotPattern = true,
}: CtaBannerNBProps) {
  const bannerBg =
    variant === 'brand'
      ? 'bg-accent-brand text-bg-warm'
      : variant === 'dark'
        ? 'bg-bg-dark text-bg-warm'
        : 'bg-accent-yellow text-ink'

  const ctaClasses =
    variant === 'brand'
      ? 'bg-bg-warm text-ink hover:bg-accent-yellow'
      : variant === 'dark'
        ? 'bg-accent-yellow text-ink hover:bg-accent-cyan'
        : 'bg-accent-brand text-bg-warm hover:bg-ink'

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24">
      <div
        className={`relative max-w-[1100px] mx-auto border-[3px] border-ink rounded-[6px] p-8 lg:p-12 xl:p-16 text-center overflow-visible ${bannerBg} ${showDotPattern ? 'bg-dot-grid' : ''}`}
        style={{ boxShadow: 'var(--shadow-double)' }}
      >
        <span
          className="nb-sticker absolute top-[-12px] left-8"
          style={{ background: 'var(--accent-yellow)', color: 'var(--ink)' }}
          aria-hidden="true"
        >
          FREE · 5 PHÚT
        </span>

        {overline && (
          <p className="font-mono uppercase text-xs tracking-[0.08em] mb-6 opacity-90 mt-2">
            {overline}
          </p>
        )}

        <h2
          className="font-display font-bold tracking-tight mb-4"
          style={{ fontSize: 'clamp(36px, 5vw, 64px)', letterSpacing: '-0.03em' }}
        >
          {title}
        </h2>

        {subtitle && (
          <p className="font-body text-base lg:text-lg max-w-[640px] mx-auto mb-8 leading-relaxed opacity-95">
            {subtitle}
          </p>
        )}

        <Link
          href={ctaHref}
          className={`inline-flex items-center gap-2 font-display font-bold uppercase tracking-wide px-8 py-4 border-[3px] border-ink rounded-[4px] btn-brutal ${ctaClasses}`}
          style={{ boxShadow: '4px 4px 0 var(--ink)' }}
        >
          {ctaLabel} →
        </Link>
      </div>
    </section>
  )
}
