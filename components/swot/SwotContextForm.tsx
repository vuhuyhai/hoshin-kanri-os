'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Briefcase, Users, Target, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import IndustryIcon from '@/components/ui/IndustryIcon'
import { SwotFrameworkPicker } from './SwotFrameworkPicker'
import type { AnalysisFramework, SelectedElements, SwotContextInput } from '@/lib/swot/coaching-types'
import type { XRaySeedContext } from '@/lib/swot/xray-to-swot-mapper'

interface SwotContextFormProps {
  orgProfile: { name: string; industry: string; headcount: string; city: string }
  onSubmit: (input: SwotContextInput) => Promise<void>
  isLoading: boolean
  xrayContext?: XRaySeedContext
}

const INDUSTRY_OPTIONS = [
  { value: 'fitness',       label: 'Fitness & Thể thao'  },
  { value: 'fnb',           label: 'F&B / Nhà hàng'      },
  { value: 'retail',        label: 'Bán lẻ'              },
  { value: 'education',     label: 'Giáo dục & Đào tạo'  },
  { value: 'healthcare',    label: 'Y tế & Sức khỏe'     },
  { value: 'technology',    label: 'Công nghệ'            },
  { value: 'manufacturing', label: 'Sản xuất'             },
  { value: 'construction',  label: 'Xây dựng & BĐS'     },
  { value: 'logistics',     label: 'Logistics & Vận tải' },
  { value: 'finance',       label: 'Tài chính & Kế toán' },
  { value: 'beauty',        label: 'Làm đẹp & Spa'       },
  { value: 'agriculture',   label: 'Nông nghiệp'         },
  { value: 'other',         label: 'Ngành khác'           },
]

const HEADCOUNT_OPTIONS = [
  { value: '1-10',   label: '1–10 người' },
  { value: '10-50',  label: '10–50 người' },
  { value: '50-200', label: '50–200 người' },
  { value: '200+',   label: '200+ người' },
]

const EMPTY_ELEMENTS: SelectedElements = { eightMs: [], fiveForces: [], pestel: [] }

type FormErrors = Partial<Record<'industry' | 'headcount' | 'topChallenges' | 'currentStrengths' | 'breakthroughGoal' | 'frameworks', string>>

function deriveFrameworks(el: SelectedElements): AnalysisFramework[] {
  const fw: AnalysisFramework[] = []
  if (el.eightMs.length > 0) fw.push('8Ms')
  if (el.fiveForces.length > 0) fw.push('5Forces')
  if (el.pestel.length > 0) fw.push('PESTEL')
  return fw
}

function findIndustryOption(raw: string) {
  return INDUSTRY_OPTIONS.find((o) => o.value === raw) ??
    INDUSTRY_OPTIONS.find((o) => o.label.toLowerCase() === raw.toLowerCase()) ??
    null
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground border-b-2 border-black pb-1 mb-4">
      {children}
    </div>
  )
}

