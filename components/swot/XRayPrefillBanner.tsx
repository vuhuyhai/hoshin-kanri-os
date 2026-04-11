import { Sparkles } from 'lucide-react'

export interface PrefillResult {
  prefilled: true
  source: { date: string; totalScore: number }
  data: {
    industry: string
    headcount: string
    challenges: string
    goals: string
    strengths: string
    suggestedFrameworkSW: '8Ms'
    suggestedFrameworkOT: 'porter5' | 'PESTEL'
  }
}

export function XRayPrefillBanner({
  data,
  onDismiss,
}: {
  data: PrefillResult
  onDismiss: () => void
}) {
  return (
    <div className="flex items-start gap-3 border-2 border-black bg-[#FFF9E6] shadow-[4px_4px_0_#2C2B2B] p-4">
      <Sparkles className="h-5 w-5 mt-0.5 text-[#E8452C] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">
          AI đã chuẩn bị sẵn bối cảnh từ Business X-Ray của bạn
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kết quả ngày{' '}
          {new Date(data.source.date).toLocaleDateString('vi-VN')} · Điểm tổng{' '}
          {data.source.totalScore}/100 · Xem lại và chỉnh sửa nếu cần
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs underline shrink-0 hover:no-underline"
      >
        Bỏ qua
      </button>
    </div>
  )
}

export function XRayBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#E8F5E9] border border-[#4CAF50] px-1.5 py-0.5 ml-2">
      <Sparkles className="h-2.5 w-2.5" />
      Từ X-Ray
    </span>
  )
}

export function PrefillSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted border-2 border-black" />
        <div className="h-8 w-64 bg-muted border-2 border-black" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-12 bg-muted border-2 border-black" />
        <div className="h-12 bg-muted border-2 border-black" />
      </div>
      <div className="h-20 bg-muted border-2 border-black" />
      <div className="h-20 bg-muted border-2 border-black" />
      <div className="h-20 bg-muted border-2 border-black" />
    </div>
  )
}
