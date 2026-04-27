import { CanvasHeader } from './CanvasHeader'
import { CanvasMiniMap } from './CanvasMiniMap'
import { CanvasGrid } from './CanvasGrid'
import { SubmitBar } from './SubmitBar'
import type { XMatrixHoshin, OrgMember } from '@/lib/x-matrix/types'

export interface MockYearGoal {
  title: string
  description: string
}

export type MockHoshin = XMatrixHoshin & { owner_name?: string }

interface XMatrixCanvasPageProps {
  orgId: string
  members: OrgMember[]
}

const MOCK_YEAR_GOALS: MockYearGoal[] = [
  {
    title: 'Đạt 10 tỷ doanh thu năm 2026',
    description: 'Tăng 40% so với 2025, mở rộng kênh B2B SME ngành sản xuất',
  },
  {
    title: '100 khách hàng doanh nghiệp đang dùng',
    description: 'Trọng tâm HCM và Hà Nội, tỷ lệ churn dưới 15%',
  },
]

const MOCK_HOSHINS: MockHoshin[] = [
  {
    id: 'mock-h-1',
    title: 'Tăng tỷ lệ giữ chân khách hàng lên 85%',
    description: '',
    owner_name: 'Anh Tuấn',
    initiatives: [
      { id: 'mi-1', title: 'Triển khai chương trình loyalty Q1', timeframe: '90d' },
      { id: 'mi-2', title: 'Audit churn pipeline hàng tháng', timeframe: '30d' },
    ],
    kpis: [
      {
        id: 'mk-1',
        name: 'Tỷ lệ giữ chân',
        unit: '%',
        targetValue: 85,
        ownerUserId: null,
        ownerName: 'Anh Tuấn',
        frequency: 'monthly',
        deptLevel: 'company',
      },
    ],
    status: 'manual',
  },
  {
    id: 'mock-h-2',
    title: 'Ra mắt dòng sản phẩm Premium',
    description: '',
    owner_name: 'Chị Mai',
    initiatives: [
      { id: 'mi-3', title: 'Hoàn thiện POC trước Q2', timeframe: '60d' },
      { id: 'mi-4', title: 'Pilot 5 khách hàng đầu tiên', timeframe: '90d' },
    ],
    kpis: [
      {
        id: 'mk-2',
        name: 'Doanh thu Premium',
        unit: 'triệu',
        targetValue: 2000,
        ownerUserId: null,
        ownerName: 'Chị Mai',
        frequency: 'monthly',
        deptLevel: 'company',
      },
    ],
    status: 'manual',
  },
  {
    id: 'mock-h-3',
    title: 'Xây dựng đội ngũ Sales 10 người',
    description: '',
    owner_name: 'Anh Tuấn',
    initiatives: [
      { id: 'mi-5', title: 'Tuyển 5 Sales junior trong Q1', timeframe: '90d' },
      { id: 'mi-6', title: 'Hoàn thiện onboarding playbook', timeframe: '30d' },
    ],
    kpis: [
      {
        id: 'mk-3',
        name: 'Số lượng Sales onboard',
        unit: 'người',
        targetValue: 10,
        ownerUserId: null,
        ownerName: 'Anh Tuấn',
        frequency: 'monthly',
        deptLevel: 'company',
      },
    ],
    status: 'manual',
  },
]

export function XMatrixCanvasPage({ orgId, members }: XMatrixCanvasPageProps) {
  return (
    <div
      className="w-full min-h-full bg-[var(--bg-paper)]"
      data-org-id={orgId}
      data-member-count={members.length}
    >
      <CanvasHeader />
      <CanvasMiniMap />
      <CanvasGrid yearGoals={MOCK_YEAR_GOALS} hoshins={MOCK_HOSHINS} />
      <SubmitBar />
    </div>
  )
}
