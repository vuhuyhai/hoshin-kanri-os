'use client'

import { useState } from 'react'
import { SwotCell } from './SwotCell'
import {
  useSwotStore,
  type ExtendedCellType,
  type SwotItem,
} from '@/lib/swot/swot-session-store'

const CELL_ORDER: ExtendedCellType[] = ['SO', 'ST', 'WO', 'WT']

interface ExtendedSwotMatrixProps {
  items: SwotItem[]
  orgId: string
  orgContext: { name: string; industry: string; headcount: number }
}

export function ExtendedSwotMatrix({
  items,
  orgId,
  orgContext,
}: ExtendedSwotMatrixProps) {
  const matrix = useSwotStore((s) => s.strategy.matrix)
  const setExtendedCell = useSwotStore((s) => s.setExtendedCell)
  const [generating, setGenerating] = useState<Record<string, boolean>>({})

  const s = items.filter((i) => i.category === 'S')
  const w = items.filter((i) => i.category === 'W')
  const o = items.filter((i) => i.category === 'O')
  const t = items.filter((i) => i.category === 'T')

  const itemsMap: Record<
    ExtendedCellType,
    {
      strengths: SwotItem[]
      weaknesses: SwotItem[]
      opportunities: SwotItem[]
      threats: SwotItem[]
    }
  > = {
    SO: { strengths: s, weaknesses: [], opportunities: o, threats: [] },
    ST: { strengths: s, weaknesses: [], opportunities: [], threats: t },
    WO: { strengths: [], weaknesses: w, opportunities: o, threats: [] },
    WT: { strengths: [], weaknesses: w, opportunities: [], threats: t },
  }

  const handleGenerate = async (cellType: ExtendedCellType) => {
    const cell = matrix[cellType]
    const linked = itemsMap[cellType]
    setGenerating((prev) => ({ ...prev, [cellType]: true }))

    try {
      const res = await fetch('/api/swot/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_cell',
          org_id: orgId,
          cellType,
          strengths: linked.strengths,
          weaknesses: linked.weaknesses,
          opportunities: linked.opportunities,
          threats: linked.threats,
          orgContext,
        }),
      })

      if (!res.ok) throw new Error('API error')
      const { strategies } = (await res.json()) as { strategies: string[] }

      const linkIds = {
        strengthIds: linked.strengths.map((i) => i.id),
        weaknessIds: linked.weaknesses.map((i) => i.id),
        opportunityIds: linked.opportunities.map((i) => i.id),
        threatIds: linked.threats.map((i) => i.id),
      }

      setExtendedCell(cellType, {
        ...cell,
        ...linkIds,
        aiStrategies: strategies,
      })
    } catch (err) {
      console.error(`[swot-matrix] generate ${cellType} error:`, err)
    } finally {
      setGenerating((prev) => ({ ...prev, [cellType]: false }))
    }
  }

  const handleSelectStrategy = (
    cellType: ExtendedCellType,
    strategy: string
  ) => {
    setExtendedCell(cellType, {
      ...matrix[cellType],
      selectedStrategy: strategy,
    })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CELL_ORDER.map((ct) => (
        <SwotCell
          key={ct}
          cell={matrix[ct]}
          items={items}
          isGenerating={generating[ct] ?? false}
          onGenerate={() => handleGenerate(ct)}
          onSelectStrategy={(strat) => handleSelectStrategy(ct, strat)}
        />
      ))}
    </div>
  )
}
