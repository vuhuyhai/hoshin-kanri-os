import type { XMatrixData } from './types'

// ============================================================
// ID generators
// ============================================================
export function genHoshinId(idx: number): string {
  return `hoshin_${idx + 1}_${Date.now()}`
}

export function genInitId(hoshinIdx: number, initIdx: number): string {
  return `init_h${hoshinIdx + 1}_${initIdx + 1}_${Date.now()}`
}

export function genKpiId(hoshinIdx: number, kpiIdx: number): string {
  return `kpi_h${hoshinIdx + 1}_${kpiIdx + 1}_${Date.now()}`
}

// ============================================================
// Validation — returns error messages
// ============================================================
export function validateXMatrix(data: XMatrixData): string[] {
  const errors: string[] = []

  if (!data.vision.trim()) {
    errors.push('Vision statement không được trống')
  }

  const filledGoals = data.yearGoals.filter((g) => g.trim().length > 0)
  if (filledGoals.length === 0) {
    errors.push('Cần ít nhất 1 mục tiêu năm')
  }

  if (data.hoshins.length === 0) {
    errors.push('Cần ít nhất 1 Hoshin')
  }

  for (const h of data.hoshins) {
    if (!h.title.trim()) {
      errors.push('Mỗi Hoshin phải có tên')
      break
    }
  }

  const hasKpi = data.hoshins.some((h) =>
    h.kpis.some((k) => k.name.trim() && k.unit.trim() && k.targetValue > 0)
  )
  if (!hasKpi) {
    errors.push('Cần ít nhất 1 KPI có tên, đơn vị và target')
  }

  return errors
}

// ============================================================
// Completeness — percentage for progress bar
// ============================================================
export function calcCompleteness(data: XMatrixData): number {
  let score = 0
  const total = 100

  // Vision: 20%
  if (data.vision.trim()) score += 10
  if (data.yearGoals.some((g) => g.trim())) score += 10

  // Hoshins: 30%
  const filledHoshins = data.hoshins.filter((h) => h.title.trim())
  if (filledHoshins.length > 0) score += 15
  if (filledHoshins.length >= 2) score += 15

  // Initiatives: 25%
  const totalInits = data.hoshins.reduce(
    (s, h) => s + h.initiatives.filter((i) => i.title.trim()).length,
    0
  )
  if (totalInits > 0) score += 12
  if (totalInits >= 3) score += 13

  // KPIs: 25%
  const totalKpis = data.hoshins.reduce(
    (s, h) =>
      s +
      h.kpis.filter((k) => k.name.trim() && k.unit.trim() && k.targetValue > 0)
        .length,
    0
  )
  if (totalKpis > 0) score += 12
  if (totalKpis >= 2) score += 13

  return Math.min(score, total)
}

// ============================================================
// Share slug generator
// ============================================================
export function generateShareSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  for (let i = 0; i < 8; i++) {
    slug += chars[Math.floor(Math.random() * chars.length)]
  }
  return slug
}
