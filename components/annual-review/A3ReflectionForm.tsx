'use client'

import type { A3Reflection } from '@/lib/annual-review/types'

interface Props {
  value: A3Reflection
  onChange: (next: A3Reflection) => void
  disabled?: boolean
}

const FIELD_HINTS: Record<
  keyof A3Reflection,
  { label: string; hint: string; placeholder: string }
> = {
  background: {
    label: 'Bối cảnh (Background)',
    hint: 'Năm vừa rồi tổ chức ở đâu? Bối cảnh thị trường, nội bộ.',
    placeholder:
      'VD: Q7 chuyển từ growth sang profitability. Thị trường F&B Sài Gòn cạnh tranh khốc liệt sau khi 3 chuỗi mới mở...',
  },
  currentState: {
    label: 'Hiện trạng (Current State)',
    hint: 'Kết quả thực tế đã đạt được — số liệu cụ thể, không chung chung.',
    placeholder:
      'VD: Doanh thu đạt 82% target năm. Customer retention 71% (target 80%). Mở 2/3 store mới...',
  },
  targetGap: {
    label: 'Khoảng cách với target (Target Gap)',
    hint: 'Gap giữa thực tế và target — vì sao? Root cause analysis.',
    placeholder:
      'VD: Thiếu 18% doanh thu vì store mới ramp-up chậm. Retention thấp do dịch vụ Q3-Q4 sụt do thiếu nhân sự senior...',
  },
  nextAction: {
    label: 'Hành động tiếp theo (Next Action)',
    hint: 'Năm tới làm gì khác? Học được gì từ năm cũ?',
    placeholder:
      'VD: Tập trung profitability thay vì expansion. Tuyển 3 senior staff Q1. Implement loyalty program để vực retention...',
  },
}

export function A3ReflectionForm({ value, onChange, disabled }: Props) {
  const update = (field: keyof A3Reflection, val: string) => {
    onChange({ ...value, [field]: val })
  }

  return (
    <section className="card-brutal p-6">
      <header className="mb-4">
        <span className="nb-sticker">A3 REFLECTION</span>
        <h2 className="font-display font-bold text-2xl text-ink mt-2">
          Hansei — Phản tỉnh năm cũ
        </h2>
        <p className="text-text-2 text-sm mt-1">
          Toyota A3 4-fields pattern. Mỗi ô 1-2 đoạn, focus vào sự thật + root
          cause, không justify.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(FIELD_HINTS) as Array<keyof A3Reflection>).map((field) => {
          const config = FIELD_HINTS[field]
          return (
            <div key={field}>
              <label className="block">
                <span className="font-display font-bold text-sm text-ink">
                  {config.label}
                </span>
                <span className="block text-text-3 text-xs mt-0.5">
                  {config.hint}
                </span>
                <textarea
                  value={value[field]}
                  onChange={(e) => update(field, e.target.value)}
                  disabled={disabled}
                  placeholder={config.placeholder}
                  className="input-brutal mt-2 w-full min-h-[120px] resize-y font-body text-sm"
                  maxLength={2000}
                />
                <span className="text-text-3 text-xs">
                  {value[field].length}/2000
                </span>
              </label>
            </div>
          )
        })}
      </div>
    </section>
  )
}
