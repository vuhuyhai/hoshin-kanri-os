'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, X, Sparkles, Loader2, Check } from 'lucide-react'
import type { SwotQuadrant } from '@/lib/swot/types'
import type { SwotFactor, TowsQuadrant, TowsStrategyWithFactorsRecord, StrategyStatus } from '@/lib/swot/tows-types'
import { TOWS_CONFIG, BSC_LABELS } from '@/lib/swot/tows-types'
import { fetchJson, postJson } from '@/lib/http/fetch-json'

interface Props {
  analysisId: string
  orgId: string
  factors: Record<SwotQuadrant, SwotFactor[]>
  onStrategiesChange: (strategies: TowsStrategyWithFactorsRecord[]) => void
}

const TOWS_COLORS: Record<TowsQuadrant, { color: string; bg: string }> = {
  SO: { color: '#16a34a', bg: '#f0fdf4' },
  WO: { color: '#1d4ed8', bg: '#eff6ff' },
  ST: { color: '#d97706', bg: '#fffbeb' },
  WT: { color: '#dc2626', bg: '#fff0f0' },
}
const BSC_COLORS: Record<string, { color: string; bg: string }> = {
  finance: { color: '#16a34a', bg: '#dcfce7' },
  customer: { color: '#1d4ed8', bg: '#dbeafe' },
  process: { color: '#7c3aed', bg: '#ede9fe' },
  learning: { color: '#d97706', bg: '#fef3c7' },
}
const LAYOUT: TowsQuadrant[] = ['SO', 'WO', 'ST', 'WT']

