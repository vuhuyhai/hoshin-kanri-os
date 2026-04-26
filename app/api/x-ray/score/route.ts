import { NextRequest, NextResponse } from 'next/server'
import type Anthropic from '@anthropic-ai/sdk'
import { OPEX_PILLARS, PILLAR_ORDER, X_RAY_QUESTIONS, getQuestionsForPillar, calculatePillarScore } from '@/lib/x-ray/questions'
import type { OpexPillar, PillarScore, ScoreLevel, XRayResult } from '@/lib/x-ray/types'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'
import { xRayReportEmailTemplate } from '@/lib/email/templates'
import { AI_MODELS } from '@/lib/ai/models'
import { createAnthropicClient } from '@/lib/ai/client'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { parseBody, xRayScoreSchema, type XRayScoreInput } from '@/lib/validation'
import { toJson } from '@/lib/utils'

const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_SECONDS = 600

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  try {
    const ip = getClientIp(request.headers)
    const rl = await checkRateLimit({
      key: `xray-score:${ip}`,
      limit: RATE_LIMIT_MAX,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    })
    if (!rl.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000))
      return NextResponse.json(
        {
          error: `Bạn đã chạy X-Ray quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(retryAfter / 60)} phút.`,
          requestId,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const parsed = await parseBody(request, xRayScoreSchema)
    if (!parsed.ok) return parsed.response
    const { answers, companyInfo } = parsed.data

    if (Object.keys(answers).length < X_RAY_QUESTIONS.length) {
      return NextResponse.json(
        { error: 'Chưa trả lời đủ câu hỏi', requestId },
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

    const client = createAnthropicClient()

    const message = await client.messages.create({
      model: AI_MODELS.reasoning,
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    const validated = parseAndValidateAIResponse(responseText)
    if (!validated) {
      console.error(`[X-Ray] [${requestId}] AI response validation returned null`)
      return NextResponse.json(
        { error: 'AI trả về kết quả không hợp lệ. Vui lòng thử lại sau ít phút.', requestId },
        { status: 502 }
      )
    }

    const result: XRayResult = {
      orgName: companyInfo.companyName,
      industry: companyInfo.industry,
      overallScore: validated.overallScore,
      overallLevel: validated.overallLevel,
      executiveSummary: validated.executiveSummary,
      pillarScores: validated.pillarScores,
      topActions: validated.topActions,
      generatedAt: new Date().toISOString(),
    }

    // Auth lookup uses cookie-based client (needs user session).
    // All writes use admin client — server-initiated, bypasses RLS.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Logged-in users → xray_results (history). Anon → xray_leads only.
    // xray_results enforces NOT NULL owner via xray_results_ownership_check.
    let savedResultId: string | null = null
    if (user) {
      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()
      const orgId = membership?.org_id ?? null

      savedResultId = await saveXRayResult(orgId, user.id, answers, result)

      if (orgId) {
        markDiscoveryComplete(
          orgId, user.id, savedResultId, result
        ).catch(() => {})
      }
    } else {
      saveLead(companyInfo, answers, result).catch(() => {})
    }

    // Send report email (fire-and-forget, don't block response)
    const { subject, html } = xRayReportEmailTemplate({
      companyName: result.orgName,
      industry: result.industry,
      overallScore: result.overallScore,
      overallLevel: result.overallLevel,
      executiveSummary: result.executiveSummary,
      pillarScores: result.pillarScores,
      topActions: result.topActions,
    })
    sendEmail({ to: companyInfo.email, subject, html }).catch(() => {})

    return NextResponse.json({
      result,
      resultId: savedResultId,
      savedSuccessfully: !!savedResultId,
    })
  } catch (error) {
    console.error(`[X-Ray] [${requestId}] scoring error:`, error)
    return NextResponse.json(
      { error: 'Không thể phân tích kết quả. Vui lòng thử lại.', requestId },
      { status: 500 }
    )
  }
}

async function saveXRayResult(
  orgId: string | null,
  userId: string | null,
  answers: Record<string, number>,
  result: XRayResult
): Promise<string | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('xray_results')
      .insert({
        org_id: orgId,
        user_id: userId,
        overall_score: result.overallScore,
        overall_level: result.overallLevel,
        result_json: toJson(result),
        answers_json: toJson(answers),
      })
      .select('id')
      .single()

    if (error) {
      return null
    }
    return data.id
  } catch {
    return null
  }
}

async function markDiscoveryComplete(
  orgId: string,
  userId: string,
  resultId: string | null,
  result: XRayResult
) {
  const admin = createAdminClient()
  await admin
    .from('discovery_sessions')
    .upsert(
      {
        org_id: orgId,
        user_id: userId,
        step_completed: 'x-ray',
        data_json: toJson({
          latestResultId: resultId,
          latestScore: result.overallScore,
          latestLevel: result.overallLevel,
          completedAt: new Date().toISOString(),
        }),
      },
      {
        onConflict: 'org_id,user_id,step_completed',
        ignoreDuplicates: false,
      }
    )
}

async function saveLead(
  companyInfo: XRayScoreInput['companyInfo'],
  answers: XRayScoreInput['answers'],
  result: XRayResult
) {
  try {
    const admin = createAdminClient()
    await admin.from('xray_leads').insert({
      email: companyInfo.email,
      company_name: companyInfo.companyName,
      industry: companyInfo.industry,
      headcount: companyInfo.headcount,
      answers_json: toJson(answers),
      result_json: toJson(result),
      overall_score: result.overallScore,
      overall_level: result.overallLevel,
    })
  } catch {
    // fire-and-forget — outer catch in POST handler covers critical errors
  }
}

// ---------------------------------------------------------------------------
// AI response validation — strict shape check before trusting any field.
// Returns null on any mismatch; caller should surface a 502 to the user.
// ---------------------------------------------------------------------------

function isScoreLevel(v: unknown): v is ScoreLevel {
  return v === 'critical' || v === 'weak' || v === 'moderate' || v === 'strong'
}

function isOpexPillar(v: unknown): v is OpexPillar {
  return (
    v === 'lean' ||
    v === 'six_sigma' ||
    v === 'workplace' ||
    v === 'value_chain' ||
    v === 'cx' ||
    v === 'value_innovation' ||
    v === 'value_ai'
  )
}

function parseAndValidateAIResponse(responseText: string): {
  overallScore: number
  overallLevel: ScoreLevel
  executiveSummary: string
  pillarScores: PillarScore[]
  topActions: string[]
} | null {
  const stripped = responseText.replace(/```json|```/g, '').trim()
  const firstBrace = stripped.indexOf('{')
  const lastBrace = stripped.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    console.error('[X-Ray] No JSON object found in AI response')
    return null
  }
  const cleanJson = stripped.slice(firstBrace, lastBrace + 1)

  let parsed: unknown
  try {
    parsed = JSON.parse(cleanJson)
  } catch (err) {
    console.error('[X-Ray] JSON parse failed. Raw (first 2000 chars):', responseText.slice(0, 2000))
    console.error('[X-Ray] JSON parse error:', err)
    return null
  }

  if (!parsed || typeof parsed !== 'object') {
    console.error('[X-Ray] Parsed JSON is not an object')
    return null
  }
  const r = parsed as Record<string, unknown>

  if (typeof r.overallScore !== 'number' || !Number.isFinite(r.overallScore)) {
    console.error('[X-Ray] overallScore missing or not a finite number:', r.overallScore)
    return null
  }
  const overallScore = Math.max(0, Math.min(100, Math.round(r.overallScore)))

  if (!isScoreLevel(r.overallLevel)) {
    console.error('[X-Ray] overallLevel invalid:', r.overallLevel)
    return null
  }
  if (typeof r.executiveSummary !== 'string' || r.executiveSummary.trim().length === 0) {
    console.error('[X-Ray] executiveSummary missing or empty')
    return null
  }

  if (!Array.isArray(r.pillarScores) || r.pillarScores.length !== PILLAR_ORDER.length) {
    console.error(
      `[X-Ray] pillarScores length wrong: got ${
        Array.isArray(r.pillarScores) ? r.pillarScores.length : 'not-array'
      }, expected ${PILLAR_ORDER.length}`,
    )
    return null
  }
  const pillarScores: PillarScore[] = []
  for (let i = 0; i < r.pillarScores.length; i++) {
    const p = r.pillarScores[i]
    if (!p || typeof p !== 'object') {
      console.error(`[X-Ray] pillarScores[${i}] not an object`)
      return null
    }
    const pp = p as Record<string, unknown>
    if (!isOpexPillar(pp.pillar)) {
      console.error(`[X-Ray] pillarScores[${i}].pillar invalid:`, pp.pillar)
      return null
    }
    if (typeof pp.label !== 'string' || pp.label.trim().length === 0) {
      console.error(`[X-Ray] pillarScores[${i}].label missing/empty`)
      return null
    }
    if (typeof pp.icon !== 'string') {
      console.error(`[X-Ray] pillarScores[${i}].icon not a string`)
      return null
    }
    if (typeof pp.score !== 'number' || !Number.isFinite(pp.score)) {
      console.error(`[X-Ray] pillarScores[${i}].score not a finite number:`, pp.score)
      return null
    }
    if (!isScoreLevel(pp.level)) {
      console.error(`[X-Ray] pillarScores[${i}].level invalid:`, pp.level)
      return null
    }
    if (typeof pp.summary !== 'string' || pp.summary.trim().length === 0) {
      console.error(`[X-Ray] pillarScores[${i}].summary missing/empty`)
      return null
    }
    if (typeof pp.topIssue !== 'string' || pp.topIssue.trim().length === 0) {
      console.error(`[X-Ray] pillarScores[${i}].topIssue missing/empty`)
      return null
    }
    pillarScores.push({
      pillar: pp.pillar,
      label: pp.label,
      icon: pp.icon,
      score: Math.max(0, Math.min(100, Math.round(pp.score))),
      level: pp.level,
      summary: pp.summary,
      topIssue: pp.topIssue,
    })
  }

  if (!Array.isArray(r.topActions)) {
    console.error('[X-Ray] topActions not an array')
    return null
  }
  const topActions = r.topActions.filter(
    (a): a is string => typeof a === 'string' && a.trim().length > 0
  )
  if (topActions.length === 0) {
    console.error('[X-Ray] topActions empty after filter')
    return null
  }

  return {
    overallScore,
    overallLevel: r.overallLevel,
    executiveSummary: r.executiveSummary,
    pillarScores,
    topActions,
  }
}
