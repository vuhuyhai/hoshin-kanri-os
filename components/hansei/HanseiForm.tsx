'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { postJson, FetchJsonError } from '@/lib/http/fetch-json'
import type { RedStreakKpi } from '@/lib/hansei/types'

interface HanseiFormProps {
  redStreak: RedStreakKpi
  weekStart: string
  onSubmitted: () => void
  onCancel: () => void
}

const MIN_LEN = 30
const MAX_LEN = 1000

export function HanseiForm({
  redStreak,
  weekStart,
  onSubmitted,
  onCancel,
}: HanseiFormProps) {
  const [whyRed, setWhyRed] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const whyRedLen = whyRed.length
  const nextActionLen = nextAction.length
  const canSubmit =
    whyRedLen >= MIN_LEN && nextActionLen >= MIN_LEN && !submitting

  const pct = redStreak.kpi_target
    ? Math.round((redStreak.current_week_value / redStreak.kpi_target) * 100)
    : 0

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await postJson('/api/hansei/create', {
        kpi_id: redStreak.kpi_id,
        week_start: weekStart,
        streak_weeks: redStreak.streak_weeks,
        why_red: whyRed,
        next_action: nextAction,
      })
      toast.success('Đã lưu hansei')
      onSubmitted()
    } catch (err) {
      const message =
        err instanceof FetchJsonError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Lỗi lưu hansei'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="card-brutal p-6">
      <header className="mb-4">
        <span className="nb-sticker">HANSEI</span>
        <h2 className="font-display font-bold text-2xl text-ink mt-2">
          {redStreak.kpi_name}
        </h2>
        <p className="text-text-2 text-sm mt-1">
          Đỏ {redStreak.streak_weeks} tuần liên tiếp — tuần này{' '}
          {redStreak.current_week_value}
          {redStreak.kpi_unit ? ` ${redStreak.kpi_unit}` : ''} / target{' '}
          {redStreak.kpi_target}
          {redStreak.kpi_unit ? ` ${redStreak.kpi_unit}` : ''} ={' '}
          <strong style={{ color: 'var(--brand)' }}>{pct}%</strong>
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block">
            <span className="font-display font-bold text-sm text-ink">
              Tại sao đỏ?
            </span>
            <span className="block text-text-3 text-xs mt-0.5">
              Phân tích nguyên nhân gốc — không justify, focus sự thật.
            </span>
            <textarea
              value={whyRed}
              onChange={(e) => setWhyRed(e.target.value)}
              disabled={submitting}
              placeholder="VD: feature X chưa launch, team thiếu Y resource, marketing channel Z dropoff..."
              className="input-brutal mt-2 w-full min-h-[140px] resize-y font-body text-sm"
              maxLength={MAX_LEN}
            />
            <div className="flex justify-between text-xs mt-1">
              <span
                style={{
                  color:
                    whyRedLen >= MIN_LEN
                      ? 'var(--text-2)'
                      : 'var(--brand)',
                }}
              >
                {whyRedLen}/{MIN_LEN} (tối thiểu)
              </span>
              <span className="text-text-3">
                {whyRedLen}/{MAX_LEN}
              </span>
            </div>
          </label>
        </div>

        <div>
          <label className="block">
            <span className="font-display font-bold text-sm text-ink">
              Làm gì khác?
            </span>
            <span className="block text-text-3 text-xs mt-0.5">
              Hành động cụ thể tuần tới — verb + object + deadline.
            </span>
            <textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              disabled={submitting}
              placeholder="VD: chạy A/B test landing page tuần tới, hire 1 sales Q1, sprint 2 tuần fix conversion funnel..."
              className="input-brutal mt-2 w-full min-h-[140px] resize-y font-body text-sm"
              maxLength={MAX_LEN}
            />
            <div className="flex justify-between text-xs mt-1">
              <span
                style={{
                  color:
                    nextActionLen >= MIN_LEN
                      ? 'var(--text-2)'
                      : 'var(--brand)',
                }}
              >
                {nextActionLen}/{MIN_LEN} (tối thiểu)
              </span>
              <span className="text-text-3">
                {nextActionLen}/{MAX_LEN}
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-brutal-primary"
        >
          {submitting ? 'Đang lưu...' : 'Lưu hansei'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="btn-brutal-secondary"
        >
          Đóng
        </button>
      </div>
    </section>
  )
}
