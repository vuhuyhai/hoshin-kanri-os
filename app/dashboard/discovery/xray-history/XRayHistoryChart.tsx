'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Dot,
} from 'recharts'

interface ChartDataPoint {
  run: string
  score: number
  date: string
  color: string
}

interface XRayHistoryChartProps {
  data: ChartDataPoint[]
}

function CustomDot(props: { cx?: number; cy?: number; payload?: ChartDataPoint }) {
  const { cx, cy, payload } = props
  if (!cx || !cy || !payload) return null
  return (
    <Dot cx={cx} cy={cy} r={6} fill={payload.color} stroke="#2C2B2B" strokeWidth={2} />
  )
}

export function XRayHistoryChart({ data }: XRayHistoryChartProps) {
  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="run"
            tick={{ fontSize: 12, fill: '#8A8787' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: '#8A8787' }}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine y={25} stroke="#c73937" strokeDasharray="3 3" strokeOpacity={0.4} />
          <ReferenceLine y={50} stroke="#D97706" strokeDasharray="3 3" strokeOpacity={0.4} />
          <ReferenceLine y={75} stroke="#2563EB" strokeDasharray="3 3" strokeOpacity={0.4} />
          <Tooltip
            contentStyle={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: 14,
              border: '2px solid #2C2B2B',
              borderRadius: 0,
              boxShadow: '3px 3px 0 #2C2B2B',
            }}
            formatter={(value) => [`${value}/100`, 'Điểm']}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as ChartDataPoint | undefined
              return p?.date ?? ''
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#2C2B2B"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 8, stroke: '#c73937', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
