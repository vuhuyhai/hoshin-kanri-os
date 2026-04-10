import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700 border-gray-300',
  starter: 'bg-teal-50 text-teal-700 border-teal-300',
  growth: 'bg-blue-50 text-blue-700 border-blue-300',
  enterprise: 'bg-purple-50 text-purple-700 border-purple-300',
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

export function PlanBadge({ plan }: { plan: string }) {
  const color = PLAN_COLORS[plan] ?? PLAN_COLORS.free
  const label = PLAN_LABELS[plan] ?? plan

  return (
    <Badge
      className={cn(
        'rounded-none border font-display text-[11px] font-bold uppercase tracking-wider',
        color
      )}
    >
      {label}
    </Badge>
  )
}
