'use client'

import { Check, Loader2, AlertCircle } from 'lucide-react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  status: SaveStatus
  lastSavedAt?: Date | null
}

export function SaveIndicator({ status, lastSavedAt }: Props) {
  if (status === 'idle' && !lastSavedAt) return null

  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-text-3 text-xs">
        <Loader2 className="w-3 h-3 animate-spin" />
        Đang lưu...
      </span>
    )
  }

  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-destructive text-xs">
        <AlertCircle className="w-3 h-3" />
        Lỗi lưu
      </span>
    )
  }

  if (status === 'saved' || lastSavedAt) {
    const time = lastSavedAt
      ? lastSavedAt.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'
    return (
      <span className="inline-flex items-center gap-1.5 text-kpi-healthy-strong text-xs">
        <Check className="w-3 h-3" />
        Đã lưu lúc {time}
      </span>
    )
  }

  return null
}
