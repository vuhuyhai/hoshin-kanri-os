'use client'

import { useState } from 'react'
import { PHASES, ANNUAL_CYCLE } from '@/lib/admin/hoshin-steps-data'
import { PhaseBlock } from './PhaseBlock'

const OV_LABELS = ['SCAN', 'PLAN', 'DO', 'CHECK', 'ACT']

export function StepsView() {
  const [activePhase, setActivePhase] = useState(0)

  const scrollToPhase = (idx: number) => {
    setActivePhase(idx)
    document.getElementById(`phase-${PHASES[idx].num}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {/* Overview nav */}
      <div className="grid grid-cols-5 border-b-[3px] border-ink">
        {PHASES.map((p, i) => (
          <button
            key={p.num}
            onClick={() => scrollToPhase(i)}
            className={`px-4 py-3 text-left transition-colors border-r-[3px] border-ink last:border-r-0 ${
              activePhase === i ? 'bg-ink text-white' : 'bg-bg-warm hover:bg-bg-muted-warm'
            }`}
          >
            <div className="font-display font-black text-[28px] leading-none tracking-wider" style={{ color: activePhase === i ? '#fff' : p.color }}>
              {p.num}
            </div>
            <div className="font-display font-bold text-[9px] tracking-[1px] uppercase mt-0.5">{OV_LABELS[i]}</div>
            <div className={`font-body text-[11px] mt-0.5 ${activePhase === i ? 'text-white/60' : 'text-text-3'}`}>
              {['Đánh giá thực tế', 'Lập kế hoạch', 'Thực thi', 'Kiểm tra', 'Điều chỉnh'][i]}
            </div>
          </button>
        ))}
      </div>

      {/* Source */}
      <div className="px-8 py-3 bg-bg-muted-warm border-b border-ink flex items-center justify-between">
        <span className="font-display font-bold text-[11px] tracking-wider uppercase text-text-3">5 Giai đoạn · 20 Bước</span>
        <span className="font-body text-[11px] text-text-3">Tổng hợp từ: Kesterson · Jackson · Melander et al. · Villalba-Diez · Fukuda</span>
      </div>

      {/* Phases */}
      <div className="max-w-[1100px] mx-auto px-8 pb-16 space-y-10 mt-10">
        {PHASES.map((phase) => (
          <PhaseBlock key={phase.num} phase={phase} />
        ))}

        {/* Annual cycle */}
        <div className="border-[3px] border-ink shadow-brutal-md bg-bg-warm">
          <div className="px-6 py-4 bg-ink border-b-[3px] border-ink">
            <h3 className="font-display font-black text-xl tracking-wider uppercase text-white">
              Lịch thực hiện Hoshin Kanri — Chu kỳ năm
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
            {ANNUAL_CYCLE.map((m) => (
              <div key={m.num} className="text-center p-3">
                <div className="font-display font-black text-xl tracking-wider" style={{ color: m.color }}>{m.num}</div>
                <div className="font-display font-semibold text-[9px] tracking-[1px] uppercase text-text-3 mt-0.5">{m.label}</div>
                <div className="font-body text-[11px] text-text-2 mt-1.5 leading-relaxed">{m.act}</div>
                <div className="h-1 mt-2 mx-auto w-full" style={{ background: m.color }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
