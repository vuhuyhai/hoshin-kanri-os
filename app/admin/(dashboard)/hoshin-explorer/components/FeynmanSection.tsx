'use client'

const LEVELS = [
  { num: '01', label: 'Người mới hoàn toàn', sub: 'Không jargon · Test 12 tuổi', color: '#FFD93D', key: 'level1' as const },
  { num: '02', label: 'Người có nền tảng', sub: 'Cấu trúc lập luận · Cơ chế', color: '#2D6A9F', key: 'level2' as const },
  { num: '03', label: 'Mental Model', sub: 'Phép ẩn dụ · Nhớ mãi', color: '#E63946', key: 'level3' as const },
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
          <div className="flex items-center gap-3 px-7 py-3 bg-muted border-b border-border">
            <div className="w-2 h-2 shrink-0" style={{ background: l.color }} />
            <span className="font-mono font-bold text-xl" style={{ color: l.color }}>L{l.num}</span>
            <div>
              <div className="font-mono text-[11px] font-bold tracking-[1px] uppercase">{l.label}</div>
            </div>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">{l.sub}</span>
          </div>
          <div className="px-7 py-4">
            <p className="text-sm leading-relaxed">{values[l.key]}</p>
          </div>
        </div>
      ))}
    </>
  )
}
