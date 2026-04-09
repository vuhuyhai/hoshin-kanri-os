'use client'

import { XRAY_DIMENSIONS } from '@/lib/x-ray/questions'
import type { DimensionId, XRayAnswers } from '@/lib/x-ray/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuestionStepProps {
  dimensionId: DimensionId
  answers: XRayAnswers
  onAnswer: (questionId: string, value: 1 | 2 | 3 | 4) => void
  onNext: () => void
  onBack: () => void
  isFirstStep: boolean
}

export function QuestionStep({
  dimensionId,
  answers,
  onAnswer,
  onNext,
  onBack,
  isFirstStep,
}: QuestionStepProps) {
  const dimension = XRAY_DIMENSIONS.find((d) => d.id === dimensionId)
  if (!dimension) return null

  const allAnswered = dimension.questions.every(
    (q) => answers[q.id] !== undefined
  )

  return (
    <div className="space-y-8">
      <div className="space-y-1 text-center">
        <div className="text-4xl">{dimension.icon}</div>
        <h2 className="text-xl font-semibold">{dimension.name}</h2>
        <p className="text-sm text-muted-foreground">{dimension.description}</p>
      </div>

      <div className="space-y-6">
        {dimension.questions.map((question, qIdx) => (
          <div key={question.id} className="space-y-3">
            <div>
              <p className="text-sm font-medium leading-relaxed">
                {qIdx + 1}. {question.text}
              </p>
              {question.helpText && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {question.helpText}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => onAnswer(question.id, option.value)}
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
