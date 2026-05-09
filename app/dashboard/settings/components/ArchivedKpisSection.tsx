'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { fetchJson } from '@/lib/http/fetch-json'
import type { ArchivedKpi } from '@/app/api/kpi/archived/route'

const FREQUENCY_LABEL: Record<ArchivedKpi['frequency'], string> = {
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function ArchivedKpisSection() {
  const router = useRouter()
  const [kpis, setKpis] = useState<ArchivedKpi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmKpi, setConfirmKpi] = useState<ArchivedKpi | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchJson<{ kpis: ArchivedKpi[] }>(
          '/api/kpi/archived',
        )
        if (!cancelled) setKpis(data.kpis)
      } catch {
        if (!cancelled) {
          toast.error('Không thể tải danh sách KPI đã archived')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleRestore(kpi: ArchivedKpi) {
    setRestoringId(kpi.id)
    const previous = kpis
    setKpis((current) => current.filter((k) => k.id !== kpi.id))

    try {
      const response = await fetch(`/api/kpi/${kpi.id}/restore`, {
        method: 'POST',
      })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        requestId?: string
        already_active?: boolean
      }

      if (!response.ok) {
        setKpis(previous)
        toast.error(data.error ?? 'Không thể khôi phục KPI. Vui lòng thử lại.', {
          description: data.requestId
            ? `Mã lỗi: ${data.requestId}`
            : undefined,
          duration: 8000,
        })
        return
      }

      if (data.already_active) {
        toast.info(`KPI "${kpi.name.slice(0, 40)}" đã hoạt động`)
      } else {
        toast.success(`Đã khôi phục "${kpi.name.slice(0, 40)}"`, {
          description: 'KPI xuất hiện lại trên dashboard.',
        })
      }

      router.refresh()
    } catch (err) {
      setKpis(previous)
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
      console.error('[kpi-restore] network error:', err)
    } finally {
      setRestoringId(null)
      setConfirmKpi(null)
    }
  }

  return (
    <section className="space-y-4">
      <div className="border-b-2 border-border pb-2">
        <h2 className="font-display text-lg font-bold">
          KPIs đã archived
          {!isLoading && kpis.length > 0 && ` (${kpis.length})`}
        </h2>
        <p className="text-sm text-muted-foreground">
          KPI đã xóa khỏi dashboard. Khôi phục để KPI nhận entries mới — lịch
          sử cập nhật, hansei và actuals trước đó được giữ nguyên.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : kpis.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Không có KPI nào đã archived.
        </p>
      ) : (
        <div className="border divide-y">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{kpi.name}</p>
                <p className="text-xs text-muted-foreground">
                  Mục tiêu: {kpi.target_value} {kpi.unit} ·{' '}
                  {FREQUENCY_LABEL[kpi.frequency]}
                  {kpi.dept_level
                    ? ` · ${kpi.dept_level === 'company' ? 'Công ty' : 'Phòng ban'}`
                    : ''}
                  {' · '}
                  Cập nhật {formatDate(kpi.updated_at)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={restoringId === kpi.id}
                onClick={() => setConfirmKpi(kpi)}
                className="shrink-0"
              >
                {restoringId === kpi.id ? 'Đang khôi phục...' : 'Khôi phục'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!confirmKpi}
        onOpenChange={(open) => !open && setConfirmKpi(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Khôi phục KPI &quot;{confirmKpi?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              KPI sẽ xuất hiện lại trên dashboard và nhận entries mới. Lịch sử
              cập nhật, hansei và actuals trước đó được giữ nguyên.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!restoringId}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmKpi && handleRestore(confirmKpi)}
              disabled={!!restoringId}
            >
              {restoringId ? 'Đang khôi phục...' : 'Khôi phục KPI'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
