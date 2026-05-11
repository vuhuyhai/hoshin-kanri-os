'use client'

import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SynthesisErrorProps {
  hasDraft: boolean
  onRetry: () => void
  onBack: () => void
  onRestart: () => void
}

export function SynthesisError({
  hasDraft,
  onRetry,
  onBack,
  onRestart,
}: SynthesisErrorProps) {
  return (
    <div className="mx-auto max-w-lg py-12 text-center space-y-6">
      <div
        className="inline-flex items-center justify-center w-20 h-20 border-2 border-ink bg-card"
        style={{ boxShadow: '4px 4px 0 #2C2B2B' }}
      >
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display font-black text-xl uppercase text-ink">
          Không thể tổng hợp SWOT
        </h2>
        <p className="font-body text-sm text-text-2">
          {hasDraft
            ? 'Vui lòng thử lại hoặc quay lại bước trước.'
            : 'Không tìm thấy dữ liệu coaching. Vui lòng quay lại bước 1 để tạo lại bản nháp SWOT.'}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {hasDraft && (
          <Button variant="outline" onClick={onRetry}>
            Thử lại
          </Button>
        )}
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-1 w-4 h-4" /> Xem lại bối cảnh
        </Button>
        <Button onClick={onRestart}>
          <ArrowLeft className="mr-1 w-4 h-4" /> Quay lại bước 1
        </Button>
      </div>
    </div>
  )
}
