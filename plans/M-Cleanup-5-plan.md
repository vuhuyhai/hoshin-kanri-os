# M-Cleanup-5 — Tech Debt Sweep

> **Status**: Task 1 (design audit + decision lock) — KHÔNG code change.
> **Author**: claude.ai web (Cursor execution sau khi Vũ Hải lock decisions).
> **Trigger**: HANDOFF §18 backlog cleanup + 2 close-out items pre-existing debt.

---

## Trigger

3 candidates pile-up trong HANDOFF §18 đủ momentum gộp 1 milestone sweep:

1. **Admin SQL views** (HANDOFF §18 line 2243) — `010_admin_views.sql` lines 60-61 + 89-90 dùng `LIMIT 1` cho CEO pick. Risk LOW (admin-only, support staff). M-Hoshin-7 audit đã flag.
2. **Orphan SWOT routes** (HANDOFF §18 line 2243) — `/api/swot/xray-context` + `/api/swot/prefill-from-xray`. M-Hoshin-7 audit confirm 0 frontend caller.
3. **Migration 034 backfill** (HANDOFF §18 line 2245) — `034_idx_organizations_lower_name_city.sql` applied via dashboard 2026-05-01, NOT in repo. Git revert can't roll back the index.

Plus 2 close-out items pre-existing debt phát hiện khi audit:

- D1: HANDOFF §18 line 2252 candidate `M-AICoach-AutoFill-1` STALE — đã ship qua M-AICoach-Sensei-1 Task 6D auto-fill flow (`extractedInsight` quadrant + `ai_auto` source + toast undo).
- D2: HANDOFF §16 line 1067 chứa placeholder `<NEXT_HASH>` không thực thi — M-AICoach-Sensei-1 Task 8 chỉ có 1 commit thật `09b095d`, không có commit thứ 2.

---

## Scope

### Task A — Admin SQL views audit
**Files**: [supabase/migrations/010_admin_views.sql](supabase/migrations/010_admin_views.sql) (lines 60-61, 89-90)
**Pattern**: Lateral subquery `LIMIT 1` pick 1 user ngẫu nhiên trong các CEO của 1 org.
**Consumer**: Admin views `admin_customers_overview` + `admin_customer_detail` → admin dashboard pages (server-side admin tooling, không serve user).
**Risk**: LOW. Trigger condition (multi-CEO per org) currently rare.

### Task B — Orphan SWOT routes
**Files**:
- [app/api/swot/xray-context/route.ts](app/api/swot/xray-context/route.ts) (76 LOC)
- [app/api/swot/prefill-from-xray/route.ts](app/api/swot/prefill-from-xray/route.ts) (116 LOC, không phải ~50 ban đầu estimate)
**M-Hoshin-7 fix**: Cả 2 đã refactor `.maybeSingle()` + 409 multi-org guard ở commit `3e29a66`.
**Audit kết quả**: 0 frontend caller (verify-first ở V2).

### Task C — Migration 034 backfill
**File**: `supabase/migrations/034_idx_organizations_lower_name_city.sql` (MISSING in repo)
**Status hiện tại**: Index applied production via dashboard 2026-05-01. `supabase/migrations/` có 025-033 + 035, gap ở 034.
**Risk**: Repo state ≠ production schema. Git revert KHÔNG rollback được index nếu ship migration patch khác cần undo.

### Task D — Close-out (mandatory, no decision)
- D1: HANDOFF.md §18 line 2252 — REMOVE `M-AICoach-AutoFill-1` candidate entry (đã ship via M-AICoach-Sensei-1 Task 6D).
- D2: HANDOFF.md §16 line 1067 — REMOVE ` + \`<NEXT_HASH>\`` reference (placeholder không thực thi, plan intent ≠ reality).

---

## Verify-first findings

### V1 — Admin views actual code

**Lines 59-62 (admin_customers_overview):**
```sql
LEFT JOIN LATERAL (
  SELECT om.user_id FROM org_members om
  WHERE om.org_id = o.id AND om.role = 'CEO' LIMIT 1
) owner_member ON true
```

**Lines 88-91 (admin_customer_detail):**
```sql
LEFT JOIN LATERAL (
  SELECT om.user_id FROM org_members om
  WHERE om.org_id = o.id AND om.role = 'CEO' LIMIT 1
) owner_member ON true
```

