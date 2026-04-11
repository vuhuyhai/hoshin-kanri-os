'use client'

import { toast } from 'sonner'
import { Download, Target } from 'lucide-react'
import type { TowsQuadrant, TowsStrategyWithFactorsRecord, StrategyStatus, BscPerspective } from '@/lib/swot/tows-types'
import { BSC_LABELS, TOWS_CONFIG } from '@/lib/swot/tows-types'
import { buildExportRows } from '@/lib/swot/factor-utils'

interface Props {
  analysisId: string
  strategies: TowsStrategyWithFactorsRecord[]
  onStatusChange: (id: string, status: StrategyStatus) => void
  onBscChange?: (id: string, bsc: BscPerspective) => void
  onSendToXMatrix: (strategies: TowsStrategyWithFactorsRecord[]) => void
}

const TOWS_COLORS: Record<TowsQuadrant, { color: string; bg: string }> = {
  SO: { color: '#16a34a', bg: '#f0fdf4' }, WO: { color: '#1d4ed8', bg: '#eff6ff' },
  ST: { color: '#d97706', bg: '#fffbeb' }, WT: { color: '#dc2626', bg: '#fff0f0' },
}
const BSC_COLORS: Record<string, { color: string; bg: string }> = {
  finance: { color: '#16a34a', bg: '#dcfce7' }, customer: { color: '#1d4ed8', bg: '#dbeafe' },
  process: { color: '#7c3aed', bg: '#ede9fe' }, learning: { color: '#d97706', bg: '#fef3c7' },
}
const STATUS_CYCLE: StrategyStatus[] = ['draft', 'approved', 'in_x_matrix']
const STATUS_COLORS: Record<StrategyStatus, string> = { draft: '#888', approved: '#16a34a', in_x_matrix: '#1d4ed8', rejected: '#dc2626' }
const STATUS_LABELS: Record<StrategyStatus, string> = { draft: 'Nháp', approved: 'Duyệt', in_x_matrix: 'X-Matrix', rejected: 'Loại' }
const BSC_KEYS: BscPerspective[] = ['finance', 'customer', 'process', 'learning']

