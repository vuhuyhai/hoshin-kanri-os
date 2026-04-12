'use client'

import { Users, Target, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import IndustryIcon from '@/components/ui/IndustryIcon'
import { XRayBadge } from './XRayPrefillBanner'
import { SwotIndustryDropdown } from './SwotIndustryDropdown'
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

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="font-body text-xs text-[#c73937]">{msg}</p>
}

export function SwotContextFormTier1({
  orgProfile, industry, setIndustry, headcount, setHeadcount,
  topChallenges, setTopChallenges, currentStrengths, setCurrentStrengths,
  breakthroughGoal, setBreakthroughGoal, errors, markDirty, showBadge,
  xrayContext,
}: Tier1Props) {
  const selectedIndustry = INDUSTRY_OPTIONS.find((o) => o.value === industry)

  return (
    <>
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
        <div
          className="border-2 border-ink p-4 flex items-center gap-4 bg-bg-muted-warm"
          style={{ boxShadow: '4px 4px 0 #2C2B2B' }}
        >
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

      {selectedIndustry && (
        <div>
          <SectionLabel>NGÀNH HOẠT ĐỘNG</SectionLabel>
          <div className="flex flex-col items-center gap-3 py-6 border-2 border-ink bg-bg-muted-warm">
            <IndustryIcon industry={industry} size={64} />
            <span className="font-display font-bold text-[15px] text-ink">{selectedIndustry.label}</span>
          </div>
        </div>
      )}

      <div>
        <SectionLabel>THÔNG TIN CƠ BẢN</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SwotIndustryDropdown
            industry={industry}
            setIndustry={setIndustry}
            onDirty={() => markDirty('industry')}
            error={errors.industry}
            showXRayBadge={showBadge('industry')}
          />

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
            <ErrorMsg msg={errors.headcount} />
          </div>
        </div>
      </div>

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
              className="border-2 border-ink resize-none min-h-[100px]"
            />
            {xrayContext && (
              <p className="font-body text-xs text-text-3 mt-1 inline-flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Gợi ý từ Business X-Ray của bạn
              </p>
            )}
            <ErrorMsg msg={errors.topChallenges} />
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
              className="border-2 border-ink resize-none min-h-[100px]"
            />
            <ErrorMsg msg={errors.breakthroughGoal} />
          </div>
        </div>
      </div>

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
            className="border-2 border-ink resize-none min-h-[120px]"
          />
          <ErrorMsg msg={errors.currentStrengths} />
        </div>
      </div>
    </>
  )
}