**Confirmed**:
- 2 view dùng cùng pattern `LIMIT 1` không có `ORDER BY` → Postgres trả về **non-deterministic** row khi org có >1 CEO.
- Downstream consumer: admin dashboard hiển thị "Owner" column (1 email + 1 full_name per org).
- Currently org thực tế đa số có 1 CEO (M-OrgInvite-1 cho phép invite role CEO/EXEC/MANAGER/MEMBER nhưng beta phase chưa có org nào multi-CEO).

### V2 — Orphan routes confirmed

**Grep `swot/xray-context|swot/prefill-from-xray` toàn repo**:
- Hit duy nhất: `HANDOFF.md` (chỉ là tài liệu reference, không phải caller).
- 0 hit trong `app/`, `components/`, `lib/` → confirm **0 frontend caller**.

**Last modified date** (`git log -1 --format=%ai`):
- `app/api/swot/xray-context/route.ts`: **2026-04-30 17:24:49** (8 days ago — M-Hoshin-7 commit `3e29a66`)
- `app/api/swot/prefill-from-xray/route.ts`: **2026-04-30 17:24:49** (cùng commit)

**Judgment**: Cả 2 file CHỈ được touch để fix anti-pattern audit — không phải feature work. Activity gần đây = maintenance fix, KHÔNG phải signal "active feature in development".

**Route 1 shape (`xray-context`)**: GET → trả `{ hasXRay, data: SwotSeed }` qua `mapXRayToSwotSeed`. Có support `xray_id` query param.

**Route 2 shape (`prefill-from-xray`)**: GET → trả `{ prefilled, source, data }` với industry/headcount/challenges/goals/strengths/suggestedFrameworkSW/suggestedFrameworkOT — prefill SWOT setup form.

**Note**: Logic của route 2 (mapping pillarScores → challenges/goals/strengths) là business logic có giá trị reuse — nhưng chưa có caller nào dùng.

### V3 — Migration 034 status

**Folder `supabase/migrations/` snapshot**:
```
025_blog_preview_token.sql
026_newsletter_subscribers.sql
027_blog_covers_bucket.sql
028_backfill_public_users.sql
029_tows_strategies_v2_fields.sql
030_xmatrix_correlations.sql
031_annual_reviews.sql
032_weekly_hansei.sql
033_gemba_comments.sql
035_org_invites.sql      ← gap ở 034
```

**Confirmed gap**: 034 thiếu giữa 033 và 035. Production có index, repo không có file.
**Types impact**: Functional index `(LOWER(name), city)` KHÔNG cần update `lib/supabase/types.ts` (index implementation detail, không expose vào schema types).

### V4 — Close-out grep

**`M-AICoach-AutoFill-1`**: 1 hit ở line 2252 (§18 candidate) — match expected.
**`<NEXT_HASH>`**: 1 hit ở line 1067 (§16 commit list) — match expected.

---

## Decision lock

### Q1 — Admin views (Task A): defer status quo HAY ship migration patch?

**α. defer**: status quo OK. Trigger condition (multi-CEO per org) currently rare. Fix khi có support team escalation.
**β. ship**: migration patch `036_admin_views_deterministic_ceo.sql` thay `LIMIT 1` → `ORDER BY om.created_at ASC LIMIT 1` (oldest CEO = founding CEO conceptually) HOẶC composite display "X (+N)" nếu nhiều CEO.

**Rationale**:
- α pros: 0 effort, 0 risk, zero user impact.
- α cons: Tech debt còn nguyên, support team có thể bị surprise nếu org multi-CEO sau khi M-OrgInvite-1 enable invite.
- β pros: Deterministic = predictable cho support, future-proof khi có user thật multi-CEO.
- β cons: ~30 phút effort cho 1 view migration, cần test admin dashboard render OK, ship cùng M-Cleanup-5 thì commit gộp; ship riêng = thêm 1 milestone overhead.

**Recommendation**: **α defer** — tiêu chí "trigger condition rare + admin-only + 0 user impact" không justify cost ngay. Khi M-OrgInvite-1 actual generate org có >1 CEO trong production và support team báo confused, ship β trong 1 patch rời.

### Q2 — Orphan routes (Task B): remove HAY keep defensive HAY deprecate?

**α. remove**: xóa 2 file `route.ts`, `-192 LOC` (76 + 116). Audit surface đơn giản hơn.
**β. keep**: defensive cho future caller revive. Có thể M-Member-POV-2 hoặc onboarding flow mới fetch xray context.
**γ. deprecate**: keep file + add `@deprecated` comment + `NextResponse.json({...}, { status: 410 })` Gone signal.

