'use client'

import { useMemo } from 'react'
import { calcCompleteness, validateXMatrix } from '@/lib/x-matrix/utils'
import type { XMatrixData } from '@/lib/x-matrix/types'
import type { XMatrixCanvasData } from './CanvasContext'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
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

export function useCanvasValidation(data: XMatrixCanvasData): ValidationResult {
  return useMemo(() => {
    const legacy = toLegacyData(data)
    const errors = validateXMatrix(legacy)
    const completeness = calcCompleteness(legacy)
    const isValid = errors.length === 0

    return {
      isValid,
      errors,
      completeness,
      canSubmit: isValid && completeness >= 80,
    }
  }, [data])
}
