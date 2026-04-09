'use client'

import { useRouter } from 'next/navigation'
import type { XRayResult } from '@/lib/x-ray/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface XRayReportProps {
  result: XRayResult
}

const LEVEL_CONFIG = {
  critical: {
    label: 'Nguy hiểm',
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950',
    bar: 'bg-red-500',
    badge: 'destructive' as const,
  },
  weak: {
    label: 'Yếu',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950',
    bar: 'bg-orange-500',
    badge: 'outline' as const,
  },
  moderate: {
    label: 'Khá',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    bar: 'bg-yellow-500',
    badge: 'outline' as const,
  },
  strong: {
    label: 'Tốt',
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950',
    bar: 'bg-green-500',
    badge: 'outline' as const,
  },
}

function ScoreBar({
  score,
  level,
}: {
  score: number
  level: XRayResult['overallLevel']
}) {
  const config = LEVEL_CONFIG[level]
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={cn('font-semibold', config.color)}>{score}/100</span>
        <Badge variant={config.badge}>{config.label}</Badge>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            config.bar
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export function XRayReport({ result }: XRayReportProps) {
  const router = useRouter()

  const handlePrint = () => window.print()
  const handleSignup = () => router.push('/login?from=xray')

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">
            Báo Cáo Sức Khỏe Doanh Nghiệp
          </h1>
          <p className="text-sm text-muted-foreground">
            Phân tích bởi Hoshin Kanri OS ·{' '}
            {new Date(result.completedAt).toLocaleDateString('vi-VN')}
          </p>
        </div>

        <div
          className={cn(
            'space-y-4 rounded-xl p-6',
            LEVEL_CONFIG[result.overallLevel].bg
          )}
        >
          <h2 className="text-lg font-semibold">Điểm Tổng Thể</h2>
          <ScoreBar score={result.overallScore} level={result.overallLevel} />
          <p className="text-sm leading-relaxed">{result.executiveSummary}</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Chi Tiết 5 Chiều</h2>
          {result.dimensions.map((dim) => (
            <div
              key={dim.dimensionId}
              className="space-y-3 rounded-lg border p-4"
            >
              <h3 className="font-medium">{dim.name}</h3>
              <ScoreBar score={dim.score} level={dim.level} />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {dim.feedback}
              </p>
              <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
                <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Vấn đề chính:
                </span>
                <p className="text-sm">{dim.topIssue}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-lg border p-6">
          <h2 className="text-lg font-semibold">🎯 Top 3 Việc Cần Làm Ngay</h2>
          <ol className="space-y-3">
            {result.topPriorities.map((priority, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {idx + 1}
                </span>
                <p className="text-sm leading-relaxed">{priority}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="no-print space-y-4 rounded-xl border border-primary/20 bg-primary/10 p-6 text-center">
          <p className="font-medium leading-relaxed">{result.ctaMessage}</p>
          <Button onClick={handleSignup} size="lg" className="w-full">
            Tạo tài khoản miễn phí để lập kế hoạch hành động →
          </Button>
          <p className="text-xs text-muted-foreground">
            Miễn phí · Không cần thẻ tín dụng · Setup trong 5 phút
          </p>
        </div>

        <div className="no-print flex gap-3">
          <Button variant="outline" onClick={handlePrint} className="flex-1">
            🖨️ Tải PDF
          </Button>
          <Button onClick={handleSignup} className="flex-1">
            Bắt đầu lập kế hoạch →
          </Button>
        </div>
      </div>
    </>
  )
}
