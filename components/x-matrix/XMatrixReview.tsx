'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { validateXMatrix, calcCompleteness } from '@/lib/x-matrix/utils'
import { trackXMatrixCompleted } from '@/lib/analytics/events'
import type { XMatrixData } from '@/lib/x-matrix/types'
import { postJson } from '@/lib/http/fetch-json'

interface XMatrixReviewProps {
  data: XMatrixData
  orgId: string
  onBack: () => void
}

export function XMatrixReview({ data, orgId, onBack }: XMatrixReviewProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const errors = validateXMatrix(data)
  const completeness = calcCompleteness(data)
  const totalKpis = data.hoshins.reduce((s, h) => s + h.kpis.length, 0)
  const totalInits = data.hoshins.reduce(
    (s, h) => s + h.initiatives.length,
    0
  )

  const handleSave = async () => {
    if (errors.length > 0) {
      toast.error(errors[0])
      return
    }
    setIsSaving(true)

    try {
      const json = await postJson<{ kpisCreated: number; xMatrixId: string }>(
        '/api/x-matrix/create',
        { data, year: new Date().getFullYear(), orgId },
      )

      trackXMatrixCompleted({
        hoshinCount: data.hoshins.length,
        kpisCreated: json.kpisCreated,
        initiativesCount: totalInits,
        hasPrefill: true,
      })

      toast.success(
        `X-Matrix đã lưu! ${json.kpisCreated} KPIs tự động tạo.`
      )
      // Invalidate client router cache before navigating so the
      // dashboard server component re-runs with the new x_matrix row.
      // Without this, Next.js serves the pre-save RSC from cache and
      // the dashboard still shows the "SẴN SÀNG TẠO X-MATRIX" empty state.
      router.refresh()
      router.push('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Review X-Matrix</h2>
        <p className="text-sm text-muted-foreground">
          Hoàn thành {completeness}% · {data.hoshins.length} Hoshins ·{' '}
          {totalInits} Initiatives · {totalKpis} KPIs
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-1">
          <p className="text-sm font-medium text-destructive">
            Cần sửa trước khi lưu:
          </p>
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-destructive">
              • {e}
            </p>
          ))}
        </div>
      )}

      {/* Vision */}
      <div className="border rounded-lg p-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Vision
        </p>
        <p className="font-medium text-sm">{data.vision}</p>
        {data.yearGoals
          .filter((g) => g.trim())
          .map((g, i) => (
            <p key={i} className="text-xs text-muted-foreground">
              {i + 1}. {g}
            </p>
          ))}
      </div>

      {/* Hoshins */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Hoshins ({data.hoshins.length})
        </p>
        {data.hoshins.map((h, idx) => (
          <div key={h.id} className="border rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">
                {idx + 1}. {h.title}
              </p>
              <div className="flex gap-1 shrink-0">
                <Badge variant="outline" className="text-xs">
                  {h.initiatives.length} init
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {h.kpis.length} KPI
                </Badge>
              </div>
            </div>
            {h.kpis.map((k) => (
              <p key={k.id} className="text-xs text-muted-foreground">
                → {k.name}: target {k.targetValue} {k.unit}
                {k.ownerName !== 'Chưa giao' && (
                  <span className="ml-1">({k.ownerName})</span>
                )}
              </p>
            ))}
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          ← Chỉnh KPIs
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || errors.length > 0}
          size="lg"
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu...
            </span>
          ) : (
            'Lưu X-Matrix'
          )}
        </Button>
      </div>
    </div>
  )
}
