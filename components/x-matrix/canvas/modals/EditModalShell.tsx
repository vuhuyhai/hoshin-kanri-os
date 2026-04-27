'use client'

import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface EditModalShellProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onSave: () => void
  saveDisabled?: boolean
  children: ReactNode
}

export function EditModalShell({
  open,
  onOpenChange,
  title,
  description,
  onSave,
  saveDisabled = false,
  children,
}: EditModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-2xl">
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">{children}</div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="btn-brutal-secondary"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className="btn-brutal-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lưu
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
