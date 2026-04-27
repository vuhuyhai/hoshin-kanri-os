interface FeatureCardNBProps {
  icon: string
  title: string
  desc: string
  variant: 'yellow' | 'cyan' | 'lime' | 'pink' | 'peach' | 'lavender'
  stickerLabel: string
  tilt?: boolean
  tiltDirection?: 'left' | 'right'
}

export default function FeatureCardNB({
  icon,
  title,
  desc,
  variant,
  stickerLabel,
  tilt = false,
  tiltDirection = 'left',
}: FeatureCardNBProps) {
  return (
    <article
      className={`relative card-${variant} ${tilt ? 'card-tilt' : ''} p-6 lg:p-8`}
      style={
        tilt
          ? { transform: `rotate(${tiltDirection === 'left' ? '-' : ''}1deg)` }
          : undefined
      }
    >
      <span
        className="nb-sticker absolute top-[-12px] left-[-8px]"
        aria-hidden="true"
      >
        {stickerLabel}
      </span>

      <div className="text-5xl lg:text-6xl mb-4 leading-none">{icon}</div>

      <h3 className="font-display font-bold text-xl lg:text-2xl tracking-tight text-ink mb-3">
        {title}
      </h3>

      <p className="font-body text-sm lg:text-base text-text-2 leading-relaxed">
        {desc}
      </p>
    </article>
  )
}
