'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { VisionAnswers, VisionDraft } from '@/lib/discovery/types'
import { postJson } from '@/lib/http/fetch-json'

interface VisionEditorProps {
  answers: VisionAnswers
  draft: VisionDraft
  initialVision: string
  initialGoals: string[]
  onBack: () => void
}

export function VisionEditor({
  answers,
  draft,
  initialVision,
  initialGoals,
  onBack,
}: VisionEditorProps) {
  const router = useRouter()
  const [vision, setVision] = useState(initialVision)
  const [goals, setGoals] = useState<string[]>(
    initialGoals.length > 0 ? initialGoals : ['']
  )
  const [isSaving, setIsSaving] = useState(false)

  const updateGoal = (idx: number, value: string) => {
    setGoals((prev) => prev.map((g, i) => (i === idx ? value : g)))
  }

  const addGoal = () => {
    if (goals.length >= 3) return
    setGoals((prev) => [...prev, ''])
  }

  const removeGoal = (idx: number) => {
    if (goals.length <= 1) return
    setGoals((prev) => prev.filter((_, i) => i !== idx))
  }

  const validGoals = goals.filter((g) => g.trim().length > 0)
  const canSave = vision.trim().length > 0 && validGoals.length > 0

  const handleSave = async () => {
    if (!canSave) return
    setIsSaving(true)

    try {
      await postJson('/api/discovery/vision-save', {
        finalVision: vision.trim(),
        finalGoals: validGoals,
        answers,
        draft,
      })
      toast.success('Vision đã được lưu!')
      router.push('/dashboard/discovery/benchmark')
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Không thể lưu Vision'
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="font-semibold">Review & Chỉnh sửa Vision</h2>
          <p className="text-sm text-muted-foreground">
            AI đã draft dựa trên câu trả lời của bạn — chỉnh cho đúng ý.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          AI Draft
        </Badge>
      </div>

      {/* Vision Statement */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Vision Statement
          <span className="text-destructive ml-1">*</span>
          <span className="text-muted-foreground font-normal ml-2 text-xs">
            (1–2 câu, truyền cảm hứng, không sáo rỗng)
          </span>
        </label>
        <Textarea
          value={vision}
          onChange={(e) => setVision(e.target.value)}
          rows={3}
          className="resize-none"
          disabled={isSaving}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Đây sẽ hiển thị trên share link LinkedIn</span>
          <span>{vision.length} ký tự</span>
        </div>
      </div>

      {/* Year Goals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Mục tiêu năm nay
            <span className="text-destructive ml-1">*</span>
            <span className="text-muted-foreground font-normal ml-2 text-xs">
              (cụ thể và đo được)
            </span>
          </label>
          <span className="text-xs text-muted-foreground">
            {goals.length}/3
          </span>
        </div>

        {goals.map((goal, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm w-4 shrink-0">
              {idx + 1}.
            </span>
            <Input
              value={goal}
              onChange={(e) => updateGoal(idx, e.target.value)}
              placeholder="Mục tiêu đo được, ví dụ: Đạt 10 tỷ doanh thu Q4..."
              disabled={isSaving}
              className="flex-1"
            />
            {goals.length > 1 && (
              <button
                onClick={() => removeGoal(idx)}
                disabled={isSaving}
                className="text-muted-foreground hover:text-destructive text-sm shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {goals.length < 3 && (
          <Button
            variant="outline"
            size="sm"
            onClick={addGoal}
            disabled={isSaving}
          >
            + Thêm mục tiêu
          </Button>
        )}
      </div>

      {/* Timeframe note */}
      <div className="bg-muted/50 rounded-lg px-4 py-3 text-xs text-muted-foreground">
        Vision nhìn 3 năm. Mục tiêu năm nay là bước đầu tiên hướng tới Vision
        đó.
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="flex-1"
        >
          ← Sửa câu trả lời
        </Button>
        <Button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu...
            </span>
          ) : (
            'Lưu Vision →'
          )}
        </Button>
      </div>
    </div>
  )
}
