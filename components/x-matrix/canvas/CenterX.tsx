'use client'

const STEPS = [
  'Mục tiêu lớn',
  'Cách năm nay',
  'Đo bằng gì',
  'Ai chịu trách nhiệm',
] as const

export function CenterX() {
  return (
    <div className="hidden items-center justify-center md:flex">
      <div className="max-w-[280px] border-[3px] border-ink bg-[var(--bg)] px-4 py-6 text-center shadow-[var(--shadow-md)]">
        <p className="font-display text-sm font-bold uppercase leading-relaxed tracking-wider text-[var(--text-2)]">
          {STEPS.map((step, i) => (
            <span key={step} className="block">
              {i > 0 && <span className="mr-1 text-[var(--brand)]">→</span>}
              {step}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
