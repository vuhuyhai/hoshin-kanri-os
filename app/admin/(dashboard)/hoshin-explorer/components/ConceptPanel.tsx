'use client'

import { BookOpen } from 'lucide-react'
import { CONCEPTS, findConceptById } from '@/lib/admin/hoshin-explorer-data'
import type { HKConcept } from '@/lib/admin/hoshin-explorer-data'
import type { HKExplorerContent } from '@/app/api/admin/hoshin-explorer/route'
import { FeynmanSection } from './FeynmanSection'

const QUICK_PICKS = [
  { label: '方針 Hoshin', id: 'hoshin' },
  { label: 'X表 X-Matrix', id: 'xmatrix' },
  { label: '⇅ Catchball', id: 'catchball' },
]

interface ConceptPanelProps {
  concept: HKConcept | null
  loading: boolean
  loadingMessage: string
  content: HKExplorerContent | null
  onConnectionClick: (name: string) => void
  onQuickPick?: (concept: HKConcept) => void
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="px-4 md:px-8 py-8">
      <div className="h-[3px] w-full bg-bg-muted-warm overflow-hidden mb-4 border border-ink">
        <div className="h-full bg-accent-brand animate-[loadFill_0.9s_ease-in-out_infinite_alternate]" />
      </div>
      <p className="font-body text-[15px] text-text-3">{message}</p>
    </div>
  )
}

function getConceptIndex(id: string): number {
  let idx = 0
  for (const cat of CONCEPTS) { for (const c of cat.items) { if (c.id === id) return idx; idx++ } }
  return 0
}

export function ConceptPanel({ concept, loading, loadingMessage, content, onConnectionClick, onQuickPick }: ConceptPanelProps) {
  if (!concept) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4 md:px-8">
        <div className="w-16 h-16 border-2 border-ink flex items-center justify-center mb-6 bg-bg-muted-warm">
          <BookOpen className="w-7 h-7 text-text-3" />
        </div>
        <h3 className="font-display font-bold text-xl text-ink">Chọn một khái niệm</h3>
        <p className="font-body text-[16px] text-text-3 mt-3 max-w-sm leading-relaxed">
          Bấm vào bất kỳ khái niệm nào để Adler phân tích theo 3 tầng Feynman.
        </p>
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {QUICK_PICKS.map((qp) => (
            <button key={qp.id}
              onClick={() => { const c = findConceptById(qp.id); if (c && onQuickPick) onQuickPick(c) }}
              className="badge-brutal badge-muted cursor-pointer hover:bg-ink hover:text-white transition-colors min-h-[44px] flex items-center"
            >{qp.label}</button>
          ))}
        </div>
      </div>
    )
  }

  const conceptIdx = getConceptIndex(concept.id)

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="border-b-2 border-ink px-4 md:px-8 py-4 md:py-5 flex items-start justify-between gap-4">
        <div>
          <span className="overline">{concept.category}</span>
          <h2 className="font-display font-black text-xl md:text-2xl text-ink mt-1">{concept.kanji} {concept.name}</h2>
          <p className="font-body text-[14px] text-text-3 mt-1">{concept.desc}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="badge-brutal text-[10px] border-accent-brand text-accent-brand">{concept.layer}</span>
            <span className="badge-brutal text-[10px] border-text-3 text-text-3">{concept.books}</span>
          </div>
        </div>
        <span className="font-body text-[13px] text-text-3 shrink-0">#{String(conceptIdx + 1).padStart(2, '0')}</span>
      </div>

      {loading && <LoadingState message={loadingMessage} />}

      {content && (
        <>
          <FeynmanSection level1={content.level1} level2={content.level2} level3={content.level3} />

          <div className="border-b-2 border-ink bg-bg-muted-warm">
            <div className="overline px-4 md:px-8 py-3 border-b border-bg-muted-warm">ỨNG DỤNG THỰC TẾ — VŨ HẢI</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5">
              <div className="card-brutal p-4 md:p-5">
                <div className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-3 mb-2">🏋️ Ladysfit Franchise</div>
                <p className="font-body text-[14px] md:text-[16px] leading-relaxed text-ink">{content.application_ladysfit}</p>
              </div>
              <div className="card-brutal p-4 md:p-5">
                <div className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-3 mb-2">🎯 Tư vấn Fitness</div>
                <p className="font-body text-[14px] md:text-[16px] leading-relaxed text-ink">{content.application_consulting}</p>
              </div>
            </div>
          </div>

          <div className="border-b-2 border-ink" style={{ borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: '#c73937' }}>
            <div className="overline px-4 md:px-8 py-3 text-accent-brand">⚠ ĐIỂM MÙ / GIỚI HẠN</div>
            <div className="px-4 md:px-8 pb-4 font-body text-[14px] md:text-[16px] leading-relaxed text-text-2">{content.critical_point}</div>
          </div>

          {content.connections?.length > 0 && (
            <div className="px-4 md:px-8 py-5">
              <div className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-3 mb-3">Liên kết khái niệm</div>
              <div className="flex flex-wrap gap-2">
                {content.connections.map((conn) => (
                  <button key={conn} onClick={() => onConnectionClick(conn)}
                    className="badge-brutal text-[11px] border-ink text-ink hover:bg-ink hover:text-white transition-colors cursor-pointer min-h-[44px] flex items-center"
                  >{conn}</button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
