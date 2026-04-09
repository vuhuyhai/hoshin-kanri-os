'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { PainPoint, HoshinCandidate } from '@/lib/discovery/types'

interface PainInputFormProps {
  orgContext: { industry: string; city: string; orgName: string }
  onComplete: (candidates: HoshinCandidate[]) => void
}

export function PainInputForm({ orgContext, onComplete }: PainInputFormProps) {
  const [pains, setPains] = useState<PainPoint[]>([
    { id: 'pain_1', text: '' },
    { id: 'pain_2', text: '' },
    { id: 'pain_3', text: '' },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const updatePain = (id: string, text: string) => {
    setPains((prev) => prev.map((p) => (p.id === id ? { ...p, text } : p)))
  }

  const addPain = () => {
    if (pains.length >= 5) return
    setPains((prev) => [
      ...prev,
      { id: `pain_${prev.length + 1}`, text: '' },
    ])
  }

  const removePain = (id: string) => {
    if (pains.length <= 1) return
    setPains((prev) => prev.filter((p) => p.id !== id))
  }

  const filledPains = pains.filter((p) => p.text.trim().length > 0)

  const handleSubmit = async () => {
    if (filledPains.length === 0) {
      toast.error('Nhập ít nhất 1 pain point')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/discovery/pain-mapper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ painPoints: filledPains, orgContext }),
      })

      if (!response.ok) throw new Error()
      const { candidates } = await response.json()
      onComplete(candidates)
    } catch {
      toast.error('Không thể phân tích. Thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          Điều gì đang cản trở công ty bạn tăng trưởng?
        </h2>
        <p className="text-sm text-muted-foreground">
          Viết bằng ngôn ngữ của bạn — không cần chính xác, không cần học
          thuật.
        </p>
      </div>

      <div className="space-y-3">
        {pains.map((pain, idx) => (
          <div key={pain.id} className="flex items-start gap-2">
            <span className="mt-3 w-4 shrink-0 text-sm text-muted-foreground">
              {idx + 1}.
            </span>
            <Textarea
              value={pain.text}
              onChange={(e) => updatePain(pain.id, e.target.value)}
              placeholder={`Pain point ${idx + 1}...`}
              rows={2}
              className="flex-1 resize-none"
              disabled={isLoading}
            />
            {pains.length > 1 && (
              <button
                onClick={() => removePain(pain.id)}
                className="mt-2 text-sm text-muted-foreground hover:text-destructive"
                disabled={isLoading}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        {pains.length < 5 && (
          <Button variant="outline" onClick={addPain} disabled={isLoading}>
            + Thêm pain point
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={filledPains.length === 0 || isLoading}
          className="ml-auto"
        >
          {isLoading
            ? 'Đang phân tích...'
            : `Phân tích ${filledPains.length} pain points →`}
        </Button>
      </div>
    </div>
  )
}
