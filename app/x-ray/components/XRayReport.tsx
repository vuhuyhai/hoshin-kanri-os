'use client'

import { useRouter } from 'next/navigation'
import type { XRayResult, DimensionScore } from '@/lib/x-ray/types'
import { XRayRadarChart } from './XRayRadarChart'
import { XRayBarChart } from './XRayBarChart'
import { DimensionSparkline } from './DimensionSparkline'

// ============================================================
// SCORE HELPERS
// ============================================================

function getScoreColor(score: number): string {
  if (score <= 40) return '#c73937'
  if (score <= 60) return '#D97706'
  if (score <= 80) return '#2563EB'
  return '#16A34A'
}

function getScoreLabel(score: number): string {
  if (score <= 40) return 'Nguy hiem'
  if (score <= 60) return 'Can cai thien'
  if (score <= 80) return 'Trung binh'
  return 'Tot'
}

function getScoreBg(score: number): string {
  if (score <= 40) return '#c73937'
  if (score <= 60) return '#D97706'
  if (score <= 80) return '#2563EB'
  return '#16A34A'
}

// ============================================================
// SVG SCORE GAUGE
// ============================================================

function ScoreGauge({ score }: { score: number }) {
  const size = 200
  const cx = size / 2
  const cy = size / 2 + 10
  const r = 75
  const startAngle = Math.PI
  const endAngle = 0
  const scoreAngle = startAngle - (score / 100) * Math.PI

  // Arc path helper
  const arc = (start: number, end: number) => {
    const x1 = cx + r * Math.cos(start)
    const y1 = cy - r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy - r * Math.sin(end)
    const largeArc = Math.abs(start - end) > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  // Needle endpoint
  const needleLen = r - 12
  const nx = cx + needleLen * Math.cos(scoreAngle)
  const ny = cy - needleLen * Math.sin(scoreAngle)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size / 2 + 30}
        viewBox={`0 0 ${size} ${size / 2 + 30}`}
      >
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c73937" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path
          d={arc(startAngle, endAngle)}
          fill="none"
          stroke="#ECEAE6"
          strokeWidth={14}
          strokeLinecap="butt"
        />
        {/* Colored arc */}
        <path
          d={arc(startAngle, endAngle)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={14}
          strokeLinecap="butt"
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#2C2B2B"
          strokeWidth={3}
          strokeLinecap="butt"
        />
        <circle cx={cx} cy={cy} r={5} fill="#2C2B2B" />
        {/* Score text */}
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 900,
            fontSize: 40,
            fill: '#2C2B2B',
          }}
        >
          {score}
        </text>
      </svg>
    </div>
  )
}

// ============================================================
// SIDEBAR NAV ITEM
// ============================================================

