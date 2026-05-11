'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Building2, TrendingUp, Minus, TrendingDown } from 'lucide-react'
import { z } from 'zod'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import type { SwotContextData } from '@/lib/swot/types'

const HEADCOUNTS = ['1-10', '10-50', '50-200'] as const
const REVENUES = ['<1B', '1-5B', '5-20B', '20-100B', '>100B'] as const
const TRENDS = ['growing', 'stable', 'declining'] as const
type Headcount = (typeof HEADCOUNTS)[number]
type Revenue = (typeof REVENUES)[number]
type Trend = (typeof TRENDS)[number]

const REVENUE_LABELS: Record<Revenue, string> = {
  '<1B': '< 1 tỷ',
  '1-5B': '1 – 5 tỷ',
  '5-20B': '5 – 20 tỷ',
  '20-100B': '20 – 100 tỷ',
  '>100B': '> 100 tỷ',
}

const TREND_OPTIONS: { value: Trend; label: string; Icon: typeof TrendingUp }[] = [
  { value: 'growing', label: 'Tăng trưởng', Icon: TrendingUp },
  { value: 'stable', label: 'Ổn định', Icon: Minus },
  { value: 'declining', label: 'Giảm', Icon: TrendingDown },
]

const schema = z.object({
  industry: z.string().min(2, 'Vui lòng nhập ngành kinh doanh'),
  headcount: z.enum(HEADCOUNTS),
  mainMarket: z.string().min(2, 'Vui lòng nhập thị trường chính'),
  revenueRange: z.enum(REVENUES),
  revenueTrend: z.enum(TRENDS),
  coreProducts: z.string().min(10, 'Mô tả ít nhất 1 sản phẩm/dịch vụ chính'),
  targetCustomers: z.string().min(10, 'Mô tả đặc điểm khách hàng mục tiêu'),
  mainCompetitors: z.string().min(10, 'Liệt kê ít nhất 1 đối thủ cạnh tranh'),
  competitiveAdvantage: z.string().min(10, 'Mô tả lý do khách hàng chọn bạn'),
  yearGoal: z.string().min(10, 'Mô tả mục tiêu năm nay'),
  topChallenges: z.string().min(20, 'Mô tả chi tiết hơn về thách thức'),
  additionalContext: z.string().optional(),
})

interface SwotContextFormProps {
  orgData: { industry: string; headcount: string; city: string }
  xrayContext?: { topChallenges?: string; yearGoal?: string; competitiveAdvantage?: string }
  onComplete: () => void
}

const LABEL = 'font-body font-bold uppercase text-sm tracking-wider text-ink mb-1.5 block'
const INPUT = 'w-full border-2 border-ink bg-card px-3 py-2.5 font-display text-[15px] text-ink placeholder:text-text-3/70 focus:outline-none focus:shadow-[3px_3px_0_#2C2B2B] transition-shadow'
const HINT = 'font-display text-sm text-text-2 italic'

function GroupHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="border-2 border-ink bg-ink text-white px-3 py-2 font-body text-sm uppercase tracking-wider flex items-center gap-2">
      <span>{icon}</span> {title}
    </div>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="font-body text-xs text-destructive mt-1">{msg}</p>
}

