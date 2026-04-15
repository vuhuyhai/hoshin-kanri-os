import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseBody, kpiEntrySchema } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = await parseBody(request, kpiEntrySchema)
    if (!parsed.ok) return parsed.response
    const { kpiId, value, note, periodDate } = parsed.data

    // Verify KPI exists
    const { data: kpi } = await supabase
      .from('kpis')
      .select('id')
      .eq('id', kpiId)
      .single()

    if (!kpi) {
      return NextResponse.json(
        { error: 'KPI không tồn tại' },
        { status: 404 }
      )
    }

    // Delete existing entry for same day, then insert (safe upsert without unique constraint)
    await supabase
      .from('kpi_entries')
      .delete()
      .eq('kpi_id', kpiId)
      .eq('period_date', periodDate)

    const { data: entry, error } = await supabase
      .from('kpi_entries')
      .insert({
        kpi_id: kpiId,
        user_id: user.id,
        value,
        note: note ?? null,
        period_date: periodDate,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('KPI entry error:', error)
    return NextResponse.json(
      { error: 'Không thể lưu KPI entry' },
      { status: 500 }
    )
  }
}
