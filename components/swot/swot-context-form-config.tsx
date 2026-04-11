import type { AnalysisFramework, SelectedElements } from '@/lib/swot/coaching-types'

export const INDUSTRY_OPTIONS = [
  { value: 'fitness',       label: 'Fitness & Thể thao'  },
  { value: 'fnb',           label: 'F&B / Nhà hàng'      },
  { value: 'retail',        label: 'Bán lẻ'              },
  { value: 'education',     label: 'Giáo dục & Đào tạo'  },
  { value: 'healthcare',    label: 'Y tế & Sức khỏe'     },
  { value: 'technology',    label: 'Công nghệ'            },
  { value: 'manufacturing', label: 'Sản xuất'             },
  { value: 'construction',  label: 'Xây dựng & BĐS'     },
  { value: 'logistics',     label: 'Logistics & Vận tải' },
  { value: 'finance',       label: 'Tài chính & Kế toán' },
  { value: 'beauty',        label: 'Làm đẹp & Spa'       },
  { value: 'agriculture',   label: 'Nông nghiệp'         },
  { value: 'other',         label: 'Ngành khác'           },
]

export const HEADCOUNT_OPTIONS = [
  { value: '1-10',   label: '1–10 người' },
  { value: '10-50',  label: '10–50 người' },
  { value: '50-200', label: '50–200 người' },
  { value: '200+',   label: '200+ người' },
]

export const EMPTY_ELEMENTS: SelectedElements = { eightMs: [], fiveForces: [], pestel: [] }

export type FormErrors = Partial<Record<'industry' | 'headcount' | 'topChallenges' | 'currentStrengths' | 'breakthroughGoal' | 'frameworks', string>>

export function deriveFrameworks(el: SelectedElements): AnalysisFramework[] {
  const fw: AnalysisFramework[] = []
  if (el.eightMs.length > 0) fw.push('8Ms')
  if (el.fiveForces.length > 0) fw.push('5Forces')
  if (el.pestel.length > 0) fw.push('PESTEL')
  return fw
}

export function findIndustryOption(raw: string) {
  return INDUSTRY_OPTIONS.find((o) => o.value === raw) ??
    INDUSTRY_OPTIONS.find((o) => o.label.toLowerCase() === raw.toLowerCase()) ??
    null
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground border-b-2 border-black pb-1 mb-4">
      {children}
    </div>
  )
}
