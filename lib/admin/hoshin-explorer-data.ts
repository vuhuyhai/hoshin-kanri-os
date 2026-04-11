export interface HKConcept {
  id: string
  tag: string
  kanji: string
  name: string
  en: string
  desc: string
  layer: string
  books: string
  category: string
}

export const CONCEPTS: { category: string; items: HKConcept[] }[] = [
  { category: 'NỀN TẢNG / ORIGIN', items: [
    { id: 'hoshin', tag: '01', kanji: '方針', name: 'Hoshin', en: 'Direction / Policy', desc: 'Từ gốc tiếng Nhật: hướng đi có chủ đích', layer: 'Tầng 1 — Direction', books: 'Tất cả 5 cuốn', category: 'NỀN TẢNG / ORIGIN' },
    { id: 'kanri', tag: '02', kanji: '管理', name: 'Kanri', en: 'Management / Control', desc: 'Kiểm soát và duy trì hướng đi đã chọn', layer: 'Tầng 1+3', books: 'Tất cả 5 cuốn', category: 'NỀN TẢNG / ORIGIN' },
  ]},
  { category: 'CƠ CHẾ CHIẾN LƯỢC', items: [
    { id: 'breakthrough', tag: '03', kanji: '突破', name: 'Breakthrough Objectives', en: 'Vital few priorities', desc: '3–5 mục tiêu đột phá mỗi năm — không nhiều hơn', layer: 'Tầng 1 — Direction', books: 'Jackson, Kesterson, Melander', category: 'CƠ CHẾ CHIẾN LƯỢC' },
    { id: 'target-condition', tag: '04', kanji: '目標', name: 'Target Condition', en: 'Visionary target state', desc: 'Tổ chức trông như thế nào khi HK hoàn toàn chín muồi', layer: 'Tầng 1', books: 'Melander, Villalba-Diez', category: 'CƠ CHẾ CHIẾN LƯỢC' },
    { id: 'xmatrix', tag: '05', kanji: 'X表', name: 'X-Matrix', en: 'Hoshin planning matrix', desc: 'Công cụ kết nối vision → objectives → projects → metrics', layer: 'Tầng 2 — Deployment', books: 'Kesterson, Jackson, Melander', category: 'CƠ CHẾ CHIẾN LƯỢC' },
  ]},
  { category: 'CƠ CHẾ TRIỂN KHAI', items: [
    { id: 'catchball', tag: '06', kanji: '⇅', name: 'Catchball', en: 'Bidirectional negotiation', desc: 'Negotiate targets 2 chiều giữa các tầng tổ chức', layer: 'Tầng 2 — Deployment', books: 'Kesterson, Jackson, Melander', category: 'CƠ CHẾ TRIỂN KHAI' },
    { id: 'nemawashi', tag: '07', kanji: '根回し', name: 'Nemawashi', en: 'Consensus building', desc: 'Xây đồng thuận trước khi quyết định chính thức', layer: 'Tầng 2', books: 'Melander, Villalba-Diez', category: 'CƠ CHẾ TRIỂN KHAI' },
    { id: 'cascade', tag: '08', kanji: '↓↓↓', name: 'Policy Deployment', en: 'Strategy cascade', desc: 'Objective di chuyển từ CEO → middle → frontline như thế nào', layer: 'Tầng 2', books: 'Tất cả 5 cuốn', category: 'CƠ CHẾ TRIỂN KHAI' },
  ]},
  { category: 'VÒNG ĐIỀU HÀNH', items: [
    { id: 'pdca', tag: '09', kanji: 'PDCA', name: 'PDCA Cycle', en: 'Scientific management loop', desc: 'Plan → Do → Check → Act — vòng lặp cốt lõi của HK', layer: 'Tầng 3 — Execution', books: 'Tất cả 5 cuốn', category: 'VÒNG ĐIỀU HÀNH' },
    { id: 'a3', tag: '10', kanji: 'A3', name: 'A3 Report', en: 'One-page problem solving', desc: 'Tài liệu 1 trang — cấu trúc thinking và communication', layer: 'Tầng 3', books: 'Jackson, Kesterson', category: 'VÒNG ĐIỀU HÀNH' },
    { id: 'visual', tag: '11', kanji: '見える化', name: 'Visual Management', en: 'Make problems visible', desc: 'Bowling chart, management board — hiển thị hóa tiến độ', layer: 'Tầng 3', books: 'Jackson, Kesterson, Melander', category: 'VÒNG ĐIỀU HÀNH' },
  ]},
  { category: 'NĂNG LỰC TỔ CHỨC', items: [
    { id: 'org-fitness', tag: '12', kanji: '適応力', name: 'Organizational Fitness', en: 'Execution capability', desc: '7 điều kiện để HK vận hành — Fukuda framework', layer: 'Tầng 4 — Capability', books: 'Fukuda', category: 'NĂNG LỰC TỔ CHỨC' },
    { id: 'lean-dna', tag: '13', kanji: 'DNA', name: 'Lean DNA / 5 Rules', en: 'Embedded lean culture', desc: 'HK như hệ điều hành của Lean enterprise toàn diện', layer: 'Tầng 4', books: 'Jackson', category: 'NĂNG LỰC TỔ CHỨC' },
    { id: 'presidents-diagnosis', tag: '14', kanji: '診断', name: "President's Diagnosis", en: 'Leadership audit', desc: 'Lãnh đạo cao nhất tự kiểm tra quá trình — không chỉ kết quả', layer: 'Tầng 4', books: 'Jackson', category: 'NĂNG LỰC TỔ CHỨC' },
  ]},
]

export const HK_SYSTEM_PROMPT = `Bạn là Adler — trợ lý học sâu theo phong cách Mortimer Adler + Richard Feynman.
Người dùng: Vũ Hải — CEO Ladysfit Việt Nam (30+ cơ sở fitness franchise dành cho nữ), Business Consultant, Lean 6 Sigma Green Belt.

Trả về JSON hợp lệ (không markdown, không text thừa) với cấu trúc:
{
  "level1": "1-2 câu, không jargon, người chưa biết gì về management hiểu được",
  "level2": "3-4 câu: cơ chế hoạt động, tại sao đúng, cấu trúc lập luận",
  "level3": "1 phép ẩn dụ sắc bén — nếu chỉ nhớ 1 thứ, đây là thứ đó",
  "application_ladysfit": "Ứng dụng cụ thể cho Ladysfit franchise 30+ cơ sở (tối đa 50 từ)",
  "application_consulting": "Ứng dụng khi tư vấn doanh nghiệp fitness Việt Nam (tối đa 50 từ)",
  "critical_point": "1 điểm mù quan trọng mà tác giả không nói rõ (tối đa 50 từ)",
  "connections": ["khái niệm liên quan 1", "khái niệm liên quan 2", "khái niệm liên quan 3"]
}
Viết tiếng Việt tự nhiên. Mỗi field ngắn gọn — ưu tiên chất lượng hơn độ dài.`

export function findConceptById(id: string): HKConcept | undefined {
  for (const cat of CONCEPTS) {
    const found = cat.items.find((c) => c.id === id)
    if (found) return found
  }
  return undefined
}
