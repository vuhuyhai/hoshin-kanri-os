export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { getAdminStats, getCustomersOverview, getRegisteredUsers } from '@/lib/admin/queries'
import type { AdminStats, CustomerOverview, RegisteredUser } from '@/lib/admin/types'
import { PlanBadge } from '../_components/PlanBadge'
import Link from 'next/link'
import { cn } from '@/lib/utils'

function formatVND(value: number): string {
  return value.toLocaleString('vi-VN') + ' đ'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN')
}

function StatCard({
  label,
  value,
  accent,
  brutal,
}: {
  label: string
  value: string
  accent?: boolean
  brutal?: boolean
}) {
  const isEmpty = value === '0' || value === '0 đ'
  return (
    <div className={brutal ? 'card-brutal p-5' : 'card-subtle p-5'}>
      <p className="font-display font-semibold text-[11px] uppercase tracking-wider text-text-3 mb-2">
        {label}
      </p>
      <p
        className={cn(
          'font-display font-black text-[40px] leading-none',
          isEmpty ? 'text-text-3' : accent ? 'text-accent-brand' : 'text-ink'
        )}
      >
        {value}
      </p>
    </div>
  )
}

function StatsRow({ stats }: { stats: AdminStats }) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <StatCard label="Tổng người dùng" value={String(stats.total_users)} />
      <StatCard label="Tổng khách hàng" value={String(stats.total_customers)} />
      <StatCard
        label="Đang trả phí"
        value={String(stats.paying_customers)}
        accent
      />
      <StatCard
        label="Mới tháng này"
        value={String(stats.new_this_month)}
      />
      <StatCard
        label="MRR ước tính"
        value={formatVND(stats.mrr_estimate)}
        accent
        brutal
      />
    </div>
  )
}

function RecentTable({ rows }: { rows: CustomerOverview[] }) {
  return (
    <div className="card-brutal p-0 overflow-hidden">
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <h2 className="font-display text-[16px] font-bold text-ink">
          10 khách hàng mới nhất
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-bg-muted-warm border-b border-[var(--border)]">
              {['Tên org', 'Owner', 'Plan', 'Trạng thái', 'Ngày tạo', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-wider text-text-3"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.org_id}
                className="border-b border-[var(--border-subtle)] transition-colors duration-150 hover:bg-bg-muted-warm"
              >
                <td className="px-4 py-3 font-display text-[16px] font-bold text-ink">
                  {c.org_name}
                </td>
                <td className="px-4 py-3 font-body text-[16px] text-ink">
                  {c.owner_email ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <PlanBadge plan={c.plan} />
                </td>
                <td className="px-4 py-3 font-body text-[15px] text-kpi-healthy-strong">
                  {c.sub_status}
                </td>
                <td className="px-4 py-3 font-body text-[16px] text-ink">
                  {formatDate(c.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/customers/${c.org_id}`}
                    className="font-display text-[13px] font-bold uppercase tracking-wider text-accent-brand hover:text-accent-dark"
                  >
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center font-body text-sm text-text-3"
                >
                  Chưa có khách hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="card-brutal p-0 overflow-hidden">
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <div className="h-4 w-48 animate-pulse bg-ink/10" />
      </div>
      <div className="space-y-4 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse bg-ink/10" />
        ))}
      </div>
    </div>
  )
}

function UsersTable({ rows }: { rows: RegisteredUser[] }) {
  return (
    <div className="card-brutal p-0 overflow-hidden">
      <div className="px-4 py-4 border-b border-[var(--border)]">
        <h2 className="font-display text-[16px] font-bold text-ink">
          Người dùng đã đăng ký
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-bg-muted-warm border-b border-[var(--border)]">
              {['Email', 'Họ tên', 'SĐT', 'Tổ chức', 'Ngày đăng ký'].map((h) => (
                <th key={h} className="px-4 py-3 font-display text-[11px] font-semibold uppercase tracking-wider text-text-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-[var(--border-subtle)] transition-colors duration-150 hover:bg-bg-muted-warm">
                <td className="px-4 py-3 font-body text-[16px] text-ink">{u.email}</td>
                <td className="px-4 py-3 font-body text-[16px] text-ink">{u.full_name ?? '—'}</td>
                <td className="px-4 py-3 font-body text-[16px] text-ink">{u.phone ?? '—'}</td>
                <td className="px-4 py-3 font-body text-[16px]">
                  {u.has_org
                    ? <span className="font-display font-bold text-ink">{u.org_name}</span>
                    : <span className="text-text-3 italic">Chưa tạo org</span>}
                </td>
                <td className="px-4 py-3 font-body text-[16px] text-ink">{formatDate(u.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center font-body text-sm text-text-3">Chưa có người dùng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

async function DashboardContent() {
  const [stats, customers, users] = await Promise.all([
    getAdminStats(),
    getCustomersOverview(),
    getRegisteredUsers(),
  ])
  const recent = customers.slice(0, 10)

  return (
    <>
      <StatsRow stats={stats} />
      <UsersTable rows={users} />
      <RecentTable rows={recent} />
    </>
  )
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <span className="overline">Admin</span>
        <h1 className="font-display font-black text-[32px] text-ink uppercase">
          Tổng quan hệ thống
        </h1>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
