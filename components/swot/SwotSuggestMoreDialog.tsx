'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Sparkles, X as XIcon, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type {
  QuadrantKey,
  SwotDraftItem,
  SwotContextInput,
  SuggestMoreResponse,
} from '@/lib/swot/coaching-types'
import { QUADRANT_LABELS } from '@/lib/swot/coaching-types'
import { postJson } from '@/lib/http/fetch-json'

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
      const data = await postJson<SuggestMoreResponse>(
        '/api/swot/suggest-more',
        {
          quadrant,
          hint,
          existingItems: existingItems.map((i) => i.statement),
          contextInput,
        },
      )
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
      toast.error(err instanceof Error ? err.message : 'Lỗi kết nối AI. Thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  const label = QUADRANT_LABELS[quadrant]

  return (
    <div
      ref={dialogRef}
      className="absolute top-full left-0 right-0 z-50 mt-1 border-2 border-ink bg-card p-4 space-y-3"
      style={{ boxShadow: '4px 4px 0 #2C2B2B' }}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-display font-bold text-sm text-ink inline-flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-accent-brand" />
          Gợi thêm cho &ldquo;{label}&rdquo;
        </h4>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="text-text-2 hover:text-ink hover:bg-bg-warm p-1"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
      <p className="font-body text-xs text-text-3">Bạn muốn AI tập trung vào hướng nào?</p>
      <Textarea
        value={hint}
        onChange={(e) => setHint(e.target.value)}
        placeholder="Ví dụ: tập trung vào năng lực công nghệ, hoặc để AI tự chọn nếu để trống"
        rows={2}
        disabled={isLoading}
        className="border-2 border-ink bg-card resize-none text-sm"
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
          className="border-2 border-ink text-xs font-display font-bold"
        >
          Huỷ
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isLoading}
          className="border-2 border-ink bg-ink text-white text-xs font-display font-bold shadow-[2px_2px_0_#2C2B2B] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-1 w-3 h-3 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Sparkles className="mr-1 w-3 h-3" /> Gợi thêm <ArrowRight className="ml-1 w-3 h-3" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
