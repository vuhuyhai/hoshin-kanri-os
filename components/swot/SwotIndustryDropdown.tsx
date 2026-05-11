'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Briefcase } from 'lucide-react'
import IndustryIcon from '@/components/ui/IndustryIcon'
import { XRayBadge } from './XRayPrefillBanner'
import { INDUSTRY_OPTIONS } from './swot-context-form-config'

interface SwotIndustryDropdownProps {
  industry: string
  setIndustry: (v: string) => void
  onDirty: () => void
  error?: string
  showXRayBadge?: boolean
}

export function SwotIndustryDropdown({
  industry,
  setIndustry,
  onDirty,
  error,
  showXRayBadge,
}: SwotIndustryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = INDUSTRY_OPTIONS.find((o) => o.value === industry)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div className="space-y-1.5">
      <label className="label-brutal flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-text-3" />
        Ngành hoạt động *
        {showXRayBadge && <XRayBadge />}
      </label>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="input-brutal flex items-center justify-between w-full"
        >
          <span className="flex items-center gap-2">
            {selected ? (
              <>
                <IndustryIcon industry={industry} size={24} />
                <span className="font-body text-[18px] text-ink">{selected.label}</span>
              </>
            ) : (
              <span className="font-body text-[18px] text-text-3">Chọn ngành...</span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-text-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 w-full bg-card border-2 border-ink shadow-brutal-md z-50 max-h-64 overflow-y-auto">
            {INDUSTRY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setIndustry(opt.value)
                  setIsOpen(false)
                  onDirty()
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 font-body text-[16px] text-left border-b border-bg-muted-warm transition-colors ${
                  industry === opt.value
                    ? 'bg-accent-brand text-white'
                    : 'hover:bg-bg-muted-warm text-ink'
                }`}
              >
                <IndustryIcon industry={opt.value} size={24} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="font-body text-xs text-destructive">{error}</p>}
    </div>
  )
}
