import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { InviteAcceptClient } from './InviteAcceptClient'
import type { InvitePublicInfo } from '@/lib/invites/types'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ token: string }> }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://chienluoc.org'
}

type InviteFetch =
  | { kind: 'ok'; info: InvitePublicInfo }
  | { kind: 'gone'; message: string }

async function fetchInviteInfo(token: string): Promise<InviteFetch | null> {
  const res = await fetch(`${getBaseUrl()}/api/invites/${token}/info`, {
    cache: 'no-store',
  })
  if (res.status === 404) return null
  const body = (await res.json().catch(() => null)) as
    | { error?: string }
    | InvitePublicInfo
    | null
  if (res.status === 410) {
    const message =
      (body && 'error' in body && body.error) ||
      'Lời mời đã hết hạn hoặc đã được sử dụng.'
    return { kind: 'gone', message }
  }
  if (!res.ok || !body || !('org_name' in body)) return null
  return { kind: 'ok', info: body }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  if (!UUID_RE.test(token)) {
    return { title: 'Lời mời không hợp lệ — Chiến Lược OS' }
  }
  const result = await fetchInviteInfo(token)
  if (!result || result.kind === 'gone') {
    return {
      title: 'Lời mời không khả dụng — Chiến Lược OS',
      robots: { index: false, follow: false },
    }
  }
  return {
    title: `Lời mời tham gia ${result.info.org_name} — Chiến Lược OS`,
    robots: { index: false, follow: false },
  }
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  if (!UUID_RE.test(token)) notFound()

  const result = await fetchInviteInfo(token)
  if (!result) notFound()

  if (result.kind === 'gone') {
    return (
      <div className="min-h-screen bg-bg-warm flex items-center justify-center px-4 py-16">
        <div className="card-brutal w-full max-w-md p-8 text-center">
          <p className="overline mb-3">Chiến Lược OS</p>
          <h1 className="font-display text-2xl font-black uppercase tracking-tight text-ink mb-4">
            Lời mời không khả dụng
          </h1>
          <p className="font-body text-[15px] text-text-2 mb-6">
            {result.message}
          </p>
          <Link href="/" className="btn-brutal-secondary inline-block">
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  const { info } = result
  return (
    <InviteAcceptClient
      token={token}
      orgName={info.org_name}
      orgIndustry={info.org_industry}
      role={info.role}
      invitedByName={info.invited_by_name}
      expiresAt={info.expires_at}
      alreadyMember={info.already_member}
    />
  )
}
