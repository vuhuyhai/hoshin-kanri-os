import Link from 'next/link'
import type { ReviewableMatrix } from '@/lib/annual-review/queries'

interface Props {
  matrix: ReviewableMatrix
}

export function AnnualReviewBanner({ matrix }: Props) {
  const currentYear = new Date().getFullYear()
  const ctaText =
    matrix.reviewStatus === 'draft' ? 'Tiếp tục review' : 'Bắt đầu review'
  const href = matrix.reviewId
    ? `/dashboard/x-matrix/${matrix.year}/review?id=${matrix.reviewId}`
    : `/dashboard/x-matrix/${matrix.year}/review`

  return (
    <div
      className="card-yellow flex items-center justify-between gap-4 p-5 mb-6"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="nb-sticker">CHU KỲ MỚI</span>
        </div>
        <h3 className="font-display font-bold text-xl text-ink">
          Năm {currentYear} đã đến — review năm {matrix.year} thôi!
        </h3>
        <p className="text-text-2 text-sm mt-1">
          Đối chiếu KPI thực tế với target, ghi nhận hansei (phản tỉnh), và
          quyết định Hoshin nào carry-over sang năm {currentYear}.
        </p>
      </div>
      <Link href={href} className="btn-brutal-primary whitespace-nowrap shrink-0">
        {ctaText} →
      </Link>
    </div>
  )
}
