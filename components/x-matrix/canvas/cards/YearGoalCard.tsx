'use client'

import { useState } from 'react'
import {
  useCanEdit,
  useCanvas,
  type XMatrixYearGoal,
} from '../state/CanvasContext'
import { YearGoalEditModal } from '../modals/YearGoalEditModal'

interface YearGoalCardProps {
  goal: XMatrixYearGoal | null
  slotIndex: number
}

export function YearGoalCard({ goal, slotIndex }: YearGoalCardProps) {
  const { dispatch } = useCanvas()
  const canEdit = useCanEdit()
  const [modalOpen, setModalOpen] = useState(false)

  const handleEmptyClick = () => {
    if (!canEdit) return
    dispatch({
      type: 'ADD_YEAR_GOAL',
      payload: { title: '', description: '' },
    })
  }

  const handleFilledClick = () => {
    if (!canEdit) return
    setModalOpen(true)
  }

  if (!goal) {
    if (!canEdit) {
      return (
        <div
          className="flex h-[60px] w-full items-center justify-center border-2 border-dashed border-[var(--text-3)] bg-[var(--bg)]/40 p-2"
          role="presentation"
        >
          <span className="font-mono text-[10px] uppercase tracking-wider italic text-[var(--text-3)]">
            Chưa có mục tiêu năm #{slotIndex + 1}
          </span>
        </div>
      )
    }
    return (
      <button
        type="button"
        onClick={handleEmptyClick}
        className="flex h-[60px] w-full items-center justify-center border-2 border-dashed border-[var(--text-3)] bg-[var(--bg)]/40 p-2 transition-colors hover:bg-[var(--bg)]/70"
      >
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
          + Mục tiêu năm #{slotIndex + 1}
        </span>
      </button>
    )
  }

  const hasTitle = !!goal.title?.trim()

  return (
    <>
      <button
        type="button"
        onClick={canEdit ? handleFilledClick : undefined}
        aria-disabled={!canEdit}
        className={`card-brutal flex h-[60px] w-full flex-col items-start gap-0.5 p-2 text-left transition-shadow ${
          canEdit
            ? 'cursor-pointer hover:shadow-[var(--shadow-lg)]'
            : 'cursor-default'
        }`}
      >
        <div className="flex w-full items-center gap-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
            Y{slotIndex + 1}
          </span>
          {hasTitle ? (
            <h3 className="truncate text-sm font-semibold leading-tight text-ink">
              {goal.title}
            </h3>
          ) : (
            <span className="truncate text-sm italic text-[var(--text-3)]">
              {canEdit ? '(Chưa đặt tên — click để sửa)' : '(Chưa đặt tên)'}
            </span>
          )}
        </div>
        {goal.description && (
          <p className="w-full truncate text-xs text-[var(--text-2)]">
            {goal.description}
          </p>
        )}
      </button>
      {canEdit && (
        <YearGoalEditModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          slotIndex={slotIndex}
        />
      )}
    </>
  )
}
