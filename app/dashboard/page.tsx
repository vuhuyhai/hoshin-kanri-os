import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
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
  { key: 'x-ray', label: 'Business X-Ray' },
  { key: 'current_state', label: 'Khảo sát hiện trạng' },
  { key: 'swot', label: 'Phân tích SWOT' },
  { key: 'pain_mapper', label: 'Pain → Goal Mapper' },
  { key: 'vision', label: 'Vision Workshop' },
] as const

type StepKey = (typeof DISCOVERY_STEPS)[number]['key']

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const firstName = user?.email?.split('@')[0] ?? 'bạn'

  const { data: sessions } = await supabase
    .from('discovery_sessions')
    .select('step_completed')

  const completedSteps = new Set(
    sessions?.map((s) => s.step_completed).filter(Boolean) ?? []
  )

  const completedCount = DISCOVERY_STEPS.filter((s) =>
    completedSteps.has(s.key)
  ).length

  const allDone = completedCount === DISCOVERY_STEPS.length

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Chào {firstName} 👋</h1>
        <p className="mt-1 text-muted-foreground">
          Hoshin Kanri OS giúp bạn biến chiến lược thành hành động đo được.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {completedCount === 0
                  ? 'Bắt đầu với Business X-Ray'
                  : allDone
                    ? 'Sẵn sàng tạo X-Matrix'
                    : `Tiếp tục khám phá (${completedCount}/${DISCOVERY_STEPS.length} bước)`}
              </CardTitle>
              <CardDescription className="mt-1">
                {completedCount === 0
                  ? 'Trả lời các câu hỏi để AI hiểu doanh nghiệp của bạn'
                  : allDone
                    ? 'Bạn đã hoàn thành giai đoạn khám phá!'
                    : 'Hoàn thành các bước còn lại để tạo chiến lược tối ưu'}
              </CardDescription>
            </div>
            <Badge variant={allDone ? 'default' : 'secondary'}>
              {completedCount}/{DISCOVERY_STEPS.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2">
            {DISCOVERY_STEPS.map((step, idx) => {
              const done = completedSteps.has(step.key)
              return (
                <div
                  key={step.key}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3"
                >
                  <div
                    className={
                      done
                        ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs'
                        : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-xs text-muted-foreground'
                    }
                  >
                    {done ? '✓' : idx + 1}
                  </div>
                  <span
                    className={
                      done
                        ? 'text-sm line-through text-muted-foreground'
                        : 'text-sm'
                    }
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          <Link
            href={
              allDone ? '/dashboard/x-matrix' : '/dashboard/discovery'
            }
          >
            <Button className="w-full">
              {completedCount === 0
                ? 'Bắt đầu khám phá →'
                : allDone
                  ? 'Tạo X-Matrix →'
                  : 'Tiếp tục →'}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
