'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { persistWorkshopSelection } from '@/lib/swot/workshop-persist'
import type { SwotQuadrant } from '@/lib/swot/types'

interface SwotFinalizeListProps {
  analysisId: string
  orgId: string
  onComplete: () => void
}

const QUADRANTS: SwotQuadrant[] = ['S', 'W', 'O', 'T']
const QUADRANT_META: Record<SwotQuadrant, { label: string; cls: string }> = {
  S: { label: 'Điểm mạnh', cls: 'border-green-600 bg-green-50' },
  W: { label: 'Điểm yếu', cls: 'border-red-600 bg-red-50' },
  O: { label: 'Cơ hội', cls: 'border-blue-600 bg-blue-50' },
  T: { label: 'Thách thức', cls: 'border-orange-600 bg-orange-50' },
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}

export function SwotFinalizeList({ analysisId, orgId, onComplete }: SwotFinalizeListProps) {
  const ingredients = useSwotStore((s) => s.ingredients)
  const setWorkshopStep = useSwotStore((s) => s.setWorkshopStep)
  const toggleIngredientSelected = useSwotStore((s) => s.toggleIngredientSelected)
  const selectAllByQuadrant = useSwotStore((s) => s.selectAllByQuadrant)
  const [loading, setLoading] = useState(false)

  const selected = ingredients.filter((i) => i.selected)
  const selectedCount = selected.length
  const totalCount = ingredients.length
  const countByQuadrant = (q: SwotQuadrant) => selected.filter((i) => i.quadrant === q).length

  const handleSubmit = async () => {
    const missing = QUADRANTS.some((q) => countByQuadrant(q) === 0)
    if (selectedCount < 2 || missing) {
      toast.error('Chọn ít nhất 1 nguyên liệu ở mỗi nhóm S/W/O/T (tổng ≥ 2)')
      return
    }
    setLoading(true)
    try {
      await persistWorkshopSelection(analysisId, orgId, selected)
      toast.success(`Đã lưu ${selectedCount} nguyên liệu SWOT`)
      // Navigate FIRST. The old code reset the store to step='context' and
      // cleared ingredients before pushing — that made SwotWorkshopFlow
      // re-render and paint the context form for one frame (the "flash
      // through Bối cảnh doanh nghiệp" bug). Leaving store state as-is
      // means re-visits land on finalize with previously-saved ingredients,
      // which is the correct behavior; users can edit via "Quay lại".
      onComplete()
    } catch (err) {
      console.error('[SwotFinalizeList] persist failed:', err)
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu nguyên liệu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <header className="border-2 border-ink bg-bg-warm p-4 shadow-[5px_5px_0_#2C2B2B]">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-ink" />
          <h1 className="font-body font-black uppercase tracking-wider text-ink text-xl">
            Hoàn thiện Nguyên liệu SWOT
          </h1>
        </div>
        <p className="font-display text-sm text-text-2 mt-1 ml-9">
          Chọn các nguyên liệu sẽ dùng để kết hợp chiến lược
        </p>
      </header>

      <div className="border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#2C2B2B] flex flex-wrap items-center gap-2">
        {QUADRANTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => selectAllByQuadrant(q)}
            className="border-2 border-ink bg-bg-warm px-2 py-1 font-body font-bold uppercase text-[11px] tracking-wider text-ink hover:bg-accent-brand hover:text-white transition-colors"
          >
            ☑ Chọn tất cả {q}
          </button>
        ))}
        <span className="ml-auto font-body font-bold text-sm text-ink">
          {selectedCount}/{totalCount} nguyên liệu đã chọn
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {QUADRANTS.map((q) => {
          const meta = QUADRANT_META[q]
          const items = ingredients.filter((i) => i.quadrant === q)
          return (
            <details
              key={q}
              open
              className={`border-2 shadow-[3px_3px_0_#2C2B2B] [&>summary]:list-none [&>summary::-webkit-details-marker]:hidden ${meta.cls}`}
            >
              <summary className="cursor-pointer px-3 py-2 font-body font-black uppercase text-sm tracking-wider bg-ink text-white">
                {q} — {meta.label} ({items.length})
              </summary>
              <div className="p-2 space-y-2">
                {items.length === 0 ? (
                  <p className="font-display text-xs text-text-3 italic text-center py-2">
                    Không có nguyên liệu
                  </p>
                ) : items.map((ing) => (
                  <label
                    key={ing.id}
                    className="flex items-start gap-2 border-2 border-ink bg-white p-2 cursor-pointer hover:bg-bg-warm transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={ing.selected}
                      onChange={() => toggleIngredientSelected(ing.id)}
                      className="mt-0.5 w-4 h-4 border-2 border-ink accent-accent-brand flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm text-ink break-words">{ing.statement}</p>
                      {ing.evidence.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {ing.evidence.slice(0, 3).map((e, i) => (
                            <li key={i} className="font-body text-[11px] text-text-3 truncate">
                              <a
                                href={e.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(ev) => ev.stopPropagation()}
                                className="underline hover:text-accent-brand"
                              >
                                🌐 {domainOf(e.url)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </details>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#2C2B2B]">
        <button
          type="button"
          onClick={() => setWorkshopStep('workshop')}
          disabled={loading}
          className="inline-flex items-center gap-1 border-2 border-ink bg-bg-warm px-3 py-2 font-body font-bold uppercase text-xs tracking-wider text-ink hover:bg-ink hover:text-white disabled:opacity-50 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Quay lại chỉnh sửa
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || selectedCount === 0}
          className="inline-flex items-center gap-1 border-2 border-ink bg-accent-brand text-white font-body font-black uppercase text-xs tracking-wider px-3 py-2 shadow-[3px_3px_0_#2C2B2B] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[3px_3px_0_#2C2B2B] disabled:hover:translate-x-0 disabled:hover:translate-y-0 transition-all"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          {loading ? 'Đang lưu...' : 'Lưu & Kết hợp Chiến lược'}
          {!loading && <ArrowRight className="w-3 h-3" />}
        </button>
      </div>
    </div>
  )
}
