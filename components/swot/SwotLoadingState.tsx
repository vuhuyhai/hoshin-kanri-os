'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2 } from 'lucide-react'
import type { AnalysisFramework } from '@/lib/swot/coaching-types'

interface SwotLoadingStateProps {
  selectedFrameworks: AnalysisFramework[]
}

function buildMessages(frameworks: AnalysisFramework[]): string[] {
  const msgs: string[] = ['Đang đọc bối cảnh doanh nghiệp...']
  if (frameworks.includes('8Ms')) msgs.push('Đang phân tích 8 nguồn lực nội bộ (8Ms)...')
  if (frameworks.includes('5Forces')) msgs.push('Đang đánh giá áp lực cạnh tranh (5 Forces)...')
  if (frameworks.includes('PESTEL')) msgs.push('Đang quét môi trường vĩ mô Việt Nam (PESTEL)...')
  msgs.push('Đang tổng hợp SWOT và viết nhận xét...')
  return msgs
}

export function SwotLoadingState({ selectedFrameworks }: SwotLoadingStateProps) {
  const [messages] = useState(() => buildMessages(selectedFrameworks))
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex >= messages.length - 1) return
    const timer = setTimeout(() => {
      setCurrentIndex((i) => Math.min(i + 1, messages.length - 1))
    }, 2500)
    return () => clearTimeout(timer)
  }, [currentIndex, messages.length])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="w-full max-w-md border-2 border-ink bg-white p-6"
        style={{ boxShadow: '4px 4px 0 #2C2B2B' }}
      >
        <h3 className="font-display font-black text-lg uppercase mb-4 text-ink">
          AI đang phân tích...
        </h3>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={msg} className="flex items-center gap-3">
              {i < currentIndex ? (
                <Check className="w-5 h-5 text-[#c73937] shrink-0" />
              ) : i === currentIndex ? (
                <Loader2 className="w-5 h-5 animate-spin text-ink shrink-0" />
              ) : (
                <span className="w-5 h-5 shrink-0" />
              )}
              <span
                className={`font-body text-sm ${
                  i === currentIndex
                    ? 'font-bold text-ink'
                    : i < currentIndex
                      ? 'text-text-3 line-through'
                      : 'text-text-3/50'
                }`}
              >
                {msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
