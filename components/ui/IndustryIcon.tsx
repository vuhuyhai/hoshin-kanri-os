import type { JSX } from 'react'

const icons: Record<string, JSX.Element> = {
  fitness: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="32" x2="56" y2="32"/>
      <rect x="4" y="26" width="8" height="12" rx="2"/>
      <rect x="52" y="26" width="8" height="12" rx="2"/>
      <rect x="14" y="28" width="6" height="8" rx="1"/>
      <rect x="44" y="28" width="6" height="8" rx="1"/>
    </svg>
  ),

  fnb: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 28 C12 28 10 44 32 44 C54 44 52 28 52 28 Z"/>
      <path d="M10 28 Q32 22 54 28"/>
      <path d="M24 16 Q24 10 28 14 Q28 8 32 12 Q32 6 36 10 Q36 6 40 12"/>
    </svg>
  ),

  retail: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 24 L12 52 L52 52 L48 24 Z"/>
      <path d="M24 24 C24 16 40 16 40 24"/>
      <circle cx="28" cy="34" r="2" fill="currentColor"/>
      <circle cx="36" cy="34" r="2" fill="currentColor"/>
    </svg>
  ),

  education: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 16 L32 52"/>
      <path d="M32 16 C32 16 18 12 8 16 L8 52 C18 48 32 52 32 52"/>
      <path d="M32 16 C32 16 46 12 56 16 L56 52 C46 48 32 52 32 52"/>
    </svg>
  ),

  healthcare: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="28" y="12" width="8" height="40" rx="2"/>
      <rect x="12" y="28" width="40" height="8" rx="2"/>
    </svg>
  ),

  technology: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="10" y="14" width="44" height="30" rx="3"/>
      <path d="M4 46 L60 46"/>
      <path d="M24 46 L22 52 L42 52 L40 46"/>
      <line x1="20" y1="24" x2="44" y2="24"/>
      <line x1="20" y1="30" x2="38" y2="30"/>
      <line x1="20" y1="36" x2="32" y2="36"/>
    </svg>
  ),

  manufacturing: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 52 L4 30 L20 38 L20 24 L36 32 L36 20 L56 20 L56 52 Z"/>
      <rect x="44" y="36" width="8" height="16"/>
      <rect x="24" y="40" width="8" height="12"/>
      <path d="M44 12 L44 20 M50 12 L50 20"/>
    </svg>
  ),

  construction: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="28" width="28" height="24"/>
      <line x1="36" y1="10" x2="36" y2="52"/>
      <line x1="36" y1="10" x2="56" y2="10"/>
      <line x1="56" y1="10" x2="56" y2="24"/>
      <line x1="50" y1="10" x2="52" y2="24"/>
      <rect x="12" y="34" width="6" height="8"/>
      <rect x="24" y="34" width="6" height="8"/>
      <rect x="12" y="44" width="20" height="8"/>
    </svg>
  ),

  logistics: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20 L4 44 L40 44 L40 20 Z"/>
      <path d="M40 28 L56 28 L60 38 L60 44 L40 44"/>
      <circle cx="14" cy="48" r="5"/>
      <circle cx="50" cy="48" r="5"/>
      <line x1="14" y1="26" x2="34" y2="26"/>
      <line x1="14" y1="32" x2="34" y2="32"/>
    </svg>
  ),

  finance: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8,48 20,32 32,38 44,20 56,12"/>
      <polyline points="44,12 56,12 56,24"/>
      <line x1="8" y1="52" x2="56" y2="52"/>
      <line x1="8" y1="52" x2="8" y2="8"/>
    </svg>
  ),

  beauty: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="32" r="6"/>
      <ellipse cx="32" cy="18" rx="5" ry="8"/>
      <ellipse cx="32" cy="46" rx="5" ry="8"/>
      <ellipse cx="18" cy="32" rx="8" ry="5"/>
      <ellipse cx="46" cy="32" rx="8" ry="5"/>
      <ellipse cx="22" cy="22" rx="5" ry="8" transform="rotate(45 22 22)"/>
      <ellipse cx="42" cy="42" rx="5" ry="8" transform="rotate(45 42 42)"/>
    </svg>
  ),

  agriculture: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="32" y1="52" x2="32" y2="12"/>
      <path d="M32 40 C32 40 20 36 18 24 C24 24 32 30 32 40"/>
      <path d="M32 40 C32 40 44 36 46 24 C40 24 32 30 32 40"/>
      <path d="M32 30 C32 30 22 26 20 16 C26 16 32 22 32 30"/>
      <path d="M32 30 C32 30 42 26 44 16 C38 16 32 22 32 30"/>
    </svg>
  ),

  other: (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M32 8 L56 20 L56 44 L32 56 L8 44 L8 20 Z"/>
      <path d="M32 8 L32 32 M8 20 L32 32 M56 20 L32 32"/>
    </svg>
  ),
}

interface IndustryIconProps {
  industry: string
  size?: number
  className?: string
}

export default function IndustryIcon({
  industry,
  size = 48,
  className = '',
}: IndustryIconProps) {
  const icon = icons[industry] ?? icons.other
  return (
    <div
      style={{ width: size, height: size }}
      className={`text-ink flex-shrink-0 ${className}`}
    >
      {icon}
    </div>
  )
}
