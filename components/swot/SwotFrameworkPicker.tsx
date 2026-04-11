'use client'

import { FrameworkElementSelector } from './FrameworkElementSelector'
import type { SelectedElements } from '@/lib/swot/coaching-types'

const EIGHT_MS_ELEMENTS = [
  'Nhân lực', 'Máy móc', 'Nguyên liệu', 'Phương pháp',
  'Tài chính', 'Đo lường', 'Quản lý', 'Môi trường làm việc',
]

const FIVE_FORCES_ELEMENTS = [
  'Đối thủ hiện tại', 'Khách hàng', 'Nhà cung cấp',
  'Sản phẩm thay thế', 'Đối thủ tiềm ẩn',
]

const PESTEL_ELEMENTS = [
  'Chính trị', 'Kinh tế', 'Xã hội',
  'Công nghệ', 'Môi trường', 'Pháp lý',
]

interface SwotFrameworkPickerProps {
  selectedElements: SelectedElements
  onChange: (elements: SelectedElements) => void
  error?: string
}

export function SwotFrameworkPicker({
  selectedElements, onChange, error,
}: SwotFrameworkPickerProps) {
  const toggleElement = (
    key: keyof SelectedElements,
    element: string,
  ) => {
    const current = selectedElements[key]
    const next = current.includes(element)
      ? current.filter((e) => e !== element)
      : [...current, element]
    onChange({ ...selectedElements, [key]: next })
  }

  const swCount = selectedElements.eightMs.length
  const otCount = selectedElements.fiveForces.length + selectedElements.pestel.length
  const swValid = swCount >= 1
  const otValid = otCount >= 1

  return (
    <div className="space-y-6">
      {/* ── S-W Group ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-display font-bold px-2 py-0.5 border-2 border-blue-600 bg-blue-50 text-blue-700">
            S-W
          </span>
          <span className="text-xs font-display font-semibold text-ink">
            Phân tích Điểm mạnh &amp; Điểm yếu
          </span>
        </div>
        <FrameworkElementSelector
          name="8Ms"
          description="Phân tích nội bộ theo 8 nguồn lực"
          elements={EIGHT_MS_ELEMENTS}
          selectedElements={selectedElements.eightMs}
          onToggle={(el) => toggleElement('eightMs', el)}
          focusNote="Giúp AI tập trung vào Strengths & Weaknesses"
        />
      </div>

      {/* ── O-T Group ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-display font-bold px-2 py-0.5 border-2 border-orange-500 bg-orange-50 text-orange-700">
            O-T
          </span>
          <span className="text-xs font-display font-semibold text-ink">
            Phân tích Cơ hội &amp; Thách thức
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-1">
          Chọn ít nhất 1 yếu tố từ 1 trong 2 framework bên dưới
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FrameworkElementSelector
            name="5 Forces"
            description="Áp lực cạnh tranh ngành"
            elements={FIVE_FORCES_ELEMENTS}
            selectedElements={selectedElements.fiveForces}
            onToggle={(el) => toggleElement('fiveForces', el)}
            focusNote="Giúp AI tập trung vào Threats & Opportunities"
          />
          <FrameworkElementSelector
            name="PESTEL"
            description="Môi trường vĩ mô Việt Nam"
            elements={PESTEL_ELEMENTS}
            selectedElements={selectedElements.pestel}
            onToggle={(el) => toggleElement('pestel', el)}
            focusNote="Giúp AI tập trung vào Opportunities & Threats"
          />
        </div>
      </div>

      {/* ── Progress indicator ── */}
      <div className="border-2 border-black/10 bg-gray-50 p-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span>{swValid ? '✅' : '⬜'}</span>
          <span className={swValid ? 'text-ink font-medium' : 'text-muted-foreground'}>
            Đã chọn {swCount} yếu tố SW
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span>{otValid ? '✅' : '⬜'}</span>
          <span className={otValid ? 'text-ink font-medium' : 'text-muted-foreground'}>
            Đã chọn {otCount} yếu tố OT
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
}