function SidebarNavItem({
  dim,
  onClick,
}: {
  dim: DimensionScore
  onClick: () => void
}) {
  const color = getScoreColor(dim.score)
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 border-l-[3px] border-transparent transition-colors"
      style={{
        ['--hover-border' as string]: '#c73937',
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderLeftColor = '#c73937')
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderLeftColor = 'transparent')
      }
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 flex items-center justify-center shrink-0"
          style={{ background: color + '20' }}
        >
          <span
            className="text-xs"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 700,
              color,
            }}
          >
            {dim.score}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm truncate"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#2C2B2B',
              fontSize: 13,
            }}
          >
            {dim.name}
          </p>
          <p
            className="text-xs"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 600,
              color: '#5A5757',
              fontSize: 11,
            }}
          >
            {dim.score}/100
          </p>
        </div>
      </div>
      {/* Mini progress bar */}
      <div className="mt-2 h-1 w-full" style={{ background: '#ECEAE6' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${dim.score}%`, background: color }}
        />
      </div>
    </button>
  )
}

// ============================================================
// DIMENSION CARD
// ============================================================

function DimensionCard({ dim }: { dim: DimensionScore }) {
  const color = getScoreColor(dim.score)
  const label = getScoreLabel(dim.score)

  return (
    <div
      id={`dim-${dim.dimensionId}`}
      className="card-brutal"
      style={{
        background: '#F7F5F2',
        border: '3px solid #2C2B2B',
        boxShadow: '5px 5px 0 #2C2B2B',
        padding: 0,
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: '2px solid #2C2B2B' }}
      >
        <h3
          className="text-lg"
          style={{
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 700,
            color: '#2C2B2B',
          }}
        >
          {dim.name}
        </h3>
        <div className="flex items-center gap-3 shrink-0">
          <DimensionSparkline score={dim.score} />
          <span
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 900,
              fontSize: 24,
              color,
            }}
          >
            {dim.score}
          </span>
          <span
            className="px-2 py-0.5 text-white"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 600,
              fontSize: 11,
              textTransform: 'uppercase',
              background: color,
            }}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Progress bar */}
        <div
          className="h-2 w-full overflow-hidden"
          style={{ background: '#ECEAE6', border: '2px solid #2C2B2B' }}
        >
          <div
            className="h-full transition-all duration-1000"
            style={{ width: `${dim.score}%`, background: color }}
          />
        </div>

        {/* Feedback */}
        <p
          className="leading-relaxed"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 400,
            fontSize: 15,
            color: '#5A5757',
            lineHeight: 1.7,
          }}
        >
          {dim.feedback}
        </p>

        {/* Top issue */}
        <div
          className="px-4 py-3"
          style={{
            background: '#ECEAE6',
            borderLeft: '4px solid #c73937',
          }}
        >
          <span
            className="block mb-1"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 600,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '.12em',
              color: '#c73937',
            }}
          >
            Van de chinh
          </span>
          <p
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 500,
              fontSize: 14,
              color: '#2C2B2B',
            }}
          >
            {dim.topIssue}
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MAIN REPORT
// ============================================================

interface XRayReportProps {
  result: XRayResult
}

export function XRayReport({ result }: XRayReportProps) {
  const router = useRouter()

  const handlePrint = () => window.print()
  const handleStartPlanning = () => router.push('/dashboard/discovery')

  const scrollToDimension = (id: string) => {
    document.getElementById(`dim-${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const scoreColor = getScoreColor(result.overallScore)

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .xray-sidebar { display: none !important; }
        }
      `}</style>

      {/* ============ HEADER ============ */}
      <header
        className="w-full"
        style={{
          background: '#2C2B2B',
          borderBottom: '3px solid #2C2B2B',
        }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 md:px-12 lg:px-20 py-8 lg:py-12">
          <div>
            <span
              className="block mb-2"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 600,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '.15em',
                color: '#c73937',
              }}
            >
              Phan tich boi Hoshin Kanri OS
            </span>
            <h1
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(28px, 4vw, 48px)',
                color: '#FFFFFF',
                lineHeight: 1.1,
              }}
            >
              Bao cao suc khoe
              <br />
              doanh nghiep
            </h1>
            <p
              className="mt-3"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 400,
                fontSize: 16,
                color: '#8A8787',
              }}
            >
              {result.email} &middot;{' '}
              {new Date(result.completedAt).toLocaleDateString('vi-VN')}
            </p>
          </div>

          {/* Score badge */}
          <div className="text-center shrink-0">
            <span
              className="block"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 900,
                fontSize: 64,
                color: scoreColor,
                lineHeight: 1,
              }}
            >
              {result.overallScore}
            </span>
            <span
              className="block mt-1"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 600,
                fontSize: 14,
                textTransform: 'uppercase',
                color: '#8A8787',
              }}
            >
              Diem tong the
            </span>
          </div>
        </div>
      </header>

      {/* ============ MOBILE SUMMARY BAR ============ */}
      <div
        className="lg:hidden w-full overflow-x-auto no-print"
        style={{
          background: '#ECEAE6',
          borderBottom: '3px solid #2C2B2B',
        }}
      >
        <div className="flex items-center gap-4 px-6 py-3 min-w-max">
          {result.dimensions.map((dim) => (
            <button
              key={dim.dimensionId}
              onClick={() => scrollToDimension(dim.dimensionId)}
              className="flex items-center gap-2 shrink-0"
            >
              <span
                className="w-6 h-6 flex items-center justify-center text-xs text-white"
                style={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 700,
                  background: getScoreColor(dim.score),
                }}
              >
                {dim.score}
              </span>
              <span
                className="text-xs"
                style={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 600,
                  color: '#2C2B2B',
                }}
              >
                {dim.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ============ BODY — SIDEBAR + MAIN ============ */}
      <div className="flex w-full">
        {/* SIDEBAR — desktop only */}
        <aside
          className="xray-sidebar hidden lg:flex flex-col shrink-0 no-print"
          style={{
            width: 240,
            background: '#ECEAE6',
            borderRight: '3px solid #2C2B2B',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* Score gauge */}
          <div className="px-4 pt-6">
            <ScoreGauge score={result.overallScore} />
          </div>

          {/* Nav links */}
          <nav className="flex-1 py-4">
            {result.dimensions.map((dim) => (
              <SidebarNavItem
                key={dim.dimensionId}
                dim={dim}
                onClick={() => scrollToDimension(dim.dimensionId)}
              />
            ))}
          </nav>

          {/* CTA buttons — sticky bottom */}
          <div
            className="p-4 space-y-2"
            style={{ borderTop: '2px solid #2C2B2B' }}
          >
            <button
              onClick={handlePrint}
              className="btn-brutal w-full py-2.5 px-4 text-sm"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                background: '#F7F5F2',
                border: '2px solid #2C2B2B',
                boxShadow: '3px 3px 0 #2C2B2B',
                color: '#2C2B2B',
              }}
            >
              Tai PDF
            </button>
            <button
              onClick={handleStartPlanning}
              className="btn-brutal w-full py-2.5 px-4 text-sm"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                background: '#c73937',
                border: '2px solid #c73937',
                boxShadow: '5px 5px 0 #2C2B2B',
                color: '#FFFFFF',
              }}
            >
              Bat dau lap ke hoach &rarr;
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main
          className="flex-1 min-w-0 px-6 md:px-10 lg:px-14 py-8 space-y-8"
          style={{ background: '#F7F5F2' }}
        >
          {/* Executive summary */}
          <div
            className="px-6 py-5"
            style={{
              background: '#FFFFFF',
              border: '3px solid #2C2B2B',
              boxShadow: '5px 5px 0 #2C2B2B',
            }}
          >
            <p
              className="leading-relaxed"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 400,
                fontSize: 16,
                color: '#5A5757',
                lineHeight: 1.7,
              }}
            >
              {result.executiveSummary}
            </p>
          </div>

          {/* Charts — side-by-side on desktop */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <XRayRadarChart dimensions={result.dimensions} />
            <div
              className="flex flex-col justify-center"
              style={{
                background: '#F7F5F2',
                border: '3px solid #2C2B2B',
                boxShadow: '5px 5px 0 #2C2B2B',
                padding: '24px 20px',
              }}
            >
              <h3
                className="text-base uppercase tracking-wider mb-4"
                style={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 700,
                  color: '#2C2B2B',
                }}
              >
                So sanh 5 chieu
              </h3>
              <XRayBarChart dimensions={result.dimensions} />
            </div>
          </div>

          {/* Dimension cards — 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {result.dimensions.map((dim) => (
              <DimensionCard key={dim.dimensionId} dim={dim} />
            ))}
          </div>

          {/* ============ TOP 3 ACTIONS ============ */}
          <div
            className="w-full"
            style={{
              background: '#2C2B2B',
              border: '3px solid #2C2B2B',
              padding: '32px 28px',
            }}
          >
            <h2
              className="mb-6"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 900,
                fontSize: 20,
                color: '#FFFFFF',
              }}
            >
              Top 3 viec can lam ngay
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {result.topPriorities.map((priority, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 px-5 py-4"
                  style={{
                    borderRight:
                      idx < result.topPriorities.length - 1
                        ? '2px solid #5A5757'
                        : 'none',
                  }}
                >
                  <span
                    className="shrink-0"
                    style={{
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 900,
                      fontSize: 32,
                      color: '#c73937',
                      lineHeight: 1,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <p
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 500,
                      fontSize: 16,
                      color: '#FFFFFF',
                      lineHeight: 1.6,
                    }}
                  >
                    {priority}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ============ CTA BANNER ============ */}
          <div
            className="no-print w-full"
            style={{
              background: '#c73937',
              borderTop: '3px solid #2C2B2B',
            }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-8 md:px-12 py-10">
              <div>
                <h2
                  style={{
                    fontFamily: '"Montserrat", sans-serif',
                    fontWeight: 800,
                    fontSize: 'clamp(20px, 3vw, 28px)',
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  {result.ctaMessage}
                </h2>
              </div>
              <div className="shrink-0 text-center space-y-3">
                <button
                  onClick={handleStartPlanning}
                  className="btn-brutal block px-8 py-3"
                  style={{
                    fontFamily: '"Montserrat", sans-serif',
                    fontWeight: 700,
                    fontSize: 14,
                    textTransform: 'uppercase',
                    background: '#FFFFFF',
                    color: '#c73937',
                    border: '2px solid #FFFFFF',
                    boxShadow: '5px 5px 0 #9e1f1e',
                  }}
                >
                  Tao tai khoan mien phi &rarr;
                </button>
                <p
                  style={{
                    fontFamily: '"Barlow Condensed", sans-serif',
                    fontWeight: 400,
                    fontSize: 13,
                    color: '#FFFFFF',
                    opacity: 0.7,
                  }}
                >
                  Mien phi · Khong can the tin dung · Setup trong 5 phut
                </p>
              </div>
            </div>
          </div>

          {/* ============ BOTTOM BUTTONS (mobile) ============ */}
          <div className="no-print flex gap-3 lg:hidden">
            <button
              onClick={handlePrint}
              className="btn-brutal flex-1 py-3 text-sm"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 600,
                textTransform: 'uppercase',
                background: '#F7F5F2',
                border: '2px solid #2C2B2B',
                boxShadow: '3px 3px 0 #2C2B2B',
                color: '#2C2B2B',
              }}
            >
              Tai PDF
            </button>
            <button
              onClick={handleStartPlanning}
              className="btn-brutal flex-1 py-3 text-sm"
              style={{
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: '#c73937',
                border: '2px solid #c73937',
                boxShadow: '5px 5px 0 #2C2B2B',
                color: '#FFFFFF',
              }}
            >
              Bat dau lap ke hoach &rarr;
            </button>
          </div>
        </main>
      </div>
    </>
  )
}
