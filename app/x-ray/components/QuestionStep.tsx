'use client'

import { OPEX_PILLARS, getQuestionsForPillar } from '@/lib/x-ray/questions'
import type { OpexPillar } from '@/lib/x-ray/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuestionStepProps {
  pillar: OpexPillar
  answers: Record<string, number>
  onAnswer: (questionId: string, value: number) => void
  onNext: () => void
  onBack: () => void
  isFirstStep: boolean
}

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

  const allAnswered = questions.every((q) => answers[q.id] !== undefined)

  return (
    <div className="space-y-8">
      <div className="space-y-1 text-center">
        <div className="text-4xl" aria-hidden="true">{meta.icon}</div>
        <h2 className="font-display text-xl font-bold uppercase tracking-wider text-ink">
          {meta.label}
        </h2>
        <p className="font-body text-sm text-text-2">{meta.description}</p>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="space-y-3">
            <div>
              <p className="font-body text-base font-medium leading-relaxed text-ink">
                {qIdx + 1}. {q.question}
              </p>
              {q.helpText && (
                <p className="mt-1 font-body text-sm text-text-3">
                  {q.helpText}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              {q.options.map((option) => {
                const isSelected = answers[q.id] === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => onAnswer(q.id, option.value)}
                    className={cn(
                      'w-full text-left p-4 flex items-start gap-3',
                      'border-[2px] font-body text-base',
                      'transition-all duration-150 cursor-pointer min-h-[44px]',
                      isSelected
                        ? 'bg-accent-brand border-accent-brand text-white shadow-[3px_3px_0_#9e1f1e]'
                        : 'bg-bg-warm border-ink text-ink hover:bg-bg-muted-warm hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_#2C2B2B]'
                    )}
                  >
                    <span
                      className={cn(
                        'w-5 h-5 border-[2px] flex-shrink-0 mt-0.5 flex items-center justify-center',
                        isSelected
                          ? 'bg-white border-white'
                          : 'bg-bg-warm border-ink'
                      )}
                    >
                      {isSelected && (
                        <span className="text-accent-brand text-xs font-bold">✓</span>
                      )}
                    </span>
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        {!isFirstStep && (
          <Button variant="outline" onClick={onBack} className="flex-1 btn-brutal-secondary min-h-[44px]">
            ← Quay lại
          </Button>
        )}
        <Button onClick={onNext} disabled={!allAnswered} className="flex-1 btn-brutal-primary min-h-[44px]">
          Tiếp theo →
        </Button>
      </div>
    </div>
  )
}
