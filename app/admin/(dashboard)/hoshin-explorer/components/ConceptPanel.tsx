'use client'

import type { HKConcept } from '@/lib/admin/hoshin-explorer-data'
import type { HKExplorerContent } from '@/app/api/admin/hoshin-explorer/route'
import { FeynmanSection } from './FeynmanSection'

interface ConceptPanelProps {
  concept: HKConcept
  loading: boolean
  loadingMessage: string
  content: HKExplorerContent | null
  onConnectionClick: (name: string) => void
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="px-7 py-7">
      <div className="h-[3px] w-full bg-bg-muted-warm overflow-hidden mb-4 border border-ink">
        <div className="h-full bg-accent-brand animate-[loadFill_0.9s_ease-in-out_infinite_alternate]" />
      </div>
      <p className="font-body text-sm text-text-3">{message}</p>
    </div>
  )
}

export function ConceptPanel({ concept, loading, loadingMessage, content, onConnectionClick }: ConceptPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="px-7 py-6 bg-ink text-white border-b-[3px] border-ink">
        <div className="font-display font-black text-[38px] tracking-wider text-accent-brand leading-none">{concept.kanji}</div>
        <h2 className="font-display font-black text-2xl tracking-wider uppercase mt-1 text-white">{concept.name} — {concept.en}</h2>
        <p className="font-body text-[13px] text-text-3 mt-2 leading-relaxed">{concept.desc}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="badge-brutal text-[10px] border-accent-brand text-accent-brand">{concept.layer}</span>
          <span className="badge-brutal text-[10px] border-text-3 text-text-3">{concept.books}</span>
        </div>
      </div>

      {loading && <LoadingState message={loadingMessage} />}

      {content && (
        <>
          <FeynmanSection level1={content.level1} level2={content.level2} level3={content.level3} />

          {/* Applications */}
          <div className="border-b-[3px] border-ink bg-bg-muted-warm">
            <div className="heading-overline px-7 py-3 bg-ink text-accent-brand">
              ỨNG DỤNG THỰC TẾ — VŨ HẢI
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
              <div className="card-brutal p-5">
                <div className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-3 mb-2">🏋️ Ladysfit Franchise</div>
                <p className="font-body text-[14px] leading-relaxed text-ink">{content.application_ladysfit}</p>
              </div>
              <div className="card-brutal p-5">
                <div className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-3 mb-2">🎯 Tư vấn Fitness</div>
                <p className="font-body text-[14px] leading-relaxed text-ink">{content.application_consulting}</p>
              </div>
            </div>
          </div>

          {/* Critical point */}
          <div className="border-b-[3px] border-ink">
            <div className="heading-overline px-7 py-3 bg-red-50 border-b-2 border-ink" style={{ borderLeftWidth: 5, borderLeftStyle: 'solid', borderLeftColor: '#c73937' }}>
              ⚠ ĐIỂM MÙ / GIỚI HẠN
            </div>
            <div className="px-7 py-4 font-body text-[14px] leading-relaxed text-text-2 bg-bg-warm">{content.critical_point}</div>
          </div>

          {/* Connections */}
          {content.connections?.length > 0 && (
            <div className="px-7 py-5 bg-bg-warm">
              <div className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-3 mb-3">Liên kết khái niệm</div>
              <div className="flex flex-wrap gap-2">
                {content.connections.map((conn) => (
                  <button
                    key={conn}
                    onClick={() => onConnectionClick(conn)}
                    className="badge-brutal text-[11px] border-ink text-ink hover:bg-ink hover:text-white transition-colors cursor-pointer"
                  >
                    {conn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
