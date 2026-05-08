'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, X, Sparkles, Loader2, Check } from 'lucide-react'
import type { SwotQuadrant } from '@/lib/swot/types'
import type { SwotFactor } from '@/lib/swot/tows-types'
import { fetchJson, postJson } from '@/lib/http/fetch-json'

interface Props {
  analysisId: string
  orgId: string
  onFactorsChange: (factors: Record<SwotQuadrant, SwotFactor[]>) => void
}

const QUAD_CONFIG: Record<SwotQuadrant, { label: string; color: string; bg: string }> = {
  S: { label: 'Điểm mạnh', color: '#16a34a', bg: '#f0fdf4' },
  W: { label: 'Điểm yếu', color: '#dc2626', bg: '#fff0f0' },
  O: { label: 'Cơ hội', color: '#1d4ed8', bg: '#eff6ff' },
  T: { label: 'Đe dọa', color: '#d97706', bg: '#fffbeb' },
}
const QUADS: SwotQuadrant[] = ['S', 'W', 'O', 'T']

export function SwotFactorInput({ analysisId, onFactorsChange }: Props) {
  const [factors, setFactors] = useState<Record<SwotQuadrant, SwotFactor[]>>({ S: [], W: [], O: [], T: [] })
  const [newInput, setNewInput] = useState<Record<SwotQuadrant, string>>({ S: '', W: '', O: '', T: '' })
  const [loadingCheck, setLoadingCheck] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  const notify = useCallback((f: Record<SwotQuadrant, SwotFactor[]>) => onFactorsChange(f), [onFactorsChange])

  useEffect(() => {
    fetchJson<Partial<Record<SwotQuadrant, SwotFactor[]>>>(
      `/api/swot-analyses/${analysisId}/factors`
    )
      .then((data) => {
        // Defensive: API is expected to return { S, W, O, T } but coerce
        // any missing / malformed keys to [] so render-time .filter() is safe.
        const safe: Record<SwotQuadrant, SwotFactor[]> = {
          S: Array.isArray(data.S) ? data.S : [],
          W: Array.isArray(data.W) ? data.W : [],
          O: Array.isArray(data.O) ? data.O : [],
          T: Array.isArray(data.T) ? data.T : [],
        }
        setFactors(safe)
        notify(safe)
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : 'Không tải được yếu tố')
      })
      .finally(() => setIsLoading(false))
  }, [analysisId, notify])

  const handleAdd = async (q: SwotQuadrant) => {
    const content = newInput[q].trim()
    if (!content) return
    try {
      const factor = await postJson<SwotFactor>(
        `/api/swot-analyses/${analysisId}/factors`,
        { quadrant: q, content, is_key_factor: false },
      )
      const next = { ...factors, [q]: [...factors[q], factor] }
      setFactors(next); notify(next)
      setNewInput((p) => ({ ...p, [q]: '' }))
      toast.success('Đã thêm yếu tố')
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Lỗi thêm yếu tố') }
  }

  const handleDelete = async (q: SwotQuadrant, id: string) => {
    try {
      await fetchJson(`/api/swot-analyses/${analysisId}/factors/${id}`, {
        method: 'DELETE',
      })
      const next = { ...factors, [q]: factors[q].filter((f) => f.id !== id) }
      setFactors(next); notify(next)
      toast.success('Đã xoá')
    } catch { toast.error('Lỗi xoá yếu tố') }
  }

  const handleToggleKey = async (q: SwotQuadrant, factor: SwotFactor) => {
    const prev = factors
    const next = { ...factors, [q]: factors[q].map((f) => f.id === factor.id ? { ...f, is_key_factor: !f.is_key_factor } : f) }
    setFactors(next); notify(next)
    try {
      await fetchJson(`/api/swot-analyses/${analysisId}/factors/${factor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_key_factor: !factor.is_key_factor }),
      })
    } catch { setFactors(prev); notify(prev); toast.error('Lỗi cập nhật') }
  }

  const handleQualityCheck = async (q: SwotQuadrant, factor: SwotFactor) => {
    setLoadingCheck((p) => ({ ...p, [factor.id]: true }))
    try {
      const result = await fetchJson<{ score: number; feedback: string }>(
        `/api/swot-analyses/${analysisId}/factors/${factor.id}/quality-check`,
        { method: 'POST' },
      )
      const next = { ...factors, [q]: factors[q].map((f) => f.id === factor.id ? { ...f, quality_score: result.score } : f) }
      setFactors(next); notify(next)
      setFeedback((p) => ({ ...p, [factor.id]: result.feedback }))
    } catch { toast.error('Lỗi kiểm tra chất lượng') }
    setLoadingCheck((p) => ({ ...p, [factor.id]: false }))
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {QUADS.map((q) => (
          <div key={q} className="h-48 animate-pulse border-2 border-ink" style={{ background: QUAD_CONFIG[q].bg }} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {QUADS.map((q) => {
        const cfg = QUAD_CONFIG[q]
        const keyCount = factors[q].filter((f) => f.is_key_factor).length
        return (
          <div key={q} className="border-2 border-ink" style={{ background: cfg.bg, boxShadow: '4px 4px 0 #2C2B2B' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b-2 border-ink" style={{ background: cfg.color }}>
              <span className="font-display font-bold text-white text-sm">{cfg.label}</span>
              {keyCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-white font-bold" style={{ color: cfg.color }}>
                  {keyCount} key
                </span>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto">
              {factors[q].map((f) => (
                <div key={f.id} className="border-b border-ink/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleKey(q, f)} className="shrink-0 size-4 border-2 border-ink flex items-center justify-center" style={{ background: f.is_key_factor ? cfg.color : 'white' }}>
                      {f.is_key_factor && <Check className="size-3 text-white" />}
                    </button>
                    <span className="text-[10px] font-mono font-bold px-1 border border-ink/40 bg-white">{f.code}</span>
                    <span className="text-sm font-body flex-1">{f.content}</span>
                    <button onClick={() => handleQualityCheck(q, f)} disabled={!!loadingCheck[f.id]} className="shrink-0 text-[10px] px-1.5 py-0.5 border border-ink/40 hover:bg-white/80">
                      {loadingCheck[f.id] ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                    </button>
                    {f.quality_score != null && (
                      <span className="text-[10px] font-bold px-1 py-0.5" style={{ color: f.quality_score >= 4 ? '#16a34a' : f.quality_score >= 3 ? '#d97706' : '#dc2626' }}>
                        {f.quality_score}/5
                      </span>
                    )}
                    <button onClick={() => handleDelete(q, f.id)} className="shrink-0 text-ink/50 hover:text-red-600">
                      <X className="size-3.5" />
                    </button>
                  </div>
                  {feedback[f.id] && <p className="text-[11px] italic text-ink/60 mt-1 pl-6">{feedback[f.id]}</p>}
                </div>
              ))}
            </div>
            <div className="flex gap-1 p-2 border-t border-ink/20">
              <input
                value={newInput[q]}
                onChange={(e) => setNewInput((p) => ({ ...p, [q]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    handleAdd(q)
                  }
                }}
                placeholder="Nhập yếu tố..."
                className="flex-1 text-sm px-2 py-1 border-2 border-ink bg-white focus:outline-none font-body"
              />
              <button onClick={() => handleAdd(q)} className="px-2 py-1 border-2 border-ink bg-white hover:bg-ink hover:text-white transition-colors">
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
