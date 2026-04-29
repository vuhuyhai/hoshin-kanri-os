'use client'

import type {
  CarryOverEntry,
  CarryOverDecision,
} from '@/lib/annual-review/types'
import type { HoshinFlag } from '@/lib/annual-review/flagging'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface Props {
  flags: HoshinFlag[]
  decisions: CarryOverEntry[]
  onChange: (next: CarryOverEntry[]) => void
  disabled?: boolean
}

const DECISION_LABELS: Record<
  CarryOverDecision,
  { label: string; description: string; color: string }
> = {
  pending: {
    label: 'Chưa quyết',
    description: 'Cần quyết định',
    color: 'bg-bg-paper',
  },
  carry: {
    label: 'Carry',
    description: 'Đem sang năm sau giữ nguyên',
    color: 'bg-accent-yellow',
  },
  modify: {
    label: 'Modify',
    description: 'Đem sang nhưng sửa title/scope',
    color: 'bg-accent-cyan',
  },
  drop: {
    label: 'Drop',
    description: 'Bỏ, không carry',
    color: 'bg-accent-pink',
  },
}

export function CarryOverDecisions({
  flags,
  decisions,
  onChange,
  disabled,
}: Props) {
  const decisionMap = new Map(decisions.map((d) => [d.sourceHoshinId, d]))

  const updateDecision = (
    hoshinId: string,
    update: Partial<Omit<CarryOverEntry, 'sourceHoshinId'>>,
  ) => {
    const existing: CarryOverEntry = decisionMap.get(hoshinId) ?? {
      sourceHoshinId: hoshinId,
      decision: 'pending',
    }
    const updated: CarryOverEntry = { ...existing, ...update }
    const next = decisions
      .filter((d) => d.sourceHoshinId !== hoshinId)
      .concat(updated)
    onChange(next)
  }

  if (flags.length === 0) {
    return (
      <section className="card-brutal p-6">
        <h2 className="font-display font-bold text-2xl mb-2">
          Carry-over decisions
        </h2>
        <p className="text-text-3">X-Matrix này không có Hoshin nào.</p>
      </section>
    )
  }

  return (
    <section className="card-brutal p-6">
      <header className="mb-4">
        <span className="nb-sticker">CARRY-OVER</span>
        <h2 className="font-display font-bold text-2xl text-ink mt-2">
          Quyết định Hoshins
        </h2>
        <p className="text-text-2 text-sm mt-1">
          Hoshin có KPI &lt; 70% (red) auto-flag carry sang năm sau. Bạn quyết:
          carry / modify / drop.
        </p>
      </header>

      <div className="space-y-4">
        {flags.map((flag) => {
          const decision = decisionMap.get(flag.hoshinId)
          const currentDecision = decision?.decision ?? 'pending'
          const isFlagged = flag.shouldCarryOver

          return (
            <div
              key={flag.hoshinId}
              className={`border-2 border-ink p-4 ${
                isFlagged ? 'bg-red-50' : 'bg-bg-paper'
              }`}
            >
              <header className="flex items-start gap-2 mb-3">
                {isFlagged ? (
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-display font-bold text-ink">
                    {flag.hoshinTitle}
                  </h3>
                  {isFlagged ? (
                    <p className="text-red-700 text-xs mt-1">
                      {flag.redKpis.length} KPI &lt; 70%:{' '}
                      {flag.redKpis
                        .map((k) => `${k.kpiName} (${k.achievementPct}%)`)
                        .join(', ')}
                    </p>
                  ) : (
                    <p className="text-green-700 text-xs mt-1">
                      Đạt target — gợi ý drop natural
                    </p>
                  )}
                </div>
              </header>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {(Object.keys(DECISION_LABELS) as CarryOverDecision[]).map(
                  (d) => {
                    const config = DECISION_LABELS[d]
                    const isSelected = currentDecision === d
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          updateDecision(flag.hoshinId, { decision: d })
                        }
                        disabled={disabled}
                        className={`border-2 border-ink p-2 text-left transition-all ${
                          isSelected
                            ? `${config.color} font-bold shadow-[2px_2px_0_var(--ink)]`
                            : 'bg-white hover:bg-bg-paper'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <div className="font-display font-bold text-sm text-ink">
                          {config.label}
                        </div>
                        <div className="text-text-3 text-xs">
                          {config.description}
                        </div>
                      </button>
                    )
                  },
                )}
              </div>

              {currentDecision === 'modify' && (
                <div className="mb-2">
                  <label className="block">
                    <span className="text-xs text-text-3">
                      Title mới cho năm sau
                    </span>
                    <input
                      type="text"
                      value={decision?.modifiedTitle ?? ''}
                      onChange={(e) =>
                        updateDecision(flag.hoshinId, {
                          modifiedTitle: e.target.value,
                        })
                      }
                      disabled={disabled}
                      placeholder="VD: Tăng customer retention từ 70% → 85%"
                      className="input-brutal w-full text-sm"
                      maxLength={200}
                    />
                  </label>
                </div>
              )}

              {(currentDecision === 'carry' ||
                currentDecision === 'modify' ||
                currentDecision === 'drop') && (
                <div>
                  <label className="block">
                    <span className="text-xs text-text-3">Lý do (tuỳ chọn)</span>
                    <textarea
                      value={decision?.rationale ?? ''}
                      onChange={(e) =>
                        updateDecision(flag.hoshinId, {
                          rationale: e.target.value,
                        })
                      }
                      disabled={disabled}
                      placeholder="Vì sao quyết định này?"
                      className="input-brutal w-full text-sm min-h-[60px] resize-y"
                      maxLength={1000}
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
