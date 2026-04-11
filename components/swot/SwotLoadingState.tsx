'use client'

import { useState, useEffect, useRef } from 'react'
import type { AnalysisFramework } from '@/lib/swot/coaching-types'

interface SwotLoadingStateProps {
  selectedFrameworks: AnalysisFramework[]
}

function buildMessages(frameworks: AnalysisFramework[]): string[] {
  const msgs: string[] = ['Đang đọc bối cảnh doanh nghiệp...']
  if (frameworks.includes('8Ms')) {
    msgs.push('Đang phân tích 8 nguồn lực nội bộ (8Ms)...')
  }
  if (frameworks.includes('5Forces')) {
    msgs.push('Đang đánh giá áp lực cạnh tranh (5 Forces)...')
  }
  if (frameworks.includes('PESTEL')) {
    msgs.push('Đang quét môi trường vĩ mô Việt Nam (PESTEL)...')
  }
  msgs.push('Đang tổng hợp SWOT và viết nhận xét...')
  return msgs
}

export function SwotLoadingState({
  selectedFrameworks,
}: SwotLoadingStateProps) {
  const messages = useRef(buildMessages(selectedFrameworks)).current
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
      <div className="w-full max-w-md border-2 border-black bg-white p-6 shadow-[4px_4px_0_#000]">
        <h3 className="font-display font-bold text-lg mb-4">
          AI đang phân tích...
        </h3>
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={msg} className="flex items-center gap-3">
              {i < currentIndex ? (
                <span className="text-green-600 shrink-0">✓</span>
              ) : i === currentIndex ? (
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin shrink-0" />
              ) : (
                <span className="w-5 h-5 shrink-0" />
              )}
              <span
                className={`text-sm ${
                  i === currentIndex
                    ? 'font-bold text-black'
                    : i < currentIndex
                      ? 'text-muted-foreground line-through'
                      : 'text-muted-foreground/50'
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
