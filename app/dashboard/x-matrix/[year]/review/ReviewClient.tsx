'use client'

import type { ReviewPageData } from '@/lib/annual-review/queries'

interface Props {
  data: ReviewPageData
  userId: string
}

export function ReviewClient({ data }: Props) {
  // Auto-create above guarantees review is non-null when this renders.
  if (!data.review) return null

  const hoshins = data.matrix.visionJson.hoshins ?? []

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="font-display font-bold text-3xl text-ink">
          Review năm {data.matrix.year}
        </h1>
        <p className="text-text-2 mt-1">
          {data.matrix.title ?? 'X-Matrix'} · Status: {data.review.status}
        </p>
      </header>

      <section className="card-brutal p-6">
        <h2 className="font-display font-bold text-xl mb-4">Data check</h2>
        <ul className="space-y-2 text-sm">
          <li>
            Review ID: <code>{data.review.id}</code>
          </li>
          <li>KPIs count: {data.kpis.length}</li>
          <li>KPI actuals saved: {data.review.kpiActuals.length}</li>
          <li>Carry-overs saved: {data.review.carryOvers.length}</li>
        </ul>
      </section>

      <section className="card-brutal p-6">
        <h2 className="font-display font-bold text-xl mb-4">KPIs cần review</h2>
        {data.kpis.length === 0 ? (
          <p className="text-text-3">Không có KPI nào active cho matrix này.</p>
        ) : (
          <ul className="space-y-2">
            {data.kpis.map((kpi) => (
              <li
                key={kpi.id}
                className="flex justify-between border-b border-ink/10 pb-2"
              >
                <span className="font-medium">{kpi.name}</span>
                <span className="text-text-3">
                  Target: {kpi.targetValue} {kpi.unit ?? ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-brutal p-6">
        <h2 className="font-display font-bold text-xl mb-4">Hoshins từ matrix</h2>
        {hoshins.length === 0 ? (
          <p className="text-text-3">Không có Hoshins.</p>
        ) : (
          <ul className="space-y-2">
            {hoshins.map((h) => (
              <li key={h.id}>
                <strong>{h.title}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-text-3 text-sm italic">
        UI form sẽ ship ở Task 4b (A3 + KPI actuals + carry-over decisions).
      </p>
    </div>
  )
}
