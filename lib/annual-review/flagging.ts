import type { ReviewKpi } from './queries'
import type { KpiActualEntry } from './types'

export interface HoshinFlag {
  hoshinId: string
  hoshinTitle: string
  redKpis: Array<{ kpiId: string; kpiName: string; achievementPct: number }>
  shouldCarryOver: boolean
}

const RED_THRESHOLD = 70

export function flagHoshins(
  hoshins: Array<{ id: string; title: string }>,
  kpis: ReviewKpi[],
  actuals: KpiActualEntry[],
): HoshinFlag[] {
  const actualMap = new Map(actuals.map((a) => [a.kpiId, a]))

  return hoshins.map((hoshin) => {
    const linkedKpis = kpis.filter((k) => k.hoshinId === hoshin.id)
    const redKpis = linkedKpis
      .map((k) => {
        const actual = actualMap.get(k.id)
        if (!actual) return null
        if (actual.achievementPct >= RED_THRESHOLD) return null
        return {
          kpiId: k.id,
          kpiName: k.name,
          achievementPct: actual.achievementPct,
        }
      })
      .filter(
        (
          x,
        ): x is { kpiId: string; kpiName: string; achievementPct: number } =>
          x !== null,
      )

    return {
      hoshinId: hoshin.id,
      hoshinTitle: hoshin.title,
      redKpis,
      shouldCarryOver: redKpis.length > 0,
    }
  })
}
