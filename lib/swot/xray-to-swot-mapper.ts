import type { XRayResult, ScoreLevel } from '@/lib/x-ray/types'

export interface XRayDimensionSeed {
  dimensionId: string
  dimensionLabel: string
  score: number
  level: ScoreLevel
  swotQuadrant: 'S' | 'W' | 'O' | 'T' | null
}

export interface SwotHintGroup {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

export interface XRaySeedContext {
  xrayResultId: string
  overallScore: number
  overallLevel: ScoreLevel
  dimensions: XRayDimensionSeed[]
  swotHints: SwotHintGroup
  summaryForAI: string
}

function scoreToQuadrant(score: number): 'S' | 'W' | 'T' | null {
  if (score >= 70) return 'S'
  if (score >= 50) return null
  if (score >= 30) return 'W'
  return 'T'
}

const LEVEL_LABELS: Record<ScoreLevel, string> = {
  critical: 'nguy hiểm', weak: 'yếu', moderate: 'trung bình', strong: 'tốt',
}

export function getSwotQuadrantLabel(quadrant: 'S' | 'W' | 'O' | 'T' | null): string {
  if (!quadrant) return ''
  return { S: 'Điểm mạnh', W: 'Điểm yếu', O: 'Cơ hội', T: 'Thách thức' }[quadrant]
}

export function mapXRayToSwotSeed(
  resultId: string,
  xrayResult: XRayResult,
): XRaySeedContext {
  const dimensions: XRayDimensionSeed[] = xrayResult.pillarScores.map((p) => ({
    dimensionId: p.pillar,
    dimensionLabel: p.label,
    score: p.score,
    level: p.level,
    swotQuadrant: scoreToQuadrant(p.score),
  }))

  const sorted = [...dimensions].sort((a, b) => b.score - a.score)
  const fmt = (d: XRayDimensionSeed) => `${d.dimensionLabel} (${d.score} điểm)`

  const strengths = sorted.filter((d) => d.swotQuadrant === 'S').slice(0, 3).map(fmt)
  const weakDims = sorted.filter((d) => d.swotQuadrant === 'W').slice(0, 3).map(fmt)
  const threatDims = sorted.filter((d) => d.swotQuadrant === 'T').slice(0, 2).map(fmt)

  return {
    xrayResultId: resultId,
    overallScore: xrayResult.overallScore,
    overallLevel: xrayResult.overallLevel,
    dimensions,
    swotHints: {
      strengths: strengths.slice(0, 3),
      weaknesses: weakDims.slice(0, 3),
      opportunities: [],
      threats: threatDims.slice(0, 2),
    },
    summaryForAI: buildSummary(xrayResult, strengths, weakDims, threatDims),
  }
}

function buildSummary(
  result: XRayResult,
  strengths: string[],
  weaknesses: string[],
  threats: string[],
): string {
  const level = LEVEL_LABELS[result.overallLevel]
  const parts = [`Doanh nghiệp đạt ${result.overallScore}/100 điểm (mức ${level}).`]

  if (strengths.length > 0)
    parts.push(`Điểm mạnh: ${strengths.slice(0, 2).join(', ')}.`)

  const allWeak = [...weaknesses, ...threats]
  if (allWeak.length > 0)
    parts.push(`Điểm yếu: ${allWeak.slice(0, 3).join(', ')}.`)

  if (result.overallScore >= 70)
    parts.push('Tổng thể doanh nghiệp có nền tảng vận hành tốt, cần duy trì và tối ưu.')
  else if (result.overallScore >= 50)
    parts.push('Tổng thể ở mức trung bình, cần cải thiện các điểm yếu trọng yếu.')
  else
    parts.push('Tổng thể cần cải thiện nghiêm túc nhiều mặt vận hành.')

  return parts.join(' ')
}
