import Link from 'next/link'
import { ClipboardCheck } from 'lucide-react'

export function AnnualReviewCard() {
  return (
    <Link
      href="/dashboard/x-matrix"
      className="card-brutal flex items-center gap-3 p-4 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
    >
      <div className="p-2 bg-accent-cyan border-2 border-ink">
        <ClipboardCheck className="w-5 h-5 text-ink" strokeWidth={2.5} />
      </div>
      <div className="flex-1">
        <h4 className="font-display font-bold text-ink">Review năm cũ</h4>
        <p className="text-text-3 text-xs">Hansei + carry-over Hoshins</p>
      </div>
    </Link>
  )
}
