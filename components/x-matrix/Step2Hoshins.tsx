'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LIMITS } from '@/lib/x-matrix/types'
import { genHoshinId } from '@/lib/x-matrix/utils'
import type { XMatrixData, XMatrixHoshin } from '@/lib/x-matrix/types'
import { cn } from '@/lib/utils'

const SWOT_LABELS: Record<string, { label: string; class: string }> = {
  SO: { label: 'Tăng trưởng', class: 'bg-green-100 text-green-700' },
  ST: { label: 'Phòng thủ', class: 'bg-blue-100 text-blue-700' },
  WO: { label: 'Cải thiện', class: 'bg-yellow-100 text-yellow-700' },
  WT: { label: 'Khẩn cấp', class: 'bg-red-100 text-red-700' },
}

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
    status: 'manual',
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
    data.hoshins.length > 0 &&
    data.hoshins.every((h) => h.title.trim().length > 0)

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

  const confirmHoshin = (idx: number) => {
    onChange({
      ...data,
      hoshins: data.hoshins.map((h, i) =>
        i === idx ? { ...h, status: 'confirmed' } : h
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
        {data.hoshins.map((hoshin, idx) => {
          const isAi = hoshin.status === 'ai_suggested'
          const isConfirmed = hoshin.status === 'confirmed'
          const swotSource = hoshin.sourceSwotCellType
            ? SWOT_LABELS[hoshin.sourceSwotCellType]
            : null

          return (
            <div
              key={hoshin.id}
              className={cn(
                'border p-4 space-y-3',
                isAi && 'border-dashed border-primary/50',
                isConfirmed && 'border-solid border-green-500'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Hoshin {idx + 1}
                  </span>
                  {isAi && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                      AI
                    </span>
                  )}
                  {swotSource && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                        swotSource.class
                      )}
                    >
                      {swotSource.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isAi && (
                    <button
                      onClick={() => confirmHoshin(idx)}
                      className="text-xs text-primary hover:text-primary/80 font-semibold"
                    >
                      Xác nhận ✓
                    </button>
                  )}
                  <button
                    onClick={() => removeHoshin(idx)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Xoá
                  </button>
                </div>
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
              {hoshin.suggestedKpis && hoshin.suggestedKpis.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {hoshin.suggestedKpis.map((kpi, kIdx) => (
                    <span
                      key={kIdx}
                      className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground"
                    >
                      {kpi}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
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
