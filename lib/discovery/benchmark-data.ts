import type { IndustryBenchmark, IndustryId } from './types'

export const INDUSTRY_BENCHMARKS: IndustryBenchmark[] = [
  {
    id: 'fitness',
    name: 'Fitness & Gym',
    icon: '💪',
    kpis: [
      { id: 'fitness_member_retention', name: 'Tỷ lệ giữ chân hội viên', unit: '%/tháng', frequency: 'monthly', median: 72, top25: 82, top10: 90, description: 'Phần trăm hội viên gia hạn trong tháng', dept_level: 'company' },
      { id: 'fitness_new_members', name: 'Hội viên mới', unit: 'người/tháng', frequency: 'monthly', median: 40, top25: 75, top10: 120, description: 'Số hội viên đăng ký mới mỗi tháng', dept_level: 'company' },
      { id: 'fitness_revenue_per_member', name: 'Doanh thu / hội viên', unit: 'VND/tháng', frequency: 'monthly', median: 500000, top25: 750000, top10: 1200000, description: 'Average Revenue Per Member', dept_level: 'company' },
      { id: 'fitness_class_fill_rate', name: 'Tỷ lệ lấp đầy lớp học', unit: '%', frequency: 'weekly', median: 58, top25: 75, top10: 88, description: 'Số học viên / sĩ số tối đa lớp', dept_level: 'dept' },
      { id: 'fitness_pt_revenue', name: 'Doanh thu PT', unit: 'triệu VND/tháng', frequency: 'monthly', median: 80, top25: 150, top10: 300, description: 'Tổng doanh thu Personal Training', dept_level: 'dept' },
    ],
  },
  {
    id: 'fnb',
    name: 'F&B (Nhà hàng / Cà phê)',
    icon: '☕',
    kpis: [
      { id: 'fnb_table_turn', name: 'Hệ số quay bàn', unit: 'lần/ngày', frequency: 'daily', median: 2.5, top25: 3.5, top10: 5.0, description: 'Số lần 1 bàn được sử dụng trong ngày', dept_level: 'company' },
      { id: 'fnb_avg_bill', name: 'Giá trị trung bình / hoá đơn', unit: 'VND', frequency: 'daily', median: 180000, top25: 280000, top10: 450000, description: 'Average Check Size', dept_level: 'company' },
      { id: 'fnb_food_cost', name: 'Tỷ lệ chi phí nguyên vật liệu', unit: '%/doanh thu', frequency: 'monthly', median: 35, top25: 28, top10: 22, description: 'Food Cost % — thấp hơn tốt hơn', dept_level: 'company' },
      { id: 'fnb_repeat_rate', name: 'Tỷ lệ khách quay lại', unit: '%/tháng', frequency: 'monthly', median: 30, top25: 45, top10: 62, description: 'Khách ghé thăm ít nhất 2 lần/tháng', dept_level: 'company' },
      { id: 'fnb_labor_cost', name: 'Tỷ lệ chi phí nhân công', unit: '%/doanh thu', frequency: 'monthly', median: 32, top25: 25, top10: 20, description: 'Labor Cost % — thấp hơn tốt hơn', dept_level: 'company' },
    ],
  },
  {
    id: 'b2b_services',
    name: 'Dịch vụ B2B',
    icon: '🤝',
    kpis: [
      { id: 'b2b_mrr_growth', name: 'Tăng trưởng MRR', unit: '%/tháng', frequency: 'monthly', median: 5, top25: 10, top10: 18, description: 'Monthly Recurring Revenue growth', dept_level: 'company' },
      { id: 'b2b_churn_rate', name: 'Tỷ lệ Churn', unit: '%/tháng', frequency: 'monthly', median: 5, top25: 2.5, top10: 1.2, description: 'Khách không gia hạn — thấp hơn tốt hơn', dept_level: 'company' },
      { id: 'b2b_sales_cycle', name: 'Chu kỳ bán hàng', unit: 'ngày', frequency: 'monthly', median: 45, top25: 25, top10: 14, description: 'Từ tiếp xúc đến ký HĐ — thấp hơn tốt hơn', dept_level: 'dept' },
      { id: 'b2b_nps', name: 'Net Promoter Score', unit: 'điểm', frequency: 'monthly', median: 25, top25: 45, top10: 65, description: 'Độ hài lòng khách hàng', dept_level: 'company' },
      { id: 'b2b_revenue_per_employee', name: 'Doanh thu / nhân viên', unit: 'triệu VND/tháng', frequency: 'monthly', median: 40, top25: 70, top10: 120, description: 'Hiệu suất nhân lực', dept_level: 'company' },
    ],
  },
  {
    id: 'retail',
    name: 'Bán lẻ (Retail)',
    icon: '🛍️',
    kpis: [
      { id: 'retail_inventory_turn', name: 'Vòng quay hàng tồn kho', unit: 'lần/tháng', frequency: 'monthly', median: 2, top25: 3.5, top10: 5, description: 'Số lần hàng tồn kho được bán/bổ sung', dept_level: 'company' },
      { id: 'retail_revenue_per_sqm', name: 'Doanh thu / m²', unit: 'nghìn VND/m²/tháng', frequency: 'monthly', median: 800, top25: 1500, top10: 2800, description: 'Hiệu quả sử dụng mặt bằng', dept_level: 'company' },
      { id: 'retail_conversion_rate', name: 'Tỷ lệ chuyển đổi', unit: '%', frequency: 'daily', median: 15, top25: 25, top10: 38, description: 'Khách vào cửa hàng → mua hàng', dept_level: 'company' },
      { id: 'retail_avg_basket', name: 'Giá trị giỏ hàng TB', unit: 'VND', frequency: 'daily', median: 350000, top25: 600000, top10: 1000000, description: 'Average Basket Size', dept_level: 'company' },
      { id: 'retail_stockout_rate', name: 'Tỷ lệ hết hàng', unit: '%/SKU', frequency: 'weekly', median: 8, top25: 4, top10: 1.5, description: 'SKU bị hết hàng — thấp hơn tốt hơn', dept_level: 'dept' },
    ],
  },
  {
    id: 'education',
    name: 'Giáo dục & Đào tạo',
    icon: '📚',
    kpis: [
      { id: 'edu_enrollment_rate', name: 'Tỷ lệ tuyển sinh', unit: '%/tháng', frequency: 'monthly', median: 40, top25: 65, top10: 85, description: 'Leads → học viên đăng ký', dept_level: 'company' },
      { id: 'edu_completion_rate', name: 'Tỷ lệ hoàn thành', unit: '%', frequency: 'monthly', median: 60, top25: 78, top10: 90, description: 'Học viên hoàn thành khoá', dept_level: 'dept' },
      { id: 'edu_referral_rate', name: 'Tỷ lệ giới thiệu', unit: '%/tháng', frequency: 'monthly', median: 15, top25: 28, top10: 42, description: 'Học viên mới từ giới thiệu', dept_level: 'company' },
      { id: 'edu_revenue_per_student', name: 'Doanh thu / học viên', unit: 'VND/tháng', frequency: 'monthly', median: 2500000, top25: 4000000, top10: 7000000, description: 'Average Revenue Per Student', dept_level: 'company' },
      { id: 'edu_teacher_utilization', name: 'Sử dụng giảng viên', unit: '%', frequency: 'weekly', median: 60, top25: 78, top10: 90, description: 'Giờ dạy thực tế / tổng giờ có thể', dept_level: 'dept' },
    ],
  },
]

export function getBenchmarkByIndustry(industryId: string) {
  return INDUSTRY_BENCHMARKS.find((b) => b.id === industryId)
}

export function mapIndustryToId(industry: string): IndustryId {
  const map: Record<string, IndustryId> = {
    Fitness: 'fitness',
    'F&B': 'fnb',
    'Dịch vụ B2B': 'b2b_services',
    Retail: 'retail',
    'Giáo dục': 'education',
  }
  return map[industry] ?? 'b2b_services'
}
