'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { CONCEPTS } from '@/lib/admin/hoshin-explorer-data'
import type { HKConcept } from '@/lib/admin/hoshin-explorer-data'
import type { HKExplorerContent } from '@/app/api/admin/hoshin-explorer/route'
import { ConceptSidebar } from './components/ConceptSidebar'
import { ConceptPanel } from './components/ConceptPanel'
import { StepsView } from './components/StepsView'
import { postJson } from '@/lib/http/fetch-json'

type Tab = 'concepts' | 'steps'
const TABS: { key: Tab; label: string }[] = [
  { key: 'concepts', label: 'Khái niệm (AI)' },
  { key: 'steps', label: 'Các bước thực hiện' },
]
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
      const data = await postJson<HKExplorerContent>(
        '/api/admin/hoshin-explorer',
        {
          conceptId: concept.id,
          conceptName: concept.name,
          conceptKanji: concept.kanji,
          conceptDesc: concept.desc,
          books: concept.books,
          layer: concept.layer,
        },
      )
      cache.current[concept.id] = data
      setContent(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải khái niệm này')
      setSelected(null)
    } finally { clearInterval(interval); setLoading(false) }
  }, [])

  const handleBack = useCallback(() => setSelected(null), [])

  const handleConnectionClick = useCallback((name: string) => {
    const lower = name.toLowerCase()
    for (const cat of CONCEPTS) {
      const found = cat.items.find((c) => c.name.toLowerCase() === lower || c.id === lower || c.kanji === name)
      if (found) { loadConcept(found); document.getElementById(`btn-${found.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    }
    toast.error(`Không tìm thấy khái niệm "${name}"`)
  }, [loadConcept])

  return (
    <div className="-m-8">
      {/* Header */}
      <div className="flex items-end justify-between px-4 md:px-8 py-4 md:py-6 border-b-2 border-ink">
        <div>
          <span className="overline">Knowledge Base</span>
          <h1 className="font-display font-black text-[clamp(24px,3vw,36px)] text-ink uppercase mt-1">
            Hoshin Kanri Explorer
          </h1>
          <p className="font-body text-[14px] md:text-[16px] text-text-3 mt-1">
            Deep Learning Companion · Adler + Feynman
          </p>
        </div>
        <span className="badge-brutal badge-accent mb-1 hidden md:inline-block">⚡ AI Powered</span>
      </div>

      {/* Tabs — scroll ngang trên mobile */}
      <div className="flex overflow-x-auto border-b-2 border-ink">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 md:px-6 py-3 font-display text-[13px] uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap min-h-[44px] ${
              tab === key ? 'font-bold text-ink border-b-accent-brand' : 'font-semibold text-text-3 border-b-transparent hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'steps' ? (
        <StepsView />
      ) : (
        <>
          {/* Desktop: 2 columns */}
          <div className="hidden lg:grid" style={{ gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 120px)' }}>
            <ConceptSidebar selectedId={selected?.id ?? null} onSelect={loadConcept} />
            <div className="overflow-y-auto bg-bg-warm">
              {!selected ? (
                <ConceptPanel concept={null} loading={false} loadingMessage="" content={null} onConnectionClick={handleConnectionClick} onQuickPick={loadConcept} />
              ) : (
                <ConceptPanel concept={selected} loading={loading} loadingMessage={loadingMsg} content={content} onConnectionClick={handleConnectionClick} />
              )}
            </div>
          </div>

          {/* Mobile/Tablet: single column with detail view */}
          <div className="lg:hidden">
            {selected ? (
              <div className="bg-bg-warm">
                <button onClick={handleBack} className="flex items-center gap-2 px-4 py-3 font-display font-semibold text-[13px] uppercase tracking-wider text-text-3 hover:text-ink transition-colors min-h-[44px] border-b border-bg-muted-warm w-full text-left">
                  ← Danh sách
                </button>
                <ConceptPanel concept={selected} loading={loading} loadingMessage={loadingMsg} content={content} onConnectionClick={handleConnectionClick} />
              </div>
            ) : (
              <ConceptSidebar selectedId={null} onSelect={loadConcept} mobile />
            )}
          </div>
        </>
      )}
    </div>
  )
}
