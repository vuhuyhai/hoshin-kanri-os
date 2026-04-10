'use client'

import { useEffect } from 'react'
import { identifyUser } from '@/lib/analytics/events'

interface IdentifyUserProps {
  userId: string
  orgId: string
  orgName: string
  role: string
  industry: string
}

export function IdentifyUser(props: IdentifyUserProps) {
  useEffect(() => {
    identifyUser(props.userId, {
      orgId: props.orgId,
      orgName: props.orgName,
      role: props.role,
      industry: props.industry,
    })
  }, [props.userId, props.orgId, props.orgName, props.role, props.industry])

  return null
}
