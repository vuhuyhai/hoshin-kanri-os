'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EIGHT_MS, PORTER_FORCES, PESTEL_FACTORS } from '@/lib/swot/frameworks'
import {
  getDimensionStatus,
  DIMENSION_SEQUENCES,
  type DimensionStatus,
} from '@/lib/swot/coaching-tracker'
import type {
  CoachingTrackerState,
  FrameworkId,
  ExternalFrameworkChoice,
} from '@/lib/swot/types'
import type { FrameworkDimension } from '@/lib/swot/frameworks'
import { cn } from '@/lib/utils'

interface DimensionPillsProps {
  tracker: CoachingTrackerState
  onJumpToDimension: (dimension: string) => void
}

/** Map nameEn → short label for pills. */
function getShortLabel(nameEn: string, framework: FrameworkId): string {
  const allDims: FrameworkDimension[] =
    framework === '8M'
      ? EIGHT_MS
      : framework === 'Porter'
        ? PORTER_FORCES
        : PESTEL_FACTORS

  const dim = allDims.find((d) => d.nameEn === nameEn)
  if (!dim) return nameEn

  if (framework === '8M') {
    return `${dim.id.replace('_', ' ')} ${dim.name}`
  }
  return dim.name
}

const STATUS_CLASSES: Record<DimensionStatus, string> = {
  completed:
    'bg-primary/10 border-primary/40 text-primary',
  active:
    'border-foreground border-2 bg-background text-foreground animate-pulse',
  pending:
    'border-border text-muted-foreground hover:border-foreground/30',
}

export function DimensionPills({
  tracker,
  onJumpToDimension,
}: DimensionPillsProps) {
  const [jumpTarget, setJumpTarget] = useState<{
    dimension: string
    label: string
  } | null>(null)

  const selected = tracker.selectedDimensions
  const extChoice = tracker.selectedExternalFramework

  // Build ordered list of pill groups
  const groups: { framework: FrameworkId; label: string; dims: string[] }[] = [
    {
      framework: '8M',
      label: '8Ms',
      dims: DIMENSION_SEQUENCES['8M'].filter((d) =>
        selected['8M'].includes(d)
      ),
    },
  ]

  if (extChoice === 'Porter' || extChoice === 'both') {
    groups.push({
      framework: 'Porter',
      label: 'Porter',
      dims: DIMENSION_SEQUENCES.Porter.filter((d) =>
        selected.Porter.includes(d)
      ),
    })
  }
  if (extChoice === 'PESTEL' || extChoice === 'both') {
    groups.push({
      framework: 'PESTEL',
      label: 'PESTEL',
      dims: DIMENSION_SEQUENCES.PESTEL.filter((d) =>
        selected.PESTEL.includes(d)
      ),
    })
  }

  const handlePillClick = (
    dimension: string,
    status: DimensionStatus,
    framework: FrameworkId
  ) => {
    if (status === 'completed' || status === 'active') return
    setJumpTarget({
      dimension,
      label: getShortLabel(dimension, framework),
    })
  }

  const confirmJump = () => {
    if (jumpTarget) {
      onJumpToDimension(jumpTarget.dimension)
      setJumpTarget(null)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-6 md:px-12 lg:px-20 py-2 border-b-2 border-foreground/10 bg-background">
        {groups.map((group, gi) => (
          <div key={group.framework} className="flex items-center gap-1.5 shrink-0">
            {gi > 0 && (
              <div className="w-px h-5 bg-foreground/20 mx-1 shrink-0" />
            )}
            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground mr-1 shrink-0">
              {group.label}
            </span>
            {group.dims.map((dim) => {
              const status = getDimensionStatus(
                dim,
                group.framework,
                tracker
              )
              return (
                <button
                  key={dim}
                  onClick={() =>
                    handlePillClick(dim, status, group.framework)
                  }
                  disabled={status === 'completed' || status === 'active'}
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-display font-semibold border whitespace-nowrap transition-colors shrink-0',
                    STATUS_CLASSES[status],
                    status === 'pending' && 'cursor-pointer'
                  )}
                >
                  {status === 'completed' && (
                    <Check className="w-3 h-3 shrink-0" />
                  )}
                  {status === 'active' && (
                    <span className="w-1.5 h-1.5 bg-foreground shrink-0" />
                  )}
                  {getShortLabel(dim, group.framework)}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Jump confirmation dialog */}
      <AlertDialog
        open={jumpTarget !== null}
        onOpenChange={(open) => !open && setJumpTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chuyen sang dimension khac?</AlertDialogTitle>
            <AlertDialogDescription>
              Bo qua cac cau hoi con lai va chuyen sang{' '}
              <strong>{jumpTarget?.label}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Tiep tuc hien tai</AlertDialogCancel>
            <AlertDialogAction onClick={confirmJump}>
              Chuyen ngay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
