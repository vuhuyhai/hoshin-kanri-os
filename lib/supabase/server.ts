import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

/**
 * Valid values for `org_members.role`. Mirrors the CHECK constraint
 * in migration 001_initial_schema.sql.
 */
export type OrgRole = 'CEO' | 'Manager' | 'Member'

/** Any member — used for read-only endpoints. */
export const ALL_ROLES: OrgRole[] = ['CEO', 'Manager', 'Member']

/** Roles allowed to edit SWOT factors and draft TOWS strategies. */
export const WRITE_ROLES: OrgRole[] = ['CEO', 'Manager']

/** Roles allowed to finalize strategy (create/delete X-Matrix, delete TOWS). */
export const ADMIN_ROLES: OrgRole[] = ['CEO']

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — cookies may not be writable
          }
        },
      },
    }
  )
}

/**
 * Verify that a user belongs to the given org.
 * Returns true if membership exists, false otherwise.
 */
export async function verifyOrgMembership(
  supabase: SupabaseClient<Database>,
  userId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single()
  return !!data
}

// ============================================================
// Role-based authorization helpers
// ============================================================
//
// These exist so write routes can return a clean 403 + explanation
// *before* the DB RLS policy throws a 42501. Without them, a Member
// user clicking a write button sees a raw 500 error toast instead of
// a helpful "you need Manager role" message. The RLS policies in
// migration 016 remain the real enforcement — these helpers are for UX.

export type RoleCheckResult =
  | { ok: true; orgId: string }
  | { ok: false; error: string; status: number }

/**
 * Check that `userId` is a member of the org that owns `analysisId`
 * AND that their role is in `allowedRoles`. Returns the resolved
 * `orgId` on success or a structured error on failure.
 *
 * Typical usage in a route handler:
 *
 *   const check = await requireOrgRoleForAnalysis(
 *     supabase, user.id, analysisId, WRITE_ROLES
 *   )
 *   if (!check.ok) return NextResponse.json(
 *     { error: check.error }, { status: check.status }
 *   )
 *   const { orgId } = check
 */
export async function requireOrgRoleForAnalysis(
  supabase: SupabaseClient<Database>,
  userId: string,
  analysisId: string,
  allowedRoles: OrgRole[],
): Promise<RoleCheckResult> {
  const { data: analysis } = await supabase
    .from('swot_analyses')
    .select('org_id')
    .eq('id', analysisId)
    .single()
  if (!analysis) {
    return { ok: false, error: 'Phân tích không tồn tại', status: 404 }
  }

  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', analysis.org_id)
    .single()
  if (!member) {
    return { ok: false, error: 'Không có quyền truy cập tổ chức này', status: 403 }
  }

  if (!allowedRoles.includes(member.role as OrgRole)) {
    return {
      ok: false,
      error: `Chức năng này yêu cầu quyền ${allowedRoles.join(' hoặc ')}`,
      status: 403,
    }
  }

  return { ok: true, orgId: analysis.org_id }
}

/**
 * Same as requireOrgRoleForAnalysis but for routes that already have
 * the `orgId` directly (no analysis lookup needed) — e.g. /api/x-matrix/create.
 */
export async function requireOrgRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  orgId: string,
  allowedRoles: OrgRole[],
): Promise<RoleCheckResult> {
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single()
  if (!member) {
    return { ok: false, error: 'Không có quyền truy cập tổ chức này', status: 403 }
  }

  if (!allowedRoles.includes(member.role as OrgRole)) {
    return {
      ok: false,
      error: `Chức năng này yêu cầu quyền ${allowedRoles.join(' hoặc ')}`,
      status: 403,
    }
  }

  return { ok: true, orgId }
}
