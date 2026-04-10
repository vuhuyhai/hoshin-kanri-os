interface KpiSparklineProps {
  values: number[]
  target: number
  color: 'green' | 'yellow' | 'red'
  width?: number
  height?: number
}

const COLOR_MAP = {
  green: { line: '#22c55e', fill: '#22c55e20', dot: '#22c55e' },
  yellow: { line: '#eab308', fill: '#eab30820', dot: '#eab308' },
  red: { line: '#ef4444', fill: '#ef444420', dot: '#ef4444' },
}

export function KpiSparkline({
  values,
  target,
  color,
  width = 120,
  height = 40,
}: KpiSparklineProps) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      </svg>
    )
  }

  const colors = COLOR_MAP[color]
  const pad = 4

  const allVals = [...values, target]
  const minVal = Math.min(...allVals) * 0.9
  const maxVal = Math.max(...allVals) * 1.1
  const range = maxVal - minVal || 1

  const toX = (idx: number) =>
    pad + (idx / (values.length - 1)) * (width - pad * 2)

  const toY = (val: number) =>
    height - pad - ((val - minVal) / range) * (height - pad * 2)

  const points = values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')

  const areaPath =
    `M ${toX(0)},${height - pad} ` +
    values.map((v, i) => `L ${toX(i)},${toY(v)}`).join(' ') +
    ` L ${toX(values.length - 1)},${height - pad} Z`

  const targetY = toY(target)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <path d={areaPath} fill={colors.fill} />
      <line
        x1={pad}
        y1={targetY}
        x2={width - pad}
        y2={targetY}
        stroke={colors.line}
        strokeWidth={1}
        strokeDasharray="3 2"
        opacity={0.5}
      />
      <polyline
        points={points}
        fill="none"
        stroke={colors.line}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={toX(values.length - 1)}
        cy={toY(values.at(-1)!)}
        r={3}
        fill={colors.dot}
      />
    </svg>
  )
}
