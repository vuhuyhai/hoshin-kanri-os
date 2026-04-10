'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { DimensionScore } from '@/lib/x-ray/types'

interface XRayRadarChartProps {
  dimensions: DimensionScore[]
}

export function XRayRadarChart({ dimensions }: XRayRadarChartProps) {
  const data = dimensions.map((dim) => ({
    name: dim.name,
    score: dim.score,
    fullMark: 100,
  }))

  return (
    <div
      className="w-full"
      style={{
        background: 'var(--background)',
        border: '3px solid #2C2B2B',
        boxShadow: '5px 5px 0 #2C2B2B',
      }}
    >
      <div className="px-6 pt-5 pb-2">
        <h3
          className="text-base uppercase tracking-wider"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 700,
            color: '#2C2B2B',
          }}
        >
          Tong quan 5 chieu
        </h3>
      </div>
      <div className="px-4 pb-6" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#2C2B2B" strokeOpacity={0.2} />
            <PolarAngleAxis
              dataKey="name"
              tick={{
                fontSize: 12,
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 600,
                fill: '#2C2B2B',
              }}
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
            <Radar
              dataKey="score"
              stroke="#c73937"
              strokeWidth={2}
              fill="#c73937"
              fillOpacity={0.15}
              dot={{ fill: '#c73937', r: 5, strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
