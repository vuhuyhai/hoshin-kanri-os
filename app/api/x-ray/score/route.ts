import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { OPEX_PILLARS, PILLAR_ORDER, X_RAY_QUESTIONS, getQuestionsForPillar, calculatePillarScore } from '@/lib/x-ray/questions'
import type { XRayScoreRequest, XRayResult } from '@/lib/x-ray/types'
import type { Json } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body: XRayScoreRequest = await request.json()
    const { answers, companyInfo } = body

    if (!companyInfo?.email || !companyInfo.email.includes('@')) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    if (!companyInfo.companyName?.trim()) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên công ty' },
        { status: 400 }
      )
    }

    if (Object.keys(answers).length < X_RAY_QUESTIONS.length) {
      return NextResponse.json(
        { error: 'Chưa trả lời đủ câu hỏi' },
        { status: 400 }
      )
    }

    // Build context for Claude — grouped by pillar
    const answersContext = PILLAR_ORDER.map((pillar) => {
      const meta = OPEX_PILLARS[pillar]
      const questions = getQuestionsForPillar(pillar)
      const dimAnswers = questions
        .map((q) => {
          const value = answers[q.id]
          const option = q.options.find((o) => o.value === value)
          return `  - ${q.question}\n    Trả lời (${value}/4): ${option?.label ?? 'Không có'}`
        })
        .join('\n')
      return `=== ${meta.icon} ${meta.label} ===\n${dimAnswers}`
    }).join('\n\n')

    // Calculate raw scores per pillar
    const rawScores = PILLAR_ORDER.map((pillar) => {
      const questions = getQuestionsForPillar(pillar)
      const pillarAnswers = questions.map((q) => answers[q.id] ?? 1)
      const score = calculatePillarScore(pillarAnswers)
      return { pillar, score }
    })

    const headcountLabel =
      companyInfo.headcount === '1-10'
        ? '1–10 nhân viên (micro)'
        : companyInfo.headcount === '10-50'
          ? '10–50 nhân viên (nhỏ)'
          : '50–200 nhân viên (vừa)'

    const pillarListJson = PILLAR_ORDER.map((pillar) => {
      const meta = OPEX_PILLARS[pillar]
      const raw = rawScores.find((r) => r.pillar === pillar)
      return `    {
      "pillar": "${pillar}",
      "label": "${meta.label}",
      "icon": "${meta.icon}",
      "score": ${raw?.score ?? 0},
      "level": "<critical|weak|moderate|strong>",
      "summary": "<1 câu nhận xét cụ thể cho ngành ${companyInfo.industry}>",
      "topIssue": "<1 câu vấn đề cần ưu tiên giải quyết>"
    }`
    }).join(',\n')

    const prompt = `Bạn là chuyên gia phân tích Operational Excellence (OPEX).
Dựa trên câu trả lời của CEO về 7 trụ cột OPEX, hãy:
1. Viết executive summary 3-4 câu súc tích bằng tiếng Việt
2. Với mỗi trụ cột: viết 1 câu nhận xét + 1 câu vấn đề cần ưu tiên
3. Đề xuất top 3 hành động cụ thể nhất có thể bắt đầu trong 30 ngày

Nguyên tắc:
- Thẳng thắn, không nịnh
- Cụ thể với ngành của doanh nghiệp
- Không nhắc phương pháp luận hay tên tổ chức tư vấn nào
- Viết như một advisor dày dạn kinh nghiệm, không như AI

Thông tin công ty:
- Tên: ${companyInfo.companyName}
- Ngành: ${companyInfo.industry}
- Quy mô: ${headcountLabel}

Câu trả lời của CEO:

${answersContext}

Điểm thô đã tính sẵn (0–100):
${rawScores.map((s) => `- ${s.pillar}: ${s.score}/100`).join('\n')}

Trả về JSON CHÍNH XÁC theo cấu trúc sau (KHÔNG thêm bất kỳ text nào ngoài JSON):

{
  "pillarScores": [
${pillarListJson}
  ],
  "overallScore": <trung bình 7 pillars, làm tròn>,
  "overallLevel": "<critical|weak|moderate|strong>",
  "executiveSummary": "<3-4 câu tóm tắt tổng thể, xưng hô trực tiếp với CEO ${companyInfo.companyName}>",
  "topActions": [
    "<Hành động 1 — cụ thể, bắt đầu bằng động từ, khả thi trong 30 ngày>",
    "<Hành động 2>",
    "<Hành động 3>"
  ]
}

Quy tắc phân loại level:
- critical: 0–25
- weak: 26–50
- moderate: 51–75
- strong: 76–100

LƯU Ý:
- Viết bằng tiếng Việt tự nhiên, CÓ DẤU đầy đủ
- Dùng đúng điểm thô đã tính sẵn cho score
- Feedback phải cụ thể cho ngành ${companyInfo.industry} và quy mô ${headcountLabel}`

    const client = new Anthropic()

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    const cleanJson = responseText.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    const result: XRayResult = {
      orgName: companyInfo.companyName,
      industry: companyInfo.industry,
      overallScore: parsed.overallScore,
      overallLevel: parsed.overallLevel,
      executiveSummary: parsed.executiveSummary,
      pillarScores: parsed.pillarScores,
      topActions: parsed.topActions,
      generatedAt: new Date().toISOString(),
    }

    // Save results (fire-and-forget, don't block response)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let orgId: string | null = null
    if (user) {
      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()
      orgId = membership?.org_id ?? null
    }

    const savedResultId = await saveXRayResult(
      supabase, orgId, user?.id ?? null, answers, result
    )

    if (orgId && user) {
      markDiscoveryComplete(
        supabase, orgId, user.id, savedResultId, result
      ).catch((err) => console.error('Failed to mark discovery:', err))
    }

    // Also save lead for non-logged-in users
    saveLead(supabase, companyInfo, answers, result).catch((err) =>
      console.error('Failed to save X-Ray lead:', err)
    )

    return NextResponse.json({
      result,
      resultId: savedResultId,
      savedSuccessfully: !!savedResultId,
    })
  } catch (error) {
    console.error('X-Ray scoring error:', error)
    return NextResponse.json(
      { error: 'Không thể phân tích kết quả. Vui lòng thử lại.' },
      { status: 500 }
    )
  }
}

