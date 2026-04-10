import { Suspense } from 'react'
import { getCustomersOverview } from '@/lib/admin/queries'
import { Badge } from '@/components/ui/badge'
import { CustomerFilter } from '../../_components/CustomerFilter'

function TableSkeleton() {
  return (
    <div className="border-[3px] border-ink bg-bg-warm shadow-[5px_5px_0_#2C2B2B]">
      <div className="space-y-4 p-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse bg-ink/10" />
        ))}
      </div>
    </div>
  )
}

async function CustomersContent() {
  const customers = await getCustomersOverview()

  return (
    <>
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-black uppercase tracking-wider text-ink">
          Khách hàng
        </h1>
        <Badge className="rounded-none border-2 border-ink bg-ink text-white font-display text-xs font-bold">
          {customers.length}
        </Badge>
      </div>
      <CustomerFilter data={customers} />
    </>
  )
}

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse bg-ink/10" />
            <TableSkeleton />
          </div>
        }
      >
        <CustomersContent />
      </Suspense>
    </div>
  )
}
