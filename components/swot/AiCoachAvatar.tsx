'use client'

interface AiCoachAvatarProps {
  size?: number
  className?: string
}

/**
 * AI Coach avatar — SVG recreation of the headset + red circle logo.
 * Inline SVG = no external file, perfect at any size.
 */
export function AiCoachAvatar({ size = 40, className }: AiCoachAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AI Coach"
    >
      {/* White background circle */}
      <circle cx="50" cy="50" r="49" fill="#FFFFFF" stroke="#E0DEDA" strokeWidth="1" />

      {/* Red center circle */}
      <circle cx="50" cy="46" r="26" fill="#c73937" />

      {/* Headband — dark arc */}
      <path
        d="M18 52 C18 30, 82 30, 82 52"
        stroke="#2C2B2B"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left ear pad */}
      <ellipse cx="16" cy="54" rx="8" ry="11" fill="#2C2B2B" />

      {/* Right ear pad */}
      <ellipse cx="84" cy="54" rx="8" ry="11" fill="#2C2B2B" />

      {/* Microphone arm — curves down from right ear */}
      <path
        d="M84 60 C84 72, 70 78, 58 78"
        stroke="#2C2B2B"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Microphone head */}
      <ellipse cx="55" cy="79" rx="7" ry="6" fill="#2C2B2B" />
    </svg>
  )
}
