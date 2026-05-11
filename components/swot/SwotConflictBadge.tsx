'use client'

import { AlertTriangle, Info } from 'lucide-react'
import type { ConflictIssue } from '@/lib/swot/coaching-types'

interface SwotConflictBadgeProps {
  issue: ConflictIssue
  relatedItemStatement?: string
  onDismiss: () => void
}

export function SwotConflictBadge({
  issue,
  relatedItemStatement,
  onDismiss,
}: SwotConflictBadgeProps) {
  const isWarning = issue.severity === 'warning'
  const Icon = isWarning ? AlertTriangle : Info
  const accent = isWarning ? '#f59e0b' : '#2563eb'

  return (
    <div
      className="mt-2 p-2 text-xs border-2 border-ink bg-card"
      style={{ boxShadow: '2px 2px 0 #2C2B2B' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 font-display font-bold text-ink">
            <Icon className="w-3 h-3" style={{ color: accent }} />
            {issue.type === 'contradiction' ? 'Có thể mâu thuẫn' : 'Có thể trùng ý'}
          </span>
          <p className="mt-0.5 font-body text-text-2">{issue.explanation}</p>
          {relatedItemStatement && (
            <p className="mt-0.5 italic truncate font-body text-text-3">
              &ldquo;{relatedItemStatement}&rdquo;
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-[10px] px-1.5 py-0.5 border-2 border-ink font-display font-bold text-ink bg-card hover:bg-bg-warm transition-colors"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  )
}
