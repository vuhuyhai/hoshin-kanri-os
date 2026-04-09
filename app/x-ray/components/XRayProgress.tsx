'use client'

import { XRAY_DIMENSIONS } from '@/lib/x-ray/questions'

interface XRayProgressProps {
  currentStep: number
}

export function XRayProgress({ currentStep }: XRayProgressProps) {
  const totalSteps = XRAY_DIMENSIONS.length + 1
  const progress = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="w-full space-y-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {currentStep < XRAY_DIMENSIONS.length
            ? `${XRAY_DIMENSIONS[currentStep].icon} ${XRAY_DIMENSIONS[currentStep].name}`
            : '📧 Nhận báo cáo'}
        </span>
        <span>
          {currentStep + 1}/{totalSteps}
        </span>
      </div>

      <div className="mt-1 flex gap-1.5">
        {XRAY_DIMENSIONS.map((dim, idx) => (
          <div
            key={dim.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              idx < currentStep
                ? 'bg-primary'
                : idx === currentStep
                  ? 'bg-primary/60'
                  : 'bg-muted'
            }`}
          />
        ))}
        <div
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            currentStep >= XRAY_DIMENSIONS.length ? 'bg-primary/60' : 'bg-muted'
          }`}
        />
      </div>
    </div>
  )
}
