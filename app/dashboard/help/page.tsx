import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import HelpPageClient from './_components/HelpPageClient'

export const metadata: Metadata = {
  title: 'Hướng dẫn sử dụng | Hoshin Kanri OS',
  description: 'Hướng dẫn đầy đủ về cách sử dụng Hoshin Kanri OS — từ Business X-Ray đến X-Matrix và KPI Tracking.',
}

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isSuperAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .maybeSingle()
    isSuperAdmin = profile?.is_super_admin ?? false
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <HelpPageClient isSuperAdmin={isSuperAdmin} />
    </div>
  )
}
