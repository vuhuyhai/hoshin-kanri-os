'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type {
  QuadrantKey,
  SwotDraftItem,
  SwotContextInput,
  SuggestMoreResponse,
} from '@/lib/swot/coaching-types'
import { QUADRANT_LABELS } from '@/lib/swot/coaching-types'

interface SwotSuggestMoreDialogProps {
  quadrant: QuadrantKey
  existingItems: SwotDraftItem[]
  contextInput: SwotContextInput
  onSuccess: (newItems: SwotDraftItem[]) => void
  onClose: () => void
}

export function SwotSuggestMoreDialog({
  quadrant,
  existingItems,
  contextInput,
  onSuccess,
  onClose,
}: SwotSuggestMoreDialogProps) {
  const [hint, setHint] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        if (!isLoading) onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isLoading, onClose])

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/swot/suggest-more', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quadrant,
          hint,
          existingItems: existingItems.map((i) => i.statement),
          contextInput,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(
          (err as { error?: string }).error || 'Lỗi kết nối AI'
        )
      }

      const data: SuggestMoreResponse = await res.json()
      const label = QUADRANT_LABELS[quadrant]

      const hydratedItems: SwotDraftItem[] = data.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        isUserAdded: false,
      }))

      onSuccess(hydratedItems)
      toast.success(`Đã thêm ${hydratedItems.length} gợi ý vào ${label}`)
      onClose()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Lỗi kết nối AI. Thử lại.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const label = QUADRANT_LABELS[quadrant]

  return (
    <div
      ref={dialogRef}
      className="absolute top-full left-0 right-0 z-50 mt-1 border-2 border-black bg-white p-4 shadow-[4px_4px_0_#000] space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="font-display font-bold text-sm">
          🤖 Gợi thêm cho &ldquo;{label}&rdquo;
        </h4>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="text-sm hover:bg-gray-100 px-1.5 py-0.5 rounded"
        >
          ✕
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Bạn muốn AI tập trung vào hướng nào?
      </p>
      <Textarea
        value={hint}
        onChange={(e) => setHint(e.target.value)}
        placeholder="Ví dụ: tập trung vào năng lực công nghệ, hoặc để AI tự chọn nếu để trống"
        rows={2}
        disabled={isLoading}
        className="border-2 border-black resize-none text-sm"
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
          className="border-2 border-black text-xs font-display font-bold"
        >
          Huỷ
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isLoading}
          className="border-2 border-black bg-black text-white text-xs font-display font-bold shadow-[2px_2px_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang tạo...
            </span>
          ) : (
            '⚡ Gợi thêm →'
          )}
        </Button>
      </div>
    </div>
  )
}
