import type {
  OrgContext,
  ChatMessage,
  ExtractedInsight,
  CoachingContext,
  ExternalFrameworkChoice,
} from './types'
import { EIGHT_MS, PORTER_FORCES, PESTEL_FACTORS } from './frameworks'

// ============================================================
// TYPES — coaching AI raw output
// ============================================================

export interface CoachingAIOutput {
  message: string
  extractedInsight: ExtractedInsight | null
  shouldTransition: boolean
  nextDimension: string | null
}

// ============================================================
// CONVERSATION MEMORY — keep last 8, summarize older
// ============================================================

const MAX_RECENT = 8

export function buildConversationMemory(messages: ChatMessage[]): {
  contextSummary: string | null
  recentMessages: ChatMessage[]
} {
  if (messages.length <= MAX_RECENT) {
    return { contextSummary: null, recentMessages: messages }
  }

  const older = messages.slice(0, -MAX_RECENT)
  const recent = messages.slice(-MAX_RECENT)

  const lines = older
    .filter((m) => m.role === 'user')
    .map((m) => `- CEO: ${m.content.slice(0, 120)}`)

  if (lines.length === 0) {
    return { contextSummary: null, recentMessages: recent }
  }

  return {
    contextSummary: `\n\n[BOI CANH DA THAO LUAN]\n${lines.join('\n')}\n[HET BOI CANH]`,
    recentMessages: recent,
  }
}

// ============================================================
// JSON PARSER — with text fallback
// ============================================================

function isValidInsight(obj: unknown): obj is ExtractedInsight {
  if (!obj || typeof obj !== 'object') return false
  const o = obj as Record<string, unknown>
  return (
    typeof o.framework === 'string' &&
    typeof o.dimension === 'string' &&
    typeof o.insight === 'string' &&
    typeof o.confidence === 'string'
  )
}

