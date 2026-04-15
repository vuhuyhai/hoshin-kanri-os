import type { CoachingItem, GeneratedQuery, OrgContext } from './types'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'

const anthropic = createAnthropicClient()
const CURRENT_YEAR = new Date().getFullYear()
const PREV_YEAR = CURRENT_YEAR - 1

function buildQueryPrompt(item: CoachingItem, org: OrgContext, isInternal: boolean): string {
  const strategy = isInternal
    ? `tìm BENCHMARK ngành ${org.industry} tại Việt Nam (mức trung bình cùng ngành, số liệu so sánh)`
    : `tìm TRỰC TIẾP về ${org.industry} (quy mô/tốc độ tăng trưởng thị trường, báo cáo chuyên ngành)`

  return `Ngành: ${org.industry}
Nhận định SWOT (${item.quadrant}): "${item.text}"
Chiến lược tìm kiếm: ${strategy}

Tạo đúng 3 search queries để tìm số liệu chứng minh/phản bác nhận định trên.
Format JSON:
{ "queries": [
  { "type": "stat",   "query": "...", "target_metric": "...", "days": 365, "priority": 1 },
  { "type": "report", "query": "...", "target_metric": "...", "days": 730, "priority": 2 },
  { "type": "news",   "query": "...", "target_metric": "...", "days": 180, "priority": 3 }
]}

Rules:
✓ Tối đa 10 từ mỗi query
✓ Luôn có năm: ${CURRENT_YEAR} hoặc ${PREV_YEAR}
✓ Tên ngành cụ thể: ${org.industry}
✓ Có từ khóa định lượng: "tỷ lệ", "quy mô", "%", "doanh thu", "tăng trưởng"
✓ Query "report": thêm "VIRAC" hoặc "Decision Lab" hoặc "GSO"
✓ Query "news": thêm "site:cafef.vn OR site:vnexpress.net"
✗ Không dùng câu hỏi, không quá chung chung`
}

function getFallbackQueries(item: CoachingItem, org: OrgContext): GeneratedQuery[] {
  return [
    {
      type: 'stat',
      query: `${org.industry} Việt Nam ${CURRENT_YEAR} thống kê quy mô`,
      target_metric: item.text,
      days: 365,
      priority: 1,
    },
    {
      type: 'report',
      query: `${org.industry} Việt Nam ${CURRENT_YEAR} báo cáo VIRAC`,
      target_metric: item.text,
      days: 730,
      priority: 2,
    },
    {
      type: 'news',
      query: `${org.industry} ${CURRENT_YEAR} site:cafef.vn OR site:vnexpress.net`,
      target_metric: item.text,
      days: 180,
      priority: 3,
    },
  ]
}

export async function generateQueriesForItem(
  item: CoachingItem,
  org: OrgContext
): Promise<GeneratedQuery[]> {
  const isInternal = item.quadrant === 'S' || item.quadrant === 'W'

  try {
    const message = await anthropic.messages.create({
      model: AI_MODELS.reasoning,
      max_tokens: 600,
      system: 'Bạn là chuyên gia nghiên cứu thị trường Việt Nam với 10 năm kinh nghiệm.\nNhiệm vụ: Tạo search queries để tìm số liệu từ nguồn uy tín Việt Nam.\nChỉ trả về JSON hợp lệ, không thêm text.',
      messages: [{ role: 'user', content: buildQueryPrompt(item, org, isInternal) }],
    })

    const block = message.content[0]
    if (block.type !== 'text') return getFallbackQueries(item, org)

    const parsed = JSON.parse(block.text) as { queries: GeneratedQuery[] }
    return parsed.queries
  } catch {
    return getFallbackQueries(item, org)
  }
}
