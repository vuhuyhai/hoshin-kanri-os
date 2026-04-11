'use client'

import type { HKPhase } from '@/lib/admin/hoshin-steps-data'

function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 1) return <strong key={i} className="font-bold text-ink">{part}</strong>
        return part.split('\n').map((line, j, arr) => (
          <span key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>
        ))
      })}
    </>
  )
}

export function PhaseBlock({ phase }: { phase: HKPhase }) {
  return (
    <div id={`phase-${phase.num}`}>
      {/* Phase header card */}
      <div className="border-2 border-ink shadow-brutal-md bg-ink mb-6">
        <div className="flex flex-col md:flex-row">
          <div className="flex items-center justify-center px-4 md:px-6 py-3 md:py-4 min-w-[80px] md:min-w-[90px] font-display font-black text-[36px] md:text-[48px] leading-none tracking-wider text-accent-brand">
            {phase.num}
          </div>
          <div className="px-4 md:px-5 py-3 md:py-4 flex flex-col justify-center flex-1">
            <div className="font-body text-[11px] tracking-[2px] text-text-3">{phase.jp}</div>
            <h3 className="font-display font-black text-lg md:text-xl tracking-wider uppercase text-white mt-0.5">{phase.title}</h3>
            <p className="font-body text-[15px] md:text-[17px] text-white/70 mt-1 leading-relaxed">{phase.desc}</p>
          </div>
          <div className="px-4 md:px-5 py-3 md:py-4 flex flex-col gap-1.5 justify-center md:border-l-2 md:border-white/20 border-t-2 md:border-t-0 border-white/20">
            <div className="font-body text-[11px] font-bold text-white/60">{phase.timing}</div>
            <div className="font-body text-[12px] text-white/50">{phase.who}</div>
            <span className="badge-brutal text-[9px] w-fit border-accent-brand text-accent-brand">{phase.badge}</span>
          </div>
        </div>
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {phase.steps.map((step) => (
          <div key={step.num} className={`card-subtle p-4 md:p-6 border border-bg-muted-warm hover:bg-bg-muted-warm hover:shadow-brutal-sm transition-all duration-150 ${step.full ? 'md:col-span-2' : ''}`}>
            <div className="font-display font-black text-[22px] text-accent-brand">{step.num}</div>
            <div className="font-display font-bold text-[15px] md:text-[16px] text-ink mt-1">{step.title}</div>
            <div className="font-body text-[16px] md:text-[17px] text-text-2 leading-[1.75] mt-2"><RichText text={step.body} /></div>
            <div className="mt-4 pt-3 border-t border-bg-muted-warm">
              <span className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-3">Công cụ</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {step.tool.split(' · ').map((t) => (
                  <span key={t} className="font-body text-[13px] md:text-[14px] text-text-2 px-2 py-0.5 border border-bg-muted-warm bg-bg-warm">{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quote */}
      {phase.quote && (
        <div className="mb-6 pl-4 md:pl-6 py-4 bg-bg-muted-warm" style={{ borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: '#c73937' }}>
          <p className="font-body font-semibold text-[16px] md:text-[17px] text-ink leading-relaxed">{phase.quote.text}</p>
          <p className="font-body text-[13px] md:text-[14px] text-text-3 mt-2">{phase.quote.source}</p>
        </div>
      )}

      {/* Warning */}
      {phase.warn && (
        <div className="mb-6 border-2 border-ink bg-red-50" style={{ borderLeftWidth: 5, borderLeftColor: '#c73937' }}>
          <div className="heading-overline px-4 md:px-5 py-2 text-accent-brand">⚠ BẪY PHỔ BIẾN</div>
          <div className="px-4 md:px-5 pb-3 font-body text-[16px] md:text-[17px] leading-[1.75] text-text-2"><RichText text={phase.warn} /></div>
        </div>
      )}

      {/* Ladysfit */}
      <div className="mb-6 border-2 border-ink bg-ink p-4 md:p-6">
        <span className="badge-brutal badge-accent mb-4 inline-block">🏋️ Ứng dụng — Ladysfit</span>
        <div className="font-body text-[16px] md:text-[17px] text-white/80 leading-[1.75]"><RichText text={phase.ladysfit} /></div>
      </div>
    </div>
  )
}
