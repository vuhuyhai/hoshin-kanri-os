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
    <div id={`phase-${phase.num}`} className="border-[3px] border-ink shadow-brutal-md bg-bg-warm">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto] border-b-[3px] border-ink">
        <div className="flex items-center justify-center px-6 py-4 min-w-[90px] text-white font-display font-black text-[48px] leading-none tracking-wider" style={{ background: phase.color }}>
          {phase.num}
        </div>
        <div className="px-5 py-4 flex flex-col justify-center">
          <div className="font-body text-[11px] tracking-[2px] text-text-3">{phase.jp}</div>
          <h3 className="font-display font-black text-xl tracking-wider uppercase text-ink mt-0.5">{phase.title}</h3>
          <p className="font-body text-[13px] text-text-2 mt-1 leading-relaxed">{phase.desc}</p>
        </div>
        <div className="px-5 py-4 flex flex-col gap-1.5 justify-center border-l-[3px] border-ink">
          <div className="font-body text-[11px] font-bold text-text-2">{phase.timing}</div>
          <div className="font-body text-[12px] text-text-3">{phase.who}</div>
          <span className="badge-brutal text-[9px] w-fit" style={{ borderColor: phase.color, color: phase.color }}>{phase.badge}</span>
        </div>
      </div>

      {/* Steps grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {phase.steps.map((step) => (
          <div key={step.num} className={`border-2 border-ink bg-white p-4 ${step.full ? 'md:col-span-2' : ''}`}>
            <div className="font-display font-black text-lg tracking-wider mb-1" style={{ color: phase.color }}>{step.num}</div>
            <div className="font-display font-bold text-[14px] text-ink mb-2">{step.title}</div>
            <div className="font-body text-[13px] leading-relaxed text-text-2"><RichText text={step.body} /></div>
            <div className="mt-3 pt-2 border-t border-bg-muted-warm font-body text-[11px] font-bold tracking-wider text-text-3">
              CÔNG CỤ: <span className="text-ink font-normal">{step.tool}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quote */}
      {phase.quote && (
        <div className="mx-6 mb-5 px-5 py-3 border-l-[3px] border-text-3 bg-bg-muted-warm italic font-body text-[13px] text-text-2 leading-relaxed">
          {phase.quote.text}
          <div className="not-italic font-body text-[10px] tracking-wider text-text-3 mt-1.5">{phase.quote.source}</div>
        </div>
      )}

      {/* Warning */}
      {phase.warn && (
        <div className="mx-6 mb-5 border-2 border-ink bg-red-50" style={{ borderLeftWidth: 5, borderLeftColor: '#E63946' }}>
          <div className="heading-overline px-5 py-2 text-[#E63946]">⚠ BẪY PHỔ BIẾN</div>
          <div className="px-5 pb-3 font-body text-[13px] leading-relaxed text-text-2"><RichText text={phase.warn} /></div>
        </div>
      )}

      {/* Ladysfit */}
      <div className="mx-6 mb-6 border-2 border-ink bg-ink p-5">
        <div className="heading-overline text-accent-brand mb-2">🏋️ ỨNG DỤNG — LADYSFIT</div>
        <div className="font-body text-[13px] leading-relaxed text-white/80"><RichText text={phase.ladysfit} /></div>
      </div>
    </div>
  )
}