**Rationale**:
- α pros: Sạch repo, audit surface giảm, M-Hoshin-7 audit không phải re-flag mỗi sprint. `mapXRayToSwotSeed` helper vẫn còn ở `lib/swot/xray-to-swot-mapper.ts` cho future revive (logic không lost).
- α cons: Nếu future caller cần, phải write lại route (~30 phút resurrect, không phải starting from scratch — Git history còn `3e29a66`).
- β pros: Zero risk nếu hidden caller exists (vd extension/external script).
- β cons: Dead code nuôi tech debt, mỗi audit phải re-verify "0 caller" lần nữa.
- γ pros: Compromise — signal dead nhưng vẫn discoverable. 410 Gone giúp caller hidden phát hiện break early.
- γ cons: Vẫn còn dead code, complexity hơn α (file vẫn 50+ LOC chỉ để return 410).

**Recommendation**: **α remove**. Justification: (1) M-Hoshin-7 audit đã verify 0 caller, không phải assumption. (2) Solo dev, không có "external script" rủi ro. (3) `mapXRayToSwotSeed` + business logic prefill (lines 59-91 của route 2) → rescue qua git blame/history nếu cần. (4) γ deprecate hợp khi có external API consumer → solo dev không có usecase này.

**Caveat**: Nếu Vũ Hải nhớ có roadmap touch lại flow này trong 1-2 milestones tới (vd M-Discovery-Onboarding-2 reuse prefill logic), → β keep. Decision phụ thuộc memory của Vũ Hải về roadmap.

### Q3 — Migration 034 backfill (Task C): ship now HAY defer?

**α. now**: 5 phút effort, repo completeness, git revert safety mở lại.
**β. defer**: ship chung với next migration touches `organizations` table (vd M-OrgUX-2 hoặc industry/headcount schema change).

**Rationale**:
- α pros: Repo state = production state (locked). Git revert có ý nghĩa rollback. Không phải nhớ sau này.
- α cons: 1 migration commit + 1 dummy DB run risk-free (CREATE INDEX IF NOT EXISTS idempotent — đã verify M-OrgUX-1 pattern).
- β pros: Gộp commit, ít churn migration folder.
- β cons: HANDOFF carry debt entry; risk forget khi human turnover (mặc dù solo dev — risk low). Nếu M-Cleanup-5 sweep này không backfill, debt entry sẽ rotate qua M-Cleanup-6/7/...

**Recommendation**: **α now**. Nguyên tắc: "khi đang sweep tech debt thì sweep đủ". 5 phút marginal cost, gain repo completeness vĩnh viễn. Defer cost = 1 entry HANDOFF rot trong N tuần.

### Q4 — Smoke test scope sau cleanup

**α. minimal**: `npm run typecheck` + `npm run build` PASS đủ. Không có behavior change nếu remove dead routes (Q2 α) + không touch admin views (Q1 α).
**β. functional**: Thêm 1-2 case verify:
  - Admin dashboard render OK (nếu Q1 β ship — KHÔNG cần nếu Q1 α defer).
  - Onboarding duplicate-name check vẫn work (verify migration 034 index intact post-backfill — nếu Q3 α).

**Rationale**:
- Q2 α (remove routes): 0 caller → 0 functional impact. Typecheck + build catch import break (nếu có).
- Q3 α (backfill 034): file mới chỉ là `CREATE INDEX IF NOT EXISTS` — production index already exists, file mirror only. Smoke test trên feature đã shipped không cần thiết (M-OrgUX-1 đã smoke test).

**Recommendation**: **α minimal**. Justification: Q1 α (defer admin) + Q2 α (remove dead) + Q3 α (backfill mirror) = 0 user-visible change. Typecheck + build đủ catch lint/import break. Manual browser smoke test chỉ cần khi có UI surface change.

**Fallback**: Nếu Q2 β/γ chosen (route still active) → cần manual hit endpoint qua `curl` hoặc browser network tab verify response shape OK.

### Q5 — Commit plan

**α. 1 commit gộp**: `chore(cleanup): M-Cleanup-5 sweep — orphan routes + migration 034 backfill + close-out`
**β. tách 3-4 commits**: 1 per task (A nếu ship + B + C + D), audit trail rõ.
**γ. tách 2 commits**: code (B+C) + docs (D1+D2) separate.

