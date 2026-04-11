'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { CONCEPTS, findConceptById } from '@/lib/admin/hoshin-explorer-data'
import type { HKConcept } from '@/lib/admin/hoshin-explorer-data'
import type { HKExplorerContent } from '@/app/api/admin/hoshin-explorer/route'
import { ConceptSidebar } from './components/ConceptSidebar'
import { ConceptPanel } from './components/ConceptPanel'

const LOADING_MSGS = ['Adler đang phân tích...', 'Kiểm tra tài liệu...', 'Feynman compression...']

export default function HoshinExplorerPage() {
  const [selected, setSelected] = useState<HKConcept | null>(null)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState<HKExplorerContent | null>(null)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0])
  const cache = useRef<Record<string, HKExplorerContent>>({})

  const loadConcept = useCallback(async (concept: HKConcept) => {
    setSelected(concept)
    setContent(null)

    if (cache.current[concept.id]) {
      setContent(cache.current[concept.id])
      return
    }

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
          conceptId: concept.id,
          conceptName: concept.name,
          conceptKanji: concept.kanji,
          conceptDesc: concept.desc,
          books: concept.books,
          layer: concept.layer,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Có lỗi xảy ra')
      cache.current[concept.id] = data
      setContent(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải khái niệm này')
      setSelected(null)
    } finally {
      clearInterval(interval)
      setLoading(false)
    }
  }, [])

  const handleConnectionClick = useCallback((name: string) => {
    const lower = name.toLowerCase()
    for (const cat of CONCEPTS) {
      const found = cat.items.find(
        (c) => c.name.toLowerCase() === lower || c.id === lower || c.kanji === name
      )
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
      {/* Header bar */}
      <div className="flex items-baseline gap-4 flex-wrap px-7 py-4 bg-black border-b-[3px] border-ink">
        <h1 className="font-mono font-black text-[30px] tracking-[2px] text-[#FFD93D] leading-none uppercase">
          Hoshin Kanri Explorer
        </h1>
        <span className="font-mono text-[10px] tracking-[1px] text-gray-500">
          DEEP LEARNING COMPANION · ADLER × FEYNMAN
        </span>
        <span className="ml-auto font-mono text-[10px] font-bold tracking-[1px] bg-[#FFD93D] text-black px-2.5 py-1">
          AI POWERED
        </span>
      </div>

      {/* 2-column layout */}
      <div className="flex">
        <ConceptSidebar selectedId={selected?.id ?? null} onSelect={loadConcept} />

        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-8">
              <div className="font-mono font-black text-7xl text-gray-200 leading-none">方針</div>
              <div className="font-mono font-black text-2xl tracking-[2px] uppercase">Chọn một khái niệm</div>
              <p className="font-mono text-xs text-muted-foreground max-w-xs leading-relaxed">
                Bấm vào bất kỳ khái niệm nào để Adler phân tích theo 3 tầng Feynman — kết nối thực tế với Ladysfit và tư vấn fitness.
              </p>
            </div>
          ) : (
            <ConceptPanel
              concept={selected}
              loading={loading}
              loadingMessage={loadingMsg}
              content={content}
              onConnectionClick={handleConnectionClick}
            />
          )}
        </div>
      </div>
    </div>
  )
}
