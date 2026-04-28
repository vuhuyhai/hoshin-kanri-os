'use client'

import { Fragment, useState } from 'react'
import { toast } from 'sonner'
import { EducationalTooltip } from './EducationalTooltip'
import { CoachPopover } from './CoachPopover'
import {
  useCanvas,
  getCorrelation,
  makeCorrelationKey,
  setCorrelationOptimistic,
  type CorrelationStrength,
} from './state/CanvasContext'
import { useCanvasValidation } from './state/useCanvasValidation'
import { cn } from '@/lib/utils'

const CYCLE_ORDER: CorrelationStrength[] = ['none', 'strong', 'medium', 'weak']

function nextStrength(current: CorrelationStrength): CorrelationStrength {
  const idx = CYCLE_ORDER.indexOf(current)
  return CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length]
}

const STRENGTH_SYMBOLS: Record<CorrelationStrength, string> = {
  strong: '\u25CF',
  medium: '\u25D0',
  weak: '\u25CB',
  none: '',
}

const STRENGTH_LABELS: Record<CorrelationStrength, string> = {
  strong: 'mạnh',
  medium: 'vừa',
  weak: 'yếu',
  none: 'không liên kết',
}

interface CenterXProps {
  xMatrixId?: string
  canEdit?: boolean
}

