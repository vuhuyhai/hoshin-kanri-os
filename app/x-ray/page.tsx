import type { Metadata } from 'next'
import { XRayForm } from './components/XRayForm'

export const metadata: Metadata = {
  title: 'Business X-Ray — Chẩn đoán sức khỏe doanh nghiệp miễn phí',
  description:
    'Trả lời 15 câu hỏi trong 5 phút. Nhận báo cáo phân tích 5 chiều quan trọng của doanh nghiệp bạn.',
}

export default function XRayPage() {
  return (
    <main className="min-h-screen bg-background">
      <XRayForm />
    </main>
  )
}
