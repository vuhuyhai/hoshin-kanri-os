interface StepCardNBProps {
  num: '01' | '02' | '03'
  title: string
  desc: string
  accent: 'yellow' | 'cyan' | 'pink'
  tilt?: boolean
  tiltDirection?: 'left' | 'right'
  stickerLabel?: string
}

export default function StepCardNB({
  num,
  title,
  desc,
  accent,
  tilt = false,
  tiltDirection = 'left',
  stickerLabel = 'BƯỚC',
}: StepCardNBProps) {
  return (
    <article
      className={`relative card-brutal bg-bg-warm ${tilt ? 'card-tilt' : ''} p-6 lg:p-8`}
      style={
        tilt
          ? { transform: `rotate(${tiltDirection === 'left' ? '-' : ''}1deg)` }
          : undefined
      }
    >
      <span
        className="nb-sticker absolute top-[-12px] right-[-8px]"
        style={{ background: `var(--accent-${accent})` }}
        aria-hidden="true"
      >
        {stickerLabel} {num}
      </span>

      <div
        className="font-mono font-bold leading-none mb-6 text-ink"
        style={{ fontSize: 'clamp(64px, 9vw, 96px)', letterSpacing: '-0.02em' }}
      >
        {num}
      </div>

      <h3 className="font-display font-bold text-xl lg:text-2xl tracking-tight text-ink mb-3">
        {title}
      </h3>

      <p className="font-body text-sm lg:text-base text-text-2 leading-relaxed">
        {desc}
      </p>
    </article>
  )
}
