'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LIMITS } from '@/lib/x-matrix/types'
import { genHoshinId } from '@/lib/x-matrix/utils'
import type { XMatrixData, XMatrixHoshin } from '@/lib/x-matrix/types'

interface Step2HoshinsProps {
  data: XMatrixData
  onChange: (data: XMatrixData) => void
  onNext: () => void
  onBack: () => void
}

function emptyHoshin(idx: number): XMatrixHoshin {
  return {
    id: genHoshinId(idx),
    title: '',
    description: '',
    initiatives: [],
    kpis: [],
  }
}

export function Step2Hoshins({
  data,
  onChange,
  onNext,
  onBack,
}: Step2HoshinsProps) {
  const atLimit = data.hoshins.length >= LIMITS.MAX_HOSHINS
  const canNext =
    data.hoshins.length > 0 && data.hoshins.every((h) => h.title.trim().length > 0)

  const addHoshin = () => {
    if (atLimit) return
    onChange({
      ...data,
      hoshins: [...data.hoshins, emptyHoshin(data.hoshins.length)],
    })
  }

  const updateHoshin = (
    idx: number,
    field: 'title' | 'description',
    value: string
  ) => {
    onChange({
      ...data,
      hoshins: data.hoshins.map((h, i) =>
        i === idx ? { ...h, [field]: value } : h
      ),
    })
  }

  const removeHoshin = (idx: number) => {
    onChange({ ...data, hoshins: data.hoshins.filter((_, i) => i !== idx) })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Q2 — Annual Hoshins</h2>
          <span className="text-sm text-muted-foreground">
            {data.hoshins.length}/{LIMITS.MAX_HOSHINS}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          &quot;Bàn thắng lớn&quot; cần đạt trong năm nay. Ít hơn = tập trung
          hơn.
        </p>
      </div>

      <div className="space-y-4">
        {data.hoshins.map((hoshin, idx) => (
          <div key={hoshin.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Hoshin {idx + 1}
              </span>
              <button
                onClick={() => removeHoshin(idx)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Xoá
              </button>
            </div>
            <Input
              value={hoshin.title}
              onChange={(e) => updateHoshin(idx, 'title', e.target.value)}
              placeholder="Bắt đầu bằng động từ — Tăng... / Xây dựng... / Đạt..."
              className="font-medium"
            />
            <Textarea
              value={hoshin.description}
              onChange={(e) =>
                updateHoshin(idx, 'description', e.target.value)
              }
              placeholder="Mô tả thêm nếu cần (tuỳ chọn)"
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <Button variant="outline" onClick={addHoshin} disabled={atLimit}>
          + Thêm Hoshin
        </Button>
        {atLimit && (
          <p className="text-xs text-muted-foreground">
            Tối đa {LIMITS.MAX_HOSHINS} Hoshins — &quot;Tập trung là nói
            không.&quot;
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          ← Vision
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          Initiatives →
        </Button>
      </div>
    </div>
  )
}
