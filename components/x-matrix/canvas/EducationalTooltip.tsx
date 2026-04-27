'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EducationalTooltipProps {
  title: string
  content: ReactNode
  align?: 'left' | 'right'
}

export function EducationalTooltip({ title, content, align = 'left' }: EducationalTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Hướng dẫn: ${title}`}
        aria-expanded={open}
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-text-3 bg-bg-paper text-[10px] font-bold text-text-3 transition-colors hover:border-ink hover:bg-accent-cyan hover:text-ink"
      >
        ⓘ
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={title}
          className={cn(
            'absolute top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] border-[3px] border-ink bg-bg-warm p-3 text-left shadow-[var(--shadow-md)]',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          <p className="mb-2 font-display text-sm font-bold text-ink">{title}</p>
          <div className="text-xs leading-relaxed text-text-2">{content}</div>
        </div>
      )}
    </div>
  )
}