**Rationale**:
- Solo dev, master branch direct push, không có PR review surface.
- α: 1 commit dễ revert toàn bộ. Đơn giản nhất.
- β: Dễ rollback từng phần (vd remove routes mà giữ migration backfill). Audit trail rõ cho ai đọc git log sau này.
- γ: Code change vs docs change tách rõ — match convention `chore:` vs `docs:` trong repo. Vũ Hải đã dùng pattern này (vd `docs(close-out): M-Member-POV-1 shipped + HANDOFF + plan update`).

**Recommendation**: **γ tách 2 commits**.
1. `chore(cleanup): M-Cleanup-5 — remove orphan SWOT routes + backfill migration 034` (Task B + C)
2. `docs(close-out): M-Cleanup-5 — HANDOFF AutoFill-1 stale + NEXT_HASH placeholder` (Task D1 + D2)

Justification: Match repo convention. Code change vs docs change separation chuẩn. Vẫn dễ rollback (revert commit 1 không affect docs cleanup).

### Q6 — Effort + risk estimate + decision lock

**Effort estimate** (giả định Q1 α + Q2 α + Q3 α + Q4 α + Q5 γ — most defer/minimal path):

| Task | Effort | Risk |
|---|---|---|
| A (defer) | 0 phút | LOW |
| B (remove 2 routes) | 5 phút (delete + verify build) | LOW |
| C (backfill 034) | 10 phút (write SQL + verify production schema match) | LOW |
| D1+D2 (HANDOFF cleanup) | 5 phút (2 line edits) | NONE |
| Smoke (typecheck + build) | 5 phút | — |
| **Total** | **~25 phút** | **LOW** |

**Risk breakdown**:
- B: dead routes → remove an toàn miễn build PASS.
- C: backfill chỉ ghi lại trạng thái production (index đã exist) → file dummy, no DB execution needed. Rủi ro duy nhất: SQL syntax không match production (verify qua dashboard SQL editor).
- D: HANDOFF docs only.

**Decision lock summary**:
- Q1 → α defer
- Q2 → α remove (caveat: confirm Vũ Hải không có roadmap revive trong 1-2 milestone tới)
- Q3 → α backfill now
- Q4 → α minimal smoke (typecheck + build)
- Q5 → γ tách 2 commits (code + docs)

**Alternative path** (nếu Vũ Hải pick β/γ ở Q1/Q2 → effort phình lên):
- Q1 β: +30 phút (write migration 036 + test admin views).
- Q2 β: 0 effort code, +5 phút tài liệu cập nhật HANDOFF "kept defensive — review next sprint".
- Q2 γ: +10 phút (add deprecated comment + 410 response per route).

---

## Constraints cho future AI sessions

- **KHÔNG** revive `M-AICoach-AutoFill-1` candidate trong HANDOFF — đã ship qua Task 6D M-AICoach-Sensei-1, ai_auto source + toast undo + extractedInsight quadrant. Nếu cần extension UX (vd undo Persistent state), tạo milestone mới `M-AICoach-AutoFill-2` thay vì revive entry cũ.
- **KHÔNG** dùng `<NEXT_HASH>` placeholder pattern trong HANDOFF — pre-existing debt M-AICoach-Sensei-1 line 1067. Nếu plan có 2 commit tới và chưa chốt, dùng "TBD" tagged với date hoặc bỏ trống và update sau khi commit thật.
- **KHI** pick Q2 α (remove routes), nếu future cần revive logic prefill SWOT từ X-Ray, **TRA git history tại commit `3e29a66`** (M-Hoshin-7 fix). Logic mapping pillarScores → challenges/goals (110 LOC business logic) recoverable. `mapXRayToSwotSeed` helper vẫn còn ở `lib/swot/xray-to-swot-mapper.ts` (KHÔNG xóa).
- **KHI** pick Q3 α (backfill 034), file phải mirror chính xác production schema. Verify qua Supabase dashboard SQL editor: `SELECT indexdef FROM pg_indexes WHERE indexname = 'idx_organizations_lower_name_city'` — copy paste vào file 034. KHÔNG write từ memory để tránh drift.
- **KHI** Q1 ship sau này (β migration 036), naming convention: `036_admin_views_deterministic_ceo.sql`. ORDER BY chọn `created_at ASC` (founding CEO) — dispatch nhất quán với "owner" semantic của view name `admin_customers_overview`.
- **KHÔNG** đổi commit tách γ → α gộp khi execute. Giữ pattern "code separate from docs" — dễ rollback nếu Q4 minimal smoke test miss bug khi remove routes.
