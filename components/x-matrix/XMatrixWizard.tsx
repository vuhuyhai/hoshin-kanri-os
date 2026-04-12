'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { WizardProgress } from './WizardProgress'
import { Step1Vision } from './Step1Vision'
import { Step2Hoshins } from './Step2Hoshins'
import { Step3Initiatives } from './Step3Initiatives'
import { Step4Kpis } from './Step4Kpis'
import { XMatrixReview } from './XMatrixReview'
import { calcCompleteness } from '@/lib/x-matrix/utils'
import type { XMatrixData, WizardStep, OrgMember } from '@/lib/x-matrix/types'
import { fetchJson } from '@/lib/http/fetch-json'

const EMPTY_DATA: XMatrixData = {
  vision: '',
  yearGoals: [''],
  hoshins: [],
}

interface XMatrixWizardProps {
  orgId: string
  members: OrgMember[]
}

export function XMatrixWizard({ orgId, members }: XMatrixWizardProps) {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<WizardStep>(1)
  const [data, setData] = useState<XMatrixData>(EMPTY_DATA)
  const [isLoadingPrefill, setIsLoadingPrefill] = useState(true)
  const [showPrefillBanner, setShowPrefillBanner] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    fetchJson<{
      data: XMatrixData | null
      hasPrefill: boolean
      completeness: number
    }>('/api/x-matrix/prefill')
      .then((res) => {
        if (res.hasPrefill && res.data) {
          setData(res.data)
          const isPrefilled = searchParams.get('prefilled') === 'true'
          if (isPrefilled) {
            setShowPrefillBanner(true)
            setTimeout(() => setShowPrefillBanner(false), 10000)
            // Jump to Step 2 (Hoshins) when coming from SWOT sync
            setStep(2)
          }
          toast.success(`X-Matrix pre-fill ${res.completeness}% từ Discovery!`)
        }
      })
      .catch(() => {
        /* Fail silently — user fills manually */
      })
      .finally(() => setIsLoadingPrefill(false))
  }, [])

  const goTo = (s: WizardStep) => {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoadingPrefill) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-3">
        <div
          className="inline-flex items-center justify-center w-16 h-16 border-2 border-ink bg-white"
          style={{ boxShadow: '3px 3px 0 #2C2B2B' }}
        >
          <Loader2 className="w-8 h-8 text-ink animate-spin" />
        </div>
        <p className="font-body text-sm text-text-3">Đang tải dữ liệu Discovery...</p>
      </div>
    )
  }

  const completeness = calcCompleteness(data)

  return (
    <div className="max-w-2xl mx-auto">
      {showPrefillBanner && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 border-2 border-green-500 bg-green-50 dark:bg-green-950/40">
          <span className="text-lg shrink-0">✨</span>
          <p className="text-sm text-green-800 dark:text-green-200 flex-1">
            X-Matrix đã được pre-fill từ phân tích SWOT. Review và xác nhận
            từng Hoshin bên dưới.
          </p>
          <button
            onClick={() => setShowPrefillBanner(false)}
            className="text-green-600 hover:text-green-800 text-sm shrink-0"
          >
            ✕
          </button>
        </div>
      )}
      <WizardProgress currentStep={step} completeness={completeness} />

      <div className="border rounded-xl p-6">
        {step === 1 && (
          <Step1Vision data={data} onChange={setData} onNext={() => goTo(2)} />
        )}
        {step === 2 && (
          <Step2Hoshins
            data={data}
            onChange={setData}
            onNext={() => goTo(3)}
            onBack={() => goTo(1)}
          />
        )}
        {step === 3 && (
          <Step3Initiatives
            data={data}
            onChange={setData}
            onNext={() => goTo(4)}
            onBack={() => goTo(2)}
          />
        )}
        {step === 4 && (
          <Step4Kpis
            data={data}
            members={members}
            onChange={setData}
            onNext={() => goTo(5)}
            onBack={() => goTo(3)}
          />
        )}
        {step === 5 && (
          <XMatrixReview data={data} orgId={orgId} onBack={() => goTo(4)} />
        )}
      </div>
    </div>
  )
}
