'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface DimensionSparklineProps {
  score: number
}

function getScoreColor(score: number): string {
  if (score <= 40) return '#c73937'
  if (score <= 60) return '#D97706'
  if (score <= 80) return '#2563EB'
  return '#16A34A'
}

export function DimensionSparkline({ score }: DimensionSparklineProps) {
  // Mock trend: 3-point progression toward current score
  const data = [
    { v: Math.round(score * 0.8) },
    { v: Math.round(score * 0.9) },
    { v: score },
  ]

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[10px] uppercase tracking-wider shrink-0"
        style={{
          fontFamily: '"Montserrat", sans-serif',
          fontWeight: 600,
          color: '#8A8787',
        }}
      >
        Trend
      </span>
      <div style={{ width: 120, height: 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={getScoreColor(score)}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
