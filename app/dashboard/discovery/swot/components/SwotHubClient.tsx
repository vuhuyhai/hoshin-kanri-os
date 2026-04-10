'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Search, Layers, Target } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PhaseCard } from '@/components/swot/PhaseCard'
import {
  useSwotStore,
  type PhaseName,
  type PhaseStatus,
} from '@/lib/swot/swot-session-store'
import { cn } from '@/lib/utils'

interface SwotHubClientProps {
  orgId: string
}

export function SwotHubClient({ orgId }: SwotHubClientProps) {
  const router = useRouter()
  const started = useRef(false)

  const isLoading = useSwotStore((s) => s.isLoading)
  const coaching = useSwotStore((s) => s.coaching)
  const evidence = useSwotStore((s) => s.evidence)
  const synthesis = useSwotStore((s) => s.synthesis)
  const strategy = useSwotStore((s) => s.strategy)
  const staleSince = useSwotStore((s) => s.staleSince)
  const staleReason = useSwotStore((s) => s.staleReason)
  const initSession = useSwotStore((s) => s.initSession)
  const getXMatrixCandidates = useSwotStore((s) => s.getXMatrixCandidates)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      initSession(orgId)
    }
  }, [orgId, initSession])

  // Count completed phases
  const phases: { name: PhaseName; status: PhaseStatus }[] = [
    { name: 'coaching', status: coaching.status },
    { name: 'evidence', status: evidence.status },
    { name: 'synthesis', status: synthesis.status },
    { name: 'strategy', status: strategy.status },
  ]
  const completedCount = phases.filter(
    (p) => p.status === 'completed'
  ).length

  // "Chạy tất cả" navigates to first non-completed phase
  const firstIncomplete = phases.find(
    (p) => p.status !== 'completed' && p.status !== 'locked'
  )
  const phaseRoutes: Record<PhaseName, string> = {
    coaching: '/dashboard/discovery/swot',
    evidence: '/dashboard/discovery/swot',
    synthesis: '/dashboard/discovery/swot',
    strategy: '/dashboard/discovery/swot/strategy',
  }
  const allCompleted = completedCount === 4

  // Build metadata strings
  const coachingMeta =
    coaching.status === 'completed'
      ? `${coaching.responses.length} câu hỏi · ${coaching.responses.filter((r) => r.swotCategory === 'S').length} điểm mạnh · ${coaching.responses.filter((r) => r.swotCategory === 'W').length} điểm yếu`
      : undefined

  const evidenceMeta =
    evidence.status === 'completed'
      ? `${evidence.allSources.length} nguồn · ${evidence.batches.length} batches`
      : evidence.status === 'in_progress'
        ? `Đang chạy ${evidence.batches.filter((b) => b.status === 'completed').length}/${evidence.batches.length} batches...`
        : undefined

  const synthesisMeta =
    synthesis.status === 'completed'
      ? `${synthesis.items.length} items · cập nhật ${synthesis.completedAt ? new Date(synthesis.completedAt).toLocaleDateString('vi-VN') : ''}`
      : undefined

  const selectedCandidates = strategy.candidates.filter(
    (c) => c.isSelectedForXMatrix
  )
  const strategyMeta =
    strategy.status === 'completed'
      ? `${strategy.candidates.length} candidates · ${selectedCandidates.length} sẵn sàng cho X-Matrix`
      : undefined

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 border bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const xMatrixCandidates = getXMatrixCandidates()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Phân tích SWOT</h1>
          <p className="text-sm text-muted-foreground">
            Nền tảng cho X-Matrix của bạn — hoàn thành để pre-fill 70%
          </p>
        </div>
        <Button
          disabled={allCompleted || !firstIncomplete}
          onClick={() =>
            firstIncomplete &&
            router.push(phaseRoutes[firstIncomplete.name])
          }
          className="font-display text-xs font-semibold uppercase tracking-wider shrink-0"
        >
          {allCompleted ? 'Đã hoàn thành' : 'Chạy tất cả →'}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(completedCount / 4) * 100}%` }}
          />
        </div>
        <span className="text-xs font-display font-semibold text-muted-foreground tabular-nums">
          {completedCount}/4
        </span>
      </div>

      {/* Stale banner */}
      {staleSince && staleReason && (
        <div className="flex items-center gap-3 px-4 py-3 border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40">
          <span className="text-lg shrink-0">⚠️</span>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex-1">
            {staleReason}
          </p>
          <Button
            size="sm"
            onClick={() => {
              const stalePhase = phases.find((p) => p.status === 'stale')
              if (stalePhase) router.push(phaseRoutes[stalePhase.name])
            }}
            className="font-display text-xs font-semibold uppercase tracking-wider shrink-0"
          >
            Chạy lại ngay
          </Button>
        </div>
      )}

      {/* 4 Phase Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PhaseCard
          icon={MessageSquare}
          title="AI Coaching"
          description="Phân tích điểm mạnh, điểm yếu, cơ hội và thách thức qua hội thoại với AI"
          status={coaching.status}
          href={phaseRoutes.coaching}
          metadata={coachingMeta}
        />
        <PhaseCard
          icon={Search}
          title="Nghiên cứu thị trường"
          description="AI tự động tìm kiếm dữ liệu thị trường, đối thủ, và xu hướng ngành để bổ sung bằng chứng"
          status={evidence.status}
          href={phaseRoutes.evidence}
          metadata={evidenceMeta}
        />
        <PhaseCard
          icon={Layers}
          title="Tổng hợp SWOT"
          description="AI kết hợp input của bạn và bằng chứng thị trường thành 12-16 SWOT items có số liệu"
          status={synthesis.status}
          href={phaseRoutes.synthesis}
          metadata={synthesisMeta}
          staleReason={
            synthesis.status === 'stale' ? staleReason : undefined
          }
        />
        <PhaseCard
          icon={Target}
          title="Hoshin Strategy"
          description="Extended SWOT: kết hợp S+O, S+T, W+O, W+T để xác định 3-5 Hoshin Candidates cho X-Matrix"
          status={strategy.status}
          href={phaseRoutes.strategy}
          metadata={strategyMeta}
          isNew
          staleReason={
            strategy.status === 'stale' ? staleReason : undefined
          }
        />
      </div>

      {/* Sync CTA — only when strategy completed */}
      {strategy.status === 'completed' && xMatrixCandidates.length > 0 && (
        <SyncToXMatrixCTA candidates={xMatrixCandidates} />
      )}
    </div>
  )
}

// ============================================================
// Sync CTA sub-component
// ============================================================

function SyncToXMatrixCTA({
  candidates,
}: {
  candidates: ReturnType<typeof useSwotStore.getState>['strategy']['candidates']
}) {
  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/swot/sync-xmatrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')

      toast.success(
        `${data.syncedCount} Hoshin Candidates đã được thêm vào X-Matrix`
      )
      router.push('/dashboard/x-matrix/new?prefilled=true')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không thể đồng bộ'
      )
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="border-2 border-primary p-5 space-y-4">
      <h3 className="font-display text-sm font-bold uppercase tracking-wider">
        {candidates.length} candidates sẵn sàng cho X-Matrix
      </h3>
      <div className="space-y-2">
        {candidates.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 border px-4 py-2"
          >
            <Badge variant="outline" className="text-xs shrink-0">
              P{c.priority}
            </Badge>
            <span className="text-sm font-semibold flex-1">{c.name}</span>
            <span
              className={cn(
                'text-[10px] font-display font-bold uppercase tracking-wider px-1.5 py-0.5',
                {
                  'bg-green-100 text-green-700': c.sourceCellType === 'SO',
                  'bg-blue-100 text-blue-700': c.sourceCellType === 'ST',
                  'bg-yellow-100 text-yellow-700': c.sourceCellType === 'WO',
                  'bg-red-100 text-red-700': c.sourceCellType === 'WT',
                }
              )}
            >
              {c.sourceCellType}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex-1 font-display text-xs font-semibold uppercase tracking-wider"
        >
          {isSyncing ? 'Đang đồng bộ...' : 'Đưa vào X-Matrix →'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push('/dashboard/discovery/swot/strategy')
          }
          className="font-display text-xs font-semibold uppercase tracking-wider"
        >
          Xem lại
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        CEO có thể chỉnh sửa trong X-Matrix Builder
      </p>
    </div>
  )
}
