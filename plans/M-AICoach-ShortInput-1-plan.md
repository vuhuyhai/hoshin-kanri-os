# M-AICoach-ShortInput-1 — Design Plan

> **Mục tiêu**: Fix Bug 2 deferred §16 — short input ("Thang nay dat.") trigger Tier 3 fallback "Xin lỗi, AI vừa trả lời lỗi format". Root cause hypothesis (b): AI hallucinate JSON syntax khi input quá ngắn không đủ context → JSON.parse fail.
>
> **Trigger**: 2 reproduction confirmed 2026-05-08 production. HANDOFF §16 entry "AI return JSON parse error in SwotWorkshopChat".
>
> **Constraint locks**: Không break 3-tier fallback chain (hotfix `df3c1ef`). Không thay decision lock M-AICoach-Sensei-1 §17 (Akao bidirectional entry, strategic memory, framework grouping, catchball not lecture).

---

## 1. Verify-first findings (V1-V4)

### V1 — `/api/swot/coaching/route.ts` flow hiện tại

**Input**:
- Schema `swotCoachingSchema` ([lib/validation/schemas.ts:229](lib/validation/schemas.ts#L229)) validate:
  - `messages: z.array(coachingMessageSchema).min(1)` — yêu cầu ≥1 message
  - `coachingMessageSchema.content: z.string()` — **KHÔNG min length**, accept empty string `""`
- Client `SwotWorkshopChat.handleSend` line 127 chỉ check `!text` (empty string block) — KHÔNG block input ngắn

**max_tokens**: 8192 (đã bump cho VN density, hotfix `df3c1ef` từ 800)

**3-tier fallback chain** ([lib/swot/coaching-prompts.ts:108-165](lib/swot/coaching-prompts.ts#L108-L165)):
- **Tier 1**: strict `JSON.parse(cleaned)` → success path
- **Tier 2**: regex recover `"message"` field via `/"message"\s*:\s*"((?:\\.|[^"\\])*)"/`, drop structured data
- **Tier 3**: friendly Vietnamese error `"Xin lỗi, AI vừa trả lời lỗi format. Vui lòng thử lại hoặc rút gọn câu hỏi."` + `console.error` log preview 200 chars

**Existing dead path discovery — followUpHint**:
- Route line 99-109 ĐÃ CÓ logic: nếu `lastUserMsg < 20 words` + `coachingTracker` truthy → append `follow_up_prompt` từ `COACHING_QUESTION_BANK` match dimension
- **NHƯNG**: client `SwotWorkshopChat.tsx` line 74-84 KHÔNG truyền `coachingTracker` → followUpHint **dead code path** ở production
- Comment route line 67-69: "coachingTracker as CoachingTrackerState | undefined" — designed nhưng client không wire
- **Implication**: pattern "short input → probe" đã được design nhưng chưa active. Fix có thể wire lại HOẶC prompt-side instead.

### V2 — `lib/swot/coaching-prompts.ts` schema + rules

**OUTPUT FORMAT block** (cả SW lẫn OT prompts) ép AI return:
```json
{
  "message": "...",
  "extractedInsight": {...} hoặc null,
  "shouldTransition": true/false,
  "nextDimension": "..." hoặc null
}
```

**Existing rules liên quan input ngắn**:
- SW Rule 4: "CEO trả lời mơ hồ → probe: 'Cho mình ví dụ cụ thể?'" — đã instruct probe
- OT Rule 4: cùng pattern
- Example block "CEO trả lời mơ hồ → probe": "Ổn là mức nào? Trong 6 tháng qua có ai nghỉ việc không?"

**Gap**:
- Rule "mơ hồ → probe" áp dụng cho **content ambiguous** (vd "Nhân sự tôi ổn"), KHÔNG explicit cho **input quá ngắn không đủ schema** (vd "ok", "yes", "Thang nay dat.")
- Khi input < 5 words, AI không có đủ context để gen `extractedInsight` đúng schema → improvise → JSON malformed
- `isValidInsight` ([lib/swot/coaching-prompts.ts:80-92](lib/swot/coaching-prompts.ts#L80-L92)) requires 5 fields all present + quadrant in `['S','W','O','T']`

### V3 — `SwotWorkshopChat.tsx` client flow

- Line 74-84: `postJson('/api/swot/coaching', {messages, orgContext, currentFramework})` — **KHÔNG truyền `coachingTracker`** → followUpHint server dead
- Line 85-89: store msg vào `swMessages` hoặc `otMessages` framework-aware
- Line 91-112: auto-fill ingredient từ `extractedInsight` (M-AICoach-Sensei-1 Task 6D), gate `confidence !== 'low' && length >= 5`
- Loading state line 156-163: spinner "AI đang suy nghĩ..."
- **NO client-side input length validation** — handleSend line 127 chỉ block empty string + loading
- Tier 3 message render qua ReactMarkdown line 151 như assistant message thông thường → user thấy như AI chat thật, KHÔNG có visual differentiation

### V4 — Audit other AI JSON structured routes

| Route | tool_use forced | max_tokens | retry | failSafe | Bug 2 risk |
|---|---|---|---|---|---|
| `/api/swot/coaching` | ❌ no | 8192 | ❌ | Tier 3 toast | **HIGH** (target) |
| `/api/swot/coaching-draft` | ✅ yes | 8192 | ✅ once | error 500 | **LOW** (Anthropic validate schema) |
| `/api/swot/suggest-more` | ❌ no | 800 | ✅ once | error 500 | **MEDIUM** (button-driven, không free-text) |
| `/api/swot/conflict-check` | ❌ no | 600 | ❌ | `failSafe()` empty issues | **LOW** (soft fail, no toast) |
| `/api/swot/context-cards` | ❌ no | 2000 | ❌ | error 500 | **LOW** (input là draft summary, không short) |

**Conclusion V4**: Chỉ `/api/swot/coaching` thực sự critical. `suggest-more` có risk nhưng triggered button-click với context summary đủ dài, không phải free-text user typing. Defer audit suggest-more vào milestone riêng nếu user complain.

---

## 2. Decision lock — 8 questions

### Q1 SCOPE — Coaching only hay all routes?

**Chọn: γ — Coaching fix + audit other routes report only**

| Option | Pro | Con |
|---|---|---|
| α coaching only | Min scope, evidence-driven (2 reproduction), 1 commit | Không proactive cho suggest-more risk MEDIUM |
| β all routes | Proactive, consistent pattern | Scope creep — suggest-more chưa có user complain, fix preemptive risk regress |
| **γ coaching + report** | Fix evidence + document defer cho khác | Cần Task 5 audit report |

**Rationale**: V4 audit cho thấy chỉ coaching route HIGH risk. `coaching-draft` an toàn (tool_use forced). `suggest-more` MEDIUM risk nhưng button-driven, ít short input. Fix coaching trước, document `suggest-more` defer cho M-AICoach-ShortInput-2 nếu user complain.

### Q2 DETECTION THRESHOLD — Khi nào trigger fallback?

**Chọn: γ — Word count < 5 (split whitespace)**

| Option | Pro | Con |
|---|---|---|
| α char count < 30 | Simple | Vietnamese vs ASCII length khác (1.5 chars/token VN vs 4 chars/token EN) |
| β token count est | Accurate | Cần helper function, complexity ↑ |
| **γ word count < 5** | Stable cross-language, đã có precedent (route line 101 dùng < 20 words cho followUpHint) | Magic number nhưng acceptable |
| δ AI tự decide | Akao-aligned (let AI judge) | Không deterministic, hard to verify |

**Rationale**: Pattern đã có sẵn trong route (`< 20 words` cho followUpHint). Threshold mới `< 5 words` chặt hơn cho short input case. "Thang nay dat." = 3 words → trigger. "ok ạ" = 2 words → trigger. "Khách bỏ vì giá X cao hơn cạnh tranh" = 9 words → KHÔNG trigger (đủ context).

### Q3 DETECTION LOCATION — Server-side, client-side, hay AI-side?

**Chọn: γ — AI-side prompt rule**

| Option | Pro | Con |
|---|---|---|
| α server bypass | Tiết kiệm Anthropic cost | Break catchball UX (giả AI response = lừa user); phá decision lock M-AICoach-Sensei-1 |
| β client block | Zero cost | Bad UX (block typing tự nhiên); chống lại Akao "user controls flow" |
| **γ AI-side prompt** | Preserve Akao; AI vẫn là sensei | Cost vẫn $$ (acceptable trade) |
| δ α+γ defense in depth | Robust | 2-3h → 4-5h scope creep |

**Rationale**: Akao Method §17 lock — "Catchball not lecture", AI là sensei challenger. Server bypass = pretend AI = anti-pattern. Client block = anti-Akao "user controls". AI-side rule preserve Akao + cost minimal increment (Vietnamese short input ~50 tokens/turn). Trade-off cost vs UX integrity → UX win.

### Q4 UX RESPONSE — Khi input ngắn, response shape gì?

**Chọn: α — Conversational text probe**

Pattern Minh persona đã có ở example block:
```
CEO: "Nhân sự tôi ổn"
{"message":"\"Ổn\" là mức nào? Trong 6 tháng qua có ai nghỉ việc không?...","extractedInsight":null,...}
```

**Extend pattern** cho input ngắn không context:
```
CEO: "ok" / "yes" / "Thang nay dat."
{"message":"Anh có thể nói rõ hơn không? Vd: 'Tháng này khách giảm 30%' hay 'Doanh số đạt 80% mục tiêu'","extractedInsight":null,"shouldTransition":false,"nextDimension":null}
```

**Constraint**:
- Vẫn return JSON shape đầy đủ ({message, extractedInsight: null, shouldTransition: false, nextDimension: null}) — KHÔNG break parser
- `extractedInsight: null` — KHÔNG fabricate insight từ memory hoặc context (Bug 3 lesson)
- `message` Vietnamese natural, match Minh persona, KHÔNG dùng tên framework

### Q5 BACKWARD COMPAT 3-TIER — Có break gì không?

**Chọn: KHÔNG TOUCH 3-tier fallback chain**

- Tier 1 strict JSON.parse: giữ nguyên
- Tier 2 regex recover: giữ nguyên
- Tier 3 friendly Vietnamese: giữ nguyên ("Xin lỗi, AI vừa trả lời lỗi format. Vui lòng thử lại hoặc rút gọn câu hỏi.")

**Lý do**: Vấn đề là route HIT Tier 3 quá thường với short input, KHÔNG phải Tier 3 message tệ. Fix prompt → giảm Tier 3 hit rate. 3-tier vẫn cần defensive cho các failure mode khác (truncation, model hallucinate, fence corrupt).

**Audit consistency**: Pattern 3-tier chỉ ở `/api/swot/coaching`. Other routes dùng pattern khác (retry-once cho `coaching-draft` + `suggest-more`, failSafe cho `conflict-check`, no-retry cho `context-cards`). KHÔNG cần unify cross-routes — context khác nhau.

### Q6 STRATEGIC MEMORY INTERACTION — Conflict không?

**Risk identified**: Memory block (M-AICoach-Sensei-1 Task 3B-2) inject `swot_factors` cross-session vào prompt. Khi short input + memory loaded:
- **Positive**: AI có thêm context để gen JSON đúng schema (more pattern match)
- **Negative**: AI có thể fabricate insight reference [S1]/[W1] dù user message hiện tại không liên quan → hallucinate cross-context

**Mitigation**:
- Add explicit rule trong prompt: "KHI input CEO < 5 từ và không reference rõ memory, return `extractedInsight: null` + probe. KHÔNG fabricate insight dựa trên memory cũ."
- Test case CASE 6+7 verify không regress Bug 3 (Strategic Memory framework filter commit `c8df2bf`)

### Q7 TEST PLAN — Smoke cases

**Add CASE 6+7 cho Strategic Memory interaction**:

| Case | Input | Expected | Verify |
|---|---|---|---|
| **C1** | "ok" (ASCII không dấu, 1 word) | message probe + extractedInsight null | Tier 3 NOT hit |
| **C2** | "ok ạ" (Vietnamese 2 words) | message probe + extractedInsight null | Tier 3 NOT hit |
| **C3** | "Tháng này bán được 50 đơn, giảm 30%" (medium 7 words) | message contextual + extractedInsight populated (W likely) | Flow chính KHÔNG regress |
| **C4** | Full paste 100+ words multiple insights (regression) | message group by topic + extractedInsight populated | Akao "framework grouping" preserved |
| **C5** | Empty input "" | Client block (button disabled), không POST | handleSend line 127 check `!text` |
| **C6** | Short input + Strategic Memory loaded (org Ladysfit có S/W populated) | message probe + extractedInsight null + KHÔNG reference [S1]/[W1] fabricated | Bug 3 không regress |
| **C7** | Short input + fresh org (no memory) | message probe + extractedInsight null | Baseline |

**Out of scope** (defer M-AICoach-ShortInput-2 nếu trigger):
- `/api/swot/suggest-more` short input behavior
- Tier 3 UI differentiation (visual badge "AI lỗi format" vs normal message)

### Q8 EFFORT VERIFY

**Realistic estimate: 2-3h, 1-2 commits**

- Files touch: 1 file (`lib/swot/coaching-prompts.ts`)
- LOC estimate: ~30-50 lines (add rule + 2 example blocks SW + OT)
- Commit count: **1 commit** (gộp SW + OT prompt update — cùng pattern, atomic ship)
- Risk LOW: chỉ extend prompt rule, không touch parser/state/UI

**Risk mitigations**:
- R1: Prompt update làm AI quá conservative → từ chối extract insight cả khi input đủ → CASE 3 verify
- R2: LLM disobedience không follow rule → CASE 1+2 reproduce 3 lần verify consistency
- R3: Strategic Memory fabricate → CASE 6 verify rule "KHÔNG fabricate dựa trên memory cũ"

---

## 3. Tasks breakdown

### Task 2 — Update SW + OT prompts với short-input rule

**Scope**: 1 file, 1 commit.

**Changes** ([lib/swot/coaching-prompts.ts](lib/swot/coaching-prompts.ts)):

1. **SW prompt** (`getSwCoachingSystemPrompt`):
   - Add Rule 9 vào QUY TẮC BẮT BUỘC block:
     ```
     9. KHI input CEO quá ngắn (< 5 từ) hoặc không đủ context (vd "ok", "yes", "Thang nay dat."):
        → Return `extractedInsight: null`, `shouldTransition: false`
        → message: probe Vietnamese natural ("Anh có thể nói rõ hơn không? Vd: ...")
        → KHÔNG fabricate insight dựa trên memory cũ hoặc bối cảnh đã thảo luận
     ```
   - Add example block "CEO trả lời quá ngắn → probe (KHÔNG extract insight)":
     ```
     CEO: "ok"
     {"message":"Anh có thể nói rõ hơn không? Vd: 'Tháng này doanh số đạt 80%' hay 'Có 2 PT vừa nghỉ việc tuần trước'","extractedInsight":null,"shouldTransition":false,"nextDimension":null}
     ```

2. **OT prompt** (`getOtCoachingSystemPrompt`):
   - Add Rule 10 (sau Rule 9 hiện tại) cùng pattern
   - Add example block với context external:
     ```
     CEO: "Thang nay dat."
     {"message":"Anh đang nhắc đến cạnh tranh hay xu hướng thị trường? Cho ví dụ cụ thể vd: 'Đối thủ X giảm giá 20%' hay 'Khách hỏi nhiều về dịch vụ Y'","extractedInsight":null,"shouldTransition":false,"nextDimension":null}
     ```

**Commit message**:
```
fix(swot): probe instead of hallucinate when CEO input too short

Bug 2 production hotfix M-AICoach-ShortInput-1.
Short input ("ok", "Thang nay dat.") triggered Tier 3 fallback
"AI lỗi format" because AI hallucinated JSON syntax without enough
context. Add Rule 9/10 + example block instructing AI to probe with
Minh persona instead of fabricating extractedInsight.

Constraints preserved:
- 3-tier fallback chain (hotfix df3c1ef)
- Akao bidirectional entry + strategic memory + catchball
- isValidInsight schema unchanged
```

### Task 3 — Smoke test 7 cases

**Setup**:
- Org test: Ladysfit (memory loaded — verify Bug 3 không regress)
- Org test fresh: tạo mới hoặc dùng test smoketest user

**Verification per case**:
- Network tab: POST `/api/swot/coaching` response shape
- UI: assistant message render đúng probe (KHÔNG hiện literal `{` `}` blob)
- Console: KHÔNG log `[coaching] JSON parse failed`
- Toast: KHÔNG show "Xin lỗi, AI vừa trả lời lỗi format"

**Pass criteria**: 7/7 cases match expected. Nếu C3/C4 regress → rollback.

### Task 4 — HANDOFF update + close milestone

- §16 entry update: Bug 2 status RESOLVED + commit hash + smoke test results
- §17 NEW pattern lesson: "Short input → AI hallucinate JSON" (generalize cho mọi AI structured output route future)
- §18 Roadmap: remove M-AICoach-ShortInput-1 từ candidates list
- Pattern lesson thêm: AI structured output routes có 3-tier fallback chain MUST có prompt rule explicit cho edge case "input không đủ context để gen schema" — return null structured + probe text, KHÔNG improvise

---

## 4. Risks + mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **R1 — Prompt update làm AI quá conservative, từ chối extract cả khi context đủ** | MEDIUM | HIGH (regress flow chính) | CASE 3 verify "Tháng này bán 50 đơn, giảm 30%" vẫn extract W insight |
| **R2 — LLM không follow rule mới (disobedience)** | LOW | MEDIUM | CASE 1+2 reproduce 3 lần consistency check; nếu fail rate > 30% → rephrase rule mạnh hơn |
| **R3 — Strategic Memory fabricate insight cho short input** | MEDIUM | MEDIUM | CASE 6 verify rule "KHÔNG fabricate dựa trên memory cũ"; nếu vẫn fabricate → tighten rule wording |
| **R4 — Threshold < 5 từ quá strict (block "Khách bỏ" 2 từ legitimate context)** | LOW | LOW | Threshold AI judgment, không hard count. Prompt nói "quá ngắn HOẶC không đủ context" — AI tự decide |
| **R5 — Example block conflict với pattern existing "CEO mơ hồ → probe"** | LOW | LOW | 2 patterns complement: existing = content ambiguous, new = content too short. KHÔNG overlap |

---

## 5. Smoke test cases — detail

### CASE 1 — ASCII không dấu 1 word
- **Input**: "ok"
- **Expected response**:
  ```json
  {
    "message": "Anh có thể nói rõ hơn không? Vd: ...",
    "extractedInsight": null,
    "shouldTransition": false,
    "nextDimension": null
  }
  ```
- **Verify**: UI render markdown probe text. Network tab response 200. Console clean.

### CASE 2 — Vietnamese có dấu 2 words
- **Input**: "ok ạ"
- **Expected**: same as C1

### CASE 3 — Medium context (REGRESSION TEST)
- **Input**: "Tháng này bán được 50 đơn, giảm 30%"
- **Expected**:
  ```json
  {
    "message": "Giảm 30% là so với cùng kỳ năm trước hay tháng trước? Anh nghĩ root cause là gì?",
    "extractedInsight": {
      "framework": "8M",
      "dimension": "Money",
      "insight": "Doanh số tháng này 50 đơn, giảm 30%",
      "confidence": "medium",
      "quadrant": "W"
    },
    ...
  }
  ```
- **Verify**: extractedInsight populated → auto-fill W card + toast "✓ Đã thêm vào W"

### CASE 4 — Full paste regression
- **Input**: 100+ words multi-topic paste (vd "Đội ngũ: PT giỏi nhưng turnover cao. Hệ thống: phần mềm cũ...")
- **Expected**: AI nhóm theo chủ đề + hỏi root cause (Akao framework grouping principle preserved)

### CASE 5 — Empty input
- **Input**: ""
- **Expected**: Client `handleSend` line 127 block (`!text`). Button disabled. KHÔNG POST.

### CASE 6 — Short input + Strategic Memory loaded
- **Setup**: Login org Ladysfit (S/W populated từ session trước)
- **Input**: "ok"
- **Expected**:
  ```json
  {
    "message": "Anh có thể nói rõ hơn không? ...",
    "extractedInsight": null,
    ...
  }
  ```
- **Critical check**: message KHÔNG reference "[S1]" hay "[W2]" — KHÔNG fabricate dựa trên memory cũ
- **Bug 3 regression check**: SW mode → memory chỉ inject S/W, KHÔNG O/T

### CASE 7 — Short input + fresh org (baseline)
- **Setup**: Tạo org mới hoặc dùng smoketest user fresh
- **Input**: "Thang nay dat."
- **Expected**: same shape as C6 nhưng KHÔNG có memory reference
- **Verify**: Tier 3 toast NOT shown, response shape clean

---

## 6. Rollback plan

**Trigger rollback nếu**:
- C3 hoặc C4 regress (flow chính bị break — AI không extract insight cho input đủ context)
- Tier 3 hit rate post-deploy > pre-deploy (verify qua console.error logs sample 1 ngày)
- User complain mới về AI từ chối respond

**Rollback action**:
```bash
git revert <task-2-commit-hash>
git push origin master
```

Vercel auto-deploy revert. Plan file giữ nguyên cho future re-attempt với approach khác (vd Q3 option α server bypass nếu prompt approach fail).

**Time-to-rollback**: < 5 phút (1 git command + Vercel auto-deploy ~2 phút).

---

## 7. Out of scope (defer milestone riêng)

- **M-AICoach-ShortInput-2**: Audit `/api/swot/suggest-more` short input behavior. Trigger: user complain.
- **M-AICoach-Tier3-UX**: Visual differentiation cho Tier 3 fallback message (badge "AI lỗi", retry button inline). Trigger: Tier 3 vẫn hit > 5%/tuần sau Task 2 ship.
- **M-AICoach-AutoFill-1** (existing roadmap entry): Wire `extractedInsight` auto-fill — đã shipped ở M-AICoach-Sensei-1 Task 6D. Update §18 remove khỏi candidates.

---

**End of plan. Ready for Vũ Hải review trước khi ship Task 2.**
