import { Lightbulb } from 'lucide-react'
import type { GuideDetail } from '@/lib/swot/guide-data'

interface SwotGuideStepProps {
  stepNumber: number
  icon: string
  title: string
  description: string
  details: GuideDetail[]
  tip: string
  isLast?: boolean
}

export function SwotGuideStep({
  stepNumber,
  icon,
  title,
  description,
  details,
  tip,
  isLast,
}: SwotGuideStepProps) {
  return (
    <div className="flex gap-5">
      {/* Step indicator + connector */}
      <div className="hidden lg:flex flex-col items-center shrink-0">
        <div
          className="w-10 h-10 flex items-center justify-center bg-ink text-white font-display font-black text-lg border-2 border-ink"
          aria-hidden="true"
        >
          {stepNumber}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-bg-muted-warm mt-1" />}
      </div>

      {/* Card */}
      <div
        className="flex-1 bg-card border-2 p-6 transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px]"
        style={{
          borderColor: '#2C2B2B',
          boxShadow: '4px 4px 0px #2C2B2B',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '6px 6px 0px #2C2B2B'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '4px 4px 0px #2C2B2B'
        }}
      >
        {/* Mobile step number */}
        <div className="lg:hidden mb-3 flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center bg-ink text-white font-display font-black text-sm border-2 border-ink">
            {stepNumber}
          </div>
          <span className="font-display font-bold text-xs uppercase tracking-widest text-text-3">
            Bước {stepNumber}
          </span>
        </div>

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl" role="img" aria-label={title}>
            {icon}
          </span>
          <h2 className="font-display font-black text-xl uppercase tracking-wider text-ink">
            {title}
          </h2>
        </div>

        {/* Description */}
        <p className="font-body text-text-2 text-base mb-4">{description}</p>

        {/* Details */}
        <ul className="space-y-2 mb-4">
          {details.map((detail, i) => (
            <li key={i}>
              <div className="flex items-start gap-2 font-body text-sm text-ink">
                <span className="mt-0.5 shrink-0" style={{ color: '#c73937' }}>
                  ■
                </span>
                <span>{detail.text}</span>
              </div>
              {detail.subItems && (
                <ul className="ml-6 mt-1 space-y-1">
                  {detail.subItems.map((sub, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 font-body text-xs text-text-2"
                    >
                      <span className="mt-0.5 shrink-0 text-text-3">▪</span>
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* Tip */}
        <div
          className="border-l-4 pl-4 py-3 text-sm font-body inline-flex items-start gap-2"
          style={{
            borderColor: '#c73937',
            backgroundColor: '#FFF5F5',
          }}
        >
          <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-accent-brand" />
          <span className="text-text-2">{tip}</span>
        </div>
      </div>
    </div>
  )
}