async function saveXRayResult(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string | null,
  userId: string | null,
  answers: Record<string, number>,
  result: XRayResult
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('xray_results')
      .insert({
        org_id: orgId,
        user_id: userId,
        overall_score: result.overallScore,
        overall_level: result.overallLevel,
        result_json: result as unknown as Json,
        answers_json: answers as unknown as Json,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Save xray_results error:', error)
      return null
    }
    return data.id
  } catch (err) {
    console.error('Save xray_results exception:', err)
    return null
  }
}

async function markDiscoveryComplete(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string,
  resultId: string | null,
  result: XRayResult
) {
  await supabase
    .from('discovery_sessions')
    .upsert(
      {
        org_id: orgId,
        user_id: userId,
        step_completed: 'x-ray',
        data_json: {
          latestResultId: resultId,
          latestScore: result.overallScore,
          latestLevel: result.overallLevel,
          completedAt: new Date().toISOString(),
        } as unknown as Json,
      },
      {
        onConflict: 'org_id,user_id,step_completed',
        ignoreDuplicates: false,
      }
    )
}

async function saveLead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyInfo: XRayScoreRequest['companyInfo'],
  answers: XRayScoreRequest['answers'],
  result: XRayResult
) {
  try {
    await supabase.from('xray_leads').insert({
      email: companyInfo.email,
      company_name: companyInfo.companyName,
      industry: companyInfo.industry,
      headcount: companyInfo.headcount,
      answers_json: answers as unknown as Json,
      result_json: result as unknown as Json,
      overall_score: result.overallScore,
      overall_level: result.overallLevel,
    })
  } catch (err) {
    console.error('Supabase lead save error:', err)
  }
}
