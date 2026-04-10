'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Phase1Coaching } from '../../components/Phase1Coaching'
import { CoachingIntroScreen } from '../../components/CoachingIntroScreen'
import { DimensionPills } from '../../components/DimensionPills'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { frameworkIdToLegacy } from '@/lib/swot/coaching-tracker'
import { useCoachingPersistence } from '../hooks/useCoachingPersistence'
import type {
  CoachingState,
  OrgContext,
  CoachingTrackerState,
  FrameworkId,
  ExternalFrameworkChoice,
} from '@/lib/swot/types'

interface CoachingClientProps {
  orgContext: OrgContext
  userId: string
}

const SWOT_HUB_PATH = '/dashboard/discovery/swot'

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

export function CoachingClient({ orgContext, userId }: CoachingClientProps) {
  const router = useRouter()

  // Zustand store
  const coachingTracker = useSwotStore((s) => s.coachingTracker)
  const coachingMessages = useSwotStore((s) => s.coachingMessages)
  const setCoachingMessages = useSwotStore((s) => s.setCoachingMessages)
  const updateCoachingTracker = useSwotStore((s) => s.updateCoachingTracker)
  const getCoachingProgress = useSwotStore((s) => s.getCoachingProgress)
  const completeCoaching = useSwotStore((s) => s.completeCoaching)
  const startCoaching = useSwotStore((s) => s.startCoaching)
  const jumpToDimension = useSwotStore((s) => s.jumpToDimension)

  const [isLoading, setIsLoading] = useState(false)

  // Supabase persistence (auto-save, load, resume)
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
  }

  // Intro screen → start coaching
  const handleIntroStart = useCallback(
    (
      selectedDimensions: Record<FrameworkId, string[]>,
      selectedExternalFramework: ExternalFrameworkChoice
    ) => {
      startCoaching(selectedDimensions, selectedExternalFramework)
    },
    [startCoaching]
  )

  // Trigger A: called when AI signals coaching complete — save + mark, NO navigate
  const handlePhaseComplete = useCallback(async () => {
    try {
      completeCoaching()
      await saveBeforeNavigate()
      toast.success('Da luu phien lam viec')
    } catch {
      console.error('[CoachingClient] save on complete failed')
    }
  }, [completeCoaching, saveBeforeNavigate])

  // Navigate to next phase (called from completion banner)
  const handleNavigateNext = useCallback(() => {
    router.push(SWOT_HUB_PATH)
  }, [router])

  // Trigger B: manual early termination
  const handleEarlyTermination = useCallback(async () => {
    try {
      updateCoachingTracker({ currentPhase: 'completed' })
      completeCoaching()
      await saveBeforeNavigate()
      toast.success('Da luu phien lam viec')
      router.push(SWOT_HUB_PATH)
    } catch {
      console.error('[CoachingClient] early termination save failed')
    }
  }, [updateCoachingTracker, completeCoaching, saveBeforeNavigate, router])

  // Dimension pill jump
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

  // Resume prompt — shown when saved session found on mount
  if (resumeData) {
    return (
      <div className="w-full px-6 md:px-12 lg:px-20 py-8 space-y-4">
        <div>
          <button
            onClick={() => router.push(SWOT_HUB_PATH)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 block"
          >
            &larr; Phan tich SWOT
          </button>
          <h1 className="text-2xl font-bold">AI Coaching</h1>
        </div>

        <Card className="border-2">
          <CardContent className="py-6 space-y-4">
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
          </CardContent>
        </Card>
      </div>
    )
  }

  // Intro screen — shown before chat when phase is 'intro'
  if (isIntro) {
    return (
      <div className="w-full px-6 md:px-12 lg:px-20 py-8 space-y-6">
        <div>
          <button
            onClick={() => router.push(SWOT_HUB_PATH)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 block"
          >
            &larr; Phan tich SWOT
          </button>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">AI Coaching</h1>
              <p className="text-sm text-muted-foreground">
                Chon cac dimensions ban muon phan tich
              </p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              Buoc 1/4
            </Badge>
          </div>
        </div>
        <CoachingIntroScreen onStart={handleIntroStart} />
      </div>
    )
  }

  // Chat interface — full-width
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
      {/* Header — sticky top */}
      <div className="shrink-0 px-6 md:px-12 lg:px-20 py-3 border-b-2 border-foreground/10 bg-background">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => router.push(SWOT_HUB_PATH)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              &larr; Phan tich SWOT
            </button>
            <h1 className="text-lg font-display font-bold truncate">
              AI Coaching
            </h1>
            {lastSaved && (
              <span className="text-[10px] text-muted-foreground/70 shrink-0 hidden sm:block">
                {formatSavedTime(lastSaved)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Trigger B: early termination button */}
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
                    <AlertDialogTitle>
                      Ket thuc phan tich som?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Ban da hoan thanh {progress.completedCount}/
                      {progress.totalDimensions} dimensions. AI se tong hop
                      SWOT tu du lieu hien co.
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
            <Badge variant="outline" className="text-xs">
              Buoc 1/4
            </Badge>
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

      {/* Dimension pills — sticky below header */}
      <div className="shrink-0">
        <DimensionPills
          tracker={coachingTracker}
          onJumpToDimension={handleJumpToDimension}
        />
      </div>

      {/* Chat container — fills remaining space */}
      <div className="flex-1 min-h-0">
        <Phase1Coaching
          orgContext={orgContext}
          state={coachingState}
          onStateChange={handleStateChange}
          onPhaseComplete={handlePhaseComplete}
          onNavigateNext={handleNavigateNext}
          coachingTracker={coachingTracker}
          onTrackerUpdate={handleTrackerUpdate}
        />
      </div>
    </div>
  )
}
