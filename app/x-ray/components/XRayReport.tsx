'use client'

import { useRouter } from 'next/navigation'
import type { XRayResult, PillarScore } from '@/lib/x-ray/types'
import { XRayRadarChart } from './XRayRadarChart'
import { XRayBarChart } from './XRayBarChart'

// ============================================================
// SCORE HELPERS (new thresholds: 0-25, 26-50, 51-75, 76-100)
// ============================================================

function getScoreColor(score: number): string {
  if (score <= 25) return '#c73937'
  if (score <= 50) return '#D97706'
  if (score <= 75) return '#2563EB'
  return '#16A34A'
}

function getScoreLabel(score: number): string {
  if (score <= 25) return 'Nguy hiểm'
  if (score <= 50) return 'Yếu'
  if (score <= 75) return 'Trung bình'
  return 'Tốt'
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
  const scoreAngle = startAngle - (score / 100) * Math.PI

  const arc = (start: number, end: number) => {
    const x1 = cx + r * Math.cos(start)
    const y1 = cy - r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy - r * Math.sin(end)
    const largeArc = Math.abs(start - end) > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`
  }

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
            <stop offset="33%" stopColor="#D97706" />
            <stop offset="66%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        <path
          d={arc(startAngle, 0)}
          fill="none"
          stroke="#ECEAE6"
          strokeWidth={14}
          strokeLinecap="butt"
        />
        <path
          d={arc(startAngle, 0)}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={14}
          strokeLinecap="butt"
        />
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
  pillar,
  onClick,
}: {
  pillar: PillarScore
  onClick: () => void
}) {
  const color = getScoreColor(pillar.score)
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 border-l-[3px] border-transparent transition-colors"
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderLeftColor = color)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderLeftColor = 'transparent')
      }
    >
      <div className="flex items-center gap-2.5">
        <span className="text-lg shrink-0">{pillar.icon}</span>
        <div
          className="w-7 h-7 flex items-center justify-center shrink-0"
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
            {pillar.score}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xs truncate"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#2C2B2B',
              fontSize: 11,
            }}
          >
            {pillar.label}
          </p>
        </div>
      </div>
      <div className="mt-1.5 h-1 w-full" style={{ background: '#ECEAE6' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${pillar.score}%`, background: color }}
        />
      </div>
    </button>
  )
}

// ============================================================
// PILLAR CARD
// ============================================================

function PillarCard({ pillar }: { pillar: PillarScore }) {
  const color = getScoreColor(pillar.score)
  const label = getScoreLabel(pillar.score)

  return (
    <div
      id={`pillar-${pillar.pillar}`}
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
        <div className="flex items-center gap-2">
          <span className="text-xl">{pillar.icon}</span>
          <h3
            className="text-base"
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 700,
              color: '#2C2B2B',
            }}
          >
            {pillar.label}
          </h3>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span
            style={{
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 900,
              fontSize: 24,
              color,
            }}
          >
            {pillar.score}
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
            style={{ width: `${pillar.score}%`, background: color }}
          />
        </div>

        {/* Summary */}
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
          {pillar.summary}
        </p>

        {/* Top issue */}
        <div
          className="px-4 py-3"
          style={{
            background: '#ECEAE6',
            borderLeft: `4px solid ${color}`,
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
              color,
            }}
          >
            Vấn đề chính
          </span>
          <p
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 500,
              fontSize: 14,
              color: '#2C2B2B',
            }}
          >
            {pillar.topIssue}
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
  savedSuccessfully?: boolean
}

