'use client'

import { Activity, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { XRaySeedContext } from '@/lib/swot/xray-to-swot-mapper'
import type { ScoreLevel } from '@/lib/x-ray/types'

interface XRayContextBannerProps {
  xrayContext: XRaySeedContext
  onDismiss?: () => void
}

const LEVEL_CONFIG: Record<ScoreLevel, { label: string; className: string }> = {
  critical: { label: 'Nguy hiểm', className: 'bg-red-100 text-red-700' },
  weak: { label: 'Yếu', className: 'bg-orange-100 text-orange-700' },
  moderate: { label: 'Trung bình', className: 'bg-yellow-100 text-yellow-700' },
  strong: { label: 'Tốt', className: 'bg-green-100 text-green-700' },
}

export function XRayContextBanner({ xrayContext, onDismiss }: XRayContextBannerProps) {
  const level = LEVEL_CONFIG[xrayContext.overallLevel]
  const { weaknesses, strengths } = xrayContext.swotHints

  return (
    <div className="relative border-2 border-[#2C2B2B] bg-[#F7F5F2] p-4 shadow-[5px_5px_0_#c73937]">
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-[#5A5757] hover:text-[#2C2B2B]"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-5 h-5 text-[#c73937] shrink-0" />
        <span className="font-display font-bold text-sm text-[#2C2B2B]">
          Dữ liệu Business X-Ray đã sẵn sàng
        </span>
        <Badge className={`${level.className} border-0`}>{level.label}</Badge>
      </div>

      <p className="font-display font-bold text-lg text-[#2C2B2B] mb-3">
        Điểm tổng thể: {xrayContext.overallScore}/100
      </p>

      {weaknesses.length > 0 && (
        <div className="mb-2">
          <span className="font-display font-semibold text-xs text-[#5A5757]">Cần cải thiện:</span>
          <ul className="mt-1 space-y-0.5">
            {weaknesses.slice(0, 3).map((w) => (
              <li key={w} className="text-sm text-[#2C2B2B]">• {w}</li>
            ))}
          </ul>
        </div>
      )}

      {strengths.length > 0 && (
        <div className="mb-2">
          <span className="font-display font-semibold text-xs text-[#5A5757]">Điểm mạnh:</span>
          <ul className="mt-1 space-y-0.5">
            {strengths.slice(0, 3).map((s) => (
              <li key={s} className="text-sm text-[#2C2B2B]">• {s}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-[#8A8787] mt-3">
        AI Coaching đã được cá nhân hoá dựa trên kết quả X-Ray của bạn.
      </p>
    </div>
  )
}
