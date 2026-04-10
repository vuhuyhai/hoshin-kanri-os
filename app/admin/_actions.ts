'use server'

import { revalidatePath } from 'next/cache'
import { updateCustomerPlan, addAdminNote } from '@/lib/admin/queries'

export async function changePlanAction(
  orgId: string,
  plan: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await updateCustomerPlan(orgId, plan)
    revalidatePath(`/admin/customers/${orgId}`)
    revalidatePath('/admin/customers')
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lỗi không xác định' }
  }
}

export async function addNoteAction(
  orgId: string,
  content: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await addAdminNote(orgId, content)
    revalidatePath(`/admin/customers/${orgId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lỗi không xác định' }
  }
}
