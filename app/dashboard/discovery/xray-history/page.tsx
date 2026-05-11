import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { XRayHistoryChart } from './XRayHistoryChart'
import { getScoreTier } from '@/lib/design/chart-tokens'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'

function getScoreLabel(score: number): string {
  if (score <= 25) return 'Nguy hiểm'
  if (score <= 50) return 'Yếu'
  if (score <= 75) return 'Trung bình'
  return 'Tốt'
}

function getBadgeClass(score: number): string {
  if (score <= 25) return 'border-destructive text-destructive'
  if (score <= 50) return 'border-kpi-attention text-kpi-attention-strong'
  if (score <= 75) return 'border-accent-cyan text-accent-cyan'
  return 'border-kpi-healthy text-kpi-healthy-strong'
}

interface ResultRow {
  id: string
  overall_score: number
  overall_level: string
  result_json: {
    executiveSummary?: string
    topActions?: string[]
  }
  created_at: string
}

export default async function XRayHistoryPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
  const membership = await getActiveMembership(supabase, user.id, lastOrgId)
  if (!membership) return null

  const { data: rawHistory, count } = await supabase
    .from('xray_results')
    .select('id, overall_score, overall_level, result_json, created_at', { count: 'exact' })
    .eq('org_id', membership.org_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const history = (rawHistory ?? []) as unknown as ResultRow[]
  const totalRuns = count ?? history.length
  const oldestShownRunNumber = totalRuns - history.length + 1

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <span className="text-5xl block mb-4">🔍</span>
        <h1 className="text-xl font-bold mb-2">Chưa có kết quả X-Ray</h1>
        <p className="text-muted-foreground mb-6">
          Chạy Business X-Ray lần đầu để chẩn đoán sức khỏe doanh nghiệp
        </p>
        <Link href="/x-ray" target="_blank">
          <Button>Bắt đầu X-Ray →</Button>
        </Link>
      </div>
    )
  }

  // Chart data: oldest → newest for progression.
  // Pass score tier (not hex) so the client component resolves the actual
  // CSS token at render time — Recharts can't consume `var(--token)`.
  const chartData = [...history]
    .reverse()
    .map((r, idx) => ({
      run: `Lần ${oldestShownRunNumber + idx}`,
      score: r.overall_score,
      date: new Date(r.created_at).toLocaleDateString('vi-VN'),
      tier: getScoreTier(r.overall_score),
    }))

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/dashboard/discovery"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Khám phá
          </Link>
          <h1 className="text-2xl font-bold mt-1">Lịch sử X-Ray</h1>
        </div>
        <Link href="/x-ray" target="_blank">
          <Button size="sm">Chạy X-Ray mới →</Button>
        </Link>
      </div>

      {/* Progression chart */}
      {chartData.length >= 2 && (
        <div className="mb-8 rounded-lg border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Tiến triển theo thời gian
          </h2>
          <XRayHistoryChart data={chartData} />
        </div>
      )}

      {/* History list */}
      <div className="space-y-4">
        {history.map((result, idx) => (
          <div
            key={result.id}
            className="rounded-lg border bg-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {new Date(result.created_at).toLocaleDateString('vi-VN')} · Lần {totalRuns - idx}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-black"
                  style={{ color: `var(--score-${getScoreTier(result.overall_score)})` }}
                >
                  {result.overall_score}
                </span>
                <Badge variant="outline" className={getBadgeClass(result.overall_score)}>
                  {getScoreLabel(result.overall_score)}
                </Badge>
              </div>
            </div>

            {result.result_json?.executiveSummary && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                &ldquo;{result.result_json.executiveSummary}&rdquo;
              </p>
            )}

            <Link href={`/dashboard/discovery/xray-history/${result.id}`}>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Xem báo cáo đầy đủ →
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
