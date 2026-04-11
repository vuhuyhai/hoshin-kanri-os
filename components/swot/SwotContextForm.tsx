'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Briefcase, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import IndustryIcon from '@/components/ui/IndustryIcon'
import { SwotFrameworkPicker } from './SwotFrameworkPicker'
import type { AnalysisFramework, SelectedElements, SwotContextInput } from '@/lib/swot/coaching-types'

interface SwotContextFormProps {
  orgProfile: { name: string; industry: string; headcount: string; city: string }
  onSubmit: (input: SwotContextInput) => Promise<void>
  isLoading: boolean
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

export function SwotContextForm({ orgProfile, onSubmit, isLoading }: SwotContextFormProps) {
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
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      {/* ── Page header ── */}
      <div>
        <span className="heading-overline">Bước 1 / 3</span>
        <h2 className="font-display font-extrabold text-2xl text-ink mt-1">
          Cung cấp bối cảnh doanh nghiệp
        </h2>
        <p className="font-body text-[18px] text-text-2 mt-2">
          Chỉ cần 3–4 phút điền thông tin — AI sẽ tạo bản nháp SWOT đầy đủ
        </p>
      </div>

      {/* ── Org info card ── */}
      <div className="flex items-center gap-4 p-4 border border-bg-muted-warm bg-bg-muted-warm">
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
            Cập nhật tại Cài đặt tổ chức nếu cần →
          </a>
        </div>
      </div>

      {/* ── Industry icon preview ── */}
      {selectedIndustry && (
        <div className="flex flex-col items-center gap-3 py-6 border border-bg-muted-warm bg-bg-muted-warm">
          <IndustryIcon industry={industry} size={64} />
          <span className="font-display font-bold text-[15px] text-ink">
            {selectedIndustry.label}
          </span>
        </div>
      )}

      {/* ── Industry + Headcount ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* ── Current State ── */}
      <fieldset className="space-y-4">
        <legend className="font-display font-bold text-base flex items-center gap-2">
          Hiện trạng (Current State)
        </legend>
        <div className="space-y-1.5">
          <label className="label-brutal" htmlFor="challenges">
            3 thách thức lớn nhất hiện tại *
          </label>
          <Textarea
            id="challenges"
            value={topChallenges}
            onChange={(e) => setTopChallenges(e.target.value)}
            placeholder="Ví dụ: Chi phí vận hành tăng 30%, khó tuyển nhân sự cấp trung..."
            rows={3}
            className="border-2 border-black resize-none"
          />
          {errors.topChallenges && <p className="text-xs text-red-600">{errors.topChallenges}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="label-brutal" htmlFor="strengths">
            Điều doanh nghiệp đang làm TỐT NHẤT *
          </label>
          <Textarea
            id="strengths"
            value={currentStrengths}
            onChange={(e) => setCurrentStrengths(e.target.value)}
            placeholder="Ví dụ: Đội ngũ sales có kinh nghiệm, quy trình sản xuất ổn định..."
            rows={3}
            className="border-2 border-black resize-none"
          />
          {errors.currentStrengths && <p className="text-xs text-red-600">{errors.currentStrengths}</p>}
        </div>
      </fieldset>

      {/* ── Breakthrough Goal ── */}
      <fieldset className="space-y-3">
        <legend className="font-display font-bold text-base flex items-center gap-2">
          Mục tiêu đột phá
        </legend>
        <div className="space-y-1.5">
          <label className="label-brutal" htmlFor="goal">
            Mục tiêu lớn nhất muốn đạt trong 12 tháng tới *
          </label>
          <Textarea
            id="goal"
            value={breakthroughGoal}
            onChange={(e) => setBreakthroughGoal(e.target.value)}
            placeholder="Ví dụ: Tăng doanh thu 40%, mở rộng sang 2 tỉnh mới..."
            rows={2}
            className="border-2 border-black resize-none"
          />
          {errors.breakthroughGoal && <p className="text-xs text-red-600">{errors.breakthroughGoal}</p>}
        </div>
      </fieldset>

      {/* ── Frameworks ── */}
      <fieldset className="space-y-3">
        <legend className="font-display font-bold text-base flex items-center gap-2">
          Góc nhìn phân tích
        </legend>
        <p className="text-xs text-muted-foreground">
          Chọn yếu tố cụ thể — AI sẽ tập trung phân tích SWOT theo đúng những gì bạn quan tâm
        </p>
        <SwotFrameworkPicker
          selectedElements={selectedElements}
          onChange={setSelectedElements}
          error={errors.frameworks}
        />
      </fieldset>

      {/* ── Submit ── */}
      <div className="relative group">
        <Button
          type="submit"
          disabled={isLoading || !elementsValid}
          className="w-full border-2 border-black bg-black text-white font-display font-bold text-sm py-6 shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[4px_4px_0_#000] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang xử lý...
            </span>
          ) : (
            'Bắt đầu phân tích với AI'
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
