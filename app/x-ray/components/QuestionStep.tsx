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
        <div className="text-4xl">{meta.icon}</div>
        <h2 className="text-xl font-semibold">{meta.label}</h2>
        <p className="text-sm text-muted-foreground">{meta.description}</p>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="space-y-3">
            <div>
              <p className="text-sm font-medium leading-relaxed">
                {qIdx + 1}. {q.question}
              </p>
              {q.helpText && (
                <p className="mt-1 text-xs text-muted-foreground">
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
                      'w-full rounded-lg border px-4 py-3 text-left text-sm transition-all duration-150',
                      'hover:border-primary/60 hover:bg-primary/5',
                      isSelected
                        ? 'border-primary bg-primary/10 font-medium text-primary'
                        : 'border-border bg-card'
                    )}
                  >
                    <span
                      className={cn(
                        'mr-3 inline-block h-5 w-5 rounded-full border-2 align-middle transition-colors',
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      )}
                    />
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
          <Button variant="outline" onClick={onBack} className="flex-1">
            ← Quay lại
          </Button>
        )}
        <Button onClick={onNext} disabled={!allAnswered} className="flex-1">
          Tiếp theo →
        </Button>
      </div>
    </div>
  )
}
