'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LIMITS } from '@/lib/x-matrix/types'
import { genKpiId } from '@/lib/x-matrix/utils'
import type { XMatrixData, XMatrixKpi, OrgMember } from '@/lib/x-matrix/types'
import { cn } from '@/lib/utils'

interface Step4KpisProps {
  data: XMatrixData
  members: OrgMember[]
  onChange: (data: XMatrixData) => void
  onNext: () => void
  onBack: () => void
}

export function Step4Kpis({
  data,
  members,
  onChange,
  onNext,
  onBack,
}: Step4KpisProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const activeHoshin = data.hoshins[activeIdx]

  const setHoshinKpis = (hIdx: number, kpis: XMatrixKpi[]) => {
    onChange({
      ...data,
      hoshins: data.hoshins.map((h, i) =>
        i === hIdx ? { ...h, kpis } : h
      ),
    })
  }

  const addKpi = () => {
    if (
      !activeHoshin ||
      activeHoshin.kpis.length >= LIMITS.MAX_KPIS_PER_HOSHIN
    )
      return
    const defaultMember = members[0]
    setHoshinKpis(activeIdx, [
      ...activeHoshin.kpis,
      {
        id: genKpiId(activeIdx, activeHoshin.kpis.length),
        name: '',
        unit: '',
        targetValue: 0,
        ownerUserId: defaultMember?.userId ?? null,
        ownerName: defaultMember?.fullName ?? 'Chưa giao',
        frequency: 'monthly',
        deptLevel: 'company',
      },
    ])
  }

  const updateKpi = (kIdx: number, updates: Partial<XMatrixKpi>) => {
    setHoshinKpis(
      activeIdx,
      activeHoshin.kpis.map((k, i) =>
        i === kIdx ? { ...k, ...updates } : k
      )
    )
  }

  const removeKpi = (kIdx: number) => {
    setHoshinKpis(
      activeIdx,
      activeHoshin.kpis.filter((_, i) => i !== kIdx)
    )
  }

  const atLimit =
    activeHoshin?.kpis.length >= LIMITS.MAX_KPIS_PER_HOSHIN
  const hasMinKpis = data.hoshins.some((h) =>
    h.kpis.some((k) => k.name.trim() && k.unit.trim() && k.targetValue > 0)
  )

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          Q4 — KPIs & Người chịu trách nhiệm
        </h2>
        <p className="text-sm text-muted-foreground">
          1–2 KPI đo được cho mỗi Hoshin. Sẽ tự động tạo trong KPI Tracker.
        </p>
      </div>

      {/* Hoshin tabs */}
      <div className="flex gap-2 flex-wrap">
        {data.hoshins.map((h, idx) => (
          <button
            key={h.id}
            onClick={() => setActiveIdx(idx)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs transition-all',
              activeIdx === idx
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            H{idx + 1}
            <Badge
              variant="outline"
              className={cn(
                'ml-1.5 text-xs py-0',
                activeIdx === idx ? 'border-primary-foreground/40' : ''
              )}
            >
              {h.kpis.length}/{LIMITS.MAX_KPIS_PER_HOSHIN}
            </Badge>
          </button>
        ))}
      </div>

      {activeHoshin && (
        <p className="text-sm font-medium text-muted-foreground border-l-2 border-primary pl-3">
          {activeHoshin.title}
        </p>
      )}

      {activeHoshin && (
        <div className="space-y-4">
          {activeHoshin.kpis.map((kpi, kIdx) => (
            <div key={kpi.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  KPI {kIdx + 1}
                </span>
                <button
                  onClick={() => removeKpi(kIdx)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Xoá
                </button>
              </div>

              <Input
                value={kpi.name}
                onChange={(e) => updateKpi(kIdx, { name: e.target.value })}
                placeholder="Tên KPI, ví dụ: Tỷ lệ giữ chân hội viên"
                className="font-medium"
              />

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Đơn vị
                  </label>
                  <Input
                    value={kpi.unit}
                    onChange={(e) => updateKpi(kIdx, { unit: e.target.value })}
                    placeholder="%"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Target
                  </label>
                  <Input
                    type="number"
                    value={kpi.targetValue || ''}
                    onChange={(e) =>
                      updateKpi(kIdx, {
                        targetValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="85"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Tần suất
                  </label>
                  <Select
                    value={kpi.frequency}
                    onValueChange={(v) =>
                      updateKpi(kIdx, {
                        frequency: v as XMatrixKpi['frequency'],
                      })
                    }
                  >
                    <SelectTrigger className="text-sm w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hàng tuần</SelectItem>
                      <SelectItem value="monthly">Hàng tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  Người chịu trách nhiệm
                </label>
                <Select
                  value={kpi.ownerUserId ?? 'unassigned'}
                  onValueChange={(v) => {
                    const m = members.find((mem) => mem.userId === v)
                    updateKpi(kIdx, {
                      ownerUserId: v === 'unassigned' ? null : v,
                      ownerName: m?.fullName ?? 'Chưa giao',
                    })
                  }}
                >
                  <SelectTrigger className="text-sm w-full">
                    <SelectValue placeholder="Chọn người..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Chưa giao</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.fullName} ({m.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              onClick={addKpi}
              disabled={atLimit}
            >
              + Thêm KPI
            </Button>
            {atLimit && (
              <p className="text-xs text-muted-foreground">
                Tối đa {LIMITS.MAX_KPIS_PER_HOSHIN} KPIs/Hoshin
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          ← Initiatives
        </Button>
        <Button
          onClick={onNext}
          disabled={!hasMinKpis}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          Review →
        </Button>
      </div>
    </div>
  )
}
