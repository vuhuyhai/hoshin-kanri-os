import { Suspense } from 'react'
import { getAdminStats, getCustomersOverview, getRegisteredUsers } from '@/lib/admin/queries'
import type { AdminStats, CustomerOverview, RegisteredUser } from '@/lib/admin/types'
import { PlanBadge } from '../_components/PlanBadge'
import Link from 'next/link'

function formatVND(value: number): string {
  return value.toLocaleString('vi-VN') + ' đ'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN')
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="border-[3px] border-ink bg-bg-warm p-5 shadow-[5px_5px_0_#2C2B2B]">
      <p className="font-display text-xs font-bold uppercase tracking-widest text-text-3">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl font-black ${color ?? 'text-ink'}`}
      >
        {value}
      </p>
    </div>
  )
}

function StatsRow({ stats }: { stats: AdminStats }) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <StatCard label="Tổng người dùng" value={String(stats.total_users)} color="text-blue-600" />
      <StatCard label="Tổng khách hàng" value={String(stats.total_customers)} />
      <StatCard
        label="Đang trả phí"
        value={String(stats.paying_customers)}
        color="text-teal-600"
      />
      <StatCard
        label="Mới tháng này"
        value={String(stats.new_this_month)}
        color="text-purple-600"
      />
      <StatCard
        label="MRR ước tính"
        value={formatVND(stats.mrr_estimate)}
        color="text-orange-600"
      />
    </div>
  )
}

function RecentTable({ rows }: { rows: CustomerOverview[] }) {
  return (
    <div className="border-[3px] border-ink bg-bg-warm shadow-[5px_5px_0_#2C2B2B]">
      <div className="border-b-[3px] border-ink px-5 py-3">
        <h2 className="font-display text-sm font-black uppercase tracking-wider text-ink">
          10 khách hàng mới nhất
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-ink/10">
              {['Tên org', 'Owner', 'Plan', 'Trạng thái', 'Ngày tạo', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 font-display text-[11px] font-bold uppercase tracking-widest text-text-3"
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
                <td className="px-5 py-3 font-body text-sm text-text-3">
                  {formatDate(c.created_at)}
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
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center font-body text-sm text-text-3"
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
    <div className="border-[3px] border-ink bg-bg-warm shadow-[5px_5px_0_#2C2B2B]">
      <div className="border-b-[3px] border-ink px-5 py-3">
        <div className="h-4 w-48 animate-pulse bg-ink/10" />
      </div>
      <div className="space-y-4 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse bg-ink/10" />
        ))}
      </div>
    </div>
  )
}

function UsersTable({ rows }: { rows: RegisteredUser[] }) {
  return (
    <div className="border-[3px] border-ink bg-bg-warm shadow-[5px_5px_0_#2C2B2B]">
      <div className="border-b-[3px] border-ink px-5 py-3">
        <h2 className="font-display text-sm font-black uppercase tracking-wider text-ink">
          Người dùng đã đăng ký
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-ink/10">
              {['Email', 'Họ tên', 'SĐT', 'Tổ chức', 'Ngày đăng ký'].map((h) => (
                <th key={h} className="px-5 py-2.5 font-display text-[11px] font-bold uppercase tracking-widest text-text-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-ink/5 transition-colors hover:bg-bg-muted-warm">
                <td className="px-5 py-3 font-body text-sm text-ink">{u.email}</td>
                <td className="px-5 py-3 font-body text-sm text-text-2">{u.full_name ?? '—'}</td>
                <td className="px-5 py-3 font-body text-sm text-text-2">{u.phone ?? '—'}</td>
                <td className="px-5 py-3 font-body text-sm">
                  {u.has_org
                    ? <span className="text-teal-600 font-display font-bold text-xs">{u.org_name}</span>
                    : <span className="text-text-3 italic">Chưa tạo org</span>}
                </td>
                <td className="px-5 py-3 font-body text-sm text-text-3">{formatDate(u.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center font-body text-sm text-text-3">Chưa có người dùng nào.</td></tr>
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
      <h1 className="font-display text-2xl font-black uppercase tracking-wider text-ink">
        Tổng quan hệ thống
      </h1>
      <Suspense fallback={<TableSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
