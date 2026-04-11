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
      <div className="h-[3px] w-full bg-muted overflow-hidden mb-4">
        <div className="h-full bg-[#FFD93D] animate-[loadFill_0.9s_ease-in-out_infinite_alternate]" />
      </div>
      <p className="font-mono text-xs text-muted-foreground">{message}</p>
    </div>
  )
}

export function ConceptPanel({ concept, loading, loadingMessage, content, onConnectionClick }: ConceptPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
      {/* Header */}
      <div className="px-7 py-5 bg-black text-white border-b-[3px] border-ink">
        <div className="font-mono font-black text-[38px] tracking-[4px] text-[#FFD93D] leading-none">{concept.kanji}</div>
        <div className="font-mono font-black text-2xl tracking-[2px] uppercase mt-1">{concept.name} — {concept.en}</div>
        <p className="text-xs text-gray-400 mt-1.5 font-mono leading-relaxed">{concept.desc}</p>
        <div className="flex gap-2 mt-2.5 flex-wrap">
          <span className="font-mono text-[10px] font-bold tracking-[1px] px-2 py-0.5 border-[1.5px] border-[#FFD93D] text-[#FFD93D]">{concept.layer}</span>
          <span className="font-mono text-[10px] font-bold tracking-[1px] px-2 py-0.5 border-[1.5px] border-gray-500 text-gray-400">{concept.books}</span>
        </div>
      </div>

      {loading && <LoadingState message={loadingMessage} />}

      {content && (
        <>
          <FeynmanSection level1={content.level1} level2={content.level2} level3={content.level3} />

          {/* Applications */}
          <div className="border-b-[3px] border-ink bg-[#f8f4ec]">
            <div className="px-7 py-3 bg-black text-[#FFD93D] font-mono text-[10px] font-bold tracking-[2px]">
              ỨNG DỤNG THỰC TẾ — VŨ HẢI
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 p-5">
              <div className="border-2 border-black shadow-[4px_4px_0_#2C2B2B] bg-white p-4">
                <div className="font-mono text-[9px] font-bold tracking-[2px] uppercase text-muted-foreground mb-1.5">🏋️ Ladysfit Franchise</div>
                <p className="text-[13px] leading-relaxed">{content.application_ladysfit}</p>
              </div>
              <div className="border-2 border-black shadow-[4px_4px_0_#2C2B2B] bg-white p-4">
                <div className="font-mono text-[9px] font-bold tracking-[2px] uppercase text-muted-foreground mb-1.5">🎯 Tư vấn Fitness</div>
                <p className="text-[13px] leading-relaxed">{content.application_consulting}</p>
              </div>
            </div>
          </div>

          {/* Critical point */}
          <div className="border-b-[3px] border-ink">
            <div className="px-7 py-3 bg-red-50 border-b border-border border-l-[5px] border-l-[#E63946] font-mono text-[10px] font-bold tracking-[1px] text-[#E63946]">
              ⚠ ĐIỂM MÙ / GIỚI HẠN
            </div>
            <div className="px-7 py-4 text-[13px] leading-relaxed text-muted-foreground">{content.critical_point}</div>
          </div>

          {/* Connections */}
          {content.connections?.length > 0 && (
            <div className="px-7 py-5">
              <div className="font-mono text-[10px] font-bold tracking-[2px] text-muted-foreground mb-2.5">LIÊN KẾT KHÁI NIỆM</div>
              <div className="flex flex-wrap gap-2">
                {content.connections.map((conn) => (
                  <button
                    key={conn}
                    onClick={() => onConnectionClick(conn)}
                    className="font-mono text-[11px] px-2.5 py-1 border-[1.5px] border-black hover:bg-black hover:text-white transition-colors"
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
