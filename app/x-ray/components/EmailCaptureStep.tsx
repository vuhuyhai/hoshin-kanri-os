'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CompanyInfo } from '@/lib/x-ray/types'

const INDUSTRY_OPTIONS = [
  'Fitness & Gym',
  'F&B (Nhà hàng, Cafe)',
  'Giáo dục & Đào tạo',
  'B2B Services',
  'Bán lẻ (Retail)',
  'Thương mại điện tử',
  'Sản xuất',
  'Công nghệ & IT',
  'Bất động sản',
  'Y tế & Sức khỏe',
  'Khác',
] as const

const HEADCOUNT_OPTIONS = [
  { value: '1-10' as const, label: '1–10 người' },
  { value: '10-50' as const, label: '10–50 người' },
  { value: '50-200' as const, label: '50–200 người' },
] as const

interface EmailCaptureStepProps {
  onSubmit: (companyInfo: CompanyInfo) => void
  onBack: () => void
  isLoading: boolean
}

export function EmailCaptureStep({
  onSubmit,
  onBack,
  isLoading,
}: EmailCaptureStepProps) {
  const [form, setForm] = useState<CompanyInfo>({
    email: '',
    companyName: '',
    industry: '',
    headcount: '1-10',
  })
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const isValidEmail = form.email.includes('@') && form.email.includes('.')
  const isFormValid =
    isValidEmail &&
    form.companyName.trim().length >= 2 &&
    form.industry.length > 0

  const showEmailError = touched.email && form.email.length > 0 && !isValidEmail
  const showNameError =
    touched.companyName &&
    form.companyName.length > 0 &&
    form.companyName.trim().length < 2

  const handleSubmit = () => {
    setTouched({ email: true, companyName: true, industry: true })
    if (!isFormValid) return
    onSubmit(form)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-semibold">Bạn đã hoàn thành!</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Cho chúng tôi biết thêm về công ty bạn để báo cáo được{' '}
          <strong>cá nhân hóa theo ngành</strong>.
          <br />
          <span className="text-xs">
            Miễn phí. Không spam. Không cần thẻ tín dụng.
          </span>
        </p>
      </div>

      <div className="space-y-2 rounded-lg bg-muted/50 p-4">
        <p className="text-sm font-medium">Báo cáo của bạn sẽ bao gồm:</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>✅ Điểm sức khỏe cho 5 chiều quan trọng</li>
          <li>✅ Phân tích theo ngành và quy mô công ty</li>
          <li>✅ Top 3 việc cần làm ngay trong 90 ngày</li>
          <li>✅ So sánh với benchmark SME Việt Nam cùng ngành</li>
        </ul>
      </div>

      <div className="space-y-4">
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="xray-company">Tên công ty</Label>
          <Input
            id="xray-company"
            type="text"
            placeholder="VD: ABC Tech, Phở Hùng..."
            value={form.companyName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, companyName: e.target.value }))
            }
            onBlur={() => setTouched((prev) => ({ ...prev, companyName: true }))}
            className={showNameError ? 'border-destructive' : ''}
            disabled={isLoading}
          />
          {showNameError && (
            <p className="text-xs text-destructive">
              Vui lòng nhập tên công ty (ít nhất 2 ký tự)
            </p>
          )}
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="xray-industry">Ngành nghề</Label>
          <select
            id="xray-industry"
            value={form.industry}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, industry: e.target.value }))
            }
            onBlur={() => setTouched((prev) => ({ ...prev, industry: true }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            <option value="">Chọn ngành nghề...</option>
            {INDUSTRY_OPTIONS.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
          {touched.industry && !form.industry && (
            <p className="text-xs text-destructive">Vui lòng chọn ngành nghề</p>
          )}
        </div>

        {/* Headcount */}
        <div className="space-y-2">
          <Label>Quy mô nhân sự</Label>
          <div className="grid grid-cols-3 gap-2">
            {HEADCOUNT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, headcount: opt.value }))
                }
                className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                  form.headcount === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/60 hover:bg-primary/5'
                }`}
                disabled={isLoading}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="xray-email">Email của bạn</Label>
          <Input
            id="xray-email"
            type="email"
            placeholder="ceo@congty.com"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className={showEmailError ? 'border-destructive' : ''}
            disabled={isLoading}
          />
          {showEmailError && (
            <p className="text-xs text-destructive">
              Vui lòng nhập email hợp lệ
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1"
        >
          ← Quay lại
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !isFormValid}
          className="flex-1"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang phân tích...
            </span>
          ) : (
            'Xem báo cáo của tôi →'
          )}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Bằng cách tiếp tục, bạn đồng ý nhận email từ Hoshin Kanri OS. Hủy đăng
        ký bất cứ lúc nào.
      </p>
    </div>
  )
}