export function CenterX({ xMatrixId, canEdit = false }: CenterXProps) {
  const { state, dispatch } = useCanvas()
  const { yearGoals, hoshins } = state.data
  const { correlations, correlationsLoading } = state.ui
  const { warnings } = useCanvasValidation(state.data, correlations)
  const [activeCoachKey, setActiveCoachKey] = useState<string | null>(null)

  const editable = canEdit && !!xMatrixId && !correlationsLoading

  const orphanYearGoalIds = new Set(
    warnings
      .filter((w) => w.type === 'orphan_year_goal')
      .map((w) => w.targetId),
  )
  const orphanHoshinIds = new Set(
    warnings.filter((w) => w.type === 'orphan_hoshin').map((w) => w.targetId),
  )

  // year_goal_id is synthesized from index until XMatrixYearGoal carries
  // a stable id of its own. Reordering year goals will desync existing
  // correlation rows — guard the UI so reorder stays disabled until
  // yearGoals gain ids.
  const yearGoalsWithId = yearGoals.map((g, i) => ({
    id: `y${i}`,
    title: g.title || `Y${i + 1}`,
    isOrphan: orphanYearGoalIds.has(`y${i}`),
  }))

  async function handleCellClick(yearGoalId: string, hoshinId: string) {
    if (!editable || !xMatrixId) return
    const current = getCorrelation(correlations, yearGoalId, hoshinId)
    const next = nextStrength(current)
    const result = await setCorrelationOptimistic(dispatch, state.ui, {
      xMatrixId,
      yearGoalId,
      hoshinId,
      strength: next,
    })
    if (!result.ok) {
      toast.error(result.error ?? 'Không lưu được correlation. Thử lại nhé.')
      return
    }
    const cellKey = makeCorrelationKey(yearGoalId, hoshinId)
    if (next === 'strong') {
      setActiveCoachKey(cellKey)
    } else if (activeCoachKey === cellKey) {
      setActiveCoachKey(null)
    }
  }

  const header = (
    <div className="mb-2 flex items-center justify-center gap-1">
      <p className="heading-overline text-center text-xs">Ma trận liên kết</p>
      <EducationalTooltip
        title="Ma trận liên kết để làm gì?"
        content={
          <>
            <p className="mb-2">Bạn sẽ đánh dấu mức độ Hoshin liên kết với Year Goal.</p>
            <ul className="space-y-1 text-[11px]">
              <li>● <strong>Mạnh:</strong> Hoshin này đóng góp lớn cho Year Goal</li>
              <li>◐ <strong>Vừa:</strong> Đóng góp một phần</li>
              <li>○ <strong>Yếu:</strong> Liên quan ít</li>
              <li>(trống) <strong>Không:</strong> Không liên quan</li>
            </ul>
            <p className="mt-2 text-[11px] italic text-text-3">
              Nếu một Hoshin không có ● với bất kỳ Year Goal nào → có thể đó không phải Hoshin thật.
            </p>
            {!canEdit && (
              <p className="mt-2 text-[11px] text-text-3">
                Chỉ CEO và Manager edit được correlation matrix.
              </p>
            )}
          </>
        }
      />
    </div>
  )

  if (yearGoals.length === 0 || hoshins.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <span className="nb-sticker text-center text-xs">
            Thêm Year Goals và Hoshins để bắt đầu xếp correlation
          </span>
        </div>
      </div>
    )
  }

  const cols = yearGoalsWithId.length
  const rows = hoshins.length

  return (
    <div className="flex h-full flex-col">
      {header}
      <div
        role="grid"
        aria-label="Ma trận liên kết Year Goal và Hoshin"
        aria-busy={correlationsLoading}
        className="grid flex-1 gap-1"
        style={{
          gridTemplateColumns: `40px repeat(${cols}, 1fr)`,
          gridTemplateRows: `24px repeat(${rows}, 1fr)`,
        }}
      >
        <div />
        {yearGoalsWithId.map((y) => {
          const label =
            y.title.length > 8 ? `${y.title.slice(0, 8)}…` : y.title
          return (
            <div
              key={y.id}
              role="columnheader"
              className={cn(
                'truncate py-1 text-center font-mono text-xs',
                y.isOrphan && 'text-amber-600',
              )}
              title={
                y.isOrphan
                  ? 'Orphan — chưa có liên kết ● với Hoshin nào'
                  : y.title
              }
            >
              {y.isOrphan ? `• ${label}` : label}
            </div>
          )
        })}

        {hoshins.map((h, hIdx) => {
          const hoshinLabel = h.title || `H${hIdx + 1}`
          const isOrphan = orphanHoshinIds.has(h.id)
          return (
            <Fragment key={h.id}>
              <div
                role="rowheader"
                className={cn(
                  'self-center truncate text-center font-mono text-xs',
                  isOrphan && 'text-amber-600',
                )}
                title={
                  isOrphan
                    ? 'Orphan — chưa có liên kết ● với Year Goal nào'
                    : hoshinLabel
                }
              >
                {isOrphan ? `• H${hIdx + 1}` : `H${hIdx + 1}`}
              </div>
              {yearGoalsWithId.map((y, yIdx) => {
                const cellKey = makeCorrelationKey(y.id, h.id)
                const strength = getCorrelation(correlations, y.id, h.id)
                const symbol = STRENGTH_SYMBOLS[strength]
                const isWeak = strength === 'weak'
                const showCoach =
                  activeCoachKey === cellKey && strength === 'strong'
                const isLastColumn = yIdx === yearGoalsWithId.length - 1
                return (
                  <div key={cellKey} className="relative">
                    <button
                      type="button"
                      role="gridcell"
                      disabled={!editable}
                      aria-label={`Year Goal ${y.title}, Hoshin ${hoshinLabel}, hiện tại ${STRENGTH_LABELS[strength]}`}
                      onClick={() => handleCellClick(y.id, h.id)}
                      className={cn(
                        'flex h-full min-h-[44px] w-full min-w-[44px] items-center justify-center',
                        'rounded-[var(--radius-md)] border-2 border-ink bg-[var(--bg)]',
                        'font-display text-[28px] font-bold leading-none',
                        'transition-all duration-100 ease-[var(--ease-nb)]',
                        isWeak ? 'text-text-2' : 'text-ink',
                        editable && [
                          'cursor-pointer',
                          'hover:-translate-x-px hover:-translate-y-px hover:bg-accent-yellow hover:shadow-[var(--shadow-sm)]',
                          'active:translate-x-0 active:translate-y-0 active:shadow-none',
                        ],
                        correlationsLoading && 'cursor-wait opacity-40',
                        !editable &&
                          !correlationsLoading &&
                          'cursor-default opacity-90',
                      )}
                    >
                      {symbol}
                    </button>
                    {showCoach && (
                      <CoachPopover
                        yearGoalId={y.id}
                        hoshinId={h.id}
                        yearGoalTitle={y.title}
                        hoshinTitle={hoshinLabel}
                        visionContext={
                          state.data.vision.trim() || undefined
                        }
                        placement={isLastColumn ? 'below' : 'right'}
                        onClose={() => setActiveCoachKey(null)}
                      />
                    )}
                  </div>
                )
              })}
            </Fragment>
          )
        })}
      </div>
      {!canEdit && !correlationsLoading && (
        <p className="mt-1 text-center text-[11px] italic text-text-3">
          Chỉ CEO và Manager edit được correlation matrix
        </p>
      )}
    </div>
  )
}
