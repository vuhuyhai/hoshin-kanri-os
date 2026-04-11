import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liên hệ — Hoshin Kanri OS',
  description: 'Liên hệ với Hoshin Kanri OS — hỗ trợ sản phẩm, tư vấn chiến lược, hợp tác doanh nghiệp.',
}

export default function LienHeLayout({ children }: { children: React.ReactNode }) {
  return children
}
