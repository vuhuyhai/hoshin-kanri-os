'use client'

import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PhaseStatus } from '@/lib/swot/swot-session-store'
import { cn } from '@/lib/utils'

interface PhaseCardProps {
  icon: LucideIcon
  title: string
  description: string
  status: PhaseStatus
  href: string
  metadata?: string
  isNew?: boolean
  staleReason?: string
}

const STATUS_CONFIG: Record<
  PhaseStatus,
  {
    badge: string
    badgeClass: string
    borderClass: string
    ctaLabel: string
    ctaVariant: 'default' | 'outline' | 'ghost'
    disabled: boolean
  }
> = {
  locked: {
    badge: 'Chờ bước trước',
    badgeClass: 'bg-muted text-muted-foreground',
    borderClass: 'opacity-50',
    ctaLabel: 'Chờ',
    ctaVariant: 'outline',
    disabled: true,
  },
  not_started: {
    badge: 'Chưa bắt đầu',
    badgeClass: 'bg-muted text-muted-foreground',
    borderClass: '',
    ctaLabel: 'Bắt đầu →',
    ctaVariant: 'default',
    disabled: false,
  },
  in_progress: {
    badge: 'Đang thực hiện',
    badgeClass: 'bg-primary/10 text-primary',
    borderClass: 'border-primary border-2',
    ctaLabel: 'Tiếp tục →',
    ctaVariant: 'default',
    disabled: false,
  },
  completed: {
    badge: '✓ Hoàn thành',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    borderClass: 'border-green-500 border-2',
    ctaLabel: 'Xem lại',
    ctaVariant: 'ghost',
    disabled: false,
  },
  stale: {
    badge: '⚠ Cần cập nhật',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    borderClass: 'border-yellow-500 border-2',
    ctaLabel: 'Chạy lại →',
    ctaVariant: 'default',
    disabled: false,
  },
}

export function PhaseCard({
  icon: Icon,
  title,
  description,
  status,
  href,
  metadata,
  isNew,
  staleReason,
}: PhaseCardProps) {
  const router = useRouter()
  const config = STATUS_CONFIG[status]

  return (
    <div
      className={cn(
        'border p-5 space-y-3 transition-all',
        config.borderClass,
        status !== 'locked' && 'card-brutal'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
          <h3 className="font-display text-sm font-bold">{title}</h3>
          {isNew && (
            <span className="px-1.5 py-0.5 text-[10px] font-display font-bold uppercase tracking-wider bg-primary text-primary-foreground">
              ★ Mới
            </span>
          )}
        </div>
        <span
          className={cn(
            'px-2 py-0.5 text-[10px] font-display font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1',
            config.badgeClass
          )}
        >
          {status === 'in_progress' && (
            <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
          )}
          {config.badge}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-text-2 leading-relaxed">{description}</p>

      {/* Stale reason */}
      {status === 'stale' && staleReason && (
        <p className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 px-3 py-2">
          {staleReason}
        </p>
      )}

      {/* Metadata */}
      {metadata && (
        <p className="text-xs text-text-3">{metadata}</p>
      )}

      {/* CTA */}
      <Button
        variant={config.ctaVariant}
        size="sm"
        disabled={config.disabled}
        onClick={() => router.push(href)}
        className="w-full font-display text-xs font-semibold uppercase tracking-wider"
      >
        {config.ctaLabel}
      </Button>
    </div>
  )
}
