'use client'

const LEVELS = [
  { num: '01', label: 'Người mới hoàn toàn', sub: 'Không jargon · Test 12 tuổi', key: 'level1' as const },
  { num: '02', label: 'Người có nền tảng', sub: 'Cấu trúc lập luận · Cơ chế', key: 'level2' as const },
  { num: '03', label: 'Mental Model', sub: 'Phép ẩn dụ · Nhớ mãi', key: 'level3' as const },
]

interface FeynmanSectionProps {
  level1: string
  level2: string
  level3: string
}

export function FeynmanSection({ level1, level2, level3 }: FeynmanSectionProps) {
  const values = { level1, level2, level3 }

  return (
    <>
      {LEVELS.map((l) => (
        <div key={l.num} className="border-b-2 border-ink" style={{ borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: '#c73937' }}>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 px-4 md:px-8 py-3 bg-bg-muted-warm border-b border-bg-muted-warm">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xl text-accent-brand">L{l.num}</span>
              <span className="font-display font-bold text-[11px] tracking-wider uppercase text-ink">{l.label}</span>
            </div>
            <span className="md:ml-auto font-body text-[12px] text-text-3">{l.sub}</span>
          </div>
          <div className="px-4 md:px-8 py-4 md:py-5">
            <p className="font-body text-[15px] leading-relaxed text-ink">{values[l.key]}</p>
          </div>
        </div>
      ))}
    </>
  )
}
