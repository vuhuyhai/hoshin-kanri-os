'use client'

import { CONCEPTS } from '@/lib/admin/hoshin-explorer-data'
import type { HKConcept } from '@/lib/admin/hoshin-explorer-data'

interface ConceptSidebarProps {
  selectedId: string | null
  onSelect: (concept: HKConcept) => void
}

export function ConceptSidebar({ selectedId, onSelect }: ConceptSidebarProps) {
  return (
    <div className="w-72 shrink-0 border-r-[3px] border-ink overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
      {CONCEPTS.map((cat) => (
        <div key={cat.category}>
          <div className="px-3 py-2 text-[9px] font-bold tracking-[2px] uppercase text-muted-foreground bg-muted border-b border-border font-mono">
            {cat.category}
          </div>
          {cat.items.map((c) => {
            const active = selectedId === c.id
            return (
              <button
                key={c.id}
                id={`btn-${c.id}`}
                onClick={() => onSelect(c)}
                className={`flex items-start gap-2.5 w-full px-3 py-2.5 text-left border-b border-border transition-colors ${
                  active ? 'bg-black text-white' : 'hover:bg-muted'
                }`}
              >
                <span className={`font-mono text-[9px] font-bold tracking-[1px] px-1.5 py-0.5 mt-0.5 shrink-0 ${
                  active ? 'bg-[#FFD93D] text-black' : 'bg-black text-[#FFD93D]'
                }`}>
                  {c.tag}
                </span>
                <div className="min-w-0">
                  <div className={`text-[13px] font-semibold leading-tight ${active ? 'text-white' : 'text-ink'}`}>
                    {c.kanji} {c.name}
                  </div>
                  <div className={`text-[11px] font-mono mt-0.5 ${active ? 'text-gray-400' : 'text-muted-foreground'}`}>
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
