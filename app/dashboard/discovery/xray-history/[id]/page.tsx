import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
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

  return <XRayReport result={xrayResult} />
}
