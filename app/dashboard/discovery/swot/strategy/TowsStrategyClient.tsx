'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TowsOrchestrator } from '@/components/swot/TowsOrchestrator'
import type { TowsStrategyWithFactorsRecord } from '@/lib/swot/tows-types'

interface TowsStrategyClientProps {
  analysisId: string
  orgId: string
}

export function TowsStrategyClient({
  analysisId,
  orgId,
}: TowsStrategyClientProps) {
  const router = useRouter()

  const handleComplete = (strategies: TowsStrategyWithFactorsRecord[]) => {
    toast.success(`Đã gửi ${strategies.length} chiến lược sang X-Matrix`)
    router.push('/dashboard/discovery')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-body font-black uppercase tracking-wider text-ink text-xl">
            Kết hợp Chiến lược TOWS
          </h1>
          <p className="font-display text-sm text-text-2 mt-1">
            Chọn yếu tố chủ chốt → AI tạo chiến lược SO/ST/WO/WT → Review &amp;
            gửi sang X-Matrix
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard/discovery/swot')}
          className="inline-flex items-center gap-1 border-2 border-ink bg-white font-body font-bold uppercase text-xs tracking-wider text-ink px-3 py-2 hover:bg-ink hover:text-white transition-colors"
        >
          ← Về SWOT
        </button>
      </header>
      <TowsOrchestrator
        analysisId={analysisId}
        orgId={orgId}
        onComplete={handleComplete}
      />
    </div>
  )
}
