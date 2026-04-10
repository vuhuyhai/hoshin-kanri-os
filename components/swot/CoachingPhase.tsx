'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Phase1Coaching } from '@/app/dashboard/discovery/swot/components/Phase1Coaching'
import { CoachingIntroScreen } from '@/app/dashboard/discovery/swot/components/CoachingIntroScreen'
import { DimensionPills } from '@/app/dashboard/discovery/swot/components/DimensionPills'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { frameworkIdToLegacy } from '@/lib/swot/coaching-tracker'
import { useCoachingPersistence } from '@/app/dashboard/discovery/swot/coaching/hooks/useCoachingPersistence'
import type {
  CoachingState,
  OrgContext,
  CoachingTrackerState,
  FrameworkId,
  ExternalFrameworkChoice,
} from '@/lib/swot/types'

interface CoachingPhaseProps {
  orgContext: OrgContext
  userId: string
}

function formatSavedTime(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  })
  const date = d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `Luu luc ${time} — ${date}`
}

export function CoachingPhase({ orgContext, userId }: CoachingPhaseProps) {
  // Zustand store
  const coachingTracker = useSwotStore((s) => s.coachingTracker)
  const coachingMessages = useSwotStore((s) => s.coachingMessages)
  const setCoachingMessages = useSwotStore((s) => s.setCoachingMessages)
  const updateCoachingTracker = useSwotStore((s) => s.updateCoachingTracker)
  const getCoachingProgress = useSwotStore((s) => s.getCoachingProgress)
  const completeCoaching = useSwotStore((s) => s.completeCoaching)
  const startCoaching = useSwotStore((s) => s.startCoaching)
  const jumpToDimension = useSwotStore((s) => s.jumpToDimension)
  const setSwotPhase = useSwotStore((s) => s.setSwotPhase)

  // Coverage state
  const answeredCount = useSwotStore((s) => s.coachingCoverage.answeredCount)
  const canAdvanceToPhase2 = useSwotStore((s) => s.canAdvanceToPhase2)
  const markDimensionAnswered = useSwotStore((s) => s.markDimensionAnswered)

  const [isLoading, setIsLoading] = useState(false)

  // Supabase persistence
  const {
    resumeData,
    lastSaved,
    handleResume,
    handleStartOver,
    handleManualSave,
    saveBeforeNavigate,
  } = useCoachingPersistence(orgContext.orgId, userId)

  // Compose legacy CoachingState for Phase1Coaching
  const coachingState: CoachingState = {
    messages: coachingMessages,
    currentFramework: frameworkIdToLegacy(coachingTracker.currentFramework),
    isComplete: coachingTracker.currentPhase === 'completed',
    isLoading,
    summary: null,
  }

  const handleStateChange = (newState: CoachingState) => {
    setCoachingMessages(newState.messages)
    setIsLoading(newState.isLoading)
  }

  const handleTrackerUpdate = (tracker: CoachingTrackerState) => {
    updateCoachingTracker(tracker)
    for (const dims of Object.values(tracker.completedDimensions)) {
      for (const dim of dims) {
        markDimensionAnswered(dim)
      }
    }
  }

  const handleIntroStart = useCallback(
    (
      selectedDimensions: Record<FrameworkId, string[]>,
      selectedExternalFramework: ExternalFrameworkChoice
    ) => {
      startCoaching(selectedDimensions, selectedExternalFramework)
    },
    [startCoaching]
  )

  const handlePhaseComplete = useCallback(async () => {
    try {
      completeCoaching()
      await saveBeforeNavigate()
      toast.success('Da luu phien lam viec')
    } catch {
      console.error('[CoachingPhase] save on complete failed')
    }
  }, [completeCoaching, saveBeforeNavigate])

  // Advance to Phase 2 — store action, no router.push
  const handleAdvanceToPhase2 = useCallback(async () => {
    try {
      updateCoachingTracker({ currentPhase: 'completed' })
      completeCoaching()
      await saveBeforeNavigate()
      setSwotPhase(2)
    } catch {
      console.error('[CoachingPhase] advance to phase 2 failed')
    }
  }, [updateCoachingTracker, completeCoaching, saveBeforeNavigate, setSwotPhase])

  const handleNavigateNext = useCallback(() => {
    setSwotPhase(2)
  }, [setSwotPhase])

  const handleEarlyTermination = useCallback(async () => {
    try {
      updateCoachingTracker({ currentPhase: 'completed' })
      completeCoaching()
      await saveBeforeNavigate()
      toast.success('Da luu phien lam viec')
      setSwotPhase(2)
    } catch {
      console.error('[CoachingPhase] early termination failed')
    }
  }, [updateCoachingTracker, completeCoaching, saveBeforeNavigate, setSwotPhase])

  const handleJumpToDimension = useCallback(
    (dimension: string) => {
      jumpToDimension(dimension)
    },
    [jumpToDimension]
  )

  const progress = getCoachingProgress()
  const isIntro = coachingTracker.currentPhase === 'intro'
  const showEarlyEndButton =
    progress.percentage >= 50 && !coachingState.isComplete && !isIntro

  // Resume prompt
  if (resumeData) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">AI Coaching</h2>
        <div className="border-2 p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">
              Tiep tuc phien lam viec truoc?
            </p>
            <p className="text-sm text-muted-foreground">
              {formatSavedTime(resumeData.savedAt)} &middot;{' '}
              {resumeData.messages.length} tin nhan
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleResume}>Tiep tuc</Button>
            <Button variant="outline" onClick={handleStartOver}>
              Bat dau lai
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Intro screen
  if (isIntro) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">AI Coaching</h2>
            <p className="text-sm text-muted-foreground">
              Chon cac khia canh ban muon phan tich
            </p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">
            Buoc 1/3
          </Badge>
        </div>
        <CoachingIntroScreen onStart={handleIntroStart} />
      </div>
    )
  }

  // Chat interface
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 16rem)' }}>
      {/* Header bar */}
      <div className="shrink-0 pb-3 border-b-2 border-foreground/10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-display font-bold truncate">
            AI Coaching
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground/70 hidden sm:block">
                {formatSavedTime(lastSaved)}
              </span>
            )}
            {showEarlyEndButton && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-display text-xs font-semibold uppercase tracking-wider"
                    />
                  }
                >
                  Ket thuc phan tich
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ket thuc phan tich som?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ban da hoan thanh {progress.completedCount}/
                      {progress.totalDimensions} chu de. AI se tong hop SWOT tu
                      du lieu hien co.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Tiep tuc chat</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEarlyTermination}>
                      Ket thuc &amp; Tong hop
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <button
              onClick={handleManualSave}
              disabled={coachingMessages.length === 0}
              className="text-lg hover:scale-110 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
              title="Luu phien lam viec"
            >
              💾
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-1.5 bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="text-xs font-display font-semibold text-muted-foreground tabular-nums shrink-0">
            {progress.completedCount}/{progress.totalDimensions}
          </span>
        </div>
      </div>

      {/* Dimension pills */}
      <div className="shrink-0">
        <DimensionPills
          tracker={coachingTracker}
          onJumpToDimension={handleJumpToDimension}
        />
      </div>

      {/* Chat container */}
      <div className="flex-1 min-h-0">
        <Phase1Coaching
          orgContext={orgContext}
          state={coachingState}
          onStateChange={handleStateChange}
          onPhaseComplete={handlePhaseComplete}
          onNavigateNext={handleNavigateNext}
          coachingTracker={coachingTracker}
          onTrackerUpdate={handleTrackerUpdate}
          answeredCount={answeredCount}
          canAdvanceToPhase2={canAdvanceToPhase2}
          onAdvanceToPhase2={handleAdvanceToPhase2}
        />
      </div>
    </div>
  )
}
