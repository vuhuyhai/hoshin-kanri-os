import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCustomerDetail, getAdminNotes } from '@/lib/admin/queries'
import { PlanBadge } from '../../../_components/PlanBadge'
import { ChangePlanForm } from '../../../_components/ChangePlanForm'
import { AdminNotesSection } from '../../../_components/AdminNotesSection'
import { Badge } from '@/components/ui/badge'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function InfoCard({
  label,
  value,
}: {
  label: string
  value: string | number | null
}) {
  return (
    <div>
      <p className="font-display text-[11px] font-bold uppercase tracking-widest text-text-3">
        {label}
      </p>
      <p className="mt-0.5 font-body text-sm text-ink">{value ?? '—'}</p>
    </div>
  )
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [detail, notes] = await Promise.all([
    getCustomerDetail(id),
    getAdminNotes(id),
  ])

  if (!detail) notFound()

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-text-2 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Khách hàng
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="font-display text-2xl font-black uppercase tracking-wider text-ink">
          {detail.org_name}
        </h1>
        <PlanBadge plan={detail.plan} />
        <Badge className="rounded-none border border-ink/30 bg-bg-warm font-display text-[11px] font-bold uppercase text-text-2">
          {detail.sub_status}
        </Badge>
      </div>

      {/* Change plan */}
      <div className="border-[3px] border-ink bg-bg-warm p-5 shadow-[5px_5px_0_#2C2B2B]">
        <p className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-text-3">
          Đổi plan
        </p>
        <ChangePlanForm orgId={detail.org_id} currentPlan={detail.plan} />
      </div>

      {/* Info cards — 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border-[3px] border-ink bg-bg-warm p-5 shadow-[5px_5px_0_#2C2B2B] space-y-4">
          <InfoCard label="Owner email" value={detail.owner_email} />
          <InfoCard label="Ngành" value={detail.industry} />
          <InfoCard label="Quy mô" value={detail.headcount} />
          <InfoCard label="Thành phố" value={detail.city} />
          <InfoCard label="Ngày tạo" value={formatDate(detail.created_at)} />
          <InfoCard
            label="Kỳ thanh toán kết thúc"
            value={formatDate(detail.current_period_end)}
          />
          <InfoCard
            label="Stripe Customer ID"
            value={detail.stripe_customer_id}
          />
        </div>
        <div className="border-[3px] border-ink bg-bg-warm p-5 shadow-[5px_5px_0_#2C2B2B] space-y-4">
          <InfoCard label="Tổng members" value={detail.member_count} />
          <InfoCard label="X-Matrices" value={detail.total_x_matrices} />
          <InfoCard label="Sessions" value={detail.total_sessions} />
          <InfoCard
            label="Lần hoạt động cuối"
            value={formatDate(detail.last_active_at)}
          />
        </div>
      </div>

      {/* Notes */}
      <AdminNotesSection orgId={detail.org_id} initialNotes={notes} />
    </div>
  )
}
