export interface CustomerOverview {
  org_id: string
  org_name: string
  owner_email: string | null
  owner_name: string | null
  plan: string
  sub_status: string
  member_count: number
  created_at: string
  last_active_at: string | null
}

export interface CustomerDetail extends CustomerOverview {
  industry: string
  headcount: string
  city: string
  total_x_matrices: number
  total_sessions: number
  current_period_end: string | null
  stripe_customer_id: string | null
}

export interface AdminNote {
  id: string
  org_id: string
  content: string
  created_at: string
}

export interface AdminStats {
  total_customers: number
  paying_customers: number
  new_this_month: number
  mrr_estimate: number
  total_users: number
}

export interface RegisteredUser {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at: string
  has_org: boolean
  org_name: string | null
}
