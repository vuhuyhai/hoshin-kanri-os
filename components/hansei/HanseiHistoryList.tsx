'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { fetchJson } from '@/lib/http/fetch-json'
import type { HanseiEntry } from '@/lib/hansei/types'

interface HanseiHistoryListProps {
  kpiId: string
  refreshTrigger?: number
}

interface ListResponse {
  entries: HanseiEntry[]
}

export function HanseiHistoryList({
  kpiId,
  refreshTrigger,
}: HanseiHistoryListProps) {
  const [entries, setEntries] = useState<HanseiEntry[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // Reset loading on refetch (kpiId or refreshTrigger change) so the
    // stale entries are visually replaced by the loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetchJson<ListResponse>(
      `/api/hansei/list?kpi_id=${encodeURIComponent(kpiId)}`,
    )
      .then((data) => {
        if (cancelled) return
        setEntries(data.entries)
      })
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : 'Không tải được lịch sử hansei'
        toast.error(message)
        setEntries([])
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [kpiId, refreshTrigger])

  if (loading) {
    return (
      <section className="card-brutal p-6">
        <p className="text-text-3 text-sm">Đang tải lịch sử...</p>
      </section>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <section className="card-brutal p-6">
        <header className="mb-2">
          <span className="nb-sticker">LỊCH SỬ</span>
          <h3 className="font-display font-bold text-lg text-ink mt-2">
            Lịch sử hansei
          </h3>
        </header>
        <p className="text-text-3 text-sm">Chưa có hansei nào cho KPI này.</p>
      </section>
    )
  }

  return (
    <section className="card-brutal p-6">
      <header className="mb-4">
        <span className="nb-sticker">LỊCH SỬ</span>
        <h3 className="font-display font-bold text-lg text-ink mt-2">
          Lịch sử hansei ({entries.length})
        </h3>
      </header>

      <ul className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="border-2 border-ink p-4"
            style={{
              background: 'var(--bg-paper)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className="badge-brutal"
                style={{
                  background: 'var(--accent-yellow)',
                  borderColor: 'var(--ink)',
                }}
              >
                Tuần {formatShortDate(entry.week_start)}
              </span>
              <span
                className="badge-brutal"
                style={{
                  background: 'var(--brand)',
                  color: 'var(--white)',
                  borderColor: 'var(--brand)',
                }}
              >
                {entry.streak_weeks} tuần đỏ
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="font-display font-bold text-xs text-ink uppercase tracking-wide">
                  Tại sao đỏ
                </span>
                <p className="text-text-2 text-sm mt-0.5 whitespace-pre-wrap">
                  {entry.why_red}
                </p>
              </div>
              <div>
                <span className="font-display font-bold text-xs text-ink uppercase tracking-wide">
                  Hành động
                </span>
                <p className="text-text-2 text-sm mt-0.5 whitespace-pre-wrap">
                  {entry.next_action}
                </p>
              </div>
            </div>

            <p className="text-text-3 text-xs mt-3">
              Lưu lúc {formatDateTime(entry.created_at)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00Z')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}`
}

function formatDateTime(isoTimestamp: string): string {
  const d = new Date(isoTimestamp)
  if (Number.isNaN(d.getTime())) return isoTimestamp
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}
