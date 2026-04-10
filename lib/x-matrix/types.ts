// ============================================================
// LIMITS — Hoshin Kanri discipline
// ============================================================
export const LIMITS = {
  MAX_YEAR_GOALS: 3,
  MAX_HOSHINS: 5,
  MAX_INITIATIVES_PER_HOSHIN: 3,
  MAX_KPIS_PER_HOSHIN: 2,
} as const

// ============================================================
// Wizard step
// ============================================================
export type WizardStep = 1 | 2 | 3 | 4 | 5

// ============================================================
// Data structures
// ============================================================
export interface XMatrixKpi {
  id: string
  name: string
  unit: string
  targetValue: number
  ownerUserId: string | null
  ownerName: string
  frequency: 'weekly' | 'monthly'
  deptLevel: 'company' | 'dept'
}

export interface XMatrixInitiative {
  id: string
  title: string
  timeframe: '30d' | '60d' | '90d'
}

export interface XMatrixHoshin {
  id: string
  title: string
  description: string
  initiatives: XMatrixInitiative[]
  kpis: XMatrixKpi[]
}

export interface XMatrixData {
  vision: string
  yearGoals: string[]
  hoshins: XMatrixHoshin[]
}

// ============================================================
// Org member (for KPI owner select)
// ============================================================
export interface OrgMember {
  userId: string
  fullName: string
  email: string
  role: 'CEO' | 'manager' | 'staff'
}
