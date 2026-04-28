export interface CorrelationWarning {
  type: 'orphan_hoshin' | 'orphan_year_goal'
  targetId: string
  targetLabel: string
  message: string
}

type Strength = 'strong' | 'medium' | 'weak' | 'none'

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s
}

export function detectCorrelationOrphans(params: {
  yearGoals: Array<{ id: string; title: string }>
  hoshins: Array<{ id: string; title: string }>
  correlations: Record<string, Strength>
}): CorrelationWarning[] {
  const { yearGoals, hoshins, correlations } = params

  if (yearGoals.length === 0 || hoshins.length === 0) return []

  const warnings: CorrelationWarning[] = []

  hoshins.forEach((h, idx) => {
    const hasStrongLink = yearGoals.some(
      (y) => correlations[`${y.id}:${h.id}`] === 'strong',
    )
    if (!hasStrongLink) {
      warnings.push({
        type: 'orphan_hoshin',
        targetId: h.id,
        targetLabel: `H${idx + 1}: ${truncate(h.title || '(chưa có tên)', 60)}`,
        message:
          'Hoshin này có vẻ không phục vụ Year Goal nào — đây có thực sự là Hoshin breakthrough?',
      })
    }
  })

  yearGoals.forEach((y, idx) => {
    const hasStrongLink = hoshins.some(
      (h) => correlations[`${y.id}:${h.id}`] === 'strong',
    )
    if (!hasStrongLink) {
      warnings.push({
        type: 'orphan_year_goal',
        targetId: y.id,
        targetLabel: `Y${idx + 1}: ${truncate(y.title || '(chưa có tên)', 60)}`,
        message:
          'Year Goal này chưa có Hoshin nào driving — năm nay không có chiến lược cho mục tiêu này?',
      })
    }
  })

  return warnings
}