export function XRayReport({ result, savedSuccessfully }: XRayReportProps) {
  const router = useRouter()

  const handlePrint = () => window.print()
  const handleStartPlanning = () => router.push('/dashboard/discovery')

  const scrollToPillar = (id: string) => {
    document.getElementById(`pillar-${id}`)?.scrollIntoView({
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
              Phân tích bởi Hoshin Kanri OS
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
              Báo cáo sức khỏe
              <br />
              doanh nghiệp
            </h1>
            <p
              className="mt-1"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 400,
                fontSize: 14,
                color: '#8A8787',
              }}
            >
              Phân tích theo 7 trụ cột Operational Excellence
            </p>
            {result.orgName && (
              <p
                className="mt-3"
                style={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 600,
                  fontSize: 18,
                  color: '#ECEAE6',
                }}
              >
                {result.orgName}
                {result.industry && (
                  <span
                    className="ml-3 px-2 py-0.5"
                    style={{
                      fontFamily: '"Montserrat", sans-serif',
                      fontWeight: 500,
                      fontSize: 12,
                      background: 'rgba(255,255,255,0.15)',
                      color: '#ECEAE6',
                    }}
                  >
                    {result.industry}
                  </span>
                )}
              </p>
            )}
            <p
              className="mt-2"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 400,
                fontSize: 14,
                color: '#8A8787',
              }}
            >
              {new Date(result.generatedAt).toLocaleDateString('vi-VN')}
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
              Điểm tổng thể
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
        <div className="flex items-center gap-3 px-6 py-3 min-w-max">
          {result.pillarScores.map((p) => (
            <button
              key={p.pillar}
              onClick={() => scrollToPillar(p.pillar)}
              className="flex items-center gap-1.5 shrink-0"
            >
              <span className="text-sm">{p.icon}</span>
              <span
                className="w-6 h-6 flex items-center justify-center text-xs text-white"
                style={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 700,
                  background: getScoreColor(p.score),
                }}
              >
                {p.score}
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
            width: 260,
            background: '#ECEAE6',
            borderRight: '3px solid #2C2B2B',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
          }}
        >
          <div className="px-4 pt-6">
            <ScoreGauge score={result.overallScore} />
          </div>

          <nav className="flex-1 py-2">
            {result.pillarScores.map((p) => (
              <SidebarNavItem
                key={p.pillar}
                pillar={p}
                onClick={() => scrollToPillar(p.pillar)}
              />
            ))}
          </nav>

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
              Tải PDF
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
              Bắt đầu lập kế hoạch &rarr;
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
            <XRayRadarChart pillarScores={result.pillarScores} />
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
                So sánh 7 trụ cột
              </h3>
              <XRayBarChart pillarScores={result.pillarScores} />
            </div>
          </div>

          {/* Pillar cards — 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {result.pillarScores.map((p) => (
              <PillarCard key={p.pillar} pillar={p} />
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
              Top 3 việc cần làm ngay
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {result.topActions.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 px-5 py-4"
                  style={{
                    borderRight:
                      idx < result.topActions.length - 1
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
                    {action}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ============ SAVE STATUS BANNER ============ */}
          {savedSuccessfully !== undefined && (
            <div
              className="no-print w-full px-6 py-4"
              style={{
                background: savedSuccessfully ? '#f0fdf4' : '#fffbeb',
                border: `2px solid ${savedSuccessfully ? '#16A34A' : '#D97706'}`,
              }}
            >
              {savedSuccessfully ? (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 500,
                      fontSize: 15,
                      color: '#166534',
                    }}
                  >
                    ✅ Báo cáo đã được lưu vào tài khoản của bạn
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/discovery/xray-history')}
                    className="text-sm font-semibold underline"
                    style={{ color: '#166534' }}
                  >
                    → Vào Dashboard xem lịch sử X-Ray
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <p
                    style={{
                      fontFamily: '"Barlow Condensed", sans-serif',
                      fontWeight: 500,
                      fontSize: 15,
                      color: '#92400e',
                    }}
                  >
                    💡 Đăng nhập để lưu và theo dõi tiến độ qua từng lần chạy
                  </p>
                  <button
                    onClick={handleStartPlanning}
                    className="text-sm font-semibold underline"
                    style={{ color: '#92400e' }}
                  >
                    → Tạo tài khoản miễn phí
                  </button>
                </div>
              )}
            </div>
          )}

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
                  Biến phân tích thành hành động — bắt đầu lập X-Matrix ngay
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
                  Tạo tài khoản miễn phí &rarr;
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
                  Miễn phí · Không cần thẻ tín dụng · Setup trong 5 phút
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
              Tải PDF
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
              Bắt đầu lập kế hoạch &rarr;
            </button>
          </div>
        </main>
      </div>
    </>
  )
}