export function SwotContextForm({ orgProfile, onSubmit, isLoading, xrayContext }: SwotContextFormProps) {
  const initialOption = findIndustryOption(orgProfile.industry)
  const [industry, setIndustry] = useState(initialOption?.value ?? '')
  const [industryOpen, setIndustryOpen] = useState(false)
  const industryRef = useRef<HTMLDivElement>(null)
  const [headcount, setHeadcount] = useState(orgProfile.headcount || '')
  const [topChallenges, setTopChallenges] = useState('')
  const [currentStrengths, setCurrentStrengths] = useState('')
  const [breakthroughGoal, setBreakthroughGoal] = useState('')
  const [selectedElements, setSelectedElements] = useState<SelectedElements>(EMPTY_ELEMENTS)
  const [errors, setErrors] = useState<FormErrors>({})

  const selectedIndustry = INDUSTRY_OPTIONS.find((o) => o.value === industry)

  // Click outside → close dropdown
  useEffect(() => {
    if (!industryOpen) return
    const handler = (e: MouseEvent) => {
      if (industryRef.current && !industryRef.current.contains(e.target as Node)) {
        setIndustryOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [industryOpen])

  // Auto-fill from X-Ray context
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

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-8">

      {/* ══════════════════════════════════════════════════════════
          HEADER SECTION — 2 columns: title (2/3) + org card (1/3)
          ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left col — step info */}
        <div className="lg:col-span-2">
          <span className="heading-overline">Bước 1 / 3</span>
          <h2 className="font-display font-extrabold text-2xl text-ink mt-1">
            Cung cấp bối cảnh doanh nghiệp
          </h2>
          <p className="font-body text-[18px] text-text-2 mt-2">
            Chỉ cần 3–4 phút điền thông tin — AI sẽ tạo bản nháp SWOT đầy đủ
          </p>
        </div>

        {/* Right col — org info card (neobrutalism) */}
        <div className="border-2 border-black shadow-[4px_4px_0_#2C2B2B] p-4 flex items-center gap-4 bg-bg-muted-warm">
          <div className="w-10 h-10 bg-accent-brand flex items-center justify-center flex-shrink-0">
            <span className="font-display font-black text-white text-sm">
              {orgProfile.name[0]}
            </span>
          </div>
          <div>
            <p className="font-display font-bold text-[15px] text-ink">
              {orgProfile.name} · {orgProfile.city}
            </p>
            <a
              href="/dashboard/settings"
              className="font-body text-[14px] text-text-3 hover:text-accent-brand transition-colors"
            >
              Cập nhật tại Cài đặt tổ chức →
            </a>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          INDUSTRY PREVIEW — full width card
          ══════════════════════════════════════════════════════════ */}
      {selectedIndustry && (
        <div>
          <SectionLabel>NGÀNH HOẠT ĐỘNG</SectionLabel>
          <div className="flex flex-col items-center gap-3 py-6 border-2 border-black bg-bg-muted-warm">
            <IndustryIcon industry={industry} size={64} />
            <span className="font-display font-bold text-[15px] text-ink">
              {selectedIndustry.label}
            </span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          GROUP 1 — THÔNG TIN CƠ BẢN (grid 2 cột)
          ══════════════════════════════════════════════════════════ */}
      <div>
        <SectionLabel>THÔNG TIN CƠ BẢN</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Industry — custom dropdown */}
          <div className="space-y-1.5">
            <label className="label-brutal flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-text-3" />
              Ngành hoạt động *
            </label>
            <div className="relative" ref={industryRef}>
              <button
                type="button"
                onClick={() => setIndustryOpen(!industryOpen)}
                className="input-brutal flex items-center justify-between w-full"
              >
                <span className="flex items-center gap-2">
                  {selectedIndustry ? (
                    <>
                      <IndustryIcon industry={industry} size={24} />
                      <span className="font-body text-[18px] text-ink">
                        {selectedIndustry.label}
                      </span>
                    </>
                  ) : (
                    <span className="font-body text-[18px] text-text-3">
                      Chọn ngành...
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-3 flex-shrink-0 transition-transform ${
                    industryOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {industryOpen && (
                <div className="absolute top-full left-0 w-full bg-white border-2 border-ink shadow-brutal-md z-50 max-h-64 overflow-y-auto">
                  {INDUSTRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setIndustry(opt.value)
                        setIndustryOpen(false)
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-3 font-body text-[16px] text-left border-b border-bg-muted-warm transition-colors ${
                        industry === opt.value
                          ? 'bg-accent-brand text-white'
                          : 'hover:bg-bg-muted-warm text-ink'
                      }`}
                    >
                      <IndustryIcon industry={opt.value} size={24} />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.industry && <p className="text-xs text-red-600">{errors.industry}</p>}
          </div>

          {/* Headcount — native select */}
          <div className="space-y-1.5">
            <label className="label-brutal flex items-center gap-2" htmlFor="headcount">
              <Users className="w-4 h-4 text-text-3" />
              Quy mô nhân sự *
            </label>
            <select
              id="headcount"
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value)}
              className="input-brutal appearance-none"
            >
              <option value="" disabled>Chọn quy mô...</option>
              {HEADCOUNT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.headcount && <p className="text-xs text-red-600">{errors.headcount}</p>}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          GROUP 2 — HIỆN TRẠNG (full width, stacked)
          ══════════════════════════════════════════════════════════ */}
      <div>
        <SectionLabel>HIỆN TRẠNG</SectionLabel>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="label-brutal flex items-center gap-2" htmlFor="challenges">
              <AlertTriangle className="w-4 h-4 text-text-3" />
              3 thách thức lớn nhất hiện tại *
            </label>
            <Textarea
              id="challenges"
              value={topChallenges}
              onChange={(e) => setTopChallenges(e.target.value)}
              placeholder="Ví dụ: Chi phí vận hành tăng 30%, khó tuyển nhân sự cấp trung..."
              rows={3}
              className="border-2 border-black resize-none min-h-[100px]"
            />
            {xrayContext && <p className="text-xs text-[#8A8787] mt-1">💡 Gợi ý từ Business X-Ray của bạn</p>}
            {errors.topChallenges && <p className="text-xs text-red-600">{errors.topChallenges}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="label-brutal flex items-center gap-2" htmlFor="goal">
              <Target className="w-4 h-4 text-text-3" />
              Mục tiêu lớn nhất muốn đạt trong 12 tháng tới *
            </label>
            <Textarea
              id="goal"
              value={breakthroughGoal}
              onChange={(e) => setBreakthroughGoal(e.target.value)}
              placeholder="Ví dụ: Tăng doanh thu 40%, mở rộng sang 2 tỉnh mới..."
              rows={3}
              className="border-2 border-black resize-none min-h-[100px]"
            />
            {errors.breakthroughGoal && <p className="text-xs text-red-600">{errors.breakthroughGoal}</p>}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          GROUP 3 — LỢI THẾ CẠNH TRANH (full width)
          ══════════════════════════════════════════════════════════ */}
      <div>
        <SectionLabel>LỢI THẾ CẠNH TRANH</SectionLabel>
        <div className="space-y-1.5">
          <label className="label-brutal flex items-center gap-2" htmlFor="strengths">
            <TrendingUp className="w-4 h-4 text-text-3" />
            Điều doanh nghiệp đang làm TỐT NHẤT *
          </label>
          <Textarea
            id="strengths"
            value={currentStrengths}
            onChange={(e) => setCurrentStrengths(e.target.value)}
            placeholder="Ví dụ: Đội ngũ sales có kinh nghiệm, quy trình sản xuất ổn định..."
            rows={3}
            className="border-2 border-black resize-none min-h-[120px]"
          />
          {errors.currentStrengths && <p className="text-xs text-red-600">{errors.currentStrengths}</p>}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          GROUP 4 — GÓC NHÌN PHÂN TÍCH (full width)
          ══════════════════════════════════════════════════════════ */}
      <div>
        <SectionLabel>GÓC NHÌN PHÂN TÍCH</SectionLabel>
        <p className="text-xs text-muted-foreground mb-3">
          Chọn yếu tố cụ thể — AI sẽ tập trung phân tích SWOT theo đúng những gì bạn quan tâm
        </p>
        <SwotFrameworkPicker
          selectedElements={selectedElements}
          onChange={setSelectedElements}
          error={errors.frameworks}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════
          SUBMIT — neobrutalism button
          ══════════════════════════════════════════════════════════ */}
      <div className="relative group">
        <Button
          type="submit"
          disabled={isLoading || !elementsValid}
          className="w-full border-2 border-black bg-black text-white font-display font-bold text-sm py-6 shadow-[4px_4px_0_#E8452C] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0_#E8452C] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
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
          <div className="invisible group-hover:visible absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_#000]">
            Vui lòng chọn ít nhất 1 yếu tố 8Ms và 1 yếu tố OT
          </div>
        )}
      </div>
    </form>
  )
}
