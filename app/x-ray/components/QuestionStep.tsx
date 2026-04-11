'use client'

import { OPEX_PILLARS, getQuestionsForPillar, PILLAR_ORDER } from '@/lib/x-ray/questions'
import type { OpexPillar } from '@/lib/x-ray/types'
import { cn } from '@/lib/utils'

interface QuestionStepProps {
  pillar: OpexPillar
  answers: Record<string, number>
  onAnswer: (questionId: string, value: number) => void
  onNext: () => void
  onBack: () => void
  isFirstStep: boolean
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function QuestionStep({
  pillar,
  answers,
  onAnswer,
  onNext,
  onBack,
  isFirstStep,
}: QuestionStepProps) {
  const meta = OPEX_PILLARS[pillar]
  const questions = getQuestionsForPillar(pillar)
  const pillarIndex = PILLAR_ORDER.indexOf(pillar)
  const allAnswered = questions.every((q) => answers[q.id] !== undefined)

  return (
    <div>
      <span className="badge-brutal badge-ink mb-4 inline-block">
        {pillarIndex + 1}/{PILLAR_ORDER.length} · {meta.label}
      </span>

      {questions.map((q, qIdx) => (
        <div key={q.id}>
          {qIdx > 0 && <div className="border-b border-bg-muted-warm my-6" />}

          <p className="font-display font-bold text-lg text-ink mb-2">
            {qIdx + 1}. {q.question}
          </p>
          {q.helpText && (
            <p className="font-body text-[15px] text-text-3 mb-4">
              {q.helpText}
            </p>
          )}

          <div className="grid gap-2">
            {q.options.map((option, optIdx) => {
              const isSelected = answers[q.id] === option.value
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-start gap-3 p-4 cursor-pointer min-h-[52px]',
                    'transition-all duration-100',
                    isSelected
                      ? 'bg-accent-brand text-white border-2 border-ink shadow-brutal-sm'
                      : 'bg-white border border-bg-muted-warm hover:bg-bg-muted-warm'
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={option.value}
                    checked={isSelected}
                    onChange={() => onAnswer(q.id, option.value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      'w-6 h-6 flex-shrink-0 flex items-center justify-center border-2',
                      'font-display font-bold text-xs',
                      isSelected
                        ? 'bg-ink text-white border-ink'
                        : 'border-ink'
                    )}
                  >
                    {isSelected ? '✓' : LETTERS[optIdx]}
                  </span>
                  <span className="font-body text-[18px] leading-[1.75]">
                    {option.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      ))}

      <button
        onClick={onNext}
        disabled={!allAnswered}
        className="btn-primary w-full justify-center mt-6"
      >
        Tiếp theo →
      </button>

      {!isFirstStep && (
        <button
          onClick={onBack}
          className="font-body text-[15px] text-text-3 hover:text-ink mt-3 inline-block"
        >
          ← Quay lại
        </button>
      )}
    </div>
  )
}
