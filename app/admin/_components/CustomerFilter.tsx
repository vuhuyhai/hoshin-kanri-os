'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { PlanBadge } from './PlanBadge'
import type { CustomerOverview } from '@/lib/admin/types'

const TABS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Starter', value: 'starter' },
  { label: 'Growth', value: 'growth' },
  { label: 'Enterprise', value: 'enterprise' },
] as const

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

export function CustomerFilter({ data }: { data: CustomerOverview[] }) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data.filter((c) => {
      if (tab !== 'all' && c.plan !== tab) return false
      if (!q) return true
      return (
        c.org_name.toLowerCase().includes(q) ||
        (c.owner_email?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [data, search, tab])

  return (
    <div className="space-y-4">
      {/* Search + tabs */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
          />
          <Input
            placeholder="Tìm theo tên org hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[40px] border-2 border-ink bg-bg-warm pl-9 font-body"
          />
        </div>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-wider transition-colors',
                'border-2',
                tab === t.value
                  ? 'border-ink bg-ink text-white'
                  : 'border-ink/20 bg-bg-warm text-text-2 hover:border-ink/40'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border-[3px] border-ink bg-bg-warm shadow-[5px_5px_0_#2C2B2B]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-ink/10">
                {[
                  'Tên org',
                  'Owner email',
                  'Plan',
                  'Trạng thái',
                  'Members',
                  'Hoạt động cuối',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 font-display text-[11px] font-bold uppercase tracking-widest text-text-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.org_id}
                  className="border-b border-ink/5 transition-colors hover:bg-bg-muted-warm"
                >
                  <td className="px-5 py-3 font-display text-sm font-bold text-ink">
                    {c.org_name}
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-text-2">
                    {c.owner_email ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <PlanBadge plan={c.plan} />
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-text-2">
                    {c.sub_status}
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-text-2">
                    {c.member_count}
                  </td>
                  <td className="px-5 py-3 font-body text-sm text-text-3">
                    {formatDate(c.last_active_at)}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/customers/${c.org_id}`}
                      className="font-display text-xs font-bold uppercase tracking-wider text-accent-brand hover:underline"
                    >
                      Xem
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-8 text-center font-body text-sm text-text-3"
                  >
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
