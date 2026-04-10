'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { PillarScore } from '@/lib/x-ray/types'

interface XRayBarChartProps {
  pillarScores: PillarScore[]
}

function getScoreColor(score: number): string {
  if (score <= 25) return '#c73937'
  if (score <= 50) return '#D97706'
  if (score <= 75) return '#2563EB'
  return '#16A34A'
}

export function XRayBarChart({ pillarScores }: XRayBarChartProps) {
  const data = pillarScores.map((p) => ({
    name: p.label,
    score: p.score,
  }))

  return (
    <div className="w-full" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          barSize={24}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{
              fontSize: 12,
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 600,
              fill: '#2C2B2B',
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 14,
              border: '2px solid #2C2B2B',
              borderRadius: 0,
              boxShadow: '3px 3px 0 #2C2B2B',
            }}
            formatter={(value) => [`${value}/100`, 'Điểm']}
          />
          <Bar
            dataKey="score"
            background={{ fill: '#ECEAE6', radius: 0 }}
            label={{
              position: 'right',
              formatter: (v) => `${v}/100`,
              style: {
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 700,
                fontSize: 12,
                fill: '#2C2B2B',
              },
            }}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={getScoreColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
