'use client'

import type { TowsQuadrant, TowsStrategyWithFactorsRecord, BscPerspective } from '@/lib/swot/tows-types'
import { BSC_LABELS } from '@/lib/swot/tows-types'

export const TOWS_COLORS: Record<TowsQuadrant, { color: string; bg: string }> = {
  SO: { color: '#16a34a', bg: '#f0fdf4' }, WO: { color: '#1d4ed8', bg: '#eff6ff' },
  ST: { color: '#d97706', bg: '#fffbeb' }, WT: { color: '#dc2626', bg: '#fff0f0' },
}
export const BSC_COLORS: Record<string, { color: string; bg: string }> = {
  finance:  { color: '#16a34a', bg: '#dcfce7' }, customer: { color: '#1d4ed8', bg: '#dbeafe' },
  process:  { color: '#7c3aed', bg: '#ede9fe' }, learning: { color: '#d97706', bg: '#fef3c7' },
}
export const BSC_KEYS: BscPerspective[] = ['finance', 'customer', 'process', 'learning']

export function StrategyReviewSummary({ strategies }: { strategies: TowsStrategyWithFactorsRecord[] }) {
  const towsCounts: Record<TowsQuadrant, number> = { SO: 0, WO: 0, ST: 0, WT: 0 }
  const bscCounts: Record<BscPerspective, number> = { finance: 0, customer: 0, process: 0, learning: 0 }
  let approvedCount = 0
  let syncedCount = 0
  for (const s of strategies) {
    towsCounts[s.quadrant as TowsQuadrant]++
    bscCounts[s.bsc_perspective as BscPerspective]++
    if (s.status === 'approved') approvedCount++
    if (s.status === 'in_x_matrix') syncedCount++
  }
  return (
    <div className="flex flex-wrap gap-3 p-3 border-2 border-ink bg-white" style={{ boxShadow: '4px 4px 0 #2C2B2B' }}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-ink/60">TOWS:</span>
        {(Object.keys(towsCounts) as TowsQuadrant[]).map((q) => (
          <span key={q} className="text-[10px] px-1.5 py-0.5 font-bold border"
            style={{ color: TOWS_COLORS[q].color, background: TOWS_COLORS[q].bg, borderColor: TOWS_COLORS[q].color }}>
            {q}: {towsCounts[q]}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-ink/60">BSC:</span>
        {BSC_KEYS.map((k) => (
          <span key={k} className="text-[10px] px-1.5 py-0.5 font-bold border" style={{
            color: bscCounts[k] === 0 ? '#dc2626' : BSC_COLORS[k].color,
            background: bscCounts[k] === 0 ? '#fff0f0' : BSC_COLORS[k].bg,
            borderColor: bscCounts[k] === 0 ? '#dc2626' : BSC_COLORS[k].color,
          }}>
            {BSC_LABELS[k]}: {bscCounts[k]}
          </span>
        ))}
      </div>
      <span className="text-[10px] font-bold px-1.5 py-0.5 border-2 border-ink bg-white ml-auto">
        Duyệt: {approvedCount} · Đã sync: {syncedCount}
      </span>
    </div>
  )
}
