import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-xl font-bold text-primary">Hoshin Kanri OS</span>
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Đăng nhập
          </Button>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Biến chiến lược thành hành động đo được trong{' '}
          <span className="text-primary">90 ngày</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Hoshin Kanri OS — Công cụ quản lý chiến lược cho SME Việt Nam. AI hỗ
          trợ từ phân tích hiện trạng đến triển khai KPI.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/x-ray">
            <Button size="lg" className="px-8 text-base">
              Chẩn đoán miễn phí →
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="px-8 text-base">
              Đăng nhập
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Bắt đầu với Business X-Ray — 5 phút, miễn phí, không cần đăng ký
        </p>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        © 2026 Hoshin Kanri OS. Built for Vietnamese SMEs.
      </footer>
    </div>
  )
}
