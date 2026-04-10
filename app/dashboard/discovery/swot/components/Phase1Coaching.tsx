'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ChatMessage } from '@/components/swot/ChatMessage'
import { MIN_COVERAGE_TO_ADVANCE } from '@/lib/swot/frameworks'
import type {
  CoachingState,
  ChatMessage as ChatMsg,
  OrgContext,
  CoachingTrackerState,
} from '@/lib/swot/types'

interface Phase1CoachingProps {
  orgContext: OrgContext
  state: CoachingState
  onStateChange: (state: CoachingState) => void
  onPhaseComplete: () => void
  onNavigateNext?: () => void
  coachingTracker?: CoachingTrackerState
  onTrackerUpdate?: (tracker: CoachingTrackerState) => void
  // Coverage props
  answeredCount?: number
  canAdvanceToPhase2?: boolean
  onAdvanceToPhase2?: () => void
}

export function Phase1Coaching({
  orgContext,
  state,
  onStateChange,
  onPhaseComplete,
  onNavigateNext,
  coachingTracker,
  onTrackerUpdate,
  answeredCount = 0,
  canAdvanceToPhase2 = false,
  onAdvanceToPhase2,
}: Phase1CoachingProps) {
  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialSent = useRef(false)
  const [coverageMilestoneShown, setCoverageMilestoneShown] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [state.messages, state.isLoading])

  useEffect(() => {
    if (state.messages.length === 0 && !initialSent.current) {
      initialSent.current = true
      sendMessage('')
    }
  }, [])

  // Show one-time milestone message when coverage threshold is first reached
  useEffect(() => {
    if (canAdvanceToPhase2 && !coverageMilestoneShown && !state.isComplete) {
      setCoverageMilestoneShown(true)
    }
  }, [canAdvanceToPhase2, coverageMilestoneShown, state.isComplete])

  const sendMessage = async (userInput: string) => {
    const newMessages: ChatMsg[] = userInput
      ? [...state.messages, { role: 'user', content: userInput }]
      : state.messages

    onStateChange({ ...state, messages: newMessages, isLoading: true })
    setInputText('')

    try {
      const response = await fetch('/api/swot/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:
            newMessages.length > 0
              ? newMessages
              : [
                  {
                    role: 'user',
                    content: 'Xin chao, hay bat dau phan tich.',
                  },
                ],
          orgContext,
          currentFramework: state.currentFramework,
          ...(coachingTracker && { coachingTracker }),
        }),
      })

      if (!response.ok) throw new Error('API error')
      const data = await response.json()

      // Update tracker from server response
      if (data.updatedCoachingTracker && onTrackerUpdate) {
        onTrackerUpdate(data.updatedCoachingTracker)
      }

      const updatedMessages: ChatMsg[] = [...newMessages, data.message]

      if (data.isCoachingComplete) {
        if (state.currentFramework === 'sw') {
          onStateChange({
            ...state,
            messages: updatedMessages,
            currentFramework: 'ot',
            isLoading: false,
          })
        } else {
          onStateChange({
            ...state,
            messages: updatedMessages,
            isComplete: true,
            isLoading: false,
          })
          onPhaseComplete()
        }
      } else {
        onStateChange({
          ...state,
          messages: updatedMessages,
          isLoading: false,
        })
      }
    } catch {
      toast.error('Ket noi AI gian doan. Thu lai.')
      onStateChange({ ...state, messages: newMessages, isLoading: false })
    }
  }

  const handleSend = () => {
    if (!inputText.trim() || state.isLoading) return
    sendMessage(inputText.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const coverageProgress = Math.min(
    100,
    Math.round((answeredCount / MIN_COVERAGE_TO_ADVANCE) * 100)
  )

  return (
    <div className="flex h-full flex-col">
      {/* Messages area — full-width with responsive padding */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 md:px-12 lg:px-20 py-6 space-y-5"
      >
        {state.messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role} content={msg.content} />
        ))}

        {/* One-time inline milestone message */}
        {coverageMilestoneShown && !state.isComplete && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-2.5 text-sm text-primary">
              <span className="text-lg">✅</span>
              <span>
                AI da hieu kha ro ve doanh nghiep cua ban. Ban co the tiep tuc
                chia se hoac chuyen sang buoc tiep theo.
              </span>
            </div>
          </div>
        )}

        {state.isLoading && (
          <ChatMessage role="assistant" content="" isStreaming />
        )}
      </div>

      {/* Coverage progress bar — thin, below chat */}
      {!state.isComplete && (
        <div className="shrink-0 px-6 md:px-12 lg:px-20 py-1.5 bg-background">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 bg-muted overflow-hidden rounded-full">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${coverageProgress}%` }}
              />
            </div>
            <span className="text-[11px] font-display font-semibold text-muted-foreground tabular-nums shrink-0">
              Da kham pha {answeredCount}/{MIN_COVERAGE_TO_ADVANCE} chu de
            </span>
          </div>
        </div>
      )}

      {/* Input area / Completion banner — sticky bottom */}
      {state.isComplete ? (
        <div className="shrink-0 px-6 md:px-12 lg:px-20 py-5 border-t-2 border-foreground/10 bg-primary/5">
          <div className="text-center space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-display font-semibold text-primary">
                Phan tich hoan tat
              </p>
              <p className="text-xs text-muted-foreground">
                Da thu thap insight tu buoi phan tich
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                }
                className="font-display text-xs font-semibold uppercase tracking-wider"
              >
                Xem tom tat
              </Button>
              {onNavigateNext && (
                <Button
                  size="sm"
                  onClick={onNavigateNext}
                  className="font-display text-xs font-semibold uppercase tracking-wider"
                >
                  Sang buoc 2 &rarr;
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="shrink-0 px-6 md:px-12 lg:px-20 py-3 border-t-2 border-foreground/10 bg-background">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhap cau tra loi cua ban..."
              disabled={state.isLoading}
              rows={1}
              className="flex-1 px-4 py-2.5 text-sm border-2 border-foreground/20 bg-background resize-none focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!inputText.trim() || state.isLoading}
              className="font-display text-xs font-semibold uppercase tracking-wider px-6 border-2"
            >
              {state.isLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Gui
                </span>
              ) : (
                'Gui'
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1.5 max-w-4xl mx-auto">
            <p className="text-xs text-muted-foreground">
              Enter de gui · Shift+Enter xuong dong
            </p>
            {onAdvanceToPhase2 && (
              <Button
                variant={canAdvanceToPhase2 ? 'default' : 'outline'}
                size="sm"
                disabled={!canAdvanceToPhase2}
                onClick={onAdvanceToPhase2}
                title={
                  canAdvanceToPhase2
                    ? undefined
                    : 'Hay chia se them de AI hieu ro hon ve doanh nghiep cua ban'
                }
                className="font-display text-[10px] font-semibold uppercase tracking-wider"
              >
                Tiep tuc sang buoc tiep theo &rarr;
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
