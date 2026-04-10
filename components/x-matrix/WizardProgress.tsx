import { cn } from '@/lib/utils'
import type { WizardStep } from '@/lib/x-matrix/types'

const STEPS: { step: WizardStep; label: string; icon: string }[] = [
  { step: 1, label: 'Vision', icon: '🌟' },
  { step: 2, label: 'Hoshins', icon: '🎯' },
  { step: 3, label: 'Initiatives', icon: '⚡' },
  { step: 4, label: 'KPIs', icon: '📊' },
  { step: 5, label: 'Review', icon: '✅' },
]

interface WizardProgressProps {
  currentStep: WizardStep
  completeness: number
}

export function WizardProgress({
  currentStep,
  completeness,
}: WizardProgressProps) {
  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center">
        {STEPS.map((s, idx) => (
          <div key={s.step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all shrink-0',
                  s.step < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : s.step === currentStep
                      ? 'bg-primary/15 border-2 border-primary text-primary'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {s.step < currentStep ? '✓' : s.icon}
              </div>
              <span
                className={cn(
                  'text-xs hidden sm:block whitespace-nowrap',
                  s.step === currentStep
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 transition-colors',
                  s.step < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${completeness}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
          {completeness}%
        </span>
      </div>
    </div>
  )
}
