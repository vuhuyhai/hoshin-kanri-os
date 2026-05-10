'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { CONCEPTS } from '@/lib/admin/hoshin-explorer-data'
import type { HKConcept } from '@/lib/admin/hoshin-explorer-data'

interface ConceptSidebarProps {
  selectedId: string | null
  onSelect: (concept: HKConcept) => void
  mobile?: boolean
}

export function ConceptSidebar({ selectedId, onSelect, mobile }: ConceptSidebarProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return CONCEPTS
    const q = search.toLowerCase()
    return CONCEPTS.map((cat) => ({
      ...cat,
      items: cat.items.filter((c) =>
        c.name.toLowerCase().includes(q) || c.en.toLowerCase().includes(q) || c.kanji.includes(q)
      ),
    })).filter((cat) => cat.items.length > 0)
  }, [search])

  const indexMap = useMemo(() => {
    const map: Record<string, number> = {}
    let idx = 0
    for (const cat of CONCEPTS) for (const c of cat.items) map[c.id] = idx++
    return map
  }, [])

  return (
    <div className={mobile
      ? 'w-full bg-bg-warm'
      : 'border-r-2 border-ink bg-bg-warm overflow-y-auto h-full'
    }>
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-3" />
          <input type="text" placeholder="Tìm khái niệm..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-brutal pl-10 py-2 text-[15px] min-h-[44px] font-body" />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="font-body text-[15px] text-text-3 text-center py-8">Không tìm thấy khái niệm nào</p>
      )}

      {filtered.map((cat) => (
        <div key={cat.category}>
          <div className="flex items-center gap-3 py-2 px-3 mt-4 mb-1 border-b border-bg-muted-warm">
            <span className="overline text-[10px]">{cat.category}</span>
            <span className="font-body text-[12px] text-text-3 ml-auto">{cat.items.length} khái niệm</span>
          </div>
          {cat.items.map((c) => {
            const active = selectedId === c.id
            const num = indexMap[c.id] ?? 0
            return (
              <button key={c.id} id={`btn-${c.id}`} onClick={() => onSelect(c)}
                className={`w-full flex items-start gap-3 px-3 py-3 border-b border-bg-muted-warm text-left transition-all duration-150 cursor-pointer min-h-[44px] ${
                  active ? 'bg-ink text-white' : 'hover:bg-bg-muted-warm'
                }`}
              >
                <span className={`w-7 h-7 flex items-center justify-center font-display font-bold text-[12px] shrink-0 border-2 mt-0.5 ${
                  active ? 'bg-accent-brand border-accent-brand text-white' : 'bg-bg-warm border-ink text-ink'
                }`}>
                  {String(num + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-display font-semibold text-[14px] leading-snug truncate ${active ? 'text-white' : 'text-ink'}`}>
                    {c.kanji} {c.name}
                  </p>
                  <p className={`font-body text-[13px] mt-0.5 truncate ${active ? 'text-white/70' : 'text-text-3'}`}>
                    {c.en}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
