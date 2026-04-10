'use client'

import { useState } from 'react'
import type { TowsResult, TowsStrategy } from '@/lib/swot/types'

interface TowsMatrixProps {
  strategies: TowsResult['tows_strategies']
  onCellClick?: (type: 'SO' | 'ST' | 'WO' | 'WT') => void
}

const CELLS = [
  { type: 'SO' as const, label: '⚔️ SO · Tấn công', sub: 'Dùng điểm mạnh khai thác cơ hội', bg: 'bg-green-50 hover:bg-green-100', text: 'text-green-800' },
  { type: 'ST' as const, label: '🛡️ ST · Bảo vệ', sub: 'Dùng điểm mạnh chống lại thách thức', bg: 'bg-blue-50 hover:bg-blue-100', text: 'text-blue-800' },
  { type: 'WO' as const, label: '📈 WO · Cải thiện', sub: 'Dùng cơ hội khắc phục điểm yếu', bg: 'bg-orange-50 hover:bg-orange-100', text: 'text-orange-800' },
  { type: 'WT' as const, label: '🔒 WT · Phòng thủ', sub: 'Minimize rủi ro từ điểm yếu + thách thức', bg: 'bg-red-50 hover:bg-red-100', text: 'text-red-800' },
] as const

function StrategyList({ items }: { items: TowsStrategy[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground italic">Chưa có chiến lược</p>
  const show = items.slice(0, 3)
  const rest = items.length - 3
  return (
    <ul className="space-y-1 mt-2">
      {show.map((s, i) => <li key={i} className="text-sm">• {s.strategy}</li>)}
      {rest > 0 && <li className="text-xs text-muted-foreground">... và {rest} chiến lược khác</li>}
    </ul>
  )
}

export default function TowsMatrix({ strategies, onCellClick }: TowsMatrixProps) {
  const [activeCell, setActiveCell] = useState<'SO' | 'ST' | 'WO' | 'WT' | null>(null)

  const handleClick = (type: 'SO' | 'ST' | 'WO' | 'WT') => {
    setActiveCell(type)
    onCellClick?.(type)
  }

  return (
    <div className="grid grid-cols-2 gap-0 border-2 border-ink">
      {CELLS.map((cell) => (
        <div
          key={cell.type}
          onClick={() => handleClick(cell.type)}
          className={`border-2 border-ink p-4 cursor-pointer transition-all ${cell.bg} ${
            activeCell === cell.type ? 'ring-2 ring-offset-2 ring-ink shadow-brutal-sm' : ''
          }`}
        >
          <h3 className={`font-heading font-bold ${cell.text}`}>{cell.label}</h3>
          <p className="text-xs text-muted-foreground">{cell.sub}</p>
          <StrategyList items={strategies[cell.type]} />
        </div>
      ))}
    </div>
  )
}
