export interface OrgInvite {
  id: string
  org_id: string
  invited_by: string
  email: string
  role: 'Manager' | 'Member'
  token: string
  expires_at: string
  accepted_at: string | null
  accepted_by: string | null
  created_at: string
}

export interface InvitePublicInfo {
  org_name: string
  org_industry: string
  role: 'Manager' | 'Member'
  invited_by_name: string
  expires_at: string
  already_member: boolean
}

export const INVITE_EXPIRES_DAYS = 7
export const INVITE_MAX_PENDING = 5
