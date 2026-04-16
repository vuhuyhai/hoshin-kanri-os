'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Search, RefreshCcw, ExternalLink, Globe, Calendar, Plus, Check } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { postJson, FetchJsonError } from '@/lib/http/fetch-json'
import type { TavilyEvidenceResult, ItemEvidenceResponse } from '@/lib/swot/types'

interface SwotItemEvidenceDrawerProps {
  ingredientId: string | null
  onClose: () => void
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') } catch { return url }
}
function formatDate(iso?: string): string | null {
  if (!iso) return null
  try { return new Date(iso).toLocaleDateString('vi-VN') } catch { return null }
}

export function SwotItemEvidenceDrawer({ ingredientId, onClose }: SwotItemEvidenceDrawerProps) {
  const ingredient = useSwotStore((s) =>
    ingredientId ? s.ingredients.find((i) => i.id === ingredientId) : undefined,
  )
  const contextData = useSwotStore((s) => s.contextData)
  const updateIngredient = useSwotStore((s) => s.updateIngredient)
  const setItemEvidence = useSwotStore((s) => s.setItemEvidence)
  const setItemSearching = useSwotStore((s) => s.setItemSearching)

  const [candidates, setCandidates] = useState<TavilyEvidenceResult[] | null>(null)
  const [queryStr, setQueryStr] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const fetchEvidence = async () => {
    const ing = ingredient
    if (!ing || !contextData) return
    setLoading(true)
    setHasError(false)
    setItemSearching(ing.id, true)
    try {
      const ctxStr = `${contextData.industry}, quy mô ${contextData.headcount}, thị trường ${contextData.mainMarket}. Mục tiêu năm: ${contextData.yearGoal}`
      const res = await postJson<ItemEvidenceResponse>('/api/swot/item-evidence', {
        statement: ing.statement,
        quadrant: ing.quadrant,
        orgContext: ctxStr,
      })
      setQueryStr(res.query)
      setCandidates(res.results)
      setItemEvidence(ing.id, res.results)
    } catch {
      setCandidates([])
      setHasError(true)
    } finally {
      setLoading(false)
      setItemSearching(ing.id, false)
    }
  }

  useEffect(() => {
    if (!ingredientId || !ingredient) {
      setCandidates(null); setQueryStr(''); setHasError(false)
      return
    }
    if (ingredient.evidence.length > 0) {
      setCandidates(ingredient.evidence)
    } else {
      fetchEvidence()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientId])

  const reSearch = () => { setCandidates(null); fetchEvidence() }

  const addToIngredient = (r: TavilyEvidenceResult) => {
    if (!ingredient) return
    if (ingredient.evidence.some((e) => e.url === r.url)) return
    updateIngredient(ingredient.id, { evidence: [...ingredient.evidence, r] })
    toast.success('Đã lưu nguồn tham khảo')
  }

  const isOpen = ingredientId !== null && !!ingredient
  const showEmpty = !loading && candidates !== null && candidates.length === 0

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] border-l-2 border-ink bg-bg-warm p-0 flex flex-col">
        <SheetHeader className="border-b-2 border-ink bg-white p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-ink" />
            <SheetTitle className="font-body font-black uppercase tracking-wider text-ink">
              Tìm kiếm dữ liệu
            </SheetTitle>
          </div>
          {ingredient && (
            <p className="mt-2 font-display text-sm text-text-2 break-words">{ingredient.statement}</p>
          )}
        </SheetHeader>

        {queryStr && (
          <div className="border-b-2 border-ink bg-white px-4 py-3">
            <p className="font-body font-bold uppercase text-[11px] tracking-wider text-text-3 mb-1">
              Query AI đã tạo
            </p>
            <p className="font-display text-sm text-ink italic break-words">&ldquo;{queryStr}&rdquo;</p>
            <button
              type="button"
              onClick={reSearch}
              disabled={loading}
              className="mt-2 inline-flex items-center gap-1 border-2 border-ink bg-bg-warm px-2 py-1 font-body font-bold uppercase text-[11px] tracking-wider text-ink hover:bg-accent-brand hover:text-white disabled:opacity-50 transition-colors"
            >
              <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Tìm kiếm lại
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#2C2B2B] animate-pulse">
                <div className="h-4 bg-bg-warm w-3/4 mb-2" />
                <div className="h-3 bg-bg-warm w-full mb-1" />
                <div className="h-3 bg-bg-warm w-5/6" />
              </div>
            ))
          ) : showEmpty || hasError ? (
            <p className="font-display text-sm text-text-2 text-center py-8">
              Không tìm thấy dữ liệu phù hợp. Thử tìm kiếm lại.
            </p>
          ) : (
            candidates?.map((r, i) => {
              const added = !!ingredient && ingredient.evidence.some((e) => e.url === r.url)
              const dateStr = formatDate(r.published_date)
              return (
                <div key={r.url + i} className="border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#2C2B2B]">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1 font-body font-bold text-ink hover:text-accent-brand underline underline-offset-2"
                  >
                    <span className="break-words">{r.title}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 mt-1" />
                  </a>
                  <p className="mt-1.5 font-display text-sm text-text-2 line-clamp-2 break-words">{r.snippet}</p>
                  <div className="mt-2 flex items-center gap-3 font-body text-[11px] text-text-3">
                    <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" />{extractDomain(r.url)}</span>
                    {dateStr && (
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{dateStr}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addToIngredient(r)}
                    disabled={added}
                    className="mt-2 inline-flex items-center gap-1 border-2 border-ink bg-bg-warm px-2 py-1 font-body font-bold uppercase text-[11px] tracking-wider text-ink hover:bg-accent-brand hover:text-white disabled:bg-green-100 disabled:text-green-800 disabled:cursor-default transition-colors"
                  >
                    {added ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {added ? 'Đã thêm' : 'Thêm vào nguyên liệu'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
