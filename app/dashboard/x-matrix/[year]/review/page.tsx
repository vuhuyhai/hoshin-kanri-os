import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/auth/getActiveMembership'
import { getReviewPageData } from '@/lib/annual-review/queries'
import { ReviewClient } from './ReviewClient'

interface PageProps {
  params: Promise<{ year: string }>
}

export default async function AnnualReviewPage({ params }: PageProps) {
  const { year: yearStr } = await params
  const year = parseInt(yearStr, 10)
  if (isNaN(year) || year < 2020 || year > 2100) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const lastOrgId = (user.user_metadata?.last_org_id as string | undefined) ?? null
  const membership = await getActiveMembership(supabase, user.id, lastOrgId)
  if (!membership) redirect('/onboarding/setup-org')

  if (membership.role !== 'CEO') {
    return (
      <div className="card-brutal p-8 max-w-2xl mx-auto mt-8">
        <h1 className="font-display font-bold text-2xl mb-2">
          Chỉ CEO được review
        </h1>
        <p className="text-text-2">
          Annual Review là quyết định cấp cao, chỉ CEO của tổ chức mới có quyền
          thực hiện.
        </p>
      </div>
    )
  }

  const data = await getReviewPageData(supabase, membership.org_id, year)
  if (!data) notFound()

  // Auto-create the draft review on first visit. Direct insert avoids a
  // network hop to /api/annual-review/create — we already have the
  // user-scoped supabase client and RLS will block any other org.
  if (!data.review) {
    const { error: insertError } = await supabase
      .from('annual_reviews')
      .insert({
        x_matrix_id: data.matrix.id,
        org_id: data.matrix.orgId,
        reviewed_by: user.id,
        status: 'draft',
      })
      .select('id')
      .single()

    // Race condition guard: two tabs both opening the page at once. The
    // UNIQUE(x_matrix_id) constraint will reject the second insert; refetch
    // and continue.
    if (insertError) {
      const refetch = await getReviewPageData(supabase, membership.org_id, year)
      if (!refetch?.review) {
        return (
          <div className="card-brutal p-8 max-w-2xl mx-auto mt-8">
            <h1 className="font-display font-bold text-xl mb-2">Lỗi tạo review</h1>
            <p className="text-text-2">
              Không thể khởi tạo annual review. Vui lòng thử lại hoặc liên hệ
              support.
            </p>
          </div>
        )
      }
      return <ReviewClient data={refetch} userId={user.id} />
    }

    const fullData = await getReviewPageData(supabase, membership.org_id, year)
    if (!fullData?.review) notFound()
    return <ReviewClient data={fullData} userId={user.id} />
  }

  return <ReviewClient data={data} userId={user.id} />
}
