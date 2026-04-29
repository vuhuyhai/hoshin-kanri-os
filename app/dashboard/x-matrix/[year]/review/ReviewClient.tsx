'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { fetchJson, FetchJsonError } from '@/lib/http/fetch-json'
import type { ReviewPageData } from '@/lib/annual-review/queries'
import type {
  A3Reflection,
  KpiActualEntry,
} from '@/lib/annual-review/types'
import { A3ReflectionForm } from '@/components/annual-review/A3ReflectionForm'
import { KpiActualsForm } from '@/components/annual-review/KpiActualsForm'
import {
  SaveIndicator,
  type SaveStatus,
} from '@/components/annual-review/SaveIndicator'

interface Props {
  data: ReviewPageData
  userId: string
}

const AUTOSAVE_DEBOUNCE_MS = 2000

export function ReviewClient({ data }: Props) {
  // Auto-create in page.tsx guarantees review is non-null when this renders.
  if (!data.review) return null

  return <ReviewClientInner data={data as ReviewPageDataWithReview} />
}

type ReviewPageDataWithReview = ReviewPageData & {
  review: NonNullable<ReviewPageData['review']>
}

function ReviewClientInner({ data }: { data: ReviewPageDataWithReview }) {
  const [a3, setA3] = useState<A3Reflection>(data.review.a3)
  const [kpiActuals, setKpiActuals] = useState<KpiActualEntry[]>(() =>
    // Server returns note as `string | null`, our domain type uses
    // `string | undefined`. Normalize at the boundary.
    data.review.kpiActuals.map((a) => ({
      kpiId: a.kpiId,
      actualValue: a.actualValue,
      achievementPct: a.achievementPct,
      note: a.note ?? undefined,
    })),
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialMount = useRef(true)
  const isLocked = data.review.status === 'transitioned'

  const save = useCallback(
    async (payload: {
      a3?: A3Reflection
      kpiActuals?: KpiActualEntry[]
    }) => {
      setSaveStatus('saving')
      try {
        // postJson hardcodes POST + omits `method` from its init type, so
        // we drop down to fetchJson directly for PUT.
        await fetchJson(`/api/annual-review/${data.review.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        setSaveStatus('saved')
        setLastSavedAt(new Date())
      } catch (err) {
        setSaveStatus('error')
        // FetchJsonError.message already prefers the server's `error`
        // field, so plain `err.message` gives the Vietnamese copy from
        // the API route.
        const msg =
          err instanceof FetchJsonError ? err.message : 'Lưu thất bại'
        toast.error(`Lưu thất bại: ${msg}`)
      }
    },
    [data.review.id],
  )

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (isLocked) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      save({ a3, kpiActuals })
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [a3, kpiActuals, save, isLocked])

  const statusLabel =
    data.review.status === 'draft'
      ? 'Đang draft'
      : data.review.status === 'completed'
        ? 'Đã hoàn tất'
        : 'Đã chuyển năm'

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-ink">
            Review năm {data.matrix.year}
          </h1>
          <p className="text-text-2 mt-1 text-sm">
            {data.matrix.title ?? 'X-Matrix'} · {statusLabel}
          </p>
        </div>
        <SaveIndicator status={saveStatus} lastSavedAt={lastSavedAt} />
      </header>

      {isLocked && (
        <div className="card-yellow p-4">
          <p className="text-ink font-medium">
            Review này đã chuyển năm. Không thể edit.
          </p>
        </div>
      )}

      <A3ReflectionForm value={a3} onChange={setA3} disabled={isLocked} />
      <KpiActualsForm
        kpis={data.kpis}
        actuals={kpiActuals}
        onChange={setKpiActuals}
        disabled={isLocked}
      />

      <section className="card-brutal p-6 bg-bg-paper">
        <h2 className="font-display font-bold text-xl mb-2">
          Carry-over decisions
        </h2>
        <p className="text-text-3 text-sm italic">
          Sẽ ship ở Task 4c. KPI &lt; 70% sẽ auto-flag Hoshin để bạn quyết
          carry/drop/modify.
        </p>
      </section>
    </div>
  )
}
