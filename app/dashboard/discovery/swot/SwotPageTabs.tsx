'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { SwotOrchestrator } from '@/components/swot/SwotOrchestrator'
import type { OrgContext } from '@/lib/swot/types'

interface SwotPageTabsProps {
  orgContext: OrgContext
  userId: string
  analysisId: string
  orgId: string
}

const TABS = [
  { key: 'coaching' as const, label: 'AI Coaching' },
  { key: 'tows' as const, label: 'SWOT → TOWS → Strategy' },
]

export function SwotPageTabs({ orgContext, userId, analysisId, orgId }: SwotPageTabsProps) {
  const [activeTab, setActiveTab] = useState<'coaching' | 'tows'>('coaching')

  return (
    <div>
      <div className="flex mb-6 border-b-2 border-ink">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-sm font-display font-body transition-colors"
              style={{
                fontWeight: isActive ? 700 : 400,
                borderBottom: isActive ? '3px solid #c73937' : '3px solid transparent',
                marginBottom: '-2px',
                color: isActive ? '#2C2B2B' : '#5A5757',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'coaching' && (
        <SwotOrchestrator
          mode="coaching"
          orgContext={orgContext}
          userId={userId}
        />
      )}

      {activeTab === 'tows' && (
        <SwotOrchestrator
          mode="tows"
          orgContext={orgContext}
          userId={userId}
          analysisId={analysisId}
          orgId={orgId}
          onTowsComplete={(strategies) => {
            toast.success(`${strategies.length} chiến lược đã sẵn sàng cho X-Matrix`)
          }}
        />
      )}
    </div>
  )
}
