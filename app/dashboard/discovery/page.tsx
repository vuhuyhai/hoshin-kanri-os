import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DISCOVERY_STEPS = [
  {
    key: 'x-ray',
    label: 'Business X-Ray',
    description: 'Chẩn đoán sức khỏe doanh nghiệp theo 7 trụ cột OPEX',
    href: '/x-ray',
    icon: '🔍',
    external: true,
  },
  {
    key: 'swot_coaching',
    label: 'Phân tích SWOT',
    description: 'AI Coach giúp phân tích 8Ms, Porter, PESTEL + nghiên cứu thị trường',
    href: '/dashboard/discovery/swot',
    icon: '🧠',
    external: false,
  },
  {
    key: 'pain_mapper',
    label: 'Pain → Goal Mapper',
    description: 'Chuyển đổi vấn đề thực tế thành mục tiêu chiến lược Hoshin Kanri',
    href: '/dashboard/discovery/pain-mapper',
    icon: '🎯',
    external: false,
  },
  {
    key: 'vision',
    label: 'Vision Workshop',
    description: 'Xây dựng tầm nhìn và mục tiêu năm cho doanh nghiệp',
    href: '/dashboard/discovery/vision-workshop',
    icon: '🔭',
    external: false,
  },
  {
    key: 'benchmark',
    label: 'KPI Benchmark Library',
    description: 'Tham khảo KPI theo ngành với benchmark Việt Nam',
    href: '/dashboard/discovery/benchmark',
    icon: '📊',
    external: false,
  },
  {
    key: 'synthesis',
    label: 'AI Strategy Synthesis',
    description: 'Tổng hợp toàn bộ Discovery → X-Matrix pre-fill 70%',
    href: '/dashboard/discovery/synthesis',
    icon: '🧬',
    external: false,
  },
] as const

function getScoreLabel(score: number): string {
  if (score <= 25) return 'Nguy hiểm'
  if (score <= 50) return 'Yếu'
  if (score <= 75) return 'Trung bình'
  return 'Tốt'
}

function getScoreColor(score: number): string {
  if (score <= 25) return 'text-red-600 border-red-300'
  if (score <= 50) return 'text-amber-600 border-amber-300'
  if (score <= 75) return 'text-blue-600 border-blue-300'
  return 'text-green-600 border-green-300'
}

interface XRayData {
  latestScore?: number
  latestLevel?: string
  completedAt?: string
  latestResultId?: string
}

export default async function DiscoveryPage() {
  const supabase = await createClient()
  const { data: sessions } = await supabase
    .from('discovery_sessions')
    .select('step_completed, data_json')

  const completedSteps = new Set(
    sessions?.map((s) => s.step_completed).filter(Boolean) ?? []
  )

  // Extract X-Ray data from discovery session
  const xraySession = sessions?.find((s) => s.step_completed === 'x-ray')
  const xrayData = xraySession?.data_json as XRayData | null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Khám phá doanh nghiệp</h1>
        <p className="mt-1 text-muted-foreground">
          Hoàn thành các bước để hiểu rõ doanh nghiệp trước khi lập chiến lược
        </p>
      </div>

      <div className="space-y-4">
        {DISCOVERY_STEPS.map((step, idx) => {
          const done = completedSteps.has(step.key)
          const isNext =
            !done &&
            (idx === 0 ||
              completedSteps.has(DISCOVERY_STEPS[idx - 1].key))

          // Special X-Ray card with score
          if (step.key === 'x-ray' && done && xrayData) {
            return (
              <Card
                key={step.key}
                className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{step.icon}</span>
                      <div>
                        <CardTitle className="text-base">{step.label}</CardTitle>
                        <CardDescription className="text-xs">
                          Điểm gần nhất: {xrayData.latestScore}/100 · {getScoreLabel(xrayData.latestScore ?? 0)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-green-300 text-green-600"
                    >
                      ✓ Hoàn thành
                    </Badge>
                  </div>
                  {xrayData.completedAt && (
                    <p className="text-xs text-muted-foreground mt-1 ml-11">
                      Lần cuối: {new Date(xrayData.completedAt).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Link href="/dashboard/discovery/xray-history" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Xem báo cáo
                      </Button>
                    </Link>
                    <Link href="/x-ray" target="_blank" className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        Chạy lại →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          }

          return (
            <Card
              key={step.key}
              className={
                done
                  ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30'
                  : isNext
                    ? 'border-primary/30 bg-primary/5'
                    : ''
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{step.icon}</span>
                    <div>
                      <CardTitle className="text-base">{step.label}</CardTitle>
                      <CardDescription className="text-xs">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>
                  {done && (
                    <Badge
                      variant="outline"
                      className="border-green-300 text-green-600"
                    >
                      ✓ Hoàn thành
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={step.href}
                  target={step.external ? '_blank' : undefined}
                >
                  <Button
                    variant={done ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                  >
                    {done ? 'Xem lại' : 'Bắt đầu →'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
