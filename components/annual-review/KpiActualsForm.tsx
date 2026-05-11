'use client'

import type { ReviewKpi } from '@/lib/annual-review/queries'
import type { KpiActualEntry } from '@/lib/annual-review/types'

interface Props {
  kpis: ReviewKpi[]
  actuals: KpiActualEntry[]
  onChange: (next: KpiActualEntry[]) => void
  disabled?: boolean
}

export function KpiActualsForm({ kpis, actuals, onChange, disabled }: Props) {
  const actualMap = new Map(actuals.map((a) => [a.kpiId, a]))

  const updateActual = (
    kpiId: string,
    field: 'actualValue' | 'note',
    val: string,
  ) => {
    const kpi = kpis.find((k) => k.id === kpiId)
    if (!kpi) return

    const existing = actualMap.get(kpiId)

    if (field === 'actualValue') {
      const parsed = val === '' ? NaN : Number(val)
      const actualValue = isNaN(parsed) ? 0 : parsed
      const achievementPct =
        kpi.targetValue > 0
          ? Math.round((actualValue / kpi.targetValue) * 100 * 10) / 10
          : 0

      const updated: KpiActualEntry = {
        kpiId,
        actualValue,
        achievementPct,
        note: existing?.note,
      }

      const next = actuals.filter((a) => a.kpiId !== kpiId).concat(updated)
      onChange(next)
    } else if (field === 'note') {
      // Note can't exist without an actual value. The form hides the
      // note input until actualValue is entered, so this is just a guard.
      if (!existing) return
      const updated: KpiActualEntry = { ...existing, note: val }
      const next = actuals.filter((a) => a.kpiId !== kpiId).concat(updated)
      onChange(next)
    }
  }

  const colorForPct = (pct: number): string => {
    if (pct >= 100) return 'text-kpi-healthy-fg bg-kpi-healthy'
    if (pct >= 70) return 'text-kpi-attention-fg bg-kpi-attention'
    return 'text-kpi-warning-fg bg-kpi-warning'
  }

  if (kpis.length === 0) {
    return (
      <section className="card-brutal p-6">
        <h2 className="font-display font-bold text-2xl text-ink mb-2">
          KPI Actuals
        </h2>
        <p className="text-text-3">X-Matrix này không có KPI active.</p>
      </section>
    )
  }

  return (
    <section className="card-brutal p-6">
      <header className="mb-4">
        <span className="nb-sticker">KPI ACTUALS</span>
        <h2 className="font-display font-bold text-2xl text-ink mt-2">
          Đối chiếu KPI thực tế
        </h2>
        <p className="text-text-2 text-sm mt-1">
          Nhập giá trị thực tế cuối năm. Achievement % auto-compute. KPI &lt; 70%
          sẽ flag carry-over ở bước sau.
        </p>
      </header>

      <div className="space-y-3">
        {kpis.map((kpi) => {
          const actual = actualMap.get(kpi.id)
          const pct = actual?.achievementPct ?? 0
          const hasValue = actual !== undefined

          return (
            <div
              key={kpi.id}
              className="border-2 border-ink p-4 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-start"
            >
              <div>
                <div className="font-display font-bold text-ink">{kpi.name}</div>
                <div className="text-text-3 text-xs">
                  Target: {kpi.targetValue} {kpi.unit ?? ''} · {kpi.frequency}
                </div>
              </div>

              <div>
                <label className="block">
                  <span className="text-xs text-text-3">Actual</span>
                  <input
                    type="number"
                    value={actual?.actualValue ?? ''}
                    onChange={(e) =>
                      updateActual(kpi.id, 'actualValue', e.target.value)
                    }
                    disabled={disabled}
                    placeholder="0"
                    className="input-brutal w-32 font-mono text-sm"
                    step="any"
                  />
                </label>
              </div>

              <div
                className={`px-3 py-2 border-2 border-ink min-w-[80px] text-center font-mono font-bold text-sm ${
                  hasValue ? colorForPct(pct) : 'text-text-3'
                }`}
              >
                {hasValue ? `${pct}%` : '—'}
              </div>

              {hasValue && (
                <div className="md:col-span-3">
                  <label className="block">
                    <span className="text-xs text-text-3">Note (tuỳ chọn)</span>
                    <input
                      type="text"
                      value={actual?.note ?? ''}
                      onChange={(e) =>
                        updateActual(kpi.id, 'note', e.target.value)
                      }
                      disabled={disabled}
                      placeholder="Vì sao đạt/không đạt?"
                      className="input-brutal w-full text-sm"
                      maxLength={500}
                    />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
