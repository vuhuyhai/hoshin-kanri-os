'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import type { VisionAnswers, VisionDraft } from '@/lib/discovery/types'

interface VisionEditorProps {
  answers: VisionAnswers
  draft: VisionDraft
}

export function VisionEditor({ answers, draft }: VisionEditorProps) {
  const router = useRouter()
  const [vision, setVision] = useState(draft.visionStatement)
  const [goals, setGoals] = useState<string[]>(draft.yearGoals)
  const [isSaving, setIsSaving] = useState(false)

  const updateGoal = (idx: number, value: string) => {
    setGoals((prev) => prev.map((g, i) => (i === idx ? value : g)))
  }

  const handleSave = async () => {
    if (!vision.trim()) {
      toast.error('Vision statement không được trống')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/discovery/vision-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalVision: vision,
          finalGoals: goals.filter((g) => g.trim().length > 0),
          answers,
          draft,
        }),
      })

      if (!response.ok) throw new Error()
      toast.success('Vision đã được lưu!')
      router.push('/dashboard/discovery/benchmark')
    } catch {
      toast.error('Không thể lưu Vision. Thử lại.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">✏️ Review & Chỉnh sửa Vision</h2>
        <p className="text-sm text-muted-foreground">
          AI đã draft dựa trên câu trả lời. Chỉnh sửa cho đúng suy nghĩ của bạn.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Vision Statement ({draft.timeframe})
        </label>
        <Textarea
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          rows={3}
          className="resize-none"
          disabled={isSaving}
        />
        <p className="text-xs text-muted-foreground">
          {vision.length} ký tự
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">
          Mục tiêu năm nay (2–3 mục tiêu đo được)
        </label>
        {goals.map((goal, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="w-4 text-sm text-muted-foreground">
              {idx + 1}.
            </span>
            <Input
              value={goal}
              onChange={(e) => updateGoal(idx, e.target.value)}
              placeholder={`Mục tiêu ${idx + 1}...`}
              disabled={isSaving}
              className="flex-1"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={isSaving}
          onClick={() => router.back()}
        >
          ← Chỉnh answers
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !vision.trim()}
          className="flex-1"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu Vision →'}
        </Button>
      </div>
    </div>
  )
}
