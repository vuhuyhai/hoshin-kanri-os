'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { VisionAnswers, VisionDraft } from '@/lib/discovery/types'
import { postJson } from '@/lib/http/fetch-json'

const VISION_PROMPTS = [
  {
    id: 'q1',
    question:
      'Sau 3 năm nữa, công ty của bạn sẽ phục vụ ai và tạo ra giá trị gì?',
    placeholder:
      'Ví dụ: Chúng tôi sẽ là chuỗi gym được lựa chọn đầu tiên bởi dân văn phòng bận rộn tại Hà Nội...',
  },
  {
    id: 'q2',
    question:
      'Điều gì làm công ty bạn khác biệt hoàn toàn — thứ khách hàng không tìm được ở nơi khác?',
    placeholder:
      'Ví dụ: Chúng tôi là đơn vị duy nhất có huấn luyện viên chuyên phục hồi chức năng...',
  },
  {
    id: 'q3',
    question:
      'Đến cuối năm nay, bạn sẽ cảm thấy thành công nếu đạt được điều gì?',
    placeholder:
      'Ví dụ: Doanh thu 10 tỷ và tỷ lệ giữ chân hội viên trên 80%...',
  },
  {
    id: 'q4',
    question: 'Điều bạn tự hào nhất về công ty hiện tại là gì?',
    placeholder: 'Điểm mạnh nào bạn muốn khuếch đại lên trong 3 năm tới...',
  },
  {
    id: 'q5',
    question:
      'Nếu công ty bạn biến mất, khách hàng sẽ mất đi điều gì không thể tìm thấy ở nơi khác?',
    placeholder: 'Câu này giúp xác định lý do tồn tại thực sự của bạn...',
  },
]

interface VisionGuideProps {
  orgContext: { orgName: string; industry: string; headcount: string }
  initialAnswers: VisionAnswers
  onDraftReady: (answers: VisionAnswers, draft: VisionDraft) => void
}

export function VisionGuide({
  orgContext,
  initialAnswers,
  onDraftReady,
}: VisionGuideProps) {
  const [answers, setAnswers] = useState<VisionAnswers>(initialAnswers)
  const [isLoading, setIsLoading] = useState(false)

  const updateAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const answeredCount = Object.values(answers).filter(
    (v) => v.trim().length > 10
  ).length
  const canGenerate = answeredCount >= 3

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const { draft } = await postJson<{ draft: VisionDraft }>(
        '/api/discovery/vision-draft',
        { answers, orgContext },
      )
      onDraftReady(answers, draft)
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : 'Không thể tạo Vision draft'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-semibold">Trả lời các câu hỏi dưới đây</h2>
        <p className="text-sm text-muted-foreground">
          Không cần hoàn hảo — viết thật, viết nhanh. AI sẽ đúc kết lại. Cần
          trả lời ít nhất 3/5 câu.
        </p>
      </div>

      <div className="space-y-5">
        {VISION_PROMPTS.map((prompt, idx) => {
          const value = answers[prompt.id] ?? ''
          const isFilled = value.trim().length > 10
          return (
            <div key={prompt.id} className="space-y-2">
              <label className="text-sm font-medium leading-relaxed flex items-start gap-2">
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs shrink-0 mt-0.5 transition-colors ${
                    isFilled
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isFilled ? '✓' : idx + 1}
                </span>
                {prompt.question}
              </label>
              <Textarea
                value={value}
                onChange={(e) => updateAnswer(prompt.id, e.target.value)}
                placeholder={prompt.placeholder}
                rows={3}
                className="resize-none text-sm"
                disabled={isLoading}
              />
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {answeredCount}/5 câu đã trả lời
        {answeredCount >= 3 && ' · Đủ điều kiện tạo Vision'}
      </p>

      <Button
        onClick={handleGenerate}
        disabled={!canGenerate || isLoading}
        className="w-full bg-primary hover:bg-primary/90"
        size="lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            AI đang draft Vision...
          </span>
        ) : (
          `Tạo Vision Statement (${answeredCount}/5 câu) →`
        )}
      </Button>
    </div>
  )
}