function SummaryBar({ strategies }: { strategies: TowsStrategyWithFactorsRecord[] }) {
  const towsCounts: Record<TowsQuadrant, number> = { SO: 0, WO: 0, ST: 0, WT: 0 }
  const bscCounts: Record<BscPerspective, number> = { finance: 0, customer: 0, process: 0, learning: 0 }
  let xmReady = 0
  for (const s of strategies) {
    towsCounts[s.quadrant as TowsQuadrant]++
    bscCounts[s.bsc_perspective as BscPerspective]++
    if (s.status === 'in_x_matrix') xmReady++
  }
  return (
    <div className="flex flex-wrap gap-3 p-3 border-2 border-ink bg-white" style={{ boxShadow: '4px 4px 0 #2C2B2B' }}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-ink/60">TOWS:</span>
        {(Object.keys(towsCounts) as TowsQuadrant[]).map((q) => (
          <span key={q} className="text-[10px] px-1.5 py-0.5 font-bold border" style={{ color: TOWS_COLORS[q].color, background: TOWS_COLORS[q].bg, borderColor: TOWS_COLORS[q].color }}>
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
        X-Matrix ready: {xmReady}
      </span>
    </div>
  )
}

export function StrategyReviewTable({ analysisId, strategies, onStatusChange, onBscChange, onSendToXMatrix }: Props) {
  if (strategies.length === 0) {
    return <p className="text-center text-ink/50 py-8 font-body">Chưa có chiến lược nào. Quay lại Phase 2 để tạo.</p>
  }

  const cycleStatus = async (id: string, current: StrategyStatus) => {
    const idx = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    onStatusChange(id, next)
    try {
      const res = await fetch(`/api/swot-analyses/${analysisId}/strategies`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      onStatusChange(id, current) // rollback
      toast.error('Lỗi cập nhật trạng thái')
    }
  }

  const handleBscChange = async (id: string, bsc: BscPerspective) => {
    onBscChange?.(id, bsc)
    try {
      const res = await fetch(`/api/swot-analyses/${analysisId}/strategies`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, bsc_perspective: bsc }),
      })
      if (!res.ok) throw new Error()
    } catch { toast.error('Lỗi cập nhật BSC') }
  }

  const handleExportCsv = () => {
    const rows = buildExportRows(strategies)
    if (rows.length === 0) { toast.error('Không có chiến lược đã duyệt'); return }
    const headers = ['STT', 'Loại', 'Mã SW', 'Nguyên liệu SW', 'Mã OT', 'Nguyên liệu OT', 'Combined Code', 'BSC', 'Chiến lược']
    const csv = [headers.join(','), ...rows.map((r) =>
      [r.stt, r.chien_luoc_type, r.sw_code, `"${r.nguyen_lieu_sw}"`, r.ot_code, `"${r.nguyen_lieu_ot}"`, r.combined_code, r.bsc, `"${r.chien_luoc}"`].join(',')
    )].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'tows_strategies.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const xmStrategies = strategies.filter((s) => s.status === 'in_x_matrix')

  return (
    <div className="space-y-4">
      <SummaryBar strategies={strategies} />
      <div className="overflow-x-auto border-2 border-ink" style={{ boxShadow: '4px 4px 0 #2C2B2B' }}>
        <table className="w-full text-[12px] font-body">
          <thead>
            <tr className="bg-ink text-white text-left">
              {['#', 'Loại', 'SW', 'OT', 'Code', 'BSC', 'Chiến lược', 'Trạng thái'].map((h) => (
                <th key={h} className="px-2 py-1.5 font-display font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {strategies.map((s, i) => {
              const tc = TOWS_COLORS[s.quadrant as TowsQuadrant] ?? TOWS_COLORS.SO
              const st = s.status as StrategyStatus
              return (
                <tr key={s.id} className="border-b border-ink/15 hover:bg-white/60">
                  <td className="px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="px-2 py-1.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold border" style={{ color: tc.color, background: tc.bg, borderColor: tc.color }}>{s.quadrant}</span>
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[10px]">{s.sw_factors.map((f) => f.code).join(', ')}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px]">{s.ot_factors.map((f) => f.code).join(', ')}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px]">{s.combined_code}</td>
                  <td className="px-2 py-1.5">
                    <select value={s.bsc_perspective} onChange={(e) => handleBscChange(s.id, e.target.value as BscPerspective)}
                      className="text-[10px] border border-ink/40 bg-white px-1 py-0.5">
                      {BSC_KEYS.map((k) => <option key={k} value={k}>{BSC_LABELS[k]}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 max-w-[240px]">
                    {s.strategy_title && <p className="font-bold font-display text-[11px]">{s.strategy_title}</p>}
                    <p className="text-ink/70 leading-tight">{s.strategy_statement}</p>
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => cycleStatus(s.id, st)}
                      className="text-[10px] px-2 py-0.5 font-bold border-2 cursor-pointer"
                      style={{ color: 'white', background: STATUS_COLORS[st], borderColor: STATUS_COLORS[st] }}>
                      {STATUS_LABELS[st]}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 justify-end">
        <button onClick={handleExportCsv} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold border-2 border-ink bg-white hover:bg-ink hover:text-white transition-colors">
          <Download className="size-4" /> Xuất CSV
        </button>
        <button onClick={() => onSendToXMatrix(xmStrategies)} disabled={xmStrategies.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold border-2 border-ink text-white disabled:opacity-40 transition-colors"
          style={{ background: '#c73937' }}>
          <Target className="size-4" /> Đưa vào X-Matrix ({xmStrategies.length})
        </button>
      </div>
    </div>
  )
}
