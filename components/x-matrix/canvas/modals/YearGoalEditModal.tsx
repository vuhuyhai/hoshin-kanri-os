'use client'

import { useState } from 'react'
import { useCanvas } from '../state/CanvasContext'
import { EditModalShell } from './EditModalShell'

interface YearGoalEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slotIndex: number
}

const TITLE_MAX = 80
const DESC_MAX = 200

export function YearGoalEditModal(props: YearGoalEditModalProps) {
  // Only mount the form while open — local state initializes from
  // context on each open and is discarded on close (no useEffect sync).
  if (!props.open) return null
  return <YearGoalEditModalForm {...props} />
}

function YearGoalEditModalForm({
  open,
  onOpenChange,
  slotIndex,
}: YearGoalEditModalProps) {
  const { state, dispatch } = useCanvas()
  const goal = state.data.yearGoals[slotIndex]

  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')

  const trimmedTitle = title.trim()
  const saveDisabled = trimmedTitle === ''

  const handleSave = () => {
    if (saveDisabled) return
    dispatch({
      type: 'UPDATE_YEAR_GOAL',
      payload: {
        index: slotIndex,
        patch: { title: trimmedTitle, description: description.trim() },
      },
    })
    onOpenChange(false)
  }

  return (
    <EditModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={`Sửa mục tiêu năm Y${slotIndex + 1}`}
      description="Mỗi mục tiêu năm là một kết quả cụ thể bạn muốn đạt được trong 12 tháng tới."
      onSave={handleSave}
      saveDisabled={saveDisabled}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ymg-title" className="field-label">
            Tiêu đề mục tiêu <span className="text-[var(--brand)]">*</span>
          </label>
          <input
            id="ymg-title"
            type="text"
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Đạt 10 tỷ doanh thu 2026"
            className="input-brutal"
            autoFocus
          />
          <div className="text-right font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
            {title.length}/{TITLE_MAX}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ymg-desc" className="field-label">
            Mô tả
          </label>
          <textarea
            id="ymg-desc"
            value={description}
            maxLength={DESC_MAX}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bối cảnh, lý do, hoặc cách đo lường mục tiêu này"
            rows={3}
            className="input-brutal resize-none"
          />
          <div className="text-right font-mono text-[10px] uppercase tracking-wider text-[var(--text-3)]">
            {description.length}/{DESC_MAX}
          </div>
        </div>
      </div>
    </EditModalShell>
  )
}
