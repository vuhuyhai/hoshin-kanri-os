import { redirect } from 'next/navigation'

/**
 * @deprecated The coaching flow is now integrated into /dashboard/discovery/swot
 * as Phase 1 of the single-page SWOT experience.
 * This redirect catches bookmarked URLs. Safe to delete after 1 sprint.
 */
export default function CoachingRedirect() {
  redirect('/dashboard/discovery/swot')
}
