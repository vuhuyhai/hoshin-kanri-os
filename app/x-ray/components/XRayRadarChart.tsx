'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { PillarScore } from '@/lib/x-ray/types'

interface XRayRadarChartProps {
  pillarScores: PillarScore[]
}

export function XRayRadarChart({ pillarScores }: XRayRadarChartProps) {
  const data = pillarScores.map((p) => ({
    name: p.label,
    score: p.score,
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
          Tổng quan 7 trụ cột
        </h3>
      </div>
      <div className="px-4 pb-6" style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#2C2B2B" strokeOpacity={0.2} />
            <PolarAngleAxis
              dataKey="name"
              tick={{
                fontSize: 11,
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
              formatter={(value) => [`${value}/100`, 'Điểm']}
            />
            <Radar
              dataKey="score"
              stroke="#c73937"
              strokeWidth={2}
              fill="#c73937"
              fillOpacity={0.15}
              dot={{ fill: '#c73937', r: 4, strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
