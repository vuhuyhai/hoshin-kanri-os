'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const sizeMap = {
  sm: { px: 32, textClass: 'text-sm' },
  md: { px: 40, textClass: 'text-lg' },
  lg: { px: 64, textClass: 'text-2xl' },
}

/**
 * Hoshin Kanri OS logo — strategy icon: circle + cross + arrow + red accent.
 * Inline SVG — no external file, scalable at any size.
 */
function LogoIcon({ size = 32 }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Red accent circle — top right */}
      <circle cx="66" cy="28" r="20" fill="#FFFFFF" stroke="#D4D2CE" strokeWidth="1.5" />
      <circle cx="66" cy="28" r="14" fill="#c73937" />

      {/* Dark circle — bottom left */}
      <circle cx="28" cy="72" r="14" fill="#2C2B2B" />

      {/* Cross/X — center left */}
      <g transform="translate(38, 48) rotate(45)">
        <rect x="-10" y="-3" width="20" height="6" rx="0" fill="#2C2B2B" />
        <rect x="-3" y="-10" width="6" height="20" rx="0" fill="#2C2B2B" />
      </g>

      {/* Curved arrow — bottom right going up */}
      <path
        d="M62 82 C62 82, 72 82, 72 68 L72 48"
        stroke="#2C2B2B"
        strokeWidth="8"
        strokeLinecap="butt"
        fill="none"
      />
      {/* Arrowhead */}
      <polygon points="72,42 62,54 82,54" fill="#2C2B2B" />
    </svg>
  )
}

export function Logo({ size = 'sm', showText = true, className }: LogoProps) {
  const { px, textClass } = sizeMap[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LogoIcon size={px} />
      {showText && (
        <span
          className={cn(
            'font-display font-black uppercase tracking-wider',
            textClass
          )}
        >
          Hoshin Kanri OS
        </span>
      )}
    </div>
  )
}
