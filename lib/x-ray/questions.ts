import type { XRayDimension } from './types'

export const XRAY_DIMENSIONS: XRayDimension[] = [
  {
    id: 'strategy',
    name: 'Chiến lược & Tầm nhìn',
    description: 'Công ty có định hướng rõ ràng và nhất quán không?',
    icon: '🎯',
    questions: [
      {
        id: 'strategy_1',
        dimensionId: 'strategy',
        text: 'Toàn bộ nhân viên có thể trả lời câu hỏi "Công ty chúng ta đang đi về đâu trong 1–3 năm tới" không?',
        helpText: 'Không cần chính xác — chỉ cần nhất quán.',
        options: [
          { value: 1, label: 'Hầu như không ai biết, kể cả quản lý' },
          { value: 2, label: 'Chỉ tôi và vài người thân cận biết' },
          { value: 3, label: 'Cấp quản lý biết, nhân viên thì chưa rõ' },
          { value: 4, label: 'Cả công ty biết và có thể nói được' },
        ],
      },
      {
        id: 'strategy_2',
        dimensionId: 'strategy',
        text: 'Khi phải quyết định ưu tiên giữa hai việc quan trọng, bạn dựa vào đâu?',
        options: [
          { value: 1, label: 'Cảm tính và kinh nghiệm cá nhân' },
          { value: 2, label: 'Việc nào gấp hơn thì làm trước' },
          { value: 3, label: 'Có tiêu chí nhưng chưa thành văn bản' },
          { value: 4, label: 'Có bộ tiêu chí rõ ràng, cả team hiểu' },
        ],
      },
      {
        id: 'strategy_3',
        dimensionId: 'strategy',
        text: 'Trong 12 tháng qua, công ty bạn thay đổi hướng đi chính bao nhiêu lần?',
        helpText: 'Ví dụ: đổi sản phẩm chính, đổi thị trường mục tiêu, đổi mô hình kinh doanh.',
        options: [
          { value: 1, label: 'Hơn 3 lần — liên tục xoay chuyển' },
          { value: 2, label: '2–3 lần — khá nhiều thay đổi lớn' },
          { value: 3, label: '1 lần — có điều chỉnh nhưng có lý do rõ' },
          { value: 4, label: 'Không thay đổi — đi đúng hướng đã định' },
        ],
      },
    ],
  },
  {
    id: 'execution',
    name: 'Thực thi & Quy trình',
    description: 'Kế hoạch có thực sự được thực hiện không?',
    icon: '⚙️',
    questions: [
      {
        id: 'execution_1',
        dimensionId: 'execution',
        text: 'Tỷ lệ các mục tiêu/kế hoạch đề ra đầu năm được hoàn thành đúng hạn là bao nhiêu?',
        options: [
          { value: 1, label: 'Dưới 30% — phần lớn không hoàn thành' },
          { value: 2, label: '30–60% — hoàn thành khoảng một nửa' },
          { value: 3, label: '60–80% — hoàn thành phần lớn' },
          { value: 4, label: 'Trên 80% — gần như luôn đúng kế hoạch' },
        ],
      },
      {
        id: 'execution_2',
        dimensionId: 'execution',
        text: 'Khi một dự án bị trễ hoặc sai, bạn biết ngay từ đâu?',
        options: [
          { value: 1, label: 'Đến khi khách hàng phàn nàn hoặc deadline qua rồi' },
          { value: 2, label: 'Khi họp định kỳ hàng tuần' },
          { value: 3, label: 'Có dashboard hoặc báo cáo nhưng chưa tự động' },
          { value: 4, label: 'Hệ thống cảnh báo tự động khi có vấn đề' },
        ],
      },
      {
        id: 'execution_3',
        dimensionId: 'execution',
        text: 'Quy trình làm việc chính của công ty được tài liệu hóa như thế nào?',
        options: [
          { value: 1, label: 'Nằm trong đầu người phụ trách, không có tài liệu' },
          { value: 2, label: 'Có ghi chú rải rác, không cập nhật đều' },
          { value: 3, label: 'Có SOP nhưng chưa ai follow đều' },
          { value: 4, label: 'Có SOP đầy đủ, được follow và cập nhật thường xuyên' },
        ],
      },
    ],
  },
  {
    id: 'people',
    name: 'Con người & Năng lực',
    description: 'Đội ngũ có đủ khả năng để đạt mục tiêu không?',
    icon: '👥',
    questions: [
      {
        id: 'people_1',
        dimensionId: 'people',
        text: 'Nếu 2–3 nhân viên chủ chốt nghỉ việc cùng lúc, điều gì sẽ xảy ra?',
        options: [
          { value: 1, label: 'Công ty sẽ gần như tê liệt' },
          { value: 2, label: 'Sẽ rất khó khăn và mất nhiều tháng phục hồi' },
          { value: 3, label: 'Sẽ ảnh hưởng nhưng vẫn tiếp tục được' },
          { value: 4, label: 'Hệ thống đủ mạnh để tiếp tục bình thường' },
        ],
      },
      {
        id: 'people_2',
        dimensionId: 'people',
        text: 'Nhân viên của bạn biết rõ họ cần làm gì để được thăng tiến hoặc tăng lương không?',
        options: [
          { value: 1, label: 'Không rõ — quyết định theo cảm tính của tôi' },
          { value: 2, label: 'Họ đoán được nhưng không có tiêu chí rõ' },
          { value: 3, label: 'Có tiêu chí nhưng chưa truyền thông đầy đủ' },
          { value: 4, label: 'Có lộ trình rõ ràng, họ biết và đồng ý' },
        ],
      },
      {
        id: 'people_3',
        dimensionId: 'people',
        text: 'Tỷ lệ nhân viên nghỉ việc (turnover) trong 12 tháng qua là bao nhiêu?',
        options: [
          { value: 1, label: 'Trên 40% — liên tục thay người' },
          { value: 2, label: '20–40% — khá cao, ảnh hưởng đến công việc' },
          { value: 3, label: '10–20% — chấp nhận được' },
          { value: 4, label: 'Dưới 10% — đội ngũ ổn định' },
        ],
      },
    ],
  },
  {
    id: 'finance',
    name: 'Tài chính & Tăng trưởng',
    description: 'Sức khỏe tài chính và tốc độ tăng trưởng.',
    icon: '📊',
    questions: [
      {
        id: 'finance_1',
        dimensionId: 'finance',
        text: 'Bạn biết chính xác lợi nhuận ròng tháng trước của công ty không?',
        helpText: 'Không phải doanh thu — là lợi nhuận sau tất cả chi phí.',
        options: [
          { value: 1, label: 'Không biết — chưa có báo cáo tài chính đều' },
          { value: 2, label: 'Biết sau khoảng 2–4 tuần mới có số' },
          { value: 3, label: 'Biết trong vòng 1 tuần' },
          { value: 4, label: 'Biết ngay trong vòng 2–3 ngày' },
        ],
      },
      {
        id: 'finance_2',
        dimensionId: 'finance',
        text: 'Tốc độ tăng trưởng doanh thu trong 12 tháng qua là bao nhiêu?',
        options: [
          { value: 1, label: 'Âm — doanh thu giảm so với năm trước' },
          { value: 2, label: '0–10% — tăng trưởng chậm hoặc đi ngang' },
          { value: 3, label: '10–30% — tăng trưởng khá tốt' },
          { value: 4, label: 'Trên 30% — tăng trưởng mạnh' },
        ],
      },
      {
        id: 'finance_3',
        dimensionId: 'finance',
        text: 'Nếu doanh thu giảm 30% trong 3 tháng tới, công ty có thể duy trì hoạt động bao lâu?',
        options: [
          { value: 1, label: 'Dưới 1 tháng — rất dễ tổn thương' },
          { value: 2, label: '1–3 tháng — cần cắt giảm ngay' },
          { value: 3, label: '3–6 tháng — có thể xoay xở được' },
          { value: 4, label: 'Trên 6 tháng — dự phòng tốt' },
        ],
      },
    ],
  },
  {
    id: 'customer',
    name: 'Khách hàng & Thị trường',
    description: 'Vị thế cạnh tranh và sức mạnh với khách hàng.',
    icon: '🏆',
    questions: [
      {
        id: 'customer_1',
        dimensionId: 'customer',
        text: 'Khách hàng quay lại mua lần 2 chiếm bao nhiêu % tổng doanh thu?',
        options: [
          { value: 1, label: 'Dưới 20% — gần như toàn bộ là khách mới' },
          { value: 2, label: '20–40% — phần lớn phụ thuộc khách mới' },
          { value: 3, label: '40–60% — khá cân bằng' },
          { value: 4, label: 'Trên 60% — khách cũ là nền tảng' },
        ],
      },
      {
        id: 'customer_2',
        dimensionId: 'customer',
        text: 'Nếu có đối thủ mới vào thị trường với giá rẻ hơn 20%, bạn sẽ phản ứng thế nào?',
        options: [
          { value: 1, label: 'Phải giảm giá theo — không có lợi thế khác' },
          { value: 2, label: 'Khó khăn — một số khách có thể bỏ đi' },
          { value: 3, label: 'Ảnh hưởng ít — có một số điểm khác biệt' },
          { value: 4, label: 'Không ảnh hưởng — khách chọn vì giá trị, không phải giá' },
        ],
      },
      {
        id: 'customer_3',
        dimensionId: 'customer',
        text: 'Bạn biết lý do chính xác tại sao khách hàng rời bỏ không mua nữa không?',
        options: [
          { value: 1, label: 'Không biết — chưa bao giờ hỏi' },
          { value: 2, label: 'Đoán được nhưng chưa có dữ liệu' },
          { value: 3, label: 'Có hỏi nhưng không hệ thống' },
          { value: 4, label: 'Có hệ thống theo dõi và phỏng vấn khách rời bỏ đều đặn' },
        ],
      },
    ],
  },
]

export function getAllQuestions() {
  return XRAY_DIMENSIONS.flatMap((d) => d.questions)
}

export function getDimensionById(id: string) {
  return XRAY_DIMENSIONS.find((d) => d.id === id)
}
