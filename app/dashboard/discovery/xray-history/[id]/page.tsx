import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { XRayReport } from '@/app/x-ray/components/XRayReport'
import type { XRayResult } from '@/lib/x-ray/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function XRayResultDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  const { data: result } = await supabase
    .from('xray_results')
    .select('result_json')
    .eq('id', id)
    .single()

  if (!result) return notFound()

  const xrayResult = result.result_json as unknown as XRayResult

  return (
    <>
      <div className="mb-4 flex items-center justify-between px-6 md:px-12 lg:px-20 pt-4">
        <Link
          href={`/dashboard/discovery/swot?xray_id=${id}`}
          className="inline-flex items-center gap-2 border-2 border-[#2C2B2B] bg-[#c73937] text-white px-4 py-2 font-bold text-sm shadow-[3px_3px_0_#2C2B2B] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
        >
          Dùng làm nguyên liệu SWOT →
        </Link>
        <span className="text-xs text-[#8A8787]">
          Kết quả này sẽ được dùng để cá nhân hoá AI Coaching
        </span>
      </div>
      <XRayReport result={xrayResult} />
    </>
  )
}
