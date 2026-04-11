'use client'

import { CONCEPTS } from '@/lib/admin/hoshin-explorer-data'
import type { HKConcept } from '@/lib/admin/hoshin-explorer-data'

interface ConceptSidebarProps {
  selectedId: string | null
  onSelect: (concept: HKConcept) => void
}

export function ConceptSidebar({ selectedId, onSelect }: ConceptSidebarProps) {
  return (
    <div className="w-72 shrink-0 border-r-[3px] border-ink bg-bg-warm overflow-y-auto" style={{ maxHeight: 'calc(100vh - 64px)' }}>
      {CONCEPTS.map((cat) => (
        <div key={cat.category}>
          <div className="heading-overline px-4 py-2.5 bg-bg-muted-warm border-b-2 border-ink">
            {cat.category}
          </div>
          {cat.items.map((c) => {
            const active = selectedId === c.id
            return (
              <button
                key={c.id}
                id={`btn-${c.id}`}
                onClick={() => onSelect(c)}
                className={`flex items-start gap-3 w-full px-4 py-3 text-left border-b border-bg-muted-warm transition-all duration-100 ${
                  active
                    ? 'bg-ink text-white border-b-ink'
                    : 'hover:bg-bg-muted-warm'
                }`}
              >
                <span className={`badge-brutal text-[10px] px-1.5 py-0.5 mt-0.5 shrink-0 ${
                  active
                    ? 'bg-accent-brand text-white border-accent-brand'
                    : 'bg-ink text-white border-ink'
                }`}>
                  {c.tag}
                </span>
                <div className="min-w-0">
                  <div className={`font-display font-bold text-[13px] leading-tight ${active ? 'text-white' : 'text-ink'}`}>
                    {c.kanji} {c.name}
                  </div>
                  <div className={`font-body text-[12px] mt-0.5 ${active ? 'text-white/60' : 'text-text-3'}`}>
                    {c.en}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
