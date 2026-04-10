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
          <span
            className="inline-block text-6xl"
            style={{
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            {STEPS[currentStep].icon}
          </span>
        </div>

        <div>
          <h2
            className="text-xl"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 800,
              color: '#2C2B2B',
            }}
          >
            Đang chẩn đoán {companyName}
          </h2>
        </div>

        <div className="space-y-3">
          <div
            className="h-3 w-full overflow-hidden"
            style={{
              background: '#ECEAE6',
              border: '2px solid #2C2B2B',
            }}
          >
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{
                width: `${progress}%`,
                background: '#c73937',
              }}
            />
          </div>

          <p
            className="text-sm"
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 500,
              fontSize: 15,
              color: '#5A5757',
              minHeight: '1.5em',
            }}
          >
            {STEPS[currentStep].label}
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className="h-2 w-2 rounded-full transition-all duration-500"
              style={{
                background: idx <= currentStep ? '#c73937' : '#ECEAE6',
                transform: idx === currentStep ? 'scale(1.4)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <p
          className="text-xs"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 400,
            color: '#8A8787',
          }}
        >
          AI đang phân tích · Thường mất 15–30 giây
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
