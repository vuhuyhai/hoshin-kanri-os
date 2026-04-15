'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics/events'

/**
 * Client helper to fire a PostHog event once when a page/component mounts.
 * Drop into Server Components (route pages) where we want to capture "user
 * reached step X" without converting the whole page to a Client Component.
 *
 * Usage:
 *   // in app/dashboard/discovery/page.tsx (Server Component)
 *   <TrackMount event="discovery_start" />
 *
 * The `fired` ref guards against React 18 StrictMode double-invocation of
 * effects in development — without it we'd log two events every time a
 * dev hits the page.
 */
interface TrackMountProps {
  event: string
  properties?: Record<string, unknown>
}

export function TrackMount({ event, properties }: TrackMountProps) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackEvent(event, properties)
  }, [event, properties])
  return null
}
