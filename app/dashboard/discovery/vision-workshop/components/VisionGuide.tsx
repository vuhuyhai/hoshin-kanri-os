'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { VisionAnswers, VisionDraft } from '@/lib/discovery/types'

const VISION_PROMPTS = [
  {
    id: 'q1',
    question:
      'Sau 3 năm nữa, công ty của bạn sẽ phục vụ ai và tạo ra giá trị gì?',
    placeholder: 'Ví dụ: Chúng tôi sẽ là chuỗi gym hàng đầu cho người đi làm bận rộn...',
  },
  {
    id: 'q2',
    question:
      'Điều gì làm công ty bạn khác biệt so với đối thủ?',
    placeholder: 'Ví dụ: Chúng tôi là đơn vị duy nhất có huấn luyện viên phục hồi chức năng...',
  },
  {
    id: 'q3',
    question:
      'Đến cuối năm nay, bạn sẽ cảm thấy thành công nếu đạt được điều gì?',
    placeholder: 'Ví dụ: Doanh thu đạt 10 tỷ và tỷ lệ giữ chân hội viên trên 80%...',
  },
  {
    id: 'q4',
    question: 'Điều bạn tự hào nhất về công ty hiện tại là gì?',
    placeholder: 'Điểm mạnh nào bạn muốn khuếch đại lên trong 3 năm tới...',
  },
  {
    id: 'q5',
    question:
      'Nếu công ty bạn biến mất, khách hàng sẽ mất đi điều gì?',
    placeholder: 'Điều này giúp xác định lý do tồn tại thực sự...',
  },
]

interface VisionGuideProps {
  orgContext: { industry: string; orgName: string; headcount: string }
  onDraftReady: (answers: VisionAnswers, draft: VisionDraft) => void
}

export function VisionGuide({ orgContext, onDraftReady }: VisionGuideProps) {
  const [answers, setAnswers] = useState<VisionAnswers>({})
  const [isLoading, setIsLoading] = useState(false)

  const answeredCount = Object.values(answers).filter(
    (v) => v.trim().length > 10
  ).length

  const handleGenerate = async () => {
    if (answeredCount < 3) {
      toast.error('Trả lời ít nhất 3 câu hỏi để tạo Vision')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/discovery/vision-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, orgContext }),
      })

      if (!response.ok) throw new Error()
      const { draft } = await response.json()
      onDraftReady(answers, draft)
    } catch {
      toast.error('Không thể tạo Vision draft. Thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">🌟 Vision Workshop</h2>
        <p className="text-sm text-muted-foreground">
          Trả lời ít nhất 3/5 câu. AI sẽ giúp bạn đúc kết Vision.
        </p>
      </div>

      <div className="space-y-5">
        {VISION_PROMPTS.map((prompt, idx) => (
          <div key={prompt.id} className="space-y-2">
            <label className="text-sm font-medium leading-relaxed">
              {idx + 1}. {prompt.question}
            </label>
            <Textarea
              value={answers[prompt.id] ?? ''}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [prompt.id]: e.target.value,
                }))
              }
              placeholder={prompt.placeholder}
              rows={3}
              className="resize-none text-sm"
              disabled={isLoading}
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleGenerate}
        disabled={answeredCount < 3 || isLoading}
        className="w-full"
      >
        {isLoading
          ? 'AI đang draft Vision...'
          : `Tạo Vision Statement (${answeredCount}/5 câu đã trả lời)`}
      </Button>
    </div>
  )
}
