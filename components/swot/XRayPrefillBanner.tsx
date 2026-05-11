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
    <div
      className="flex items-start gap-3 border-2 border-ink bg-card p-4"
      style={{ boxShadow: '4px 4px 0 #2C2B2B', borderLeft: '8px solid #E8452C' }}
    >
      <Sparkles className="h-5 w-5 mt-0.5 text-[#E8452C] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-ink">
          AI đã chuẩn bị sẵn bối cảnh từ Business X-Ray của bạn
        </p>
        <p className="font-body text-xs text-text-3 mt-0.5">
          Kết quả ngày {new Date(data.source.date).toLocaleDateString('vi-VN')} · Điểm tổng{' '}
          {data.source.totalScore}/100 · Xem lại và chỉnh sửa nếu cần
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="font-body text-xs underline shrink-0 hover:no-underline text-text-2"
      >
        Bỏ qua
      </button>
    </div>
  )
}

export function XRayBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold bg-card border-2 border-ink px-1.5 py-0.5 ml-2 text-ink">
      <Sparkles className="h-2.5 w-2.5" />
      Từ X-Ray
    </span>
  )
}

export function PrefillSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-bg-muted-warm border-2 border-ink" />
        <div className="h-8 w-64 bg-bg-muted-warm border-2 border-ink" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-12 bg-bg-muted-warm border-2 border-ink" />
        <div className="h-12 bg-bg-muted-warm border-2 border-ink" />
      </div>
      <div className="h-20 bg-bg-muted-warm border-2 border-ink" />
      <div className="h-20 bg-bg-muted-warm border-2 border-ink" />
      <div className="h-20 bg-bg-muted-warm border-2 border-ink" />
    </div>
  )
}
