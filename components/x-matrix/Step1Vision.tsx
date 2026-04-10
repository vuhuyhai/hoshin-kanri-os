'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { LIMITS } from '@/lib/x-matrix/types'
import type { XMatrixData } from '@/lib/x-matrix/types'

interface Step1VisionProps {
  data: XMatrixData
  onChange: (data: XMatrixData) => void
  onNext: () => void
}

export function Step1Vision({ data, onChange, onNext }: Step1VisionProps) {
  const filledGoals = data.yearGoals.filter((g) => g.trim().length > 0)
  const canNext = data.vision.trim().length > 0 && filledGoals.length > 0

  const updateGoal = (idx: number, value: string) => {
    const goals = [...data.yearGoals]
    goals[idx] = value
    onChange({ ...data, yearGoals: goals })
  }

  const addGoal = () => {
    if (data.yearGoals.length >= LIMITS.MAX_YEAR_GOALS) return
    onChange({ ...data, yearGoals: [...data.yearGoals, ''] })
  }

  const removeGoal = (idx: number) => {
    if (data.yearGoals.length <= 1) return
    onChange({
      ...data,
      yearGoals: data.yearGoals.filter((_, i) => i !== idx),
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Q1 — Vision & Mục tiêu năm</h2>
        <p className="text-sm text-muted-foreground">
          Lý do tồn tại và đích đến. Pre-filled từ Vision Workshop — chỉnh nếu
          cần.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Vision Statement <span className="text-destructive">*</span>
        </label>
        <Textarea
          value={data.vision}
          onChange={(e) => onChange({ ...data, vision: e.target.value })}
          placeholder="Công ty chúng ta sẽ trở thành..."
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Sẽ hiển thị trên share link LinkedIn
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Mục tiêu năm nay <span className="text-destructive">*</span>
          </label>
          <span className="text-xs text-muted-foreground">
            {data.yearGoals.length}/{LIMITS.MAX_YEAR_GOALS}
          </span>
        </div>

        {data.yearGoals.map((goal, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm w-4 shrink-0">
              {idx + 1}.
            </span>
            <Input
              value={goal}
              onChange={(e) => updateGoal(idx, e.target.value)}
              placeholder="Mục tiêu đo được, ví dụ: Đạt 10 tỷ doanh thu..."
              className="flex-1"
            />
            {data.yearGoals.length > 1 && (
              <button
                onClick={() => removeGoal(idx)}
                className="text-muted-foreground hover:text-destructive text-sm shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {data.yearGoals.length < LIMITS.MAX_YEAR_GOALS && (
          <Button variant="outline" size="sm" onClick={addGoal}>
            + Thêm mục tiêu
          </Button>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="bg-primary hover:bg-primary/90"
        >
          Hoshins →
        </Button>
      </div>
    </div>
  )
}
