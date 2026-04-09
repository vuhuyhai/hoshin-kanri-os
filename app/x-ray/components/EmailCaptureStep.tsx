'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmailCaptureStepProps {
  onSubmit: (email: string) => void
  onBack: () => void
  isLoading: boolean
}

export function EmailCaptureStep({
  onSubmit,
  onBack,
  isLoading,
}: EmailCaptureStepProps) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const isValidEmail = email.includes('@') && email.includes('.')
  const showError = touched && email.length > 0 && !isValidEmail

  const handleSubmit = () => {
    setTouched(true)
    if (!isValidEmail) return
    onSubmit(email)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3 text-center">
        <div className="text-4xl">🎉</div>
        <h2 className="text-xl font-semibold">Bạn đã hoàn thành!</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Nhập email để nhận báo cáo chẩn đoán sức khỏe doanh nghiệp.
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
          <li>✅ Phân tích điểm mạnh và điểm yếu cụ thể</li>
          <li>✅ Top 3 việc cần làm ngay trong 90 ngày</li>
          <li>✅ So sánh với benchmark SME Việt Nam</li>
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="xray-email">Email của bạn</Label>
        <Input
          id="xray-email"
          type="email"
          placeholder="ceo@congty.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className={showError ? 'border-destructive' : ''}
          disabled={isLoading}
        />
        {showError && (
          <p className="text-xs text-destructive">
            Vui lòng nhập email hợp lệ
          </p>
        )}
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
          disabled={isLoading || !isValidEmail}
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
