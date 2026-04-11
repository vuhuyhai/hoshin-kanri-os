'use client'

type PostHogInstance = {
  capture: (event: string, properties?: Record<string, unknown>) => void
  identify: (userId: string, properties?: Record<string, unknown>) => void
}

function getPostHog(): PostHogInstance | null {
  if (typeof window === 'undefined') return null
  return (window as Window & { posthog?: PostHogInstance }).posthog ?? null
}

// Generic event
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  getPostHog()?.capture(event, properties)
}

// Activation events
export function trackXRayCompleted(props: {
  overallScore: number
  email: string
}) {
  getPostHog()?.capture('x_ray_completed', props)
}

export function trackDiscoveryStepCompleted(
  step: 'swot' | 'pain_mapper' | 'vision' | 'benchmark'
) {
  getPostHog()?.capture('discovery_step_completed', { step })
}

export function trackXMatrixCompleted(props: {
  hoshinCount: number
  kpisCreated: number
  initiativesCount: number
  hasPrefill: boolean
}) {
  getPostHog()?.capture('x_matrix_completed', props)
}

// Engagement events
export function trackKpiEntryAdded(props: {
  kpiId: string
  value: number
  deptLevel: string
}) {
  getPostHog()?.capture('kpi_entry_added', props)
}

export function trackKpiDashboardViewed() {
  getPostHog()?.capture('kpi_dashboard_viewed')
}

// Retention events
export function trackMonthlyReportGenerated() {
  getPostHog()?.capture('monthly_report_generated')
}

export function trackXMatrixShared(shareSlug: string) {
  getPostHog()?.capture('x_matrix_shared', { shareSlug })
}

// User identity
export function identifyUser(
  userId: string,
  props: {
    orgId: string
    orgName: string
    role: string
    industry: string
  }
) {
  getPostHog()?.identify(userId, props)
}
