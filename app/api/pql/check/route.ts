import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkOrgPql, formatPqlEmail } from '@/lib/pql/signals'
import { sendEmail } from '@/lib/email/send'
import { toJson } from '@/lib/utils'

const CRON_SECRET = process.env.CRON_SECRET

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get active orgs (had kpi_entry in last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    const { data: activeOrgs } = await supabase
      .from('kpi_entries')
      .select('kpis!inner(org_id)')
      .gte('period_date', thirtyDaysAgo)

    const orgIds = [
      ...new Set(
        (activeOrgs ?? []).map(
          (e) => (e.kpis as { org_id: string }).org_id
        )
      ),
    ]

    const triggered: string[] = []
    const skipped: string[] = []

    for (const orgId of orgIds) {
      // Deduplicate: skip if notified in last 7 days
      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString()

      const { data: recentNotif } = await supabase
        .from('notification_logs')
        .select('id')
        .eq('org_id', orgId)
        .eq('type', 'in_app')
        .gte('created_at', sevenDaysAgo)
        .maybeSingle()

      if (recentNotif) {
        skipped.push(orgId)
        continue
      }

      const signal = await checkOrgPql(orgId)
      if (!signal) {
        skipped.push(orgId)
        continue
      }

      // Find CEO user_id for this org
      const { data: ceoMember } = await supabase
        .from('org_members')
        .select('user_id')
        .eq('org_id', orgId)
        .eq('role', 'CEO')
        .single()

      // Log notification
      await supabase.from('notification_logs').insert({
        org_id: orgId,
        user_id: ceoMember?.user_id ?? orgId,
        type: 'in_app',
        status: 'sent',
        payload: toJson({ type: 'pql_alert', signal }),
        sent_at: new Date().toISOString(),
      })

      // Send email to founder
      const FOUNDER_EMAIL = process.env.FOUNDER_ALERT_EMAIL
      if (FOUNDER_EMAIL) {
        const { subject, html } = formatPqlEmail(signal)
        await sendEmail({ to: FOUNDER_EMAIL, subject, html })
      }

      triggered.push(orgId)
    }

    return NextResponse.json({
      checked: orgIds.length,
      triggered: triggered.length,
      skipped: skipped.length,
      triggeredOrgs: triggered,
    })
  } catch (error) {
    console.error('PQL check error:', error)
    return NextResponse.json(
      { error: 'PQL check failed' },
      { status: 500 }
    )
  }
}

