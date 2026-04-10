'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { changePlanAction } from '../_actions'

const PLANS = ['free', 'starter', 'growth', 'enterprise'] as const

export function ChangePlanForm({
  orgId,
  currentPlan,
}: {
  orgId: string
  currentPlan: string
}) {
  const [plan, setPlan] = useState(currentPlan)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (plan === currentPlan) return
    setLoading(true)
    const result = await changePlanAction(orgId, plan)
    setLoading(false)

    if (result.ok) {
      toast.success('Đã cập nhật plan')
    } else {
      toast.error(result.error ?? 'Lỗi cập nhật plan')
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        disabled={loading}
        className="h-9 border-2 border-ink bg-bg-warm px-3 font-display text-sm font-bold uppercase tracking-wider text-ink outline-none"
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </option>
        ))}
      </select>
      <Button
        onClick={handleSubmit}
        disabled={loading || plan === currentPlan}
        className="btn-brutal-primary min-h-[36px] text-xs"
      >
        {loading ? 'Đang lưu...' : 'Cập nhật'}
      </Button>
    </div>
  )
}
