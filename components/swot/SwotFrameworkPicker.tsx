'use client'

import type { AnalysisFramework } from '@/lib/swot/coaching-types'

interface FrameworkOption {
  id: AnalysisFramework
  name: string
  description: string
  dimensions: string[]
  focusNote: string
}

const FRAMEWORKS: FrameworkOption[] = [
  {
    id: '8Ms',
    name: '8Ms',
    description: 'Phân tích nội bộ theo 8 nguồn lực',
    dimensions: [
      'Nhân lực', 'Máy móc', 'Nguyên liệu', 'Phương pháp',
      'Tài chính', 'Đo lường', 'Quản lý', 'Môi trường làm việc',
    ],
    focusNote: 'Giúp AI tập trung vào Strengths & Weaknesses',
  },
  {
    id: '5Forces',
    name: '5 Forces',
    description: 'Áp lực cạnh tranh ngành',
    dimensions: [
      'Đối thủ hiện tại', 'Khách hàng', 'Nhà cung cấp',
      'Sản phẩm thay thế', 'Đối thủ tiềm ẩn',
    ],
    focusNote: 'Giúp AI tập trung vào Threats & Opportunities',
  },
  {
    id: 'PESTEL',
    name: 'PESTEL',
    description: 'Môi trường vĩ mô Việt Nam',
    dimensions: [
      'Chính trị', 'Kinh tế', 'Xã hội',
      'Công nghệ', 'Môi trường', 'Pháp lý',
    ],
    focusNote: 'Giúp AI tập trung vào Opportunities & Threats',
  },
]

interface SwotFrameworkPickerProps {
  selected: AnalysisFramework[]
  onChange: (selected: AnalysisFramework[]) => void
  error?: string
}

export function SwotFrameworkPicker({
  selected,
  onChange,
  error,
}: SwotFrameworkPickerProps) {
  const toggle = (id: AnalysisFramework) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {FRAMEWORKS.map((fw) => {
          const isSelected = selected.includes(fw.id)
          return (
            <button
              key={fw.id}
              type="button"
              onClick={() => toggle(fw.id)}
              className={`text-left p-4 border-2 border-black transition-all ${
                isSelected
                  ? 'bg-black text-white shadow-none'
                  : 'bg-white hover:shadow-[4px_4px_0_#000]'
              }`}
            >
              <div className="font-display font-bold text-sm">
                {fw.name}
              </div>
              <p className={`text-xs mt-0.5 ${
                isSelected ? 'text-gray-300' : 'text-muted-foreground'
              }`}>
                {fw.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">
                {fw.dimensions.map((d) => (
                  <span
                    key={d}
                    className={`text-[10px] px-1.5 py-0.5 border ${
                      isSelected
                        ? 'border-white/30 text-gray-300'
                        : 'border-black/20 text-muted-foreground'
                    }`}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <p className={`text-[10px] mt-2 italic ${
                isSelected ? 'text-gray-400' : 'text-muted-foreground/70'
              }`}>
                {fw.focusNote}
              </p>
            </button>
          )
        })}
      </div>
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
}
