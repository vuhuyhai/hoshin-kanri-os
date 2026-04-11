'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import { createClient } from '@/lib/supabase/client'
import {
  saveCoachingSession,
  loadCoachingSession,
  deleteCoachingSession,
} from '@/lib/swot/coaching-persistence'
import type { CoachingTrackerState, ChatMessage } from '@/lib/swot/types'

interface ResumeData {
  coachingState: CoachingTrackerState
  messages: ChatMessage[]
  savedAt: string
}

export function useCoachingPersistence(orgId: string, userId: string) {
  const setCoachingMessages = useSwotStore((s) => s.setCoachingMessages)
  const updateCoachingTracker = useSwotStore((s) => s.updateCoachingTracker)
  const resetCoaching = useSwotStore((s) => s.resetCoaching)
  const coachingMessages = useSwotStore((s) => s.coachingMessages)

  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevMessageCount = useRef(0)
  const hydrated = useRef(false)

  // On mount: try to load saved session from Supabase
  useEffect(() => {
    hydrated.current = true
    const supabase = createClient()
    loadCoachingSession(supabase, orgId).then((data) => {
      if (data && data.messages.length > 0) {
        setResumeData(data)
      }
    })
  }, [orgId])

  // Debounced auto-save — fires 2s after new messages appear
  const triggerAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const state = useSwotStore.getState()
      if (state.coachingMessages.length === 0) return
      const supabase = createClient()
      const now = new Date().toISOString()
      saveCoachingSession(supabase, orgId, userId, {
        coachingState: state.coachingTracker,
        messages: state.coachingMessages,
        savedAt: now,
      })
        .then(() => setLastSaved(now))
        .catch(console.error)
    }, 2000)
  }, [orgId, userId])

  useEffect(() => {
    if (!hydrated.current) return
    if (
      coachingMessages.length > 0 &&
      coachingMessages.length > prevMessageCount.current
    ) {
      triggerAutoSave()
    }
    prevMessageCount.current = coachingMessages.length
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [coachingMessages.length, triggerAutoSave])

  // Resume saved session
  const handleResume = useCallback(() => {
    if (!resumeData) return
    setCoachingMessages(resumeData.messages)
    updateCoachingTracker(resumeData.coachingState)
    setLastSaved(resumeData.savedAt)
    setResumeData(null)
  }, [resumeData, setCoachingMessages, updateCoachingTracker])

  // Start over — reset store + remove from Supabase
  const handleStartOver = useCallback(() => {
    resetCoaching()
    const supabase = createClient()
    deleteCoachingSession(supabase, orgId).catch(console.error)
    setResumeData(null)
    setLastSaved(null)
  }, [orgId, resetCoaching])

  // Manual save — immediate, with toast feedback
  const handleManualSave = useCallback(() => {
    const state = useSwotStore.getState()
    const supabase = createClient()
    const now = new Date().toISOString()
    saveCoachingSession(supabase, orgId, userId, {
      coachingState: state.coachingTracker,
      messages: state.coachingMessages,
      savedAt: now,
    })
      .then(() => {
        setLastSaved(now)
        toast.success('Đã lưu phiên làm việc')
      })
      .catch(() => toast.error('Không thể lưu. Thử lại.'))
  }, [orgId, userId])

  // Save on phase complete (before navigation) — awaitable
  const saveBeforeNavigate = useCallback(async () => {
    const state = useSwotStore.getState()
    const supabase = createClient()
    const now = new Date().toISOString()
    await saveCoachingSession(supabase, orgId, userId, {
      coachingState: state.coachingTracker,
      messages: state.coachingMessages,
      savedAt: now,
    })
    setLastSaved(now)
  }, [orgId, userId])

  return {
    resumeData,
    lastSaved,
    handleResume,
    handleStartOver,
    handleManualSave,
    saveBeforeNavigate,
  }
}
