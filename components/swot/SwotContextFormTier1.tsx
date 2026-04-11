'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Briefcase, Users, Target, TrendingUp, AlertTriangle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import IndustryIcon from '@/components/ui/IndustryIcon'
import { XRayBadge } from './XRayPrefillBanner'
import { INDUSTRY_OPTIONS, HEADCOUNT_OPTIONS, SectionLabel } from './swot-context-form-config'
import type { FormErrors } from './swot-context-form-config'
import type { XRaySeedContext } from '@/lib/swot/xray-to-swot-mapper'

interface Tier1Props {
  orgProfile: { name: string; industry: string; headcount: string; city: string }
  industry: string
  setIndustry: (v: string) => void
  headcount: string
  setHeadcount: (v: string) => void
  topChallenges: string
  setTopChallenges: (v: string) => void
  currentStrengths: string
  setCurrentStrengths: (v: string) => void
  breakthroughGoal: string
  setBreakthroughGoal: (v: string) => void
  errors: FormErrors
  markDirty: (field: string) => void
  showBadge: (field: string) => boolean
  xrayContext?: XRaySeedContext
}

export function SwotContextFormTier1({
  orgProfile, industry, setIndustry, headcount, setHeadcount,
  topChallenges, setTopChallenges, currentStrengths, setCurrentStrengths,
  breakthroughGoal, setBreakthroughGoal, errors, markDirty, showBadge,
  xrayContext,
}: Tier1Props) {
  const [industryOpen, setIndustryOpen] = useState(false)
  const industryRef = useRef<HTMLDivElement>(null)

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

  return (
    <>
      {/* ── HEADER — 2 columns: title + org card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <span className="heading-overline">Bước 1 / 3</span>
          <h2 className="font-display font-extrabold text-2xl text-ink mt-1">
            Cung cấp bối cảnh doanh nghiệp
          </h2>
          <p className="font-body text-[18px] text-text-2 mt-2">
            Chỉ cần 3–4 phút điền thông tin — AI sẽ tạo bản nháp SWOT đầy đủ
          </p>
        </div>
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

      {/* ── INDUSTRY PREVIEW ── */}
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

      {/* ── THÔNG TIN CƠ BẢN ── */}
      <div>
        <SectionLabel>THÔNG TIN CƠ BẢN</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Industry dropdown */}
          <div className="space-y-1.5">
            <label className="label-brutal flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-text-3" />
              Ngành hoạt động *
              {showBadge('industry') && <XRayBadge />}
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
                        markDirty('industry')
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

          {/* Headcount select */}
          <div className="space-y-1.5">
            <label className="label-brutal flex items-center gap-2" htmlFor="headcount">
              <Users className="w-4 h-4 text-text-3" />
              Quy mô nhân sự *
              {showBadge('headcount') && <XRayBadge />}
            </label>
            <select
              id="headcount"
              value={headcount}
              onChange={(e) => { setHeadcount(e.target.value); markDirty('headcount') }}
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

      {/* ── HIỆN TRẠNG ── */}
      <div>
        <SectionLabel>HIỆN TRẠNG</SectionLabel>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="label-brutal flex items-center gap-2" htmlFor="challenges">
              <AlertTriangle className="w-4 h-4 text-text-3" />
              3 thách thức lớn nhất hiện tại *
              {showBadge('challenges') && <XRayBadge />}
            </label>
            <Textarea
              id="challenges"
              value={topChallenges}
              onChange={(e) => { setTopChallenges(e.target.value); markDirty('challenges') }}
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

      {/* ── LỢI THẾ CẠNH TRANH ── */}
      <div>
        <SectionLabel>LỢI THẾ CẠNH TRANH</SectionLabel>
        <div className="space-y-1.5">
          <label className="label-brutal flex items-center gap-2" htmlFor="strengths">
            <TrendingUp className="w-4 h-4 text-text-3" />
            Điều doanh nghiệp đang làm TỐT NHẤT *
            {showBadge('strengths') && <XRayBadge />}
          </label>
          <Textarea
            id="strengths"
            value={currentStrengths}
            onChange={(e) => { setCurrentStrengths(e.target.value); markDirty('strengths') }}
            placeholder="Ví dụ: Đội ngũ sales có kinh nghiệm, quy trình sản xuất ổn định..."
            rows={3}
            className="border-2 border-black resize-none min-h-[120px]"
          />
          {errors.currentStrengths && <p className="text-xs text-red-600">{errors.currentStrengths}</p>}
        </div>
      </div>
    </>
  )
}