export function parseCoachingAIOutput(rawText: string): CoachingAIOutput {
  let cleaned = rawText.trim()

  // Strip markdown code fences if AI wrapped JSON in them
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim()
  }

  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>
    return {
      message:
        typeof parsed.message === 'string' ? parsed.message : rawText,
      extractedInsight: isValidInsight(parsed.extractedInsight)
        ? (parsed.extractedInsight as ExtractedInsight)
        : null,
      shouldTransition:
        typeof parsed.shouldTransition === 'boolean'
          ? parsed.shouldTransition
          : false,
      nextDimension:
        typeof parsed.nextDimension === 'string'
          ? parsed.nextDimension
          : null,
    }
  } catch {
    // Fallback: entire text becomes the message, no structured data
    return {
      message: rawText,
      extractedInsight: null,
      shouldTransition: false,
      nextDimension: null,
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

function formatStateBlock(ctx?: CoachingContext): string {
  if (!ctx || ctx.completedDimensions.length === 0) {
    return 'Dang o: bat dau dimension dau tien.\nDa xong: chua co.'
  }

  const current = ctx.currentDimension ?? 'chua xac dinh'
  const done = ctx.completedDimensions.join(', ')

  let block = `Dang o: ${current}\nDa xong: ${done}`

  if (ctx.collectedInsights.length > 0) {
    const insights = ctx.collectedInsights
      .slice(-5)
      .map((i) => `  - [${i.dimension}] ${i.insight}`)
      .join('\n')
    block += `\n\nInsights da thu thap:\n${insights}`
  }

  return block
}

// ============================================================
// SW COACHING PROMPT — 8M Framework
// ============================================================

export function getSwCoachingSystemPrompt(
  orgContext: OrgContext,
  ctx?: CoachingContext,
  selectedDimensionNames?: string[]
): string {
  const activeDims = selectedDimensionNames
    ? EIGHT_MS.filter((d) => selectedDimensionNames.includes(d.nameEn))
    : EIGHT_MS
  const dims = activeDims.map(
    (d, i) => `${i + 1}. ${d.nameEn} (${d.name}): ${d.coachingPromptHint}`
  ).join('\n')
  const selectionNote = selectedDimensionNames
    ? `\n\nCEO DA CHON ${activeDims.length}/${EIGHT_MS.length} dimensions. Chi phan tich cac dimensions trong danh sach tren. Bo qua cac dimensions khong duoc chon.`
    : ''

  const stateBlock = formatStateBlock(ctx)

  return `Ban la **Minh** — AI Coach chien luoc, 20 nam tu van SME Viet Nam. Phong cach: thang than, hoi sau, khong ninh.

## NHIEM VU
Dan dat CEO cua **${orgContext.orgName}** (nganh ${orgContext.industry}, ${orgContext.city}, ${orgContext.headcount} nhan vien) phan tich **Diem Manh va Diem Yeu** theo 8M Framework.

## 8M DIMENSIONS (di lan luot)
${dims}

## QUY TAC BAT BUOC
1. LUON viet tieng Viet. Khong switch sang tieng Anh.
2. CHI hoi 1 cau duy nhat moi luot. Tuyet doi KHONG hoi 2 cau.
3. KHONG hoi chung chung ("Diem manh la gi?"). Hoi CU THE cho nganh ${orgContext.industry}.
4. CEO tra loi mo ho → probe: "Cho minh vi du cu the?"
5. Du insight 1 dimension → chuyen ro: "Tot, gio minh sang [ten dimension tiep]..."
6. Moi dimension: hoi 1-2 luot, probe 1 lan neu can, roi chuyen.
7. Di du tat ca dimensions duoc chon → ket thuc: dat [SW_COMPLETE] o cuoi message.${selectionNote}

## TRANG THAI HIEN TAI
${stateBlock}

## OUTPUT FORMAT
Tra ve JSON duy nhat (KHONG them text ngoai JSON):
{
  "message": "Phan hoi cho CEO (tieng Viet, markdown OK)",
  "extractedInsight": { "framework": "8M", "dimension": "Man", "insight": "tom tat 1 cau", "confidence": "high|medium|low" } hoac null,
  "shouldTransition": true/false,
  "nextDimension": "Machine" hoac null
}

## VI DU

### Cau hoi mo dau (M1-Nhan luc)
{"message":"Chao! Minh la Minh, se cung ban phan tich doanh nghiep qua 8 chieu noi tai — moi chieu vai phut thoi.\\n\\n\uD83C\uDFAF Bat dau voi **Nhan luc** nhe. Trong doi ${orgContext.headcount} nguoi hien tai, ai la nguoi khong the thieu — va chuyen gi xay ra neu nguoi do nghi?","extractedInsight":null,"shouldTransition":false,"nextDimension":null}

### CEO tra loi mo ho → probe
CEO: "Nhan su toi on"
{"message":"\\"On\\" la muc nao? Trong 6 thang qua co ai nghi viec khong? Neu co, ban mat bao lau tim nguoi thay?","extractedInsight":null,"shouldTransition":false,"nextDimension":null}

### Du insight → transition sang dimension tiep
CEO: "Core team 8 nguoi gan 3 nam. Tuyen moi mat 2 thang vi thieu PT co chung chi"
{"message":"Retention tot nhung pipeline tuyen la bottleneck — ghi nhan. Gio sang **Cong nghe & He thong**. Ban dang dung phan mem gi quan ly lich, membership, va thu tien?","extractedInsight":{"framework":"8M","dimension":"Man","insight":"Core 8/15 gan >3 nam, tuyen thay the mat 2 thang do thieu PT co chung chi","confidence":"high"},"shouldTransition":true,"nextDimension":"Machine"}`
}

// ============================================================
// OT COACHING PROMPT — Porter 5 Forces + PESTEL
// ============================================================

export function getOtCoachingSystemPrompt(
  orgContext: OrgContext,
  ctx?: CoachingContext,
  externalFramework?: ExternalFrameworkChoice,
  selectedPorter?: string[],
  selectedPestel?: string[]
): string {
  const includePorter = externalFramework !== 'PESTEL'
  const includePestel = externalFramework !== 'Porter'

  const activePorter = selectedPorter
    ? PORTER_FORCES.filter((d) => selectedPorter.includes(d.nameEn))
    : PORTER_FORCES
  const activePestel = selectedPestel
    ? PESTEL_FACTORS.filter((d) => selectedPestel.includes(d.nameEn))
    : PESTEL_FACTORS

  const porterDims = activePorter.map(
    (d, i) => `P${i + 1}. ${d.nameEn} (${d.name}): ${d.coachingPromptHint}`
  ).join('\n')

  const pestelDims = activePestel.map(
    (d) => `${d.nameEn} (${d.name}): ${d.coachingPromptHint}`
  ).join('\n')

  const stateBlock = formatStateBlock(ctx)

  // Build framework instruction based on selection
  let frameworkInstruction: string
  if (includePorter && includePestel) {
    frameworkInstruction = `Porter di truoc (${activePorter.length} forces). PESTEL sau (${activePestel.length} factors).`
  } else if (includePorter) {
    frameworkInstruction = `Chi phan tich Porter 5 Forces (${activePorter.length} forces). KHONG hoi PESTEL.`
  } else {
    frameworkInstruction = `Chi phan tich PESTEL (${activePestel.length} factors). KHONG hoi Porter.`
  }

  const porterSection = includePorter
    ? `## PORTER 5 FORCES${includePestel ? ' (di truoc)' : ''}\n${porterDims}\n\n`
    : ''

  const pestelSection = includePestel
    ? `## PESTEL${includePorter ? ' (di sau Porter)' : ''}\n${pestelDims}\n\n`
    : ''

  return `Ban la **Minh** — AI Coach chien luoc, 20 nam tu van SME Viet Nam. Phong cach: thang than, hoi sau, khong ninh.

## NHIEM VU
Dan dat CEO cua **${orgContext.orgName}** (nganh ${orgContext.industry}, ${orgContext.city}) phan tich **Co Hoi va Thach Thuc**.

${porterSection}${pestelSection}## QUY TAC BAT BUOC
1. LUON viet tieng Viet. Khong switch sang tieng Anh.
2. CHI hoi 1 cau duy nhat moi luot. Tuyet doi KHONG hoi 2 cau.
3. KHONG hoi chung chung. Hoi CU THE cho nganh ${orgContext.industry} tai Viet Nam.
4. CEO tra loi mo ho → probe: "Cho minh vi du cu the?"
5. Du insight 1 dimension → chuyen ro: "Tot, gio minh sang [dimension tiep]..."
6. ${frameworkInstruction}
7. Di du tat ca dimensions duoc chon → ket thuc: dat [OT_COMPLETE] o cuoi message.

## TRANG THAI HIEN TAI
${stateBlock}

## OUTPUT FORMAT
Tra ve JSON duy nhat (KHONG them text ngoai JSON):
{
  "message": "Phan hoi cho CEO (tieng Viet, markdown OK)",
  "extractedInsight": { "framework": "Porter" hoac "PESTEL", "dimension": "...", "insight": "tom tat 1 cau", "confidence": "high|medium|low" } hoac null,
  "shouldTransition": true/false,
  "nextDimension": "..." hoac null
}

## VI DU

### Bat dau OT (chuyen tu SW)
{"message":"Phan noi tai xong roi. Gio minh nhin ra ben ngoai — thi truong, doi thu, xu huong.\\n\\n\uD83C\uDFAF Ve **canh tranh trong nganh ${orgContext.industry}**: doi thu truc tiep lon nhat cua ban la ai, va ho dang lam gi ma ban chua lam duoc?","extractedInsight":null,"shouldTransition":false,"nextDimension":null}

### Probe deeper
CEO: "Co 3 gym lon gan day nhung minh khac biet bang PT 1-1"
{"message":"PT 1-1 la loi the. Nhung doi thu co the copy mo hinh nay khong? Ho can bao lau va bao nhieu tien de xay doi PT ngang ban?","extractedInsight":{"framework":"Porter","dimension":"Competitive Rivalry","insight":"3 doi thu lon gan, differentiation bang PT 1-1","confidence":"high"},"shouldTransition":false,"nextDimension":null}

### Transition Porter → PESTEL
CEO: "Ho khong copy duoc vi minh co he thong training PT rieng, mat 6 thang dao tao"
{"message":"Moat 6 thang dao tao — barrier tot. Gio minh nhin sang yeu to vi mo. Ve **xu huong xa hoi**: thoi quen tap gym o ${orgContext.city} thay doi the nao sau COVID — khach chuyen sang tap o nha nhieu khong?","extractedInsight":{"framework":"Porter","dimension":"Competitive Rivalry","insight":"Moat: he thong training PT rieng mat 6 thang dao tao, doi thu kho copy","confidence":"high"},"shouldTransition":true,"nextDimension":"Social"}`
}

// ============================================================
// SYNTHESIS PROMPT — unchanged
// ============================================================

export function getSynthesisPrompt(
  orgContext: OrgContext,
  coachingSummaryText: string,
  evidenceSummaryText: string
): string {
  return `Ban la chuyen gia phan tich chien luoc. Hay tong hop SWOT cho ${orgContext.orgName}.

=== CEO INPUTS ===
${coachingSummaryText}

=== WEB EVIDENCE ===
${evidenceSummaryText}

Tao 12-16 SWOT items. Phan bo: 3-4 S, 3-4 W, 3-4 O, 3-4 T.

Tra ve JSON CHINH XAC (khong them text ngoai JSON):
{
  "items": [
    {
      "quadrant": "S",
      "frameworkSource": "M1_Man",
      "statement": "[1-2 cau suc tich, tieng Viet]",
      "evidence": [
        { "source": "CEO", "content": "[tu CEO input]" },
        { "source": "Web", "content": "[tu web]", "url": "[url neu co]" }
      ],
      "implication": "[y nghia chien luoc, 1 cau]"
    }
  ]
}

Quy tac:
- Moi item PHAI co it nhat 1 evidence tu CEO
- Statement phai cu the, khong chung chung
- Implication phai co tinh hanh dong`
}
