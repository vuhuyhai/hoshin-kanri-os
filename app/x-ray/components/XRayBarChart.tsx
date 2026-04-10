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
import type { DimensionScore } from '@/lib/x-ray/types'

interface XRayBarChartProps {
  dimensions: DimensionScore[]
}

function getScoreColor(score: number): string {
  if (score <= 40) return '#c73937'
  if (score <= 60) return '#D97706'
  if (score <= 80) return '#2563EB'
  return '#16A34A'
}

export function XRayBarChart({ dimensions }: XRayBarChartProps) {
  const data = dimensions.map((dim) => ({
    name: dim.name,
    score: dim.score,
  }))

  return (
    <div className="w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
          barSize={28}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            hide
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tick={{
              fontSize: 13,
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
            formatter={(value) => [`${value}/100`, 'Diem']}
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
                fontSize: 13,
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