export function SwotContextForm({ orgData, xrayContext, onComplete }: SwotContextFormProps) {
  const setContextData = useSwotStore((s) => s.setContextData)
  const setWorkshopStep = useSwotStore((s) => s.setWorkshopStep)
  const formRef = useRef<HTMLDivElement>(null)

  const initHc = (HEADCOUNTS as readonly string[]).includes(orgData.headcount)
    ? (orgData.headcount as Headcount)
    : ''

  const [form, setForm] = useState({
    industry: orgData.industry ?? '',
    headcount: initHc as Headcount | '',
    mainMarket: orgData.city ?? '',
    revenueRange: '' as Revenue | '',
    revenueTrend: '' as Trend | '',
    coreProducts: '',
    targetCustomers: '',
    mainCompetitors: '',
    competitiveAdvantage: xrayContext?.competitiveAdvantage ?? '',
    yearGoal: xrayContext?.yearGoal ?? '',
    topChallenges: xrayContext?.topChallenges ?? '',
    additionalContext: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }))
  const errCls = (k: string) => (errors[k] ? ' border-destructive' : '')

  const handleSubmit = () => {
    const result = schema.safeParse({
      ...form,
      additionalContext: form.additionalContext.trim() || undefined,
    })
    if (!result.success) {
      const fieldErrs: Record<string, string> = {}
      for (const iss of result.error.issues) {
        const key = iss.path[0]
        if (typeof key === 'string' && !fieldErrs[key]) fieldErrs[key] = iss.message
      }
      setErrors(fieldErrs)
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      const firstKey = Object.keys(fieldErrs)[0]
      if (firstKey) {
        formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    setErrors({})
    setContextData(result.data as SwotContextData)
    setWorkshopStep('workshop')
    onComplete()
  }

  return (
    <div ref={formRef} className="max-w-3xl mx-auto space-y-5">
      <header className="border-2 border-ink bg-bg-warm p-6 shadow-[5px_5px_0_#2C2B2B]">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-ink" />
          <h1 className="font-body font-black text-2xl text-ink uppercase tracking-wider">Bối cảnh Doanh nghiệp</h1>
        </div>
        <p className="font-display text-sm text-text-2 mt-2 ml-9">Cung cấp thông tin để AI phân tích chính xác hơn</p>
      </header>

      <div>
        <GroupHeader icon="🏛️" title="Nền tảng doanh nghiệp" />
        <div className="border-2 border-t-0 border-ink bg-card p-4 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-[5px_5px_0_#2C2B2B]">
          <div data-field="industry">
            <label className={LABEL}>Ngành kinh doanh <span className="text-destructive">*</span></label>
            <input value={form.industry} onChange={(e) => update('industry', e.target.value)} placeholder="F&B, Fitness..." className={INPUT + errCls('industry')} />
            <FieldError msg={errors.industry} />
          </div>
          <div data-field="headcount">
            <label className={LABEL}>Quy mô nhân sự <span className="text-destructive">*</span></label>
            <select value={form.headcount} onChange={(e) => update('headcount', e.target.value as Headcount)} className={INPUT + ' appearance-none' + errCls('headcount')}>
              <option value="" disabled>-- Chọn quy mô --</option>
              <option value="1-10">1 – 10 người</option>
              <option value="10-50">10 – 50 người</option>
              <option value="50-200">50 – 200 người</option>
            </select>
            <FieldError msg={errors.headcount} />
          </div>
          <div data-field="mainMarket" className="md:col-span-2">
            <label className={LABEL}>Thị trường chính <span className="text-destructive">*</span></label>
            <input value={form.mainMarket} onChange={(e) => update('mainMarket', e.target.value)} placeholder="TP.HCM, Hà Nội, cả nước..." className={INPUT + errCls('mainMarket')} />
            <FieldError msg={errors.mainMarket} />
          </div>
        </div>
      </div>

      <div>
        <GroupHeader icon="📊" title="Bức tranh kinh doanh" />
        <div className="border-2 border-t-0 border-ink bg-card p-4 space-y-4 shadow-[5px_5px_0_#2C2B2B]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-field="revenueRange">
              <label className={LABEL}>Doanh thu năm gần nhất <span className="text-destructive">*</span></label>
              <select value={form.revenueRange} onChange={(e) => update('revenueRange', e.target.value as Revenue)} className={INPUT + ' appearance-none' + errCls('revenueRange')}>
                <option value="" disabled>-- Chọn khoảng --</option>
                {REVENUES.map((r) => <option key={r} value={r}>{REVENUE_LABELS[r]}</option>)}
              </select>
              <FieldError msg={errors.revenueRange} />
            </div>
            <div data-field="revenueTrend">
              <label className={LABEL}>Xu hướng doanh thu <span className="text-destructive">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {TREND_OPTIONS.map(({ value, label, Icon }) => {
                  const active = form.revenueTrend === value
                  return (
                    <button key={value} type="button" onClick={() => update('revenueTrend', value)} className={`border-2 border-ink px-2 py-2 font-body font-bold uppercase text-[11px] tracking-wider flex flex-col items-center gap-1 transition-all ${active ? 'bg-ink text-white shadow-[3px_3px_0_#2C2B2B]' : 'bg-card text-ink hover:bg-bg-warm'}`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  )
                })}
              </div>
              <FieldError msg={errors.revenueTrend} />
            </div>
          </div>
          <div data-field="coreProducts">
            <label className={LABEL}>Sản phẩm / Dịch vụ chính <span className="text-destructive">*</span></label>
            <textarea value={form.coreProducts} onChange={(e) => update('coreProducts', e.target.value)} rows={3} placeholder="VD: PT 1-1 (~60% DT), Lớp nhóm (~40%)" className={INPUT + ' resize-none' + errCls('coreProducts')} />
            <FieldError msg={errors.coreProducts} />
          </div>
          <div data-field="targetCustomers">
            <label className={LABEL}>Khách hàng mục tiêu <span className="text-destructive">*</span></label>
            <textarea value={form.targetCustomers} onChange={(e) => update('targetCustomers', e.target.value)} rows={2} placeholder="VD: NVVP 25-40 tuổi tại Hà Nội, cần kết quả nhanh và lịch linh hoạt" className={INPUT + ' resize-none' + errCls('targetCustomers')} />
            <FieldError msg={errors.targetCustomers} />
          </div>
          <p className={HINT}>💡 Thông tin kinh doanh giúp AI xác định Điểm yếu và Cơ hội tăng trưởng chính xác hơn</p>
        </div>
      </div>

      <div>
        <GroupHeader icon="⚔️" title="Cạnh tranh & Nội tại" />
        <div className="border-2 border-t-0 border-ink bg-card p-4 space-y-4 shadow-[5px_5px_0_#2C2B2B]">
          <div data-field="mainCompetitors">
            <label className={LABEL}>Đối thủ cạnh tranh chính <span className="text-destructive">*</span></label>
            <textarea value={form.mainCompetitors} onChange={(e) => update('mainCompetitors', e.target.value)} rows={3} placeholder={'VD: California Fitness – cơ sở vật chất lớn, thương hiệu mạnh\nStudio ABC – giá thấp hơn 30%'} className={INPUT + ' resize-none' + errCls('mainCompetitors')} />
            <FieldError msg={errors.mainCompetitors} />
          </div>
          <div data-field="competitiveAdvantage">
            <label className={LABEL}>Lý do khách hàng chọn bạn <span className="text-destructive">*</span></label>
            <textarea value={form.competitiveAdvantage} onChange={(e) => update('competitiveAdvantage', e.target.value)} rows={2} placeholder="VD: HLV certified quốc tế, tỷ lệ giữ khách 70%+, tư vấn dinh dưỡng" className={INPUT + ' resize-none' + errCls('competitiveAdvantage')} />
            <FieldError msg={errors.competitiveAdvantage} />
          </div>
          <div data-field="yearGoal">
            <label className={LABEL}>Mục tiêu năm nay <span className="text-destructive">*</span></label>
            <textarea value={form.yearGoal} onChange={(e) => update('yearGoal', e.target.value)} rows={2} placeholder="Tăng doanh thu 40%, mở 2 chi nhánh mới..." className={INPUT + ' resize-none' + errCls('yearGoal')} />
            <FieldError msg={errors.yearGoal} />
          </div>
          <div data-field="topChallenges">
            <label className={LABEL}>Thách thức lớn nhất <span className="text-destructive">*</span></label>
            <textarea value={form.topChallenges} onChange={(e) => update('topChallenges', e.target.value)} rows={3} placeholder="Chi phí vận hành tăng, khó tuyển nhân sự, cạnh tranh gay gắt..." className={INPUT + ' resize-none' + errCls('topChallenges')} />
            <FieldError msg={errors.topChallenges} />
          </div>
          <div>
            <label className={LABEL}>Thông tin thêm</label>
            <textarea value={form.additionalContext} onChange={(e) => update('additionalContext', e.target.value)} rows={2} placeholder="Bất kỳ điều gì bạn muốn AI biết thêm (không bắt buộc)" className={INPUT + ' resize-none'} />
          </div>
          <p className={HINT}>💡 Dữ liệu cạnh tranh giúp AI phân biệt Điểm mạnh thực sự (hiếm, khó sao chép) với lợi thế tạm thời</p>
        </div>
      </div>

      <button type="button" onClick={handleSubmit} className="w-full border-2 border-ink bg-accent-brand text-white font-body font-black uppercase text-base py-4 tracking-wider shadow-[5px_5px_0_#2C2B2B] hover:shadow-none hover:translate-x-[5px] hover:translate-y-[5px] transition-all">
        Bắt đầu phân tích AI →
      </button>
    </div>
  )
}
