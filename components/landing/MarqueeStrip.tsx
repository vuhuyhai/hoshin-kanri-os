type AccentColor = 'yellow' | 'cyan' | 'lime' | 'pink' | 'brand'
type Speed = 'slow' | 'normal' | 'fast'
type Direction = 'left' | 'right'

interface MarqueeStripProps {
  items: string[]
  accentColor?: AccentColor
  speed?: Speed
  direction?: Direction
}

const BG: Record<AccentColor, string> = {
  yellow: 'var(--accent-yellow)',
  cyan: 'var(--accent-cyan)',
  lime: 'var(--accent-lime)',
  pink: 'var(--accent-pink)',
  brand: 'var(--brand)',
}

const TEXT: Record<AccentColor, string> = {
  yellow: 'var(--ink)',
  cyan: 'var(--ink)',
  lime: 'var(--ink)',
  pink: 'var(--ink)',
  brand: 'var(--bg)',
}

const SEPARATOR: Record<AccentColor, string> = {
  yellow: 'var(--brand)',
  cyan: 'var(--brand)',
  lime: 'var(--brand)',
  pink: 'var(--brand)',
  brand: 'var(--ink)',
}

const DURATION: Record<Speed, string> = {
  slow: '35s',
  normal: '25s',
  fast: '15s',
}

export default function MarqueeStrip({
  items,
  accentColor = 'yellow',
  speed = 'normal',
  direction = 'left',
}: MarqueeStripProps) {
  const doubled = [...items, ...items]

  return (
    <div
      className="nb-marquee"
      style={{ background: BG[accentColor], color: TEXT[accentColor] }}
      aria-label="Điểm nổi bật của Hoshin Kanri OS"
    >
      <div
        className="nb-marquee-track"
        style={{
          display: 'flex',
          animationDuration: DURATION[speed],
          animationTimingFunction: 'linear',
          animationDirection: direction === 'right' ? 'reverse' : 'normal',
        }}
      >
        {doubled.map((item, idx) => (
          <span key={idx} className="nb-marquee-item" aria-hidden={idx >= items.length}>
            {item}
            <span
              className="nb-marquee-separator"
              aria-hidden="true"
              style={{ color: SEPARATOR[accentColor] }}
            >
              ✦
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
