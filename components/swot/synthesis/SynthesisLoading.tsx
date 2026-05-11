'use client'

import { Brain } from 'lucide-react'

interface SynthesisLoadingProps {
  isRecovering: boolean
}

export function SynthesisLoading({ isRecovering }: SynthesisLoadingProps) {
  return (
    <div className="mx-auto max-w-lg py-12 text-center space-y-6">
      <div
        className="inline-flex items-center justify-center w-20 h-20 border-2 border-ink bg-card"
        style={{ boxShadow: '4px 4px 0 #2C2B2B' }}
      >
        <Brain className="w-10 h-10 text-ink animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display font-black text-xl uppercase text-ink">
          {isRecovering ? 'Đang khôi phục dữ liệu...' : 'Đang tổng hợp SWOT'}
        </h2>
        <p className="font-body text-sm text-text-2">
          {isRecovering
            ? 'Đang tìm lại dữ liệu coaching từ hệ thống...'
            : 'AI đang kết hợp insights của bạn với bằng chứng từ thị trường...'}
        </p>
      </div>
      <p className="font-body text-xs text-text-3">
        {isRecovering ? 'Vài giây...' : 'Thường mất 20–30 giây'}
      </p>
    </div>
  )
}
