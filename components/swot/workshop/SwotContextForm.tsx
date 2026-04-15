'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Briefcase } from 'lucide-react'
import { z } from 'zod'
import { useSwotStore } from '@/lib/swot/swot-session-store'
import type { SwotContextData } from '@/lib/swot/types'

const HEADCOUNT_VALUES = ['1-10', '10-50', '50-200'] as const
type Headcount = (typeof HEADCOUNT_VALUES)[number]

const contextSchema = z.object({
  industry: z.string().trim().min(2, 'Ngành kinh doanh tối thiểu 2 ký tự'),
  headcount: z.enum(HEADCOUNT_VALUES, { message: 'Chọn quy mô nhân sự' }),
  mainMarket: z.string().trim().min(2, 'Thị trường chính tối thiểu 2 ký tự'),
  yearGoal: z.string().trim().min(10, 'Mục tiêu năm nay tối thiểu 10 ký tự'),
  topChallenges: z.string().trim().min(20, 'Thách thức tối thiểu 20 ký tự'),
  additionalContext: z.string().optional(),
})

interface SwotContextFormProps {
  orgData: { industry: string; headcount: string; city: string }
  xrayContext?: { topChallenges?: string; yearGoal?: string }
  onComplete: () => void
}

const LABEL = 'font-body font-bold uppercase text-xs tracking-wider text-ink mb-1.5 block'
const INPUT =
  'w-full border-2 border-ink bg-white px-3 py-2.5 font-display text-[15px] text-ink placeholder:text-text-3 focus:outline-none focus:shadow-[3px_3px_0_#2C2B2B] transition-shadow'

export function SwotContextForm({ orgData, xrayContext, onComplete }: SwotContextFormProps) {
  const setContextData = useSwotStore((s) => s.setContextData)
  const setWorkshopStep = useSwotStore((s) => s.setWorkshopStep)

  const initialHc = (HEADCOUNT_VALUES as readonly string[]).includes(orgData.headcount)
    ? (orgData.headcount as Headcount)
    : ''
  const [industry, setIndustry] = useState(orgData.industry ?? '')
  const [headcount, setHeadcount] = useState<Headcount | ''>(initialHc)
  const [mainMarket, setMainMarket] = useState(orgData.city ?? '')
  const [yearGoal, setYearGoal] = useState(xrayContext?.yearGoal ?? '')
  const [topChallenges, setTopChallenges] = useState(xrayContext?.topChallenges ?? '')
  const [additional, setAdditional] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const errCls = (k: string) => (errors[k] ? ' border-red-500' : '')

  const handleSubmit = () => {
    const result = contextSchema.safeParse({
      industry,
      headcount,
      mainMarket,
      yearGoal,
      topChallenges,
      additionalContext: additional.trim() || undefined,
    })
    if (!result.success) {
      const fieldErrs: Record<string, string> = {}
      for (const iss of result.error.issues) {
        const key = iss.path[0]
        if (typeof key === 'string' && !fieldErrs[key]) fieldErrs[key] = iss.message
      }
      setErrors(fieldErrs)
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }
    setErrors({})
    const data: SwotContextData = { ...result.data, city: orgData.city }
    setContextData(data)
    setWorkshopStep('workshop')
    onComplete()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header className="border-2 border-ink bg-bg-warm p-6 shadow-[5px_5px_0_#2C2B2B]">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-ink" />
          <h1 className="font-body font-black text-2xl text-ink uppercase tracking-wider">
            Bối cảnh Doanh nghiệp
          </h1>
        </div>
        <p className="font-display text-sm text-text-2 mt-2 ml-9">
          Cung cấp thông tin để AI phân tích chính xác hơn
        </p>
      </header>

      <div className="border-2 border-ink bg-white p-6 shadow-[5px_5px_0_#2C2B2B] space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Ngành kinh doanh <span className="text-red-500">*</span></label>
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="F&B, Fitness, Retail..."
              className={INPUT + errCls('industry')}
            />
            {errors.industry && <p className="font-body text-xs text-red-500 mt-1">{errors.industry}</p>}
          </div>

          <div>
            <label className={LABEL}>Quy mô nhân sự <span className="text-red-500">*</span></label>
            <select
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value as Headcount)}
              className={INPUT + ' appearance-none' + errCls('headcount')}
            >
              <option value="" disabled>-- Chọn quy mô --</option>
              <option value="1-10">1-10 người</option>
              <option value="10-50">10-50 người</option>
              <option value="50-200">50-200 người</option>
            </select>
            {errors.headcount && <p className="font-body text-xs text-red-500 mt-1">{errors.headcount}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={LABEL}>Thị trường chính <span className="text-red-500">*</span></label>
            <input
              value={mainMarket}
              onChange={(e) => setMainMarket(e.target.value)}
              placeholder="TP.HCM, Hà Nội, cả nước..."
              className={INPUT + errCls('mainMarket')}
            />
            {errors.mainMarket && <p className="font-body text-xs text-red-500 mt-1">{errors.mainMarket}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={LABEL}>Mục tiêu năm nay <span className="text-red-500">*</span></label>
            <textarea
              value={yearGoal}
              onChange={(e) => setYearGoal(e.target.value)}
              rows={2}
              placeholder="Tăng doanh thu 40%, mở 2 chi nhánh mới..."
              className={INPUT + ' resize-none' + errCls('yearGoal')}
            />
            {errors.yearGoal && <p className="font-body text-xs text-red-500 mt-1">{errors.yearGoal}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={LABEL}>Thách thức lớn nhất <span className="text-red-500">*</span></label>
            <textarea
              value={topChallenges}
              onChange={(e) => setTopChallenges(e.target.value)}
              rows={3}
              placeholder="Chi phí vận hành tăng, khó tuyển nhân sự, cạnh tranh gay gắt..."
              className={INPUT + ' resize-none' + errCls('topChallenges')}
            />
            {errors.topChallenges && <p className="font-body text-xs text-red-500 mt-1">{errors.topChallenges}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={LABEL}>Thông tin thêm</label>
            <textarea
              value={additional}
              onChange={(e) => setAdditional(e.target.value)}
              rows={2}
              placeholder="Bất kỳ điều gì bạn muốn AI biết thêm (không bắt buộc)"
              className={INPUT + ' resize-none'}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full border-2 border-ink bg-accent-brand text-white font-body font-black uppercase text-base py-4 tracking-wider shadow-[5px_5px_0_#2C2B2B] hover:shadow-none hover:translate-x-[5px] hover:translate-y-[5px] transition-all"
        >
          Bắt đầu phân tích AI →
        </button>
      </div>
    </div>
  )
}
