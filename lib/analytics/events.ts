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

// Activation events.
// NOTE: do not pass PII (email, phone) as event properties — PostHog's
// distinctId already identifies the user. Raw identifiers in properties
// are hard to scrub later and bloat the event index.
export function trackXRayCompleted(props: {
  overallScore: number
  overallLevel?: string
  industry?: string
}) {
  getPostHog()?.capture('x_ray_completed', props)
}

export function trackDiscoveryStepCompleted(
  step: 'swot' | 'pain_mapper' | 'vision' | 'benchmark'
) {
  getPostHog()?.capture('discovery_step_completed', { step })
}

// ============================================================
// Funnel events — distinct names so PostHog Funnels UI can filter
// them directly without property-filtering on `step`.
// ============================================================

export function trackDiscoveryStarted(props?: { entryPoint?: string }) {
  getPostHog()?.capture('discovery_start', props)
}

export function trackPainSubmitted(props: { count: number }) {
  getPostHog()?.capture('pain_submitted', props)
}

export function trackCoachingCompleted(props?: {
  strengthsCount?: number
  weaknessesCount?: number
  opportunitiesCount?: number
  threatsCount?: number
}) {
  getPostHog()?.capture('coaching_completed', props)
}

export function trackSynthesisViewed(props?: {
  itemsCount?: number
  hasWarnings?: boolean
}) {
  getPostHog()?.capture('synthesis_viewed', props)
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

// ============================================================
// Gemba (M-Hoshin-5)
// ============================================================
// NO PII trong properties: target_id là internal UUID/text-id, body_length
// là number, comment_id là internal UUID. Không bao giờ log body content.

export type GembaEventProps = {
  target_type: 'hoshin' | 'kpi'
  target_id: string
}

export function trackGembaCommentSubmitted(
  props: GembaEventProps & { body_length: number },
) {
  getPostHog()?.capture('gemba_comment_submitted', props)
}

export function trackGembaCommentAcknowledged(
  props: GembaEventProps & { comment_id: string },
) {
  getPostHog()?.capture('gemba_comment_acknowledged', props)
}

export function trackGembaCommentResolved(
  props: GembaEventProps & { comment_id: string },
) {
  getPostHog()?.capture('gemba_comment_resolved', props)
}

export function trackGembaBannerViewed(props: {
  total_open: number
  distinct_targets: number
}) {
  getPostHog()?.capture('gemba_banner_viewed', props)
}
