'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { cn } from '@/lib/utils'

export interface KpiActionsMenuProps {
  kpiId: string
  kpiName: string
  canDelete: boolean
  onOptimisticDelete?: () => void
  onDeleteRollback?: () => void
}

export function KpiActionsMenu({
  kpiId,
  kpiName,
  canDelete,
  onOptimisticDelete,
  onDeleteRollback,
}: KpiActionsMenuProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!canDelete) return null

  async function handleDelete() {
    setIsDeleting(true)
    onOptimisticDelete?.()

    try {
      const response = await fetch(`/api/kpi/${kpiId}`, { method: 'DELETE' })
      const data = (await response.json().catch(() => ({}))) as {
        error?: string
        requestId?: string
        already_archived?: boolean
      }

      if (!response.ok) {
        onDeleteRollback?.()
        router.refresh()
        toast.error(data.error ?? 'Không thể xóa KPI. Vui lòng thử lại.', {
          description: data.requestId ? `Mã lỗi: ${data.requestId}` : undefined,
          duration: 8000,
        })
        return
      }

      if (data.already_archived) {
        toast.info('KPI đã được xóa trước đó')
      } else {
        toast.success(`Đã xóa "${kpiName.slice(0, 40)}"`, {
          description: 'KPI ẩn khỏi dashboard. Lịch sử vẫn được giữ.',
        })
      }

      router.refresh()
    } catch (err) {
      onDeleteRollback?.()
      router.refresh()
      toast.error('Lỗi kết nối. Vui lòng thử lại.')
      console.error('[kpi-delete] network error:', err)
    } finally {
      setIsDeleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Tùy chọn cho KPI ${kpiName}`}
          className={cn(
            'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground',
            'transition-colors hover:bg-muted hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            className="cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa KPI
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa KPI &quot;{kpiName}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa sẽ ẩn KPI khỏi dashboard nhưng giữ lại lịch sử cập nhật,
              hansei và actuals. Bạn có thể khôi phục bằng cách liên hệ admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa KPI'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
