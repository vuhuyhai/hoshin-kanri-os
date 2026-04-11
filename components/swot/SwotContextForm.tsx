'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SwotFrameworkPicker } from './SwotFrameworkPicker'
import type { AnalysisFramework, SwotContextInput } from '@/lib/swot/coaching-types'

interface SwotContextFormProps {
  orgProfile: { name: string; industry: string; headcount: string; city: string }
  onSubmit: (input: SwotContextInput) => Promise<void>
  isLoading: boolean
}

const HEADCOUNT_OPTIONS = [
  { value: '1-10', label: 'Dưới 10 người' },
  { value: '10-50', label: '10–50 người' },
  { value: '50-200', label: '50–200 người' },
  { value: '200+', label: 'Trên 200 người' },
]

type FormErrors = Partial<Record<'industry' | 'headcount' | 'topChallenges' | 'currentStrengths' | 'breakthroughGoal' | 'frameworks', string>>

export function SwotContextForm({ orgProfile, onSubmit, isLoading }: SwotContextFormProps) {
  const [industry, setIndustry] = useState(orgProfile.industry || '')
  const [headcount, setHeadcount] = useState(orgProfile.headcount || '')
  const [topChallenges, setTopChallenges] = useState('')
  const [currentStrengths, setCurrentStrengths] = useState('')
  const [breakthroughGoal, setBreakthroughGoal] = useState('')
  const [selectedFrameworks, setSelectedFrameworks] = useState<AnalysisFramework[]>([])
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!industry || industry.length < 2) e.industry = 'Vui lòng nhập ngành hoạt động'
    if (!headcount) e.headcount = 'Vui lòng chọn quy mô nhân sự'
    if (!topChallenges || topChallenges.length < 20) e.topChallenges = 'Tối thiểu 20 ký tự'
    if (!currentStrengths || currentStrengths.length < 10) e.currentStrengths = 'Tối thiểu 10 ký tự'
    if (!breakthroughGoal || breakthroughGoal.length < 15) e.breakthroughGoal = 'Tối thiểu 15 ký tự'
    if (selectedFrameworks.length === 0) e.frameworks = 'Chọn ít nhất 1 góc nhìn phân tích'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit({
      orgName: orgProfile.name, city: orgProfile.city,
      industry, headcount, topChallenges, currentStrengths, breakthroughGoal, selectedFrameworks,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="font-display font-extrabold text-xl">Cung cấp bối cảnh để AI phân tích SWOT</h2>
        <p className="text-sm text-muted-foreground mt-1">Chỉ cần 3-4 phút điền thông tin — AI sẽ tạo bản nháp SWOT đầy đủ</p>
      </div>

      <div className="bg-yellow-100 border-2 border-black p-4">
        <p className="font-display font-bold text-sm">{orgProfile.name} · {orgProfile.city}</p>
        <p className="text-xs text-muted-foreground mt-1">Cập nhật tại Cài đặt tổ chức nếu cần</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="industry">Ngành hoạt động *</Label>
          <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)}
            placeholder="Ví dụ: F&B, Bán lẻ, Sản xuất, Công nghệ..." className="border-2 border-black" />
          {errors.industry && <p className="text-xs text-red-600">{errors.industry}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="headcount">Quy mô nhân sự *</Label>
          <Select value={headcount} onValueChange={(v) => setHeadcount(v ?? '')}>
            <SelectTrigger className="border-2 border-black">
              <SelectValue placeholder="Chọn quy mô..." />
            </SelectTrigger>
            <SelectContent>
              {HEADCOUNT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.headcount && <p className="text-xs text-red-600">{errors.headcount}</p>}
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="font-display font-bold text-base flex items-center gap-2">
          📊 Hiện trạng (Current State)
        </legend>
        <div className="space-y-1.5">
          <Label htmlFor="challenges">3 thách thức lớn nhất hiện tại *</Label>
          <Textarea id="challenges" value={topChallenges} onChange={(e) => setTopChallenges(e.target.value)}
            placeholder="Ví dụ: Chi phí vận hành tăng 30%, khó tuyển nhân sự cấp trung..." rows={3}
            className="border-2 border-black resize-none" />
          {errors.topChallenges && <p className="text-xs text-red-600">{errors.topChallenges}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="strengths">Điều doanh nghiệp đang làm TỐT NHẤT *</Label>
          <Textarea id="strengths" value={currentStrengths} onChange={(e) => setCurrentStrengths(e.target.value)}
            placeholder="Ví dụ: Đội ngũ sales có kinh nghiệm, quy trình sản xuất ổn định..." rows={3}
            className="border-2 border-black resize-none" />
          {errors.currentStrengths && <p className="text-xs text-red-600">{errors.currentStrengths}</p>}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-display font-bold text-base flex items-center gap-2">
          🎯 Mục tiêu đột phá
        </legend>
        <div className="space-y-1.5">
          <Label htmlFor="goal">Mục tiêu lớn nhất muốn đạt trong 12 tháng tới *</Label>
          <Textarea id="goal" value={breakthroughGoal} onChange={(e) => setBreakthroughGoal(e.target.value)}
            placeholder="Ví dụ: Tăng doanh thu 40%, mở rộng sang 2 tỉnh mới..." rows={2}
            className="border-2 border-black resize-none" />
          {errors.breakthroughGoal && <p className="text-xs text-red-600">{errors.breakthroughGoal}</p>}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-display font-bold text-base flex items-center gap-2">
          🔍 Góc nhìn phân tích
        </legend>
        <p className="text-xs text-muted-foreground">Chọn ít nhất 1 framework — AI sẽ dùng để phân tích SWOT phù hợp nhất</p>
        <SwotFrameworkPicker selected={selectedFrameworks} onChange={setSelectedFrameworks} error={errors.frameworks} />
      </fieldset>

      <Button type="submit" disabled={isLoading}
        className="w-full border-2 border-black bg-black text-white font-display font-bold text-sm py-6 shadow-[4px_4px_0_#000] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all">
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Đang xử lý...
          </span>
        ) : '⚡ Tạo SWOT với AI'}
      </Button>
    </form>
  )
}
