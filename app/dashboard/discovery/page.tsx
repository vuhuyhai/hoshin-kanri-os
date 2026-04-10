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
    description: 'Chẩn đoán sức khỏe doanh nghiệp trong 5 phút',
    href: '/x-ray',
    icon: '🔍',
    external: true,
  },
  {
    key: 'swot',
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

export default async function DiscoveryPage() {
  const supabase = await createClient()
  const { data: sessions } = await supabase
    .from('discovery_sessions')
    .select('step_completed')

  const completedSteps = new Set(
    sessions?.map((s) => s.step_completed).filter(Boolean) ?? []
  )

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
