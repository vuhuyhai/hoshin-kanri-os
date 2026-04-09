import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { GenerateQueriesRequest, GenerateQueriesResponse } from '@/lib/swot/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: GenerateQueriesRequest = await request.json()
    const { summary, orgContext } = body

    const summaryText = [
      'Điểm mạnh: ' + summary.strengths.map((s) => s.content).join('; '),
      'Điểm yếu: ' + summary.weaknesses.map((s) => s.content).join('; '),
      'Cơ hội: ' + summary.opportunities.map((s) => s.content).join('; '),
      'Thách thức: ' + summary.threats.map((s) => s.content).join('; '),
    ].join('\n')

    const prompt = `Tạo 20 web search queries để tìm bằng chứng cho SWOT analysis của ${orgContext.orgName} (ngành ${orgContext.industry}, ${orgContext.city}, Việt Nam).

CEO inputs:
${summaryText}

Yêu cầu:
- Mix tiếng Việt và tiếng Anh
- Mỗi query ngắn, cụ thể (5–8 từ)
- ~5 cho S, ~5 cho W, ~5 cho O, ~5 cho T

Trả về JSON (không có text ngoài JSON):
{
  "queries": [
    {
      "query": "[search query]",
      "purpose": "[tại sao cần, 1 câu]",
      "targetDimension": "S",
      "frameworkSource": "M1_Man"
    }
  ]
}`

    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    const result: GenerateQueriesResponse = { queries: parsed.queries }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Generate queries error:', error)
    return NextResponse.json(
      { error: 'Không thể tạo search queries.' },
      { status: 500 }
    )
  }
}
