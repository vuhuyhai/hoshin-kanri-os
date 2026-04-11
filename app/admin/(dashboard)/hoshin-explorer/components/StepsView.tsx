'use client'

import { useState } from 'react'
import { PHASES, ANNUAL_CYCLE } from '@/lib/admin/hoshin-steps-data'
import { PhaseBlock } from './PhaseBlock'

const OV_LABELS = ['SCAN', 'PLAN', 'DO', 'CHECK', 'ACT']
const OV_NAMES = ['Đánh giá thực tế', 'Lập kế hoạch', 'Thực thi', 'Kiểm tra', 'Điều chỉnh']

export function StepsView() {
  const [activePhase, setActivePhase] = useState(0)

  const scrollToPhase = (idx: number) => {
    setActivePhase(idx)
    document.getElementById(`phase-${PHASES[idx].num}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {/* Phase stepper — scroll ngang trên mobile */}
      <div className="flex md:grid md:grid-cols-5 overflow-x-auto border-b-2 border-ink">
        {PHASES.map((p, i) => (
          <button key={p.num} onClick={() => scrollToPhase(i)}
            className={`min-w-[80px] md:min-w-0 px-3 md:px-6 py-3 md:py-4 text-center md:text-left transition-colors duration-150 cursor-pointer border-r border-bg-muted-warm last:border-r-0 shrink-0 min-h-[44px] ${
              activePhase === i ? 'bg-ink border-b-[3px] border-b-accent-brand' : 'hover:bg-bg-muted-warm'
            }`}
          >
            <div className={`font-display font-black text-[22px] md:text-[28px] leading-none tracking-wider ${activePhase === i ? 'text-white' : 'text-text-3'}`}>
              {p.num}
            </div>
            <div className={`font-display font-semibold text-[10px] uppercase tracking-wider mt-0.5 ${activePhase === i ? 'text-white/60' : 'text-text-3'}`}>
              {OV_LABELS[i]}
            </div>
            {/* Phase name: hidden on mobile, hidden on md (tablet shows only num+code), visible on lg */}
            <div className={`font-body text-[14px] mt-1 hidden lg:block ${activePhase === i ? 'text-white/80' : 'text-text-2'}`}>
              {OV_NAMES[i]}
            </div>
          </button>
        ))}
      </div>

      {/* Source bar */}
      <div className="px-4 md:px-8 py-3 bg-bg-muted-warm border-b border-bg-muted-warm flex flex-col md:flex-row md:items-center md:justify-between gap-1">
        <span className="font-display font-bold text-[11px] tracking-wider uppercase text-text-3">5 Giai đoạn · 20 Bước</span>
        <span className="font-body text-[11px] text-text-3">Tổng hợp từ: Kesterson · Jackson · Melander et al. · Villalba-Diez · Fukuda</span>
      </div>

      {/* Phases */}
      <div className="max-w-[1100px] mx-auto px-4 md:px-8 pb-16 space-y-10 mt-8 md:mt-10">
        {PHASES.map((phase) => (
          <PhaseBlock key={phase.num} phase={phase} />
        ))}

        {/* Annual cycle */}
        <div className="border-2 border-ink bg-bg-warm">
          <div className="px-4 md:px-6 py-4 bg-ink border-b-2 border-ink">
            <h3 className="font-display font-black text-lg md:text-xl tracking-wider uppercase text-white">
              Lịch thực hiện Hoshin Kanri — Chu kỳ năm
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-5">
            {ANNUAL_CYCLE.map((m) => (
              <div key={m.num} className="text-center p-2 md:p-3">
                <div className="font-display font-black text-lg md:text-xl tracking-wider text-text-3">{m.num}</div>
                <div className="font-display font-semibold text-[9px] tracking-[1px] uppercase text-text-3 mt-0.5">{m.label}</div>
                <div className="font-body text-[11px] text-text-2 mt-1.5 leading-relaxed">{m.act}</div>
                <div className="h-1 mt-2 mx-auto w-full bg-accent-brand" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
