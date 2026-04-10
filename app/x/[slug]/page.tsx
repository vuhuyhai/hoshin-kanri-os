import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { XMatrixData } from '@/lib/x-matrix/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: 'X-Matrix Chiến lược | Hoshin Kanri OS',
    description: 'Kế hoạch chiến lược 90 ngày được tạo bởi Hoshin Kanri OS',
    openGraph: {
      title: `X-Matrix — ${slug}`,
      description: 'Xem bản kế hoạch chiến lược',
    },
  }
}

export default async function ShareXMatrixPage({ params }: Props) {
  const { slug } = await params
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch(
    `${base}/api/x-matrix/share?slug=${encodeURIComponent(slug)}`,
    { cache: 'no-store' }
  )
  if (!res.ok) notFound()

  const { xMatrix } = await res.json()
  const d = xMatrix.vision_json as XMatrixData
  const org = xMatrix.organizations as { name: string; industry: string }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Hoshin Kanri OS
          </p>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground text-sm">
            Kế hoạch chiến lược {xMatrix.year} · {org.industry}
          </p>
        </div>

        {/* Vision */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Vision
          </p>
          <p className="text-lg font-semibold leading-relaxed">{d.vision}</p>
          {d.yearGoals.filter(Boolean).map((g, i) => (
            <p key={i} className="text-sm text-muted-foreground">
              {i + 1}. {g}
            </p>
          ))}
        </div>

        {/* Hoshins */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {d.hoshins.length} Annual Hoshins
          </h2>
          {d.hoshins.map((h, idx) => (
            <div key={h.id} className="border rounded-lg p-4 space-y-2">
              <p className="font-semibold text-sm">
                {idx + 1}. {h.title}
              </p>
              {h.initiatives.map((init) => (
                <p key={init.id} className="text-xs text-muted-foreground">
                  ⚡ {init.title}
                  <span className="ml-1 text-primary">[{init.timeframe}]</span>
                </p>
              ))}
              {h.kpis.map((kpi) => (
                <p key={kpi.id} className="text-xs text-muted-foreground">
                  📊 {kpi.name}: target {kpi.targetValue} {kpi.unit}
                  {kpi.ownerName !== 'Chưa giao' && (
                    <span className="ml-1">({kpi.ownerName})</span>
                  )}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center border-t pt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            Tạo X-Matrix cho công ty bạn — miễn phí
          </p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Bắt đầu ngay →
          </a>
        </div>
      </div>
    </div>
  )
}
