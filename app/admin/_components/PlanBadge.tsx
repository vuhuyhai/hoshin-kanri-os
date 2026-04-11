const PLAN_STYLES: Record<string, string> = {
  free: 'badge-muted',
  starter: 'badge-accent',
  growth: 'badge-accent',
  enterprise: 'badge-accent',
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

export function PlanBadge({ plan }: { plan: string }) {
  const style = PLAN_STYLES[plan] ?? PLAN_STYLES.free
  const label = PLAN_LABELS[plan] ?? plan

  return (
    <span className={`badge-brutal ${style}`}>
      {label}
    </span>
  )
}
