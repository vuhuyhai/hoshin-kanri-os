// Server-side only — uses service role key
// NOTE: Supabase typed client resolves table types to `never` in this
// codebase (pre-existing issue). We use explicit casts on query results.

import { createAdminClient } from '@/lib/supabase/admin'
import type {
  CustomerOverview,
  CustomerDetail,
  AdminNote,
  AdminStats,
} from './types'

const VALID_PLANS = ['free', 'starter', 'growth', 'enterprise'] as const

// VND per month by plan
const PLAN_MRR: Record<string, number> = {
  free: 0,
  starter: 490_000,
  growth: 990_000,
  enterprise: 0,
}

export async function getCustomersOverview(): Promise<CustomerOverview[]> {
  const db = createAdminClient()
  const { data, error } = await db
    .from('admin_customers_overview' as 'organizations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as CustomerOverview[]
}

export async function getCustomerDetail(
  orgId: string
): Promise<CustomerDetail | null> {
  if (!orgId) return null

  const db = createAdminClient()
  const { data, error } = await db
    .from('admin_customer_detail' as 'organizations')
    .select('*')
    .eq('org_id' as 'id', orgId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return (data as unknown as CustomerDetail) ?? null
}

export async function updateCustomerPlan(
  orgId: string,
  plan: string
): Promise<void> {
  if (!orgId) throw new Error('orgId is required')
  if (!VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
    throw new Error(`Invalid plan: ${plan}`)
  }

  const db = createAdminClient()

  // Upsert: create subscription if it doesn't exist yet
  const row = { org_id: orgId, plan, status: 'active' }
  const { error } = await db
    .from('subscriptions' as 'organizations')
    .upsert(row as never, { onConflict: 'org_id' })

  if (error) throw error
}

export async function addAdminNote(
  orgId: string,
  content: string
): Promise<void> {
  if (!orgId) throw new Error('orgId is required')
  if (!content.trim()) throw new Error('content is required')

  const db = createAdminClient()
  const row = { org_id: orgId, content: content.trim() }
  const { error } = await db
    .from('admin_notes' as 'organizations')
    .insert(row as never)

  if (error) throw error
}

export async function getAdminNotes(orgId: string): Promise<AdminNote[]> {
  if (!orgId) return []

  const db = createAdminClient()
  const { data, error } = await db
    .from('admin_notes' as 'organizations')
    .select('*')
    .eq('org_id' as 'id', orgId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as AdminNote[]
}

export async function getAdminStats(): Promise<AdminStats> {
  const db = createAdminClient()

  // Run all counts in parallel
  const [orgsResult, payingResult, newResult, subsResult] = await Promise.all([
    db.from('organizations').select('id', { count: 'exact', head: true }),
    db
      .from('subscriptions' as 'organizations')
      .select('id', { count: 'exact', head: true })
      .neq('plan' as 'id', 'free'),
    db
      .from('organizations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at' as 'id', startOfMonth()),
    db.from('subscriptions' as 'organizations').select('plan' as 'id'),
  ])

  if (orgsResult.error) throw orgsResult.error
  if (payingResult.error) throw payingResult.error
  if (newResult.error) throw newResult.error
  if (subsResult.error) throw subsResult.error

  const rows = (subsResult.data ?? []) as unknown as { plan: string }[]
  const mrr = rows.reduce(
    (sum, row) => sum + (PLAN_MRR[row.plan] ?? 0),
    0
  )

  return {
    total_customers: orgsResult.count ?? 0,
    paying_customers: payingResult.count ?? 0,
    new_this_month: newResult.count ?? 0,
    mrr_estimate: mrr,
  }
}

function startOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}
