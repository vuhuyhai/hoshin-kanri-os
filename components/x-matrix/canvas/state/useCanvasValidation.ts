'use client'

import { useMemo } from 'react'
import { calcCompleteness, validateXMatrix } from '@/lib/x-matrix/utils'
import {
  detectCorrelationOrphans,
  type CorrelationWarning,
} from '@/lib/x-matrix/correlation-warnings'
import type { XMatrixData } from '@/lib/x-matrix/types'
import type { CorrelationsMap, XMatrixCanvasData } from './CanvasContext'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: CorrelationWarning[]
  completeness: number
  canSubmit: boolean
}

function toLegacyData(data: XMatrixCanvasData): XMatrixData {
  return {
    vision: data.vision,
    yearGoals: data.yearGoals.map((g) => g.title),
    hoshins: data.hoshins,
  }
}

export function useCanvasValidation(
  data: XMatrixCanvasData,
  correlations?: CorrelationsMap,
): ValidationResult {
  return useMemo(() => {
    const legacy = toLegacyData(data)
    const errors = validateXMatrix(legacy)
    const completeness = calcCompleteness(legacy)
    const isValid = errors.length === 0

    const warnings = detectCorrelationOrphans({
      yearGoals: data.yearGoals.map((g, i) => ({ id: `y${i}`, title: g.title })),
      hoshins: data.hoshins.map((h) => ({ id: h.id, title: h.title })),
      correlations: correlations ?? {},
    })

    return {
      isValid,
      errors,
      warnings,
      completeness,
      canSubmit: isValid && completeness >= 80,
    }
  }, [data, correlations])
}
