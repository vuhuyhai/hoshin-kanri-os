'use client'

const LEVELS = [
  { num: '01', label: 'Người mới hoàn toàn', sub: 'Không jargon · Test 12 tuổi', color: '#c73937', key: 'level1' as const },
  { num: '02', label: 'Người có nền tảng', sub: 'Cấu trúc lập luận · Cơ chế', color: '#2D6A9F', key: 'level2' as const },
  { num: '03', label: 'Mental Model', sub: 'Phép ẩn dụ · Nhớ mãi', color: '#2C2B2B', key: 'level3' as const },
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
        <div key={l.num} className="border-b-[3px] border-ink" style={{ borderLeftWidth: 5, borderLeftStyle: 'solid', borderLeftColor: l.color }}>
          <div className="flex items-center gap-3 px-6 py-3 bg-bg-muted-warm border-b border-bg-muted-warm">
            <span className="font-display font-black text-xl" style={{ color: l.color }}>L{l.num}</span>
            <div className="font-display font-bold text-[11px] tracking-wider uppercase text-ink">{l.label}</div>
            <span className="ml-auto font-body text-[12px] text-text-3">{l.sub}</span>
          </div>
          <div className="px-6 py-5 bg-bg-warm">
            <p className="font-body text-[15px] leading-relaxed text-ink">{values[l.key]}</p>
          </div>
        </div>
      ))}
    </>
  )
}
