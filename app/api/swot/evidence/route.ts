import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { EvidenceRequest, EvidenceResponse, EvidenceItem } from '@/lib/swot/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: EvidenceRequest = await request.json()
    const { queries, orgContext } = body

    if (!queries || queries.length === 0) {
      return NextResponse.json(
        { error: 'No queries provided' },
        { status: 400 }
      )
    }

    const queryList = queries
      .map(
        (q, i) =>
          `${i + 1}. [${q.targetDimension}][${q.frameworkSource}] ${q.query}`
      )
      .join('\n')

    const prompt = `Tìm bằng chứng thực tế cho SWOT analysis của công ty ngành ${orgContext.industry} tại ${orgContext.city}, Việt Nam.

Queries:
${queryList}

Với mỗi query, tìm 1–2 kết quả liên quan nhất. Ưu tiên số liệu thực tế, báo cáo ngành, dữ liệu 2023–2025.

Trả về JSON (không có text ngoài JSON):
{
  "results": [
    {
      "source": "Web",
      "content": "[Tóm tắt bằng chứng, 1–2 câu, tiếng Việt]",
      "url": "[URL nếu có, hoặc null]",
      "relevance": "high"
    }
  ]
}`

    const client = new Anthropic()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      tools: [
        {
          type: 'web_search_20250305' as const,
          name: 'web_search',
          max_uses: 5,
        },
      ],
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    const cleanJson = textContent.replace(/```json|```/g, '').trim()
    let parsed: { results: EvidenceItem[] }

    try {
      parsed = JSON.parse(cleanJson)
    } catch {
      parsed = { results: [] }
    }

    const result: EvidenceResponse = { results: parsed.results ?? [] }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Evidence API error:', error)
    return NextResponse.json({ results: [] })
  }
}
