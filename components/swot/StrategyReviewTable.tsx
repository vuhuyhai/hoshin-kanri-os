'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Target, Loader2 } from 'lucide-react'
import type {
  TowsQuadrant,
  TowsStrategyWithFactorsRecord,
  StrategyStatus,
  BscPerspective,
} from '@/lib/swot/tows-types'
import { BSC_LABELS } from '@/lib/swot/tows-types'
import { buildExportRows } from '@/lib/swot/factor-utils'
import { StrategyReviewSummary, TOWS_COLORS, BSC_KEYS } from './StrategyReviewSummary'
import { fetchJson, postJson } from '@/lib/http/fetch-json'

interface Props {
  analysisId: string
  strategies: TowsStrategyWithFactorsRecord[]
  onStatusChange: (id: string, status: StrategyStatus) => void
  onBscChange?: (id: string, bsc: BscPerspective) => void
  onSendToXMatrix?: (strategies: TowsStrategyWithFactorsRecord[]) => void
}

// User-cyclable only — in_x_matrix is set by sync (not user-toggleable)
const USER_CYCLE: StrategyStatus[] = ['draft', 'approved', 'rejected']
const STATUS_COLORS: Record<StrategyStatus, string> = {
  draft: '#888', approved: '#16a34a', in_x_matrix: '#1d4ed8', rejected: '#dc2626',
}
const STATUS_LABELS: Record<StrategyStatus, string> = {
  draft: 'Nháp', approved: 'Duyệt', in_x_matrix: 'Đã sync', rejected: 'Loại',
}

export function StrategyReviewTable({
  analysisId, strategies, onStatusChange, onBscChange, onSendToXMatrix,
}: Props) {
  const [isSyncing, setIsSyncing] = useState(false)

  if (strategies.length === 0) {
    return <p className="text-center text-ink/50 py-8 font-body">Chưa có chiến lược nào. Quay lại Phase 2 để tạo.</p>
  }

  const cycleStatus = async (id: string, current: StrategyStatus) => {
    if (current === 'in_x_matrix') {
      toast.info('Chiến lược đã sync — không thể đổi status')
      return
    }
    const idx = USER_CYCLE.indexOf(current)
    const next = USER_CYCLE[(idx + 1) % USER_CYCLE.length]
    onStatusChange(id, next)
    try {
      await fetchJson(`/api/swot-analyses/${analysisId}/strategies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
    } catch {
      onStatusChange(id, current)
      toast.error('Lỗi cập nhật trạng thái')
    }
  }

  const handleBscChange = async (id: string, bsc: BscPerspective) => {
    onBscChange?.(id, bsc)
    try {
      await fetchJson(`/api/swot-analyses/${analysisId}/strategies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, bsc_perspective: bsc }),
      })
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

  const approvedStrategies = strategies.filter((s) => s.status === 'approved')

  const handleSync = async () => {
    if (approvedStrategies.length === 0 || isSyncing) return
    setIsSyncing(true)
    try {
      const data = await postJson<{ syncedCount: number; errors?: string[] }>(
        '/api/swot/sync-xmatrix',
        { analysisId },
      )
      // Server's sync-to-xmatrix sorts by order_index asc before slicing.
      // Mirror that order client-side so optimistic in_x_matrix marks land
      // on the same rows the DB actually updated.
      const syncedSlice = [...approvedStrategies]
        .sort((a, b) => a.order_index - b.order_index)
        .slice(0, data.syncedCount)
      for (const s of syncedSlice) onStatusChange(s.id, 'in_x_matrix')
      toast.success(`Đã sync ${data.syncedCount} chiến lược vào X-Matrix`)
      if (data.errors?.length && data.errors.length > 0) toast.warning(data.errors[0])
      // Navigation is owned by the parent via onSendToXMatrix → onComplete.
      // Prior code also did router.push here, racing with the parent's
      // push and causing double-navigation chaos.
      onSendToXMatrix?.(approvedStrategies)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi sync vào X-Matrix')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      <StrategyReviewSummary strategies={strategies} />
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
              const isSynced = st === 'in_x_matrix'
              return (
                <tr key={s.id} className="border-b border-ink/15 hover:bg-card/60">
                  <td className="px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="px-2 py-1.5">
                    <span className="px-1.5 py-0.5 text-[10px] font-bold border"
                      style={{ color: tc.color, background: tc.bg, borderColor: tc.color }}>{s.quadrant}</span>
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[10px]">{s.sw_factors.map((f) => f.code).join(', ')}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px]">{s.ot_factors.map((f) => f.code).join(', ')}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px]">{s.combined_code}</td>
                  <td className="px-2 py-1.5">
                    <select value={s.bsc_perspective} onChange={(e) => handleBscChange(s.id, e.target.value as BscPerspective)}
                      disabled={isSynced}
                      className="text-[10px] border border-ink/40 bg-card px-1 py-0.5 disabled:opacity-50">
                      {BSC_KEYS.map((k) => <option key={k} value={k}>{BSC_LABELS[k]}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 max-w-[240px]">
                    {s.strategy_title && <p className="font-bold font-display text-[11px]">{s.strategy_title}</p>}
                    <p className="text-ink/70 leading-tight">{s.strategy_statement}</p>
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => cycleStatus(s.id, st)} disabled={isSynced}
                      className="text-[10px] px-2 py-0.5 font-display font-bold border-2 cursor-pointer disabled:cursor-default disabled:opacity-80"
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
        <button onClick={handleExportCsv}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-display font-bold border-2 border-ink bg-card hover:bg-ink hover:text-white transition-colors">
          <Download className="size-4" /> Xuất CSV
        </button>
        <button onClick={handleSync} disabled={approvedStrategies.length === 0 || isSyncing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-display font-bold border-2 border-ink text-white disabled:opacity-40 transition-colors"
          style={{ background: '#c73937' }}>
          {isSyncing ? (<><Loader2 className="size-4 animate-spin" /> Đang sync...</>)
                     : (<><Target className="size-4" /> Đưa vào X-Matrix ({approvedStrategies.length})</>)}
        </button>
      </div>
    </div>
  )
}
