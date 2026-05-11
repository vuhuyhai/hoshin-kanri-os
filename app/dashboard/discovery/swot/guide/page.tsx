'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GUIDE_STEPS } from '@/lib/swot/guide-data'
import { SwotGuideStep } from '@/components/swot/SwotGuideStep'

export default function SwotGuidePage() {
  const router = useRouter()
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const setRef = useCallback((i: number) => (el: HTMLDivElement | null) => { refs.current[i] = el }, [])
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          const idx = refs.current.indexOf(e.target as HTMLDivElement)
          if (idx !== -1) setActive(idx)
        }
      }),
      { threshold: 0.35, rootMargin: '-80px 0px -40% 0px' },
    )
    refs.current.forEach((el) => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])
  const scrollTo = (i: number) => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <div className="w-full min-h-full bg-bg-warm">
      <div className="px-6 lg:px-8 pt-6 lg:pt-8">
        <button onClick={() => router.back()} className="font-body text-sm text-text-2 hover:text-ink mb-3 inline-flex items-center gap-1">← Quay lại SWOT</button>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="font-display font-black text-2xl md:text-3xl text-ink uppercase">Hướng dẫn Phân tích SWOT</h1>
          <span className="inline-flex items-center font-display font-bold text-[11px] uppercase tracking-wider px-2.5 py-1 border-2 border-ink bg-card" style={{ boxShadow: '2px 2px 0px #2C2B2B' }}>6 bước · ~15 phút</span>
        </div>
      </div>
      {/* Mobile progress */}
      <div className="lg:hidden flex gap-1.5 px-6 pb-4 overflow-x-auto">
        {GUIDE_STEPS.map((_, i) => (
          <button key={i} onClick={() => scrollTo(i)} className={`w-8 h-8 shrink-0 flex items-center justify-center font-display font-black text-sm border-2 border-ink transition-colors ${active === i ? 'bg-accent-brand text-white' : 'bg-card text-ink'}`}>{i + 1}</button>
        ))}
      </div>
      <div className="flex px-6 lg:px-8 pb-8 gap-8">
        {/* Desktop sidebar */}
        <nav className="hidden lg:block w-64 shrink-0" aria-label="Mục lục hướng dẫn">
          <div className="sticky top-24 space-y-1">
            {GUIDE_STEPS.map((s, i) => (
              <button key={i} onClick={() => scrollTo(i)} className={`w-full text-left px-3 py-2 font-body text-sm transition-all ${active === i ? 'border-l-4 font-semibold text-ink' : 'border-l-4 border-transparent text-text-3 hover:text-ink'}`} style={active === i ? { borderColor: '#c73937', backgroundColor: '#FFF5F5' } : undefined}>
                <span className="font-display font-bold text-xs">Bước {i + 1}</span>
                <span className="block truncate">{s.title}</span>
              </button>
            ))}
          </div>
        </nav>
        {/* Steps */}
        <div className="flex-1 space-y-6 max-w-3xl">
          {GUIDE_STEPS.map((step, i) => (
            <div key={i} id={`step-${i + 1}`} ref={setRef(i)} tabIndex={-1}>
              <SwotGuideStep stepNumber={i + 1} isLast={i === GUIDE_STEPS.length - 1} {...step} />
            </div>
          ))}
          <div className="bg-card border-2 p-6 text-center" style={{ borderColor: '#2C2B2B', boxShadow: '4px 4px 0px #2C2B2B' }}>
            <Link href="/dashboard/discovery/swot">
              <button className="font-display font-black text-sm uppercase tracking-wider px-8 py-3 text-white border-2 border-ink transition-all hover:translate-y-[-2px]" style={{ backgroundColor: '#c73937', boxShadow: '4px 4px 0px #2C2B2B' }}>Bắt đầu phân tích SWOT →</button>
            </Link>
            <p className="font-body text-sm text-text-3 mt-3">Đã sẵn sàng? Bắt đầu ngay với dữ liệu thực của doanh nghiệp</p>
          </div>
        </div>
      </div>
    </div>
  )
}