export function TowsCanvas({ analysisId, factors, onStrategiesChange }: Props) {
  const [strategies, setStrategies] = useState<TowsStrategyWithFactorsRecord[]>([])
  const [activeQuad, setActiveQuad] = useState<TowsQuadrant | null>(null)
  const [selectedSwIds, setSelectedSwIds] = useState<Set<string>>(new Set())
  const [selectedOtIds, setSelectedOtIds] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const notify = useCallback((s: TowsStrategyWithFactorsRecord[]) => onStrategiesChange(s), [onStrategiesChange])

  useEffect(() => {
    fetchJson<unknown>(`/api/swot-analyses/${analysisId}/strategies`)
      .then((data) => {
        const list = Array.isArray(data) ? (data as TowsStrategyWithFactorsRecord[]) : []
        const safe = list.map((s) => ({
          ...s,
          sw_factors: Array.isArray(s.sw_factors) ? s.sw_factors : [],
          ot_factors: Array.isArray(s.ot_factors) ? s.ot_factors : [],
        }))
        setStrategies(safe)
        notify(safe)
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Không tải được chiến lược')
      })
      .finally(() => setIsLoading(false))
  }, [analysisId, notify])

  const toggleId = (set: Set<string>, id: string) => {
    const next = new Set(set)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  }

  const handleGenerate = async () => {
    if (!activeQuad || selectedSwIds.size === 0 || selectedOtIds.size === 0) {
      toast.error('Chọn ít nhất 1 yếu tố mỗi bên'); return
    }
    setIsGenerating(true)
    try {
      const genBody = await postJson<unknown>(
        `/api/swot-analyses/${analysisId}/strategies/ai-generate`,
        {
          sw_factor_ids: [...selectedSwIds],
          ot_factor_ids: [...selectedOtIds],
          quadrant: activeQuad,
        },
      )
      const rawItems = Array.isArray(genBody) ? (genBody as TowsStrategyWithFactorsRecord[]) : []
      // Defensive: tolerate server responses that forgot to hydrate factors.
      const newItems = rawItems.map((s) => ({
        ...s,
        sw_factors: Array.isArray(s.sw_factors) ? s.sw_factors : [],
        ot_factors: Array.isArray(s.ot_factors) ? s.ot_factors : [],
      }))
      const merged = [...strategies.filter((s) => !newItems.some((n) => n.combined_code === s.combined_code)), ...newItems]
      setStrategies(merged); notify(merged)
      setSelectedSwIds(new Set()); setSelectedOtIds(new Set()); setActiveQuad(null)
      toast.success(`Đã tạo ${newItems.length} chiến lược`)
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Lỗi tạo chiến lược') }
    setIsGenerating(false)
  }

  const handleStatusToggle = async (id: string, current: StrategyStatus) => {
    // Canvas checkbox toggles `approved` ↔ `draft`. `in_x_matrix` is a
    // terminal state set only by the sync-xmatrix endpoint — don't mint it
    // here. Phase 3 (StrategyReviewTable) also uses `approved`, so the sync
    // button's `filter(s => s.status === 'approved')` sees rows toggled on
    // in either phase.
    const next: StrategyStatus = current === 'approved' ? 'draft' : 'approved'
    const prev = strategies
    const optimistic = strategies.map((st) =>
      st.id === id ? { ...st, status: next } : st,
    )
    setStrategies(optimistic)
    notify(optimistic)
    try {
      await fetchJson(`/api/swot-analyses/${analysisId}/strategies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
    } catch {
      setStrategies(prev)
      notify(prev)
      toast.error('Lỗi cập nhật')
    }
  }

  if (isLoading) {
    return <div className="grid grid-cols-2 gap-4">{LAYOUT.map((q) => (
      <div key={q} className="h-40 animate-pulse border-2 border-ink" style={{ background: TOWS_COLORS[q].bg }} />
    ))}</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {LAYOUT.map((quad) => {
        const cfg = TOWS_CONFIG[quad]
        const tc = TOWS_COLORS[quad]
        const quadStrategies = strategies.filter((s) => s.quadrant === quad)
        const isActive = activeQuad === quad
        const swKey = factors[cfg.swQuadrant]?.filter((f) => f.is_key_factor) ?? []
        const otKey = factors[cfg.otQuadrant]?.filter((f) => f.is_key_factor) ?? []

        return (
          <div key={quad} className="border-2 border-ink" style={{ background: tc.bg, boxShadow: '4px 4px 0 #2C2B2B' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b-2 border-ink" style={{ background: tc.color }}>
              <span className="font-display font-bold text-white text-sm">{quad} — {cfg.desc}</span>
              <button onClick={() => { setActiveQuad(isActive ? null : quad); setSelectedSwIds(new Set()); setSelectedOtIds(new Set()) }}
                className="text-white/80 hover:text-white">
                {isActive ? <X className="size-4" /> : <Plus className="size-4" />}
              </button>
            </div>

            {isActive && (
              <div className="p-3 border-b-2 border-ink/30 bg-white/50">
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase mb-1">{cfg.swQuadrant === 'S' ? 'Điểm mạnh' : 'Điểm yếu'} (key)</p>
                    {swKey.length === 0 ? <p className="text-[11px] text-ink/50">Chưa có key factor</p> : swKey.map((f) => (
                      <label key={f.id} className="flex items-center gap-1.5 text-[11px] cursor-pointer py-0.5">
                        <input type="checkbox" checked={selectedSwIds.has(f.id)} onChange={() => setSelectedSwIds((s) => toggleId(s, f.id))} className="size-3" />
                        <span className="font-mono text-[10px]">{f.code}</span> {f.content}
                      </label>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase mb-1">{cfg.otQuadrant === 'O' ? 'Cơ hội' : 'Đe dọa'} (key)</p>
                    {otKey.length === 0 ? <p className="text-[11px] text-ink/50">Chưa có key factor</p> : otKey.map((f) => (
                      <label key={f.id} className="flex items-center gap-1.5 text-[11px] cursor-pointer py-0.5">
                        <input type="checkbox" checked={selectedOtIds.has(f.id)} onChange={() => setSelectedOtIds((s) => toggleId(s, f.id))} className="size-3" />
                        <span className="font-mono text-[10px]">{f.code}</span> {f.content}
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={isGenerating || selectedSwIds.size === 0 || selectedOtIds.size === 0}
                  className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-bold border-2 border-ink bg-white hover:bg-ink hover:text-white disabled:opacity-40 transition-colors">
                  {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  AI Sinh chiến lược
                </button>
              </div>
            )}

            <div className="max-h-48 overflow-y-auto">
              {quadStrategies.length === 0 ? (
                <p className="text-[11px] text-ink/40 text-center py-4">Chưa có chiến lược</p>
              ) : quadStrategies.map((s) => {
                const bsc = BSC_COLORS[s.bsc_perspective] ?? BSC_COLORS.finance
                return (
                  <div key={s.id} className="border-b border-ink/15 px-3 py-2">
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-[9px] px-1.5 py-0.5 font-bold border" style={{ color: bsc.color, background: bsc.bg, borderColor: bsc.color }}>
                        {BSC_LABELS[s.bsc_perspective as keyof typeof BSC_LABELS]}
                      </span>
                      <div className="flex-1 min-w-0">
                        {s.strategy_title && <p className="text-sm font-bold font-display leading-tight">{s.strategy_title}</p>}
                        <p className="text-[11px] text-ink/70 font-body">{s.strategy_statement}</p>
                      </div>
                      <button onClick={() => handleStatusToggle(s.id, s.status)}
                        className="shrink-0 size-5 border-2 border-ink flex items-center justify-center"
                        style={{ background: s.status === 'in_x_matrix' ? '#1d4ed8' : 'white' }}
                        title="Vào X-Matrix">
                        {s.status === 'in_x_matrix' && <Check className="size-3 text-white" />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
