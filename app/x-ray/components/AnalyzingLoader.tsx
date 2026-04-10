'use client'

import { useState, useEffect } from 'react'

const STEPS = [
  { label: 'Đang phân tích câu trả lời...', icon: '🔍', duration: 2500 },
  { label: 'Đánh giá 7 trụ cột OPEX...', icon: '📊', duration: 3000 },
  { label: 'So sánh với benchmark ngành...', icon: '📈', duration: 3000 },
  { label: 'Phân tích chuỗi giá trị & vận hành...', icon: '🔗', duration: 3000 },
  { label: 'Xác định 3 hành động ưu tiên...', icon: '🎯', duration: 3000 },
  { label: 'Hoàn thiện báo cáo cá nhân hóa...', icon: '✨', duration: 5000 },
]

interface AnalyzingLoaderProps {
  companyName: string
}

export function AnalyzingLoader({ companyName }: AnalyzingLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (currentStep >= STEPS.length - 1) return

    const timer = setTimeout(() => {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
    }, STEPS[currentStep].duration)

    return () => clearTimeout(timer)
  }, [currentStep])

  const progress = Math.min(
    ((currentStep + 1) / STEPS.length) * 100,
    95
  )

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <span className="inline-block text-6xl animate-bounce" aria-hidden="true">
            {STEPS[currentStep].icon}
          </span>
        </div>

        <h2 className="font-display text-xl font-extrabold uppercase tracking-wider text-ink">
          Đang chẩn đoán {companyName}
        </h2>

        <div className="space-y-3">
          <div className="h-3 w-full overflow-hidden border-2 border-ink bg-bg-muted-warm">
            <div
              className="h-full bg-accent-brand transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="font-body text-[15px] font-medium text-text-2 min-h-[1.5em]">
            {STEPS[currentStep].label}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className="h-2 w-2 transition-all duration-500"
              style={{
                background: idx <= currentStep ? '#c73937' : '#ECEAE6',
                transform: idx === currentStep ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <p className="font-body text-xs text-text-3">
          AI đang phân tích · Thường mất 15–30 giây
        </p>
      </div>
    </div>
  )
}
