'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, X, Sparkles, Loader2, Check, ChevronDown, ChevronUp, Target, Calendar, Lightbulb } from 'lucide-react'
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
const TIMEFRAME_LABELS: Record<string, { label: string; color: string }> = {
  '30d': { label: '30 ngày', color: 'bg-accent-yellow text-ink border-accent-yellow' },
  '60d': { label: '60 ngày', color: 'bg-accent-cyan text-ink border-accent-cyan' },
  '90d': { label: '90 ngày', color: 'bg-accent-lime text-ink border-accent-lime' },
}
const LAYOUT: TowsQuadrant[] = ['SO', 'WO', 'ST', 'WT']

export function TowsCanvas({ analysisId, factors, onStrategiesChange }: Props) {
  const [strategies, setStrategies] = useState<TowsStrategyWithFactorsRecord[]>([])
  const [activeQuad, setActiveQuad] = useState<TowsQuadrant | null>(null)
  const [selectedSwIds, setSelectedSwIds] = useState<Set<string>>(new Set())
  const [selectedOtIds, setSelectedOtIds] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

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
    if (next.has(id)) next.delete(id)
    else next.add(id)
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
              <div className="p-3 border-b-2 border-ink/30 bg-card/50">
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
                  className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-bold border-2 border-ink bg-card hover:bg-ink hover:text-white disabled:opacity-40 transition-colors">
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
                const tf = s.timeframe ? TIMEFRAME_LABELS[s.timeframe] : null
                const isExpanded = expandedIds.has(s.id)
                const hasV2Data =
                  s.timeframe ||
                  s.rationale ||
                  (s.actions && s.actions.length > 0) ||
                  (s.kpi_suggestions && s.kpi_suggestions.length > 0)

                return (
                  <div key={s.id} className="border-b border-ink/15">
                    <div className="px-3 py-2">
                      <div className="flex items-start gap-2">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 border rounded font-display whitespace-nowrap"
                          style={{ color: bsc.color, background: bsc.bg, borderColor: bsc.color }}
                        >
                          {BSC_LABELS[s.bsc_perspective as keyof typeof BSC_LABELS] ?? 'Tài chính'}
                        </span>
                        {tf && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 border rounded font-display whitespace-nowrap ${tf.color}`}
                            title="Hoshin timeframe"
                          >
                            <Calendar className="w-2.5 h-2.5 inline mr-0.5" />
                            {tf.label}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          {s.strategy_title && (
                            <p className="text-sm font-bold font-display leading-tight">
                              {s.strategy_title}
                            </p>
                          )}
                          <p className="text-[11px] text-ink/70 font-body">
                            {s.strategy_statement}
                          </p>
                        </div>
                        {hasV2Data && (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(s.id)}
                            className="p-0.5 hover:bg-ink/10 rounded shrink-0"
                            title={isExpanded ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-ink/60" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-ink/60" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(s.id, s.status)}
                          className={`w-4 h-4 border-2 border-ink shrink-0 flex items-center justify-center ${
                            s.status === 'in_x_matrix' || s.status === 'approved'
                              ? 'bg-kpi-healthy'
                              : 'bg-card'
                          }`}
                          title={
                            s.status === 'in_x_matrix'
                              ? 'Đã vào X-Matrix'
                              : s.status === 'approved'
                                ? 'Bỏ duyệt'
                                : 'Duyệt'
                          }
                        >
                          {(s.status === 'in_x_matrix' || s.status === 'approved') && (
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && hasV2Data && (
                      <div className="px-3 pb-2 pt-1 bg-ink/5 border-t border-ink/10 space-y-2">
                        {s.rationale && (
                          <div className="flex gap-1.5">
                            <Lightbulb className="w-3 h-3 text-kpi-attention-strong shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold font-display text-ink/80 uppercase tracking-wide">
                                Vital signal
                              </p>
                              <p className="text-[11px] text-ink/70 font-body italic leading-snug">
                                {s.rationale}
                              </p>
                            </div>
                          </div>
                        )}

                        {s.actions && s.actions.length > 0 && (
                          <div className="flex gap-1.5">
                            <Target className="w-3 h-3 text-accent-cyan shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold font-display text-ink/80 uppercase tracking-wide mb-0.5">
                                Hành động
                              </p>
                              <ul className="space-y-1">
                                {s.actions.map((a, idx) => (
                                  <li key={idx} className="text-[11px] text-ink/70 font-body leading-snug flex gap-1">
                                    <span className="text-ink/40 shrink-0">{idx + 1}.</span>
                                    <span className="flex-1">
                                      {a.description}
                                      {a.owner_hint && (
                                        <span className="ml-1 text-[10px] text-ink/50 font-display">
                                          — {a.owner_hint}
                                        </span>
                                      )}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {s.kpi_suggestions && s.kpi_suggestions.length > 0 && (
                          <div className="flex gap-1.5">
                            <Sparkles className="w-3 h-3 text-kpi-healthy-strong shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold font-display text-ink/80 uppercase tracking-wide mb-0.5">
                                KPI gợi ý
                              </p>
                              <ul className="space-y-1">
                                {s.kpi_suggestions.map((k, idx) => (
                                  <li key={idx} className="text-[11px] text-ink/70 font-body leading-snug">
                                    <span className="font-bold font-display text-ink/80">{k.name}</span>
                                    <span className="text-ink/50">
                                      {' — '}{k.target_value} {k.unit} / {
                                        k.frequency === 'daily' ? 'ngày' :
                                        k.frequency === 'weekly' ? 'tuần' :
                                        'tháng'
                                      }
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
