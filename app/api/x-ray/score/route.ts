import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { XRAY_DIMENSIONS, getAllQuestions } from '@/lib/x-ray/questions'
import type { XRayScoreRequest, XRayResult } from '@/lib/x-ray/types'

export async function POST(request: NextRequest) {
  try {
    const body: XRayScoreRequest = await request.json()
    const { answers, email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    const allQuestions = getAllQuestions()
    if (Object.keys(answers).length < allQuestions.length) {
      return NextResponse.json(
        { error: 'Chưa trả lời đủ câu hỏi' },
        { status: 400 }
      )
    }

    // Build context for Claude
    const answersContext = XRAY_DIMENSIONS.map((dimension) => {
      const dimAnswers = dimension.questions
        .map((q) => {
          const value = answers[q.id]
          const option = q.options.find((o) => o.value === value)
          return `  - ${q.text}\n    Trả lời (${value}/4): ${option?.label ?? 'Không có'}`
        })
        .join('\n')
      return `=== ${dimension.name} ===\n${dimAnswers}`
    }).join('\n\n')

    // Raw scores per dimension
    const rawScores = XRAY_DIMENSIONS.map((dimension) => {
      const total = dimension.questions.reduce(
        (sum, q) => sum + (answers[q.id] ?? 1),
        0
      )
      const maxScore = dimension.questions.length * 4
      const percentage = Math.round((total / maxScore) * 100)
      return { dimensionId: dimension.id, percentage }
    })

    const prompt = `Bạn là chuyên gia tư vấn chiến lược doanh nghiệp SME Việt Nam với 15 năm kinh nghiệm.

Một CEO vừa hoàn thành bài đánh giá sức khỏe doanh nghiệp (Business X-Ray). Dưới đây là câu trả lời của họ:

${answersContext}

Điểm thô đã tính sẵn (0–100):
${rawScores.map((s) => `- ${s.dimensionId}: ${s.percentage}/100`).join('\n')}

Hãy phân tích và trả về JSON CHÍNH XÁC theo cấu trúc sau (KHÔNG thêm bất kỳ text nào ngoài JSON):

{
  "dimensions": [
    {
      "dimensionId": "strategy",
      "name": "Chiến lược & Tầm nhìn",
      "score": <số 0-100, dùng điểm thô đã cho>,
      "level": "<critical|weak|moderate|strong>",
      "feedback": "<2-3 câu nhận xét cụ thể, tiếng Việt tự nhiên>",
      "topIssue": "<1 vấn đề cụ thể nhất cần giải quyết ngay>"
    },
    <tương tự cho: execution, people, finance, customer>
  ],
  "overallScore": <trung bình 5 dimensions, làm tròn>,
  "overallLevel": "<critical|weak|moderate|strong>",
  "executiveSummary": "<3-4 câu tóm tắt tổng thể, trực tiếp với CEO>",
  "topPriorities": [
    "<Ưu tiên 1 — hành động cụ thể, bắt đầu bằng động từ>",
    "<Ưu tiên 2>",
    "<Ưu tiên 3>"
  ],
  "ctaMessage": "<1 câu CTA cá nhân hóa, kết nối với điểm yếu lớn nhất>"
}

Quy tắc phân loại level:
- critical: 0–40
- weak: 41–60
- moderate: 61–80
- strong: 81–100

Viết bằng tiếng Việt tự nhiên, nói thẳng vào vấn đề, không dùng từ ngữ học thuật.`

    const client = new Anthropic()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    const cleanJson = responseText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    const result: XRayResult = {
      email,
      completedAt: new Date().toISOString(),
      overallScore: parsed.overallScore,
      overallLevel: parsed.overallLevel,
      dimensions: parsed.dimensions,
      executiveSummary: parsed.executiveSummary,
      topPriorities: parsed.topPriorities,
      ctaMessage: parsed.ctaMessage,
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('X-Ray scoring error:', error)
    return NextResponse.json(
      { error: 'Không thể phân tích kết quả. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}
