# M-AICoach-Sensei-1 — SWOT Coaching Redesign theo Akao Method

> **Created**: 2026-05-03
> **Driver**: 3 user feedbacks về AI Coach reset + ép tuyến tính + reset context giữa session
> **Methodology source**: Kesterson "Basics of Hoshin Kanri" Ch.6, Vinardi "Business Strategy with Hoshin Kanri" Ch.3-6, Villalba-Diez "The Hoshin Kanri Forest" Ch.4-7
> **Persona review**: Akao-sensei (Yoji Akao 1928-2016, "father of Hoshin Kanri")

---

## Root causes identified (verify-first audit)

### RC1: State machine forced linear SW → OT (architecture-level)
- app/api/swot/coaching/route.ts:205-225 enforce [SW_COMPLETE] → getNextFramework('8M') → Porter
- [OT_COMPLETE] → currentPhase: 'completed'
- Within framework: Rule 5-7 trong prompt force sequential dimension walk
- User muốn làm OT trước IMPOSSIBLE từ architecture, không phải prompt
- Triết lý sai: Hoshin Kanri Forest Ch.4 — SWOT là interaction matrix, không phải bậc thang

### RC2: Hardcoded currentFramework: 'sw' ở client
- components/swot/SwotWorkshopChat.tsx:50 hardcode → OT branch unreachable
- User paste OT vào chat → AI nhận state SW + nội dung OT → confusion → reset

### RC3: AI hallucinate "cái nào ảnh hưởng nhất"
- Audit confirm prompt KHÔNG có "ảnh hưởng nhất / Pareto / quan trọng nhất"
- Hành vi đến từ AI hallucinate khi context window bloat (state machine + sequential walk)
- Pareto thinking là job của catchball CEO+team, KHÔNG phải AI (Kesterson Ch.4)

### RC4: Reset context giữa session (no Strategic Memory)
- Route không load swot_factors / swot_analyses by org_id
- Chỉ context: request body + buildConversationMemory(messages)
- Triết lý sai: Vinardi Ch.6 — Strategic Memory là core, Toyota catchball nhiều tháng giữ memory

### RC5: max_tokens 4096 truncate Vietnamese paste lớn
- Pitfall #9: Vietnamese 1.5 chars/token vs English 4 chars/token
- User paste 20+ items → mid-response truncation → "reset" feel
- Precedent: X-Ray scoring 2500 → 8000, TOWS v2 4096 → 8000

### RC6: extractedInsight ignored client-side
- Server gửi về CoachingResponse line 138, client SwotWorkshopChat.tsx:80-85 ignore
- User phải manual click "Rút ý từ chat" → friction
- Confidence 'low' pass-through không filter

### RC7: xrayContext 4th param dead code
- Route call getSwCoachingSystemPrompt(...3 args), prompt builder define 4 params
- xrayBlock template luôn empty

---

## Task plan (8 tasks, ~7-8 commits)

| # | Task | Commit prefix | Critical |
|---|---|---|---|
| 1 | Plan docs (this file) | docs | - |
| 2 | Bỏ state machine forced linear, adaptive framework detection | refactor(api) | YES |
| 3 | Wire xrayContext + load persistent SWOT context | feat(api) | - |
| 4 | Bump max_tokens 4096 → 8192 + streaming SSE | feat(api) | - |
| 5 | Rewrite system prompt theo Akao 4-principle | feat(swot) | YES |
| 6 | Auto-fill extractedInsight + remove hardcode currentFramework + refactor swot-session-store client state machine | feat(swot) | - |
| 7 | ~~UI badge Strategic Memory~~ SKIPPED — verify-first phát hiện scope không cần thiết | docs | SKIP |
| 8 | HANDOFF update + smoke test 7 phases | docs | - |

## Task 6 scope expansion (added 2026-05-03 post Task 2B verify)

swot-session-store.ts line 1336-1378 có client-side state machine parallel, vẫn dùng getNextFramework/getFirstDimension/getNextDimension để force linear SW→OT. Task 6 phải refactor cả store này, không chỉ SwotWorkshopChat.tsx hardcode. Nếu không, server permissive nhưng client zustand store vẫn force linear → user vẫn bị stuck.

## Task 7 SKIP rationale (added 2026-05-03 post Task 6E close)

Verify-first analysis cho Task 7 phát hiện 2 sub-features đều không nên ship:

1. Strategic Memory badge ("Em nhớ N items từ session trước"):
   - Server đã inject memory vào prompt (Task 3B-2) — benefit thực đã ship
   - Badge chỉ visual decoration, 4 options implementation đều có cost không rõ
   - Defer milestone riêng nếu user request explicit

2. Framework detected badge ("AI đang focus: 8M"):
   - Vi phạm Rule 9 SW prompt + Rule 9 OT prompt: "TUYỆT ĐỐI KHÔNG đề cập đến 8M / Porter / PESTEL"
   - Lộ tên framework với CEO sẽ phá Akao 4-principle (catchball, không lecture)

Pattern lesson L25: verify-first phát hiện scope = 0. M-Hoshin-7 L7 áp dụng — đôi khi conclusion verify-first là "không build". Tránh ship feature decoration không value.

---

## Akao 4-principle for prompt rewrite (Task 5)

1. Bidirectional entry: User start anywhere (S/W/O/T). AI detect entry, KHÔNG ép cung cấp 3 quadrants còn lại.
2. Strategic Memory: AI reference persistent context — "Lần trước anh nói về X, hôm nay đề cập Y, có liên kết SO không?"
3. Framework grouping over Pareto: Khi user paste 20+ items, AI nhóm theo 8M (SW) / Porter+PESTEL (OT), KHÔNG hỏi "cái nào ảnh hưởng nhất". Ranking để catchball CEO+team quyết.
4. Catchball not lecture: AI là sensei challenger (5-Why, root cause), KHÔNG phải decision maker.

---

## Risk + mitigation

### R1: Bỏ state machine = breaking change user đang giữa session
- Mitigation: Deprecate [SW_COMPLETE]/[OT_COMPLETE] markers gradually. Server vẫn parse nếu có (backward compat) nhưng không enforce next framework switch.
- Rollback: git revert Task 2 commit nếu user complain.

### R2: Streaming SSE + non-streaming client mismatch
- Mitigation: Switch client postJson → postSse cùng commit Task 4. Test cả 2 paths trước commit.

### R3: Persistent context query N+1
- Mitigation: Single query swot_factors + swot_analyses by org_id LIMIT 100, cache trong route memory per request.

### R4: Auto-fill spam khi confidence='low'
- Mitigation: Gate confidence !== 'low' + show toast "Đã thêm vào [S/W/O/T] — Hoàn tác" với undo button (3s timeout).

---

## Out of scope

- AI sensei summarize comments (defer M-AICoach-Sensei-2)
- Korean characters bug (defer indefinitely, 1 anecdotal report)
- TOWS strategy auto-generate redesign (separate concern)
- Synthesis route changes (different downstream route, không trong coaching flow)
