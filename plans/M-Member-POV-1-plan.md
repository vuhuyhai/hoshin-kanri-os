# M-Member-POV-1 — Canvas Member-POV Redesign

> **Status**: Task 1 design audit APPROVED 2026-05-08. Decisions locked Q1-Q8. Ready for Task 2 implementation breakdown.

## 1. Driving Need

M-Hoshin-6 Q-canvas đã đóng tạm thời canvas access cho Member bằng 3 dòng `redirect('/dashboard')` ở [app/dashboard/x-matrix/new/page.tsx:30-32](app/dashboard/x-matrix/new/page.tsx#L30-L32). Comment trong code (`HoshinGembaSectionClient.tsx:23` + `page.tsx:29`) ghi explicit "future M-Hoshin-7 nới Member writer" — M-Member-POV-1 chính là milestone đóng debt đó.

Akao Method bidirectional entry (M-AICoach-Sensei-1 §17) yêu cầu Member là gemba observer: thấy strategic chain (Vision → YearGoal → Hoshin → KPI) để comment đúng context. Hiện Member redirect `/dashboard` → mất ngữ cảnh khi muốn comment Hoshin. Toyota hoshin philosophy: catchball cần Member visibility, không phải CEO-only artifact.

## 2. Verify Report

### 2.1 Files touched (audit-only, KHÔNG edit)

| File | LOC | Observation |
|---|---|---|
| [app/dashboard/x-matrix/new/page.tsx](app/dashboard/x-matrix/new/page.tsx) | 79 | Server Component fetch membership + `canEdit = role==='CEO'\|\|'Manager'`. **Có redirect L30-32 cho Member**. `canEdit` truyền xuống XMatrixCanvasPage prop. `HoshinGembaSection` userRole prop hardcode `'CEO' \| 'Manager'` cast → cần extend union khi mở Member. |
| [components/x-matrix/canvas/XMatrixCanvasPage.tsx](components/x-matrix/canvas/XMatrixCanvasPage.tsx) | 71 | Nhận prop `canEdit?: boolean`, forward thẳng xuống `<CanvasGrid canEdit={canEdit} />`. KHÔNG forward xuống CanvasHeader/VisionEditor/SubmitBar → 3 components này chưa có gate. |
| [components/x-matrix/canvas/state/CanvasContext.tsx](components/x-matrix/canvas/state/CanvasContext.tsx) | 644 | `CanvasContextValue` chỉ chứa `state, dispatch, xMatrixId`. **KHÔNG có `canEdit` flag** → mọi component dùng prop drilling. Reducer KHÔNG check role — bất kỳ caller nào dispatch `ADD_HOSHIN/UPDATE_HOSHIN/SET_VISION/...` đều mutate state. Đây là risk: Member hovering UI → nếu rò keyboard event/dispatch direct → state mutation → save tới DB qua SubmitBar (dù SubmitBar hide). |
| [components/x-matrix/canvas/CanvasGrid.tsx](components/x-matrix/canvas/CanvasGrid.tsx) | 46 | Forward `canEdit` thẳng xuống `<CenterX canEdit={canEdit} />`. **KHÔNG forward xuống NorthEdge/SouthEdge/EastEdge/WestEdge** — 4 edge components không nhận canEdit. |
| [components/x-matrix/canvas/CenterX.tsx](components/x-matrix/canvas/CenterX.tsx) | 254 | Pattern proven: `editable = canEdit && !!xMatrixId && !correlationsLoading` (L50). Cell button `disabled={!editable}` (L205). Footer hint "Chỉ CEO+Manager edit được" cho `!canEdit` (L247-251) + EducationalTooltip extend cho `!canEdit` (L110-114). Đây là **pattern reference** cho phần còn lại. |
| [components/x-matrix/canvas/cards/HoshinCard.tsx](components/x-matrix/canvas/cards/HoshinCard.tsx) | 139 | KHÔNG nhận canEdit. Empty slot button `handleEmptyClick` dispatch `ADD_HOSHIN`. Filled card `handleFilledClick` mở `HoshinEditModal`. GembaModal trigger qua badge `💬 N` hoặc `+ 💬` (luôn render bất kể role). |
| [components/x-matrix/canvas/cards/YearGoalCard.tsx](components/x-matrix/canvas/cards/YearGoalCard.tsx) | 78 | KHÔNG nhận canEdit. Empty slot dispatch `ADD_YEAR_GOAL`. Filled card mở `YearGoalEditModal`. |
| [components/x-matrix/canvas/edges/NorthEdge.tsx](components/x-matrix/canvas/edges/NorthEdge.tsx) | 40 | Render `LIMITS.MAX_YEAR_GOALS` slots (3) — fill từ state hoặc null. Member nhìn empty slot → click trigger ADD. |
| [components/x-matrix/canvas/edges/SouthEdge.tsx](components/x-matrix/canvas/edges/SouthEdge.tsx) | 44 | Render `LIMITS.MAX_HOSHINS` slots (5). Tương tự NorthEdge. |
| [components/x-matrix/canvas/edges/EastEdge.tsx](components/x-matrix/canvas/edges/EastEdge.tsx) | 56 | **Render-only** (KPI list từ `state.data.hoshins.flatMap(h.kpis)`). KHÔNG có click handler edit → đã safe cho Member, không cần thay đổi. |
| [components/x-matrix/canvas/edges/WestEdge.tsx](components/x-matrix/canvas/edges/WestEdge.tsx) | 60 | **Render-only** (Owner aggregate từ `h.owner_name`). Đã safe cho Member. |
| [components/x-matrix/canvas/VisionEditor.tsx](components/x-matrix/canvas/VisionEditor.tsx) | 58 | Textarea local state + `handleBlur` dispatch `SET_VISION`. KHÔNG nhận canEdit. Member nhìn editable textarea → mismatch UX. |
| [components/x-matrix/canvas/CanvasHeader.tsx](components/x-matrix/canvas/CanvasHeader.tsx) | 207 | Save status indicator + AI Prefill button + Clear Draft button. KHÔNG nhận canEdit. AI Prefill ghi `SET_AI_PREFILL` (mutation). Clear Draft ghi `CLEAR_DRAFT`. Cả 2 phải hide cho Member. Save status indicator mục Member sẽ "Chưa có thay đổi" (idle) — confusing. |
| [components/x-matrix/canvas/SubmitBar.tsx](components/x-matrix/canvas/SubmitBar.tsx) | 179 | Sticky footer với completeness % + errors/warnings + nút "Lưu X-Matrix" → `postJson('/api/x-matrix/create')`. KHÔNG nhận canEdit. Member submit → API server-side đã có `requireOrgRole(WRITE_ROLES)` (assume — verify Task 2) reject 403, nhưng UX tệ vì Member click button trước rồi mới biết fail. Phải hide. |
| [components/x-matrix/canvas/state/useLocalStorageSync.ts](components/x-matrix/canvas/state/useLocalStorageSync.ts) | 80 | Auto-save debounce 500ms. `skipHydrate` = `!!initialData` (M-Hoshin-2 pattern). Effect 2 trigger save mỗi `data` change. **Risk Member**: nếu Member load canvas (initialData truthy → skipHydrate=true), `data` từ seed; Member không edit → data không change → KHÔNG save. OK trong điều kiện idle. NHƯNG nếu Member rò 1 dispatch (vd CenterX cell có disabled, nhưng VisionEditor blur dispatch `SET_VISION` chưa gate) → trigger save tới localStorage. localStorage scope per browser, KHÔNG tới DB → contamination thấp nhưng vẫn tránh. |
| [components/x-matrix/canvas/GembaModal.tsx](components/x-matrix/canvas/GembaModal.tsx) | 97 | Render form `<GembaCommentForm>` nếu `isPersisted && xMatrixId`. KHÔNG check role hiện tại. M-Hoshin-6 dựa vào page-level redirect Member → modal chỉ render cho CEO+Manager. Nếu mở Member access → modal sẽ render form cho Member submit gemba Hoshin. **Q3 quyết định scope**. |
| [app/dashboard/x-matrix/new/components/HoshinGembaSection.tsx](app/dashboard/x-matrix/new/components/HoshinGembaSection.tsx) | 62 | Server Component fetch summary + commentsMap. Prop `userRole: 'CEO' \| 'Manager'` hardcode union → cần extend `\| 'Member'`. Server fetch chạy bất kể role (RLS cho gemba_comments SELECT all org members). |
| [app/dashboard/x-matrix/new/components/HoshinGembaSectionClient.tsx](app/dashboard/x-matrix/new/components/HoshinGembaSectionClient.tsx) | 102 | `canModerate = role !== 'Member'` (đã có logic). GembaBanner render khi `total_open > 0 && canModerate` (Banner conditional). Member sẽ KHÔNG thấy banner — đã đúng. `useHoshinGembaComments` return `{comments, canModerate, xMatrixId, isPersisted}`. **Cần update**: type prop union mở rộng `Role` đã có `\| 'Member'`. Logic OK không cần đổi. |
| [components/layout/sidebar.tsx](components/layout/sidebar.tsx) | 219 | NAV_GROUPS hardcode `[{label, href, icon}]` — KHÔNG gate role. Member nhìn thấy "X-Matrix" link → click → `/dashboard/x-matrix` → redirect `/dashboard/x-matrix/new` → currently redirect `/dashboard` (loop kết thúc ở dashboard). **Sau khi mở canvas**: link work, Member access read-only. |
| [lib/auth/getActiveMembership.ts](lib/auth/getActiveMembership.ts) | 26 | Helper signature `Promise<{org_id, role} | null>`. role là `string` generic, KHÔNG narrow union. Pattern caller-side cast `role as 'CEO' \| 'Manager' \| 'Member'`. |

### 2.2 DB state (verified 2026-05-08 via Supabase SQL Editor)

| Query | Result | Observation |
|---|---|---|
| Q1 Total Member cross-orgs | **1** | Chỉ có member-test (M-Hoshin-5 setup), 0 user Member thực |
| Q2 Test account `member-test@ladysfit.local` | **active row** | user_id `d576fef4-9e77-42ff-b04c-0c366aa8eab0`, org_id Ladysfit `e4b953d9-ccdc-45a3-befe-a4cfa88baff1`, role Member |
| Q3 Cross-org Member distribution | **0 multi-org** | 1 user × 1 org → KHÔNG có edge case multi-org Member trong production |

**Implications**:
- Phase A smoke test với `member-test@ladysfit.local` đủ — KHÔNG cần seed thêm account
- M-Cleanup-6 helper `getActiveMembership` với Member role chưa có production data verify → defer test edge case khi có user Member thực (M-Cleanup-6 Phase 2 trigger)
- Pre-Task 2: Vũ Hải MUST verify sign-in test account (8 ngày kể từ M-Hoshin-5 setup, password có thể expire). Fail → reset password qua Supabase dashboard. Defer fallback Task 1.5 nếu không recover được.

### 2.3 Sidebar audit (current behavior 3 roles)

[components/layout/sidebar.tsx:29-50](components/layout/sidebar.tsx#L29-L50) NAV_GROUPS:

| Nav item | href | Role gate hiện tại | Member behavior post-M-Hoshin-6 |
|---|---|---|---|
| Discovery Hub | `/dashboard/discovery` | None — all roles | Render OK |
| Business X-Ray | `/x-ray` | None — public | Render OK |
| **X-Matrix** | `/dashboard/x-matrix` | None | **Click → redirect chain `/dashboard/x-matrix/new` → page.tsx L30 redirect `/dashboard`**. Loop visible cho user (URL flicker). |
| KPI Tracker | `/dashboard/kpi` | None — Member primary | Render OK (gemba write KPI) |
| Monthly Report | `/dashboard/report` | None | Render OK (read-only báo cáo) |
| Hướng dẫn | `/dashboard/help` | None | Render OK |
| Cài đặt | `/dashboard/settings` | None | Render OK (CEO-only mutation; Member view-only) |

**Verify finding**: Sidebar KHÔNG gate role nào hết — tất cả 7 nav links render giống hệt cho 3 roles. M-Member-POV-1 chỉ cần đảm bảo `/dashboard/x-matrix/new` không redirect Member → link X-Matrix work natural.

### 2.4 Read-only state design

Hiện tại `canEdit?: boolean` chỉ tồn tại như prop drilling từ page.tsx → XMatrixCanvasPage → CanvasGrid → CenterX. **KHÔNG nằm trong CanvasContext**.

**Q-design**: Thêm `canEdit` vào CanvasContext để mọi component reach qua hook `useCanvas()` thay vì prop drilling 4-5 layers (page → XMatrixCanvasPage → CanvasGrid → SouthEdge → HoshinCard → HoshinEditModal/GembaModal)?

**Rec**: ✅ thêm vào Context. Lý do: prop drilling 4-5 levels tới HoshinCard sẽ tạo thay đổi 6 files cùng 1 lý do (anti-pattern). Pattern §17 M-Hoshin-6 Q4 α+γ compose: Server fetch + Context wrap. Áp dụng cùng pattern: `CanvasProvider` thêm prop `canEdit?: boolean` (default true backward compat) → expose qua `useCanvas()` → mọi component consume qua hook.

**Reducer guard layer 2**: Reducer add early-return cho mutation actions khi caller passes `canEdit=false`. Vì reducer là pure function không reach Context → cần dispatch wrapper hoặc dùng pattern "thin reducer + thick caller". **Defer**: M-Member-POV-1 chỉ gate ở UI level (component không render trigger). Layer 2 reducer guard là defense-in-depth — defer M-Cleanup-7 nếu phát hiện security risk thật.

**localStorage concern**: storageKey `xmatrix-canvas-draft-${orgId}-${year}` shared cross-role per org per year. Member load canvas với DB matrix → skipHydrate=true → KHÔNG đọc draft. Member KHÔNG edit (Q2 α hide affordances) → KHÔNG ghi draft. OK không cần special-case Member trong useLocalStorageSync.

## 3. Decision Questions (8 Q&A)

### Q1 SCOPE — Phạm vi Member access canvas

- **α**: Full canvas read-only (Vision + YearGoals + Hoshins + Correlation + KPIs + Owners visible)
- β: Subset (Hoshins + KPIs only — match gemba focus, hide Vision/YearGoals/Correlation/Owners)
- γ: Hoshin individual page only (NOT canvas — separate route mới)

**Cursor recommend: α**

**Rationale**:
1. Akao bidirectional entry (M-AICoach-Sensei-1 §17): Member là gemba observer cần whole strategic chain để comment đúng context. Member nhìn Hoshin "Tăng tỷ lệ giữ chân lên 85%" cần thấy Year Goal "Top 3 thị phần Q7" + Vision "Phòng tập #1 phụ nữ Việt 2030" để gemba context comment.
2. β cắt Vision/YearGoals → mất context tại sao Hoshin tồn tại → comment Member sẽ shallow ("Hoshin này khó", "KPI vô lý") thay vì deep ("Hoshin tăng giữ chân conflict với Year Goal mở rộng — đề xuất quay sang focus Year Goal khác").
3. γ (separate route Hoshin individual) = scope creep, duplicate render logic 5 cards, mất correlation matrix visualize.
4. Cost α = 0 vì code render edges/center/header đã chạy cho CEO/Manager, chỉ cần gate edit affordances (Q2). Reuse > rebuild.

### Q2 EDIT AFFORDANCES — Hide vs disable vs error

- **α**: Hide hoàn toàn (button KHÔNG render cho Member)
- β: Disable + tooltip "Cần Manager+ để edit"
- γ: Render bình thường, click → toast error

**Cursor recommend: α** (với 1 ngoại lệ — xem rationale)

**Rationale**:
1. Pattern reference `CenterX.tsx:50,205,247-251` — `editable = canEdit && ...` gate `disabled` button + footer hint. Đây là precedent proven M-Hoshin-2.
2. β disable (giữ render) tạo confusion: Member nhìn 5 empty slot Hoshin "+ Hoshin #N" disabled → "tại sao có button mà không click được?". Empty slot card chỉ làm nhiệm vụ "trigger ADD" → vô nghĩa cho Member → hide.
3. γ render+toast = aggressive (Member click rồi mới biết fail) — anti-pattern UX.
4. **Ngoại lệ**: CenterX correlation matrix MUST giữ `disabled={!editable}` pattern hiện tại (KHÔNG hide cells) vì cells là **read affordance** (Member xem ●◐○-) chứ không phải mutation entry. Match Q5 β (display only).

**Affordances cần hide cho `!canEdit`**:
- VisionEditor textarea → render `<p>` paragraph thay
- YearGoalCard empty slot → render `<div>` placeholder italic "Chưa có mục tiêu năm" (NOT button)
- YearGoalCard filled → KHÔNG mở YearGoalEditModal khi click; render `<div>` non-clickable
- HoshinCard empty slot → render `<div>` italic "Chưa có Hoshin" (NOT button + slot count vẫn visible)
- HoshinCard filled → click MỞ HoshinEditModal **read-only mode** (Q-followup: HoshinEditModal có support read-only mode chưa? **Verify Task 2** — nếu không, gate click handler ở HoshinCard → render `<div>` non-clickable)
- CanvasHeader: hide "AI gợi ý từ Discovery" button + "Xóa nháp" button + save status indicator
- SubmitBar: Q4 quyết định riêng

### Q3 GEMBA FORM ACCESS — Member submit gemba Hoshin

- **α**: Bật Member submit gemba Hoshin (extend M-Hoshin-5 KPI-only writer pattern → Hoshin scope)
- β: Defer (giữ M-Hoshin-6 Q3 γ KPI-only Member writer, Hoshin chỉ thread đọc)
- γ: Read-only thread (Member xem comment khác nhưng KHÔNG submit Hoshin)

**Cursor recommend: α**

**Rationale**:
1. Code comments [HoshinGembaSectionClient.tsx:23](app/dashboard/x-matrix/new/components/HoshinGembaSectionClient.tsx#L23) + [page.tsx:29](app/dashboard/x-matrix/new/page.tsx#L29) explicit ghi "future M-Hoshin-7 nới Member writer Hoshin sẽ revisit gate này" — M-Member-POV-1 chính là milestone đó. Defer thêm = milestone reservation purpose lost.
2. Akao gemba bottom-up: Member observe → comment trên BOTH KPI (operational) VÀ Hoshin (strategic). β/γ giới hạn Member vào KPI scope là half-measure, anti-philosophy. Member thấy "Hoshin tăng giữ chân khó vì khách phàn nàn check-in lag" — đây là signal strategic CEO cần biết, KHÔNG phải KPI signal.
3. đúng spec M-Hoshin-5 Q8 (INSERT-only Member, CEO+Manager moderate delete) — chỉ extend `target_type` từ `'kpi'` sang `'hoshin'`. RLS policy `gemba_comments_insert` đã ALL_ROLES (`requireOrgRole` server side). API route `/api/gemba/create` đã handle target_type='hoshin' từ M-Hoshin-5 — 0 backend change.
4. Cost α: 1 file change [GembaModal.tsx](components/x-matrix/canvas/GembaModal.tsx) — KHÔNG gate `<GembaCommentForm>` theo `canModerate`. Hiện tại component không gate role direct, chỉ gate `isPersisted` + `xMatrixId`. → Form mặc định render cho mọi role nếu hoshin persisted → α = no-op trong GembaModal.
5. **canModerate distinct với canSubmit**: `canModerate` (CEO+Manager) gate buttons "Acknowledge"/"Resolve"/"Delete" trong `<GembaCommentThread>`. `canSubmit` (ALL_ROLES) gate `<GembaCommentForm>`. Hiện component đã separate đúng — Member sẽ submit form OK, KHÔNG thấy moderate buttons. **Verify Task 2**: confirm GembaCommentThread đã gate buttons theo `canModerate` prop.
6. Risk: Banner "X góp ý chưa xử lý" hide cho Member vì `canModerate=false` (HoshinGembaSectionClient L72). Đúng UX — Member submit thì đọc thread feedback, KHÔNG cần banner aggregate.

**Lock constraint**: KHÔNG override M-Hoshin-5 Q8 INSERT-only Member, CEO+Manager moderate delete. Member submit → KHÔNG edit/delete own comment.

### Q4 SUBMIT BAR + AUTO-SAVE

- **α**: Hide hoàn toàn cho Member (no Submit, no validation panel, no completeness %)
- β: Show với button disabled + label "Chế độ xem"
- γ: Replace bằng banner "Bạn đang xem ở chế độ read-only — chỉ CEO+Manager edit được"

**Cursor recommend: α**

**Rationale**:
1. Đồng bộ Q2 α (hide affordances) — Member không edit → completeness % vô nghĩa, errors/warnings vô nghĩa.
2. β disabled button "Chế độ xem" tạo footprint visual + Member click sẽ frustrating.
3. γ banner replace tốn vertical space (sticky bottom). Nếu cần explain → nhét vào CanvasHeader nhỏ thay vì SubmitBar.
4. Cost α: 1 dòng `if (!canEdit) return null` đầu component SubmitBar.
5. **Side-effect localStorage**: SubmitBar gọi `postJson('/api/x-matrix/create')` trên submit → API server-side reject Member 403 (verified §6 require WRITE_ROLES). Hide UI = defense-in-depth (defense layer 1) — server reject = layer 2.

**Note CanvasHeader concomitant**: Save status indicator + AI Prefill + Clear Draft → Q2 đã quyết hide (đồng bộ).

### Q5 CORRELATION MATRIX INTERACTION

- α: Member click cell xem tooltip strength (●=mạnh, ◐=vừa, ○=yếu, -=chưa review)
- **β**: Display only (NO click handler — pure visual)
- γ: Member click → AI coach popover read-only (extend M-Hoshin-2 sensei questions)

**Cursor recommend: β**

**Rationale**:
1. Hiện tại CenterX header đã có EducationalTooltip explain ●◐○- meanings ([CenterX.tsx:96-117](components/x-matrix/canvas/CenterX.tsx#L96-L117)). Per-cell tooltip = noise.
2. α adding per-cell tooltip = extra UX surface + cần test mobile (touch tooltip pattern khác hover desktop).
3. γ = scope creep. AI coach route `/api/xmatrix/coach-correlation` cần rate-limit Member separate (bucket `coach:member`). Cost ≥2 commits. Out of scope M-Member-POV-1.
4. Pattern hiện tại CenterX: `disabled={!editable}` + opacity-90 + cursor-default. Member nhìn cell với symbol + cursor không pointer → đủ signal "read-only".

### Q6 ROUTE GATE STRATEGY

- **α**: Remove `redirect('/dashboard')` cho Member trong page.tsx — page render canvas + canEdit flag handle restriction
- β: Move gate xuống canvas component level (page render tất cả, canvas check role)
- γ: Keep redirect, thêm explicit allowlist param `?view=readonly`

**Cursor recommend: α**

**Rationale**:
1. `canEdit` flag đã derived L34 page.tsx (`canEdit = role==='CEO'||'Manager'`). Chỉ cần xóa 3 dòng L30-32 redirect → Member tới canvas với `canEdit=false`.
2. β redundant — Context provider đã ở component level. Move gate xuống nghĩa là duplicate logic role check ở 2 nơi (page + canvas).
3. γ allowlist param confusing — ai set `?view=readonly`? Member URL natural KHÔNG có param. Thêm param = mental overhead.
4. Page.tsx vẫn giữ redirect cho **`!user`** + **`!memberships`** — chỉ remove Member-specific gate.
5. `userRole: 'CEO' | 'Manager'` cast L66 page.tsx phải extend `| 'Member'`. HoshinGembaSection prop type extend.

### Q7 SIDEBAR NAV LINK

- **α**: Show "X-Matrix" link cho mọi role (Member nhìn thấy + access read-only)
- β: Show "X-Matrix (Xem)" cho Member với label phân biệt
- γ: Hide link cho Member (Member chỉ access qua direct URL hoặc share link `/x/[slug]`)

**Cursor recommend: α**

**Rationale**:
1. Sidebar audit (§2.3) confirm KHÔNG gate role nào — pattern proven cho 7 nav links khác. Thêm role-gate cho 1 link = inconsistency.
2. β label "(Xem)" noise + cần truyền `userRole` prop xuống NavItem render conditional. Cost: pollute Sidebar API.
3. γ hide link = "Member feature gated" mental model — anti gemba philosophy. Member access KPI Tracker write OK, X-Matrix read OK → equality, không cần distinguish.
4. Member tự hiểu role giới hạn từ context khác (KHÔNG edit kpi_entries của người khác, settings view-only). X-Matrix read-only natural.
5. Cost α = **0 commits** trong sidebar — không touch file.

### Q8 EFFORT ESTIMATE

| Mục | Estimate |
|---|---|
| Số commits dự kiến | **5 commits** (Task 1 plan + Task 2 verify SQL + Task 3 page+context+grid+edges + Task 4 cards+modals+gemba + Task 5 header+vision+submit+sidebar+smoke) |
| Files touched | **9 files code + 1 plan + 1 SMOKE_TEST update** = 11 files |
| Smoke test cases | **7 cases** (xem §4) |
| Cost time | **3-4h** code + 30 min smoke = **4h total** |
| Risk level | **MEDIUM** |

**Risk MEDIUM lý do**:
1. Q3 α execute M-Hoshin-6 Q3 γ defer plan (code comments explicit reservation) → cần verify smoke test Member submit gemba Hoshin work end-to-end.
2. canEdit propagation 9 components → 1 component miss gate = silent edit affordance leak. Mitigation: Audit checklist sau Task 4 grep `dispatch({type:` toàn canvas → verify mỗi caller đều ở component nhận canEdit.
3. Reducer KHÔNG có guard (xem §2.4) → defense-in-depth thấp. Mitigation: defer reducer guard layer 2; M-Member-POV-1 chỉ UI-level. Document constraint trong §17.
4. localStorage shared key — verified KHÔNG contamination cho idle Member nhưng nếu rò 1 dispatch (vd VisionEditor blur empty draft → SET_VISION '') → trigger save. Mitigation: Q2 hide VisionEditor textarea hoàn toàn.

**LOW** sub-risks (KHÔNG bump tier):
- API server-side đã có `requireOrgRole(WRITE_ROLES)` cho `/api/x-matrix/create` (verify Task 2) → defense layer 2 vẫn chặn Member submit dù UI bypass.
- Sidebar KHÔNG cần touch.
- 4 edge components (NorthEdge/SouthEdge/EastEdge/WestEdge): East/West đã render-only, chỉ North/South cần update (pass canEdit qua YearGoalCard/HoshinCard).

**Files touched detail**:
1. [app/dashboard/x-matrix/new/page.tsx](app/dashboard/x-matrix/new/page.tsx) — remove L30-32 redirect, extend `userRole` cast `| 'Member'`
2. [components/x-matrix/canvas/state/CanvasContext.tsx](components/x-matrix/canvas/state/CanvasContext.tsx) — add `canEdit` to ContextValue + Provider prop
3. [components/x-matrix/canvas/XMatrixCanvasPage.tsx](components/x-matrix/canvas/XMatrixCanvasPage.tsx) — pass `canEdit` xuống CanvasProvider thay vì CanvasGrid
4. [components/x-matrix/canvas/CanvasGrid.tsx](components/x-matrix/canvas/CanvasGrid.tsx) — bỏ canEdit prop drilling (consume qua Context ở children)
5. [components/x-matrix/canvas/CenterX.tsx](components/x-matrix/canvas/CenterX.tsx) — consume canEdit qua `useCanvas()` thay vì prop (refactor consistency)
6. [components/x-matrix/canvas/cards/YearGoalCard.tsx](components/x-matrix/canvas/cards/YearGoalCard.tsx) — gate empty slot button + filled card click
7. [components/x-matrix/canvas/cards/HoshinCard.tsx](components/x-matrix/canvas/cards/HoshinCard.tsx) — gate empty slot button + filled card click (giữ GembaModal trigger luôn render — Q3 α Member submit)
8. [components/x-matrix/canvas/VisionEditor.tsx](components/x-matrix/canvas/VisionEditor.tsx) — render `<p>` paragraph cho `!canEdit`
9. [components/x-matrix/canvas/CanvasHeader.tsx](components/x-matrix/canvas/CanvasHeader.tsx) — hide AI Prefill + Clear Draft + save status cho `!canEdit`
10. [components/x-matrix/canvas/SubmitBar.tsx](components/x-matrix/canvas/SubmitBar.tsx) — early return `null` cho `!canEdit`
11. [app/dashboard/x-matrix/new/components/HoshinGembaSection.tsx](app/dashboard/x-matrix/new/components/HoshinGembaSection.tsx) — extend `userRole: 'CEO' | 'Manager' | 'Member'`
12. [app/dashboard/x-matrix/new/components/HoshinGembaSectionClient.tsx](app/dashboard/x-matrix/new/components/HoshinGembaSectionClient.tsx) — type prop `Role` already includes Member; verify logic OK

(11 files KHÔNG kể plan + smoke test docs.)

## 4. Smoke Test Plan (8 cases — 7 functional + 1 defense)

**Setup precondition**:
- Member test account `member-test@ladysfit.local` (M-Hoshin-5 setup) còn active (Vũ Hải verify §2.2 Q2)
- Org Ladysfit `e4b953d9-ccdc-45a3-befe-a4cfa88baff1` có active x_matrix với ≥1 Hoshin persisted (cho gemba scope)
- CEO test account đã có sẵn

**CASE 1 — Member access canvas read-only**
- **Step**: Member login → click sidebar "X-Matrix" → URL `/dashboard/x-matrix/new`
- **Expect**: Render canvas đầy đủ (Vision text, 3 YearGoal cards, 5 Hoshin slots, correlation matrix, Owners, KPIs). KHÔNG redirect `/dashboard`. URL stay `/dashboard/x-matrix/new`.

**CASE 2 — Member KHÔNG thấy edit affordances**
- **Step**: Member trên canvas, scan UI
- **Expect**: KHÔNG có textarea Vision (chỉ paragraph). KHÔNG có empty slot button "+ Mục tiêu năm #N" / "+ Hoshin #N" (render placeholder italic). KHÔNG có "AI gợi ý" button + "Xóa nháp" button + save status indicator trong Header. KHÔNG có SubmitBar ở footer.

**CASE 3 — Member click HoshinCard → KHÔNG mở edit modal**
- **Step**: Member click filled HoshinCard
- **Expect**: HoshinEditModal KHÔNG mở. Card hover state work (visual feedback OK) nhưng click no-op. **Hoặc** modal mở read-only mode (depend Q2 followup verify Task 2 — ưu tiên no-op cho simplicity).

**CASE 4 — Member click correlation cell → no-op**
- **Step**: Member click cell trong matrix center
- **Expect**: Cell button `disabled` (cursor không pointer). Click no-op. Footer hint "Chỉ CEO và Manager edit được correlation matrix" visible.

**CASE 5 — Member submit gemba Hoshin → 200 OK**
- **Step**: Member click 💬 badge (hoặc + 💬) trên HoshinCard → GembaModal mở → nhập 50+ chars → click submit
- **Expect**: POST `/api/gemba/create` 200 OK. Comment hiện trong thread. KHÔNG có acknowledge/resolve buttons trong Member view (canModerate=false).

**CASE 6 — Member submit gemba KPI → still works (M-Hoshin-5 regression)**
- **Step**: Member ở `/dashboard/kpi` → click 💬 trên KpiCard → submit comment
- **Expect**: POST `/api/gemba/create` 200 OK. M-Hoshin-5 baseline preserved. Banner GembaBanner hide cho Member (canModerate=false).

**CASE 7 — CEO/Manager flow KHÔNG regression**
- **Step**: CEO login → `/dashboard/x-matrix/new`
- **Expect**: Tất cả edit affordances render bình thường (textarea, button, slots, header buttons, SubmitBar). Click HoshinCard → modal mở. Click correlation cell → cycle ●◐○-. Save matrix → 200 OK. AI Prefill button render khi blank canvas. M-Hoshin-2 + M-Hoshin-6 + M-Hoshin-6.1 regression preserved.

8. **DOM manipulation defense test** — Member mở DevTools → remove `disabled` attribute trên Submit button → click Save → verify API trả 403 (server `requireOrgRole(WRITE_ROLES)` defense layer 2). 5 phút test, catch edge case audit log future.

**Defer Phase B Playwright**: Smoke test pattern manual đầu tiên (Phase A) — Playwright cần extend cho 3 roles login flow, cost ≥1h. Defer Phase B nếu Phase A pass 8/8.

## 5. Constraints Locked

### Carry-over từ HANDOFF §17

- **M-AICoach-Sensei-1 (Akao Method)**: Strategic Memory filter theo framework (Bug 3 fix c8df2bf). KHÔNG impact M-Member-POV-1 trực tiếp nhưng confirm Akao bidirectional principle is canonical.
- **M-AICoach-ShortInput-1**: Short-input fallback rule (Rule 9 SW + Rule 10 OT). KHÔNG impact.
- **M-Hoshin-5 Q8**: gemba_comments INSERT-only Member, CEO+Manager moderate delete. **LOCK preserve** trong M-Member-POV-1 — Q3 α chỉ extend target_type, KHÔNG đổi update/delete policy.
- **M-Hoshin-6 Q-canvas**: redirect Member /dashboard. **OVERRIDE** ở M-Member-POV-1 Q6 α — code comments [HoshinGembaSectionClient.tsx:23](app/dashboard/x-matrix/new/components/HoshinGembaSectionClient.tsx#L23) explicit cho phép "future M-Hoshin-7 nới Member writer revisit". M-Member-POV-1 = milestone đó.
- **M-Hoshin-6 Q3 γ**: Member writer Hoshin defer. **OVERRIDE** ở M-Member-POV-1 Q3 α — cùng lý do code comments reservation.
- **M-Hoshin-6.1 hotfix**: GembaModal gate `!isPersisted` cho draft Hoshin. **PRESERVE** trong M-Member-POV-1 — Member submit gemba qua cùng GembaModal, gate `isPersisted` work cross-role.
- **M-Cleanup-6 Phase 1**: `getActiveMembership` helper. **APPLY** trong page.tsx update — hiện page.tsx đang dùng inline pattern `find(lastOrgId) ?? memberships[0]`. Refactor sang helper trong cùng commit Task 3 (consistency với 7 API routes đã refactor).
- **M-OrgInvite-1**: multi-org `.maybeSingle()` + array pattern. **APPLY** — page.tsx đã dùng `order().limit().maybeSingle()` cho `x_matrices` query L41 — verify Task 2.
- **M-Hoshin-2 X-Matrix**: CanvasData byte-identical với API contract. **PRESERVE** — M-Member-POV-1 KHÔNG đụng schema/API.

### Constraints mới generate từ Q1-Q8 decisions

- **C1 (Q1 α)**: Member access whole canvas (Vision + YearGoals + Hoshins + Correlation + Owners + KPIs). KHÔNG hide section nào theo role.
- **C2 (Q2 α)**: Member KHÔNG thấy edit affordances (button add/edit, textarea editable, AI Prefill, Clear Draft, save status, SubmitBar). Empty slots render placeholder italic non-clickable.
- **C3 (Q3 α)**: Member CÓ THỂ submit gemba Hoshin qua GembaCommentForm. KHÔNG thấy moderate buttons (acknowledge/resolve/delete) — tách `canSubmit` (ALL_ROLES) vs `canModerate` (WRITE_ROLES).
- **C4 (Q4 α)**: SubmitBar hide hoàn toàn cho Member. localStorage auto-save: idle data state nên KHÔNG trigger save — preserved naturally vì Q2 hide VisionEditor textarea.
- **C5 (Q5 β)**: Correlation matrix display only cho Member. KHÔNG thêm per-cell tooltip. Footer hint hiện tại đủ explain.
- **C6 (Q6 α)**: Page.tsx remove redirect L30-32. canEdit derived role-based, propagate qua CanvasContext (refactor prop drilling).
- **C7 (Q7 α)**: Sidebar KHÔNG touch. Link X-Matrix render cho mọi role không có label distinction.
- **C8**: KHÔNG thay đổi reducer guard layer 2 — UI-level gate sufficient cho M-Member-POV-1. Defense-in-depth defer M-Cleanup-7 nếu phát hiện security risk thật.
- **C9**: KHÔNG persist canEdit trong localStorage hoặc URL param — luôn derive runtime từ membership.role server-side. Tránh attacker spoof via param/storage.
- **C10**: HoshinEditModal KHÔNG support read-only mode hiện tại (verify Task 2). Member click filled HoshinCard → no-op (handler gate). Defer "view details modal" feature M-Member-POV-2 nếu Member request.
- **C11**: API `/api/x-matrix/create` server-side reject Member 403 vẫn là defense layer 2. KHÔNG remove gate.
- **C12 (API defense layer 2 preserved)**: POST `/api/gemba/create` đã có `requireOrgRole(ALL_ROLES)` + rate-limit 20/5min/user (M-Hoshin-5 commit). Member spam protection NOT new logic — KHÔNG cần thêm rate-limit override cho M-Member-POV-1.

## 6. Pattern Lessons Reused

- **L7 (Schema verification before SELECT)**: §2.2 đề xuất 3 SQL queries cho Vũ Hải chạy trước khi commit Task 2 — pre-fill member count + test account status + cross-org distribution. Tránh hit schema unknown lỗi.
- **L19 (Audit imports trước destructive delete)**: M-Member-POV-1 KHÔNG delete files. KHÔNG apply.
- **L25 (Verify-first phát hiện scope=0)**: Verify §2.1 phát hiện EastEdge + WestEdge đã render-only → 0 work. NorthEdge cần update min (chỉ pass canEdit qua YearGoalCard). SouthEdge tương tự HoshinCard. Confirm Q8 estimate 11 files — tránh prompt 14 files.
- **L29 (Plan claim ≠ reality)**: Verify §2.4 phát hiện `canEdit` chỉ tới CenterX (NOT trong Context). Plan reality khác plan giả định nếu chưa verify. Document Q-design Context refactor in §2.4.
- **L30 (Race condition snapshot)**: M-Member-POV-1 KHÔNG có async state read race. KHÔNG apply.
- **L26 (Streaming ≠ luôn tốt)**: KHÔNG apply.
- **L8 (Verify HANDOFF assumption với DB trước destructive)**: M-Member-POV-1 KHÔNG destructive. KHÔNG apply.
- **Pattern §17 M-Hoshin-6 Q4 α+γ compose**: Server fetch + Context wrap. Reused trong M-Member-POV-1 — Context propagate canEdit thay vì prop drilling 4-5 levels.

## 7. Open Questions — RESOLVED 2026-05-08

| Q | Answer | Reference |
|---|---|---|
| Q3 α confirm? | ✅ Confirm α (execute M-Hoshin-6 Q3 γ defer plan) | §3 Q3 |
| canEdit vào Context? | ✅ Context (pattern §17 M-Hoshin-6 Q4 compose proven 3 lần) | §2.4 |
| HoshinEditModal read-only? | ✅ Defer M-Member-POV-2 (Q2 α contradicts, no signal) | §3 Q2 |
| Phase B Playwright defer? | ✅ Defer if Phase A pass 7/7 (no CI pipeline → no recurring value) | §4 |
| Chạy SQL trước commit? | ✅ Done 2026-05-08, output filled §2.2 | §2.2 |

## 8. Approval Gate — APPROVED 2026-05-08

- [x] Vũ Hải review + confirm 8 decisions Q1-Q8
- [x] Vũ Hải chạy 3 SQL §2.2 → output filled
- [x] Em apply 2 push-back (C12 API defense layer 2, CASE 8 DOM manipulation)
- [ ] Em commit Task 1 deliverable (this commit)
- [ ] Pre-Task 2: Vũ Hải verify sign-in `member-test@ladysfit.local` work
