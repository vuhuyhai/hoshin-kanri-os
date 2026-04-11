'use client'

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

  return (
    <div
      className={`mt-2 p-2 text-xs border rounded ${
        isWarning
          ? 'bg-amber-50 border-amber-400 text-amber-800'
          : 'bg-blue-50 border-blue-300 text-blue-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span className="font-medium">
            {isWarning ? '⚠️ ' : 'ℹ️ '}
            {issue.type === 'contradiction'
              ? 'Có thể mâu thuẫn'
              : 'Có thể trùng ý'}
          </span>
          <p className="mt-0.5">{issue.explanation}</p>
          {relatedItemStatement && (
            <p className="mt-0.5 italic truncate">
              &ldquo;{relatedItemStatement}&rdquo;
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 text-[10px] px-1.5 py-0.5 border rounded font-medium hover:bg-white/50 transition-colors"
        >
          Bỏ qua
        </button>
      </div>
    </div>
  )
}
