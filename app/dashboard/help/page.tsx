import type { Metadata } from 'next'
import HelpPageClient from './_components/HelpPageClient'

export const metadata: Metadata = {
  title: 'Hướng dẫn sử dụng | Hoshin Kanri OS',
  description: 'Hướng dẫn đầy đủ về cách sử dụng Hoshin Kanri OS — từ Business X-Ray đến X-Matrix và KPI Tracking.',
}

export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <HelpPageClient />
    </div>
  )
}
