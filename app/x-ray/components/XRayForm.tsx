'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { PILLAR_ORDER, OPEX_PILLARS, getQuestionsForPillar } from '@/lib/x-ray/questions'
import type { XRayFormState, CompanyInfo } from '@/lib/x-ray/types'
import { XRayProgress } from './XRayProgress'
import { QuestionStep } from './QuestionStep'
import { EmailCaptureStep } from './EmailCaptureStep'
import { XRayReport } from './XRayReport'
import { AnalyzingLoader } from './AnalyzingLoader'

const LOCALSTORAGE_KEY = 'hoshin_xray_progress_v2'

const initialState: XRayFormState = {
  currentStep: 0,
  answers: {},
  companyInfo: {
    email: '',
    companyName: '',
    industry: '',
    headcount: '1-10',
  },
  isLoading: false,
  result: null,
  error: null,
}

export function XRayForm() {
  const [state, setState] = useState<XRayFormState>(initialState)
  const [showTransition, setShowTransition] = useState(false)
  const [savedSuccessfully, setSavedSuccessfully] = useState<boolean | undefined>(undefined)

  // Restore progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALSTORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<XRayFormState>
        if (parsed.answers && parsed.currentStep !== undefined) {
          setState((prev) => ({
            ...prev,
            answers: parsed.answers as Record<string, number>,
            currentStep: parsed.currentStep as number,
          }))
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Save progress to localStorage
  useEffect(() => {
    if (Object.keys(state.answers).length > 0) {
      localStorage.setItem(
        LOCALSTORAGE_KEY,
        JSON.stringify({
          answers: state.answers,
          currentStep: state.currentStep,
        })
      )
    }
  }, [state.answers, state.currentStep])

  const handleAnswer = (questionId: string, value: number) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }))
  }

  const handleNext = () => {
    const nextStep = state.currentStep + 1
    // Show transition screen when moving to a new pillar
    if (nextStep < PILLAR_ORDER.length) {
      setShowTransition(true)
      setTimeout(() => {
        setShowTransition(false)
        setState((prev) => ({ ...prev, currentStep: nextStep }))
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 1200)
    } else {
      setState((prev) => ({ ...prev, currentStep: nextStep }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCompanySubmit = async (companyInfo: CompanyInfo) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null, companyInfo }))

    try {
      const response = await fetch('/api/x-ray/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: state.answers, companyInfo }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Có lỗi xảy ra')
      }

      localStorage.removeItem(LOCALSTORAGE_KEY)
      setSavedSuccessfully(data.savedSuccessfully ?? false)

      setState((prev) => ({
        ...prev,
        isLoading: false,
        result: data.result,
      }))

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Có lỗi xảy ra'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
      toast.error(message)
    }
  }

  if (state.isLoading) {
    return <AnalyzingLoader companyName={state.companyInfo.companyName} />
  }

  if (state.result) {
    return <XRayReport result={state.result} savedSuccessfully={savedSuccessfully} />
  }

  const isEmailStep = state.currentStep === PILLAR_ORDER.length
  const currentPillar = PILLAR_ORDER[state.currentStep]
  const currentMeta = currentPillar ? OPEX_PILLARS[currentPillar] : null

  // Transition screen between pillars
  if (showTransition && currentMeta) {
    const nextPillar = PILLAR_ORDER[state.currentStep + 1]
    const nextMeta = nextPillar ? OPEX_PILLARS[nextPillar] : null
    if (nextMeta) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="space-y-4 text-center">
            <div className="text-6xl animate-bounce" aria-hidden="true">
              {nextMeta.icon}
            </div>
            <h2 className="font-display text-2xl font-extrabold uppercase tracking-wider text-ink">
              {nextMeta.label}
            </h2>
            <p className="font-body text-[18px] text-text-2">
              {nextMeta.description}
            </p>
          </div>
        </div>
      )
    }
  }

  return (
    <>
      <XRayProgress currentStep={state.currentStep} />
      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <div className="space-y-1 text-center">
          <p className="heading-overline mb-1">Chẩn đoán miễn phí</p>
          <h1 className="font-display text-2xl font-black uppercase tracking-wider text-ink md:text-3xl">
            Business X-Ray
          </h1>
          <p className="font-body text-[18px] text-text-2">
            Chẩn đoán sức khỏe doanh nghiệp theo 7 trụ cột OPEX · ~7 phút
          </p>
        </div>

        {isEmailStep ? (
          <EmailCaptureStep
            onSubmit={handleCompanySubmit}
            onBack={handleBack}
            isLoading={state.isLoading}
          />
        ) : (
          <QuestionStep
            pillar={currentPillar}
            answers={state.answers}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onBack={handleBack}
            isFirstStep={state.currentStep === 0}
          />
        )}
      </div>
    </>
  )
}
