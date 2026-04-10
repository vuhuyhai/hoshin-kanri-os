import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { XMatrixData, XMatrixHoshin } from '@/lib/x-matrix/types'
import { calcCompleteness } from '@/lib/x-matrix/utils'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership)
      return NextResponse.json(
        { hasPrefill: false, data: null, completeness: 0 }
      )

    const orgId = membership.org_id

    // Fetch synthesis result
    const { data: synthesisSession } = await supabase
      .from('discovery_sessions')
      .select('data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'synthesis')
      .maybeSingle()

    // Fetch vision data
    const { data: visionSession } = await supabase
      .from('discovery_sessions')
      .select('data_json')
      .eq('org_id', orgId)
      .eq('step_completed', 'vision')
      .maybeSingle()

    const synthData = synthesisSession?.data_json as {
      prefill?: {
        vision?: string
        yearGoals?: string[]
        hoshinCandidates?: Array<{
          id: string
          title: string
          description: string
        }>
        initiatives?: Array<{
          id: string
          hoshinId: string
          title: string
          timeframe: string
        }>
        kpiSuggestions?: Array<{
          hoshinId: string
          name: string
          unit: string
          targetValue: number
          frequency: string
          dept_level: string
        }>
      }
    } | null

    const visionData = visionSession?.data_json as {
      finalVision?: string
      finalGoals?: string[]
    } | null

    const prefill = synthData?.prefill

    if (!prefill && !visionData) {
      return NextResponse.json({ hasPrefill: false, data: null, completeness: 0 })
    }

    // Build XMatrixData from Discovery
    const vision = prefill?.vision ?? visionData?.finalVision ?? ''
    const yearGoals =
      prefill?.yearGoals ?? visionData?.finalGoals ?? ['']

    const hoshins: XMatrixHoshin[] = (prefill?.hoshinCandidates ?? []).map(
      (h) => {
        const inits = (prefill?.initiatives ?? [])
          .filter((i) => i.hoshinId === h.id)
          .map((i) => ({
            id: i.id,
            title: i.title,
            timeframe: (i.timeframe as '30d' | '60d' | '90d') || '90d',
          }))

        const kpis = (prefill?.kpiSuggestions ?? [])
          .filter((k) => k.hoshinId === h.id)
          .map((k, idx) => ({
            id: `kpi_${h.id}_${idx}`,
            name: k.name,
            unit: k.unit,
            targetValue: k.targetValue,
            ownerUserId: null,
            ownerName: 'Chưa giao',
            frequency: (k.frequency as 'weekly' | 'monthly') || 'monthly',
            deptLevel: (k.dept_level as 'company' | 'dept') || 'company',
          }))

        return {
          id: h.id,
          title: h.title,
          description: h.description ?? '',
          initiatives: inits,
          kpis,
        }
      }
    )

    const data: XMatrixData = {
      vision,
      yearGoals: yearGoals.length > 0 ? yearGoals : [''],
      hoshins,
    }

    return NextResponse.json({
      hasPrefill: true,
      data,
      completeness: calcCompleteness(data),
    })
  } catch (error) {
    console.error('Prefill error:', error)
    return NextResponse.json(
      { hasPrefill: false, data: null, completeness: 0 }
    )
  }
}
