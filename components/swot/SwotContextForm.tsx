'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SwotFrameworkPicker } from './SwotFrameworkPicker'
import { XRayPrefillBanner, PrefillSkeleton } from './XRayPrefillBanner'
import type { PrefillResult } from './XRayPrefillBanner'
import { SwotContextFormTier1 } from './SwotContextFormTier1'
import { EMPTY_ELEMENTS, SectionLabel, deriveFrameworks, findIndustryOption } from './swot-context-form-config'
import type { FormErrors } from './swot-context-form-config'
import type { SelectedElements, SwotContextInput } from '@/lib/swot/coaching-types'
import type { XRaySeedContext } from '@/lib/swot/xray-to-swot-mapper'
import { fetchJson } from '@/lib/http/fetch-json'

interface SwotContextFormProps {
  orgProfile: { name: string; industry: string; headcount: string; city: string }
  onSubmit: (input: SwotContextInput) => Promise<void>
  isLoading: boolean
  xrayContext?: XRaySeedContext
}

export function SwotContextForm({ orgProfile, onSubmit, isLoading, xrayContext }: SwotContextFormProps) {
  const initialOption = findIndustryOption(orgProfile.industry)
  const [industry, setIndustry] = useState(initialOption?.value ?? '')
  const [headcount, setHeadcount] = useState(orgProfile.headcount || '')
  const [topChallenges, setTopChallenges] = useState('')
  const [currentStrengths, setCurrentStrengths] = useState('')
  const [breakthroughGoal, setBreakthroughGoal] = useState('')
  const [selectedElements, setSelectedElements] = useState<SelectedElements>(EMPTY_ELEMENTS)
  const [errors, setErrors] = useState<FormErrors>({})
  const [prefillData, setPrefillData] = useState<PrefillResult | null>(null)
  const [showPrefillBanner, setShowPrefillBanner] = useState(false)
  const [prefillLoading, setPrefillLoading] = useState(true)
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set())
  const prefilledRef = useRef<Set<string>>(new Set())
  const [showFrameworks, setShowFrameworks] = useState(false)
  const frameworkRef = useRef<HTMLDivElement>(null)
  const shouldScrollRef = useRef(false)

  const markDirty = (field: string) => {
    setDirtyFields((prev) => {
      if (prev.has(field)) return prev
      return new Set(prev).add(field)
    })
  }
  const showBadge = (field: string) =>
    prefillData !== null && prefilledRef.current.has(field) && !dirtyFields.has(field)
  const tier1Ready = !!industry && !!headcount
    && topChallenges.length >= 20 && currentStrengths.length >= 10 && breakthroughGoal.length >= 15

  // Fetch X-Ray prefill on mount
  useEffect(() => {
    fetchJson<{ prefilled?: boolean } & Partial<PrefillResult>>('/api/swot/prefill-from-xray')
      .then((data) => {
        if (data.prefilled) {
          const result = data as PrefillResult
          setPrefillData(result)
          setShowPrefillBanner(true)
          const filled = new Set<string>()
          if (!industry && result.data.industry) {
            setIndustry(result.data.industry); filled.add('industry')
          }
          if (!headcount && result.data.headcount) {
            setHeadcount(result.data.headcount); filled.add('headcount')
          }
          if (!topChallenges && result.data.challenges) {
            setTopChallenges(result.data.challenges); filled.add('challenges')
          }
          if (!currentStrengths && result.data.strengths) {
            setCurrentStrengths(result.data.strengths); filled.add('strengths')
          }
          prefilledRef.current = filled
          setShowFrameworks(true)
        }
      })
      .catch((err) => console.error('[SwotContextForm] prefill fetch failed:', err))
      .finally(() => setPrefillLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showFrameworks && shouldScrollRef.current) {
      frameworkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      shouldScrollRef.current = false
    }
  }, [showFrameworks])

  useEffect(() => {
    if (!xrayContext) return
    if (!industry) setIndustry(findIndustryOption(orgProfile.industry)?.value ?? '')
    if (!topChallenges && xrayContext.swotHints.weaknesses.length > 0)
      setTopChallenges(xrayContext.swotHints.weaknesses.slice(0, 2).join('. '))
  }, [xrayContext]) // eslint-disable-line react-hooks/exhaustive-deps
  const swValid = selectedElements.eightMs.length >= 1
  const otValid = selectedElements.fiveForces.length + selectedElements.pestel.length >= 1
  const elementsValid = swValid && otValid
  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!industry) e.industry = 'Vui lòng chọn ngành hoạt động'
    if (!headcount) e.headcount = 'Vui lòng chọn quy mô nhân sự'
    if (!topChallenges || topChallenges.length < 20) e.topChallenges = 'Tối thiểu 20 ký tự'
    if (!currentStrengths || currentStrengths.length < 10) e.currentStrengths = 'Tối thiểu 10 ký tự'
    if (!breakthroughGoal || breakthroughGoal.length < 15) e.breakthroughGoal = 'Tối thiểu 15 ký tự'
    if (!elementsValid) e.frameworks = 'Chọn ít nhất 1 yếu tố 8Ms và 1 yếu tố OT (5 Forces hoặc PESTEL)'
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!elementsValid) {
      toast.error('Vui lòng chọn ít nhất 1 yếu tố 8Ms và 1 yếu tố OT')
      return
    }
    if (!validate()) return
    await onSubmit({
      orgName: orgProfile.name, city: orgProfile.city,
      industry, headcount, topChallenges, currentStrengths, breakthroughGoal,
      selectedFrameworks: deriveFrameworks(selectedElements),
      selectedElements,
      xrayContext: xrayContext ?? undefined,
    })
  }
  if (prefillLoading) return <PrefillSkeleton />
  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">
      {showPrefillBanner && prefillData && (
        <XRayPrefillBanner data={prefillData} onDismiss={() => setShowPrefillBanner(false)} />
      )}
      <SwotContextFormTier1
        orgProfile={orgProfile}
        industry={industry} setIndustry={setIndustry}
        headcount={headcount} setHeadcount={setHeadcount}
        topChallenges={topChallenges} setTopChallenges={setTopChallenges}
        currentStrengths={currentStrengths} setCurrentStrengths={setCurrentStrengths}
        breakthroughGoal={breakthroughGoal} setBreakthroughGoal={setBreakthroughGoal}
        errors={errors} markDirty={markDirty} showBadge={showBadge}
        xrayContext={xrayContext}
      />
      {!showFrameworks && (
        <button
          type="button"
          disabled={!tier1Ready}
          onClick={() => { shouldScrollRef.current = true; setShowFrameworks(true) }}
          className="w-full border-2 border-ink bg-ink text-white font-display font-bold text-sm py-3 shadow-[4px_4px_0_#E8452C] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
        >
          Tiếp theo: Chọn góc nhìn phân tích →
        </button>
      )}
      <div ref={frameworkRef}>
        <SectionLabel>GÓC NHÌN PHÂN TÍCH</SectionLabel>
        {showFrameworks ? (
          <div className="transition-all duration-300 ease-in-out space-y-6">
            <p className="text-xs text-text-3">
              Chọn yếu tố cụ thể — AI sẽ tập trung phân tích SWOT theo đúng những gì bạn quan tâm
            </p>
            <SwotFrameworkPicker
              selectedElements={selectedElements}
              onChange={setSelectedElements}
              error={errors.frameworks}
              suggestedSW={prefillData?.data.suggestedFrameworkSW}
              suggestedOT={prefillData?.data.suggestedFrameworkOT}
            />
            <div className="relative group">
              <Button
                type="submit"
                disabled={isLoading || !elementsValid}
                className="w-full border-2 border-ink bg-[#E8452C] text-white font-display font-bold text-sm py-6 shadow-[4px_4px_0_#2C2B2B] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0_#2C2B2B] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : (
                  'Tạo bản nháp SWOT →'
                )}
              </Button>
              {!elementsValid && !isLoading && (
                <div className="invisible group-hover:visible absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink text-white text-xs px-3 py-1.5 border-2 border-ink shadow-[2px_2px_0_#2C2B2B]">
                  Vui lòng chọn ít nhất 1 yếu tố 8Ms và 1 yếu tố OT
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-ink/30 p-6 text-center opacity-50">
            <Lock className="h-5 w-5 mx-auto mb-2 text-text-3" />
            <p className="font-body text-sm text-text-3">
              Hoàn thành thông tin cơ bản để mở khóa bước này
            </p>
          </div>
        )}
      </div>
    </form>
  )
}
