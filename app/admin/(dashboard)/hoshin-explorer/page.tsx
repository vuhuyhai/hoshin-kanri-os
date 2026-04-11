'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { CONCEPTS } from '@/lib/admin/hoshin-explorer-data'
import type { HKConcept } from '@/lib/admin/hoshin-explorer-data'
import type { HKExplorerContent } from '@/app/api/admin/hoshin-explorer/route'
import { ConceptSidebar } from './components/ConceptSidebar'
import { ConceptPanel } from './components/ConceptPanel'
import { StepsView } from './components/StepsView'

type Tab = 'concepts' | 'steps'
const LOADING_MSGS = ['Adler đang phân tích...', 'Kiểm tra tài liệu...', 'Feynman compression...']

export default function HoshinExplorerPage() {
  const [tab, setTab] = useState<Tab>('concepts')
  const [selected, setSelected] = useState<HKConcept | null>(null)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<HKExplorerContent | null>(null)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0])
  const cache = useRef<Record<string, HKExplorerContent>>({})

  const loadConcept = useCallback(async (concept: HKConcept) => {
    setSelected(concept)
    setContent(null)
    if (cache.current[concept.id]) { setContent(cache.current[concept.id]); return }

    setLoading(true)
    let msgIdx = 0
    setLoadingMsg(LOADING_MSGS[0])
    const interval = setInterval(() => {
      msgIdx = Math.min(msgIdx + 1, LOADING_MSGS.length - 1)
      setLoadingMsg(LOADING_MSGS[msgIdx])
    }, 900)

    try {
      const res = await fetch('/api/admin/hoshin-explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptId: concept.id, conceptName: concept.name, conceptKanji: concept.kanji,
          conceptDesc: concept.desc, books: concept.books, layer: concept.layer,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Có lỗi xảy ra')
      cache.current[concept.id] = data
      setContent(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải khái niệm này')
      setSelected(null)
    } finally { clearInterval(interval); setLoading(false) }
  }, [])

  const handleConnectionClick = useCallback((name: string) => {
    const lower = name.toLowerCase()
    for (const cat of CONCEPTS) {
      const found = cat.items.find((c) => c.name.toLowerCase() === lower || c.id === lower || c.kanji === name)
      if (found) {
        loadConcept(found)
        document.getElementById(`btn-${found.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }
    toast.error(`Không tìm thấy khái niệm "${name}"`)
  }, [loadConcept])

  return (
    <div className="-m-8">
      {/* Header */}
      <div className="flex items-center gap-5 flex-wrap px-7 py-4 bg-ink border-b-[3px] border-ink">
        <div>
          <h1 className="font-display font-black text-[28px] tracking-wider uppercase text-white leading-none">
            Hoshin Kanri Explorer
          </h1>
          <p className="font-body text-[12px] text-text-3 mt-1 tracking-wide">
            Deep Learning Companion · Adler × Feynman
          </p>
        </div>
        <span className="ml-auto badge-brutal text-[10px] bg-accent-brand text-white border-accent-brand">
          AI Powered
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b-[3px] border-ink">
        {([['concepts', 'Khái niệm (AI)'], ['steps', 'Các bước thực hiện']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-6 py-3 font-display font-bold text-[13px] uppercase tracking-wider border-r-[3px] border-ink transition-colors ${
              tab === key ? 'bg-ink text-white' : 'bg-bg-warm text-ink hover:bg-bg-muted-warm'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'steps' ? (
        <StepsView />
      ) : (
        <div className="flex">
          <ConceptSidebar selectedId={selected?.id ?? null} onSelect={loadConcept} />
          <div className="flex-1 min-w-0 bg-bg-warm">
            {!selected ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-8">
                <div className="font-display font-black text-7xl text-bg-muted-warm leading-none">方針</div>
                <h2 className="font-display font-black text-2xl tracking-wider uppercase text-ink">Chọn một khái niệm</h2>
                <p className="font-body text-sm text-text-2 max-w-sm leading-relaxed">
                  Bấm vào bất kỳ khái niệm nào để Adler phân tích theo 3 tầng Feynman — kết nối thực tế với Ladysfit và tư vấn fitness.
                </p>
              </div>
            ) : (
              <ConceptPanel concept={selected} loading={loading} loadingMessage={loadingMsg} content={content} onConnectionClick={handleConnectionClick} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
