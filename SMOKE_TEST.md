# SMOKE_TEST.md — Hoshin Kanri OS

> **Quan trọng:** Khi user nói "smoke test", Claude đọc file này và thực hiện
> TẤT CẢ các bước theo đúng thứ tự. KHÔNG bỏ bước. KHÔNG hỏi xác nhận giữa chừng.
> Chỉ báo cáo kết quả cuối cùng theo format ở Phase 7.

---

## 🎯 Project Info

- **Tên:** Hoshin Kanri OS
- **Owner:** Vũ Hải
- **Stack:** Next.js (App Router) + TypeScript + Supabase Auth + Vercel
- **Auth:** Supabase email/password
- **Dev URL:** http://localhost:3000
- **Project root:** `C:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os`
- **Package manager:** npm (có `package-lock.json`)
- **Supabase project ref:** `cnbsrlhhgrfbdhisizgg`

---

## 🔐 Test Credentials

Trong `.env.local`:

```env
TEST_USER_EMAIL=smoketest@hoshinkanri.local
TEST_USER_PASSWORD=SmokeTest_2026!
```

User đã tồn tại trong Supabase Auth (auto-confirmed).

---

## ⚠️ KNOWN ISSUES — Đọc trước khi chạy

### Issue 1: Path Unicode tiếng Việt + cmd shell escape lỗi

**Vấn đề:** Path `Hoshin Kanri by Vũ Hải` (có dấu Vũ Hải + space) gây cmd shell escape sai khi truyền qua MCP. Lệnh `cd "..."` thường fail với "syntax error" hoặc "file not found".

**Workaround chuẩn:** Tạo junction từ ASCII path tới project gốc:

```cmd
:: Tìm short name 8.3 (giúp xác định path không có dấu)
dir /X "C:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải" | findstr "HOSHIN"

:: Tạo junction
mklink /J C:\hoshin-test "C:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os"

:: Verify
dir C:\hoshin-test
```

→ Sau đó dùng `C:\hoshin-test` cho mọi lệnh shell. Cleanup ở Phase 6 bằng `rmdir C:\hoshin-test` (chỉ xoá junction, không ảnh hưởng project gốc).

### Issue 2: Playwright screenshot path bug

**Vấn đề:** `browser_take_screenshot(filename="x.png")` resolve về `C:\Windows\System32\` → EPERM.

**Quy tắc:** LUÔN gọi `browser_take_screenshot()` KHÔNG truyền filename → tự lưu vào `C:\Users\ASUS\.playwright-mcp\` với timestamp.

### Issue 3: Playwright browser context occasionally closed

**Vấn đề:** Browser context có thể đóng giữa 2 tool call.

**Workaround:** Khi gặp "context closed", chỉ cần `browser_navigate` lại URL hiện tại để mở lại — không phải fail.

### Issue 4: Onboarding flow lock user without org — RESOLVED 2026-04-30

**Status:** RESOLVED. Test user `smoketest@hoshinkanri.local` đã có org sẵn, không bị onboarding redirect. Giữ note dưới đây như historical reference cho user mới onboard:

> Sau login lần đầu, user mới bị redirect về `/onboarding/setup-org` và **không có UI logout**. Logout cho test phải dùng JS API call:
>
> ```js
> // Trong Playwright browser_evaluate
> window.localStorage.clear();
> document.cookie.split(';').forEach(c => {
>   document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
> });
> ```

### Issue 5: DC shell parse path có space + Unicode (M-Hoshin-7 smoke test 2026-04-30)

**Triệu chứng:** `xcopy "C:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\..."` fail vì Desktop Commander shell parse quote sai khi path có space + Unicode.

**Workaround 1 — short name 8.3 trong DC shell:**

```cmd
xcopy C:\Users\ASUS\Desktop\HOSHIN~1\hoshin-kanri-os\test-output\ ...
```

**Workaround 2 — PowerShell `Copy-Item` qua Desktop Commander start_process:**

```powershell
Copy-Item -Path "C:\Users\ASUS\.playwright-mcp\page-*.png" -Destination "C:\Users\ASUS\Desktop\HOSHIN~1\hoshin-kanri-os\test-output\latest\"
```

---

## 🛡️ SECURITY RULES (BẮT BUỘC)

1. **KHÔNG log nội dung `.env.local`** — kể cả excerpt. Chỉ verify field exists, không show value.
2. **KHÔNG đọc full file `.env.local`** bằng `read_file`. Dùng `findstr` / `grep` để check field tồn tại:
   ```cmd
   findstr /C:"TEST_USER_EMAIL" .env.local
   findstr /C:"TEST_USER_PASSWORD" .env.local
   findstr /C:"NEXT_PUBLIC_SUPABASE_URL" .env.local
   ```
3. **KHÔNG paste API keys, tokens, passwords** vào báo cáo.
4. Nếu phát hiện secret bị exposed → báo cảnh báo ngay đầu báo cáo, ưu tiên cao nhất.

---

## 🔬 Phase 1 — Pre-flight check (Desktop Commander)

### 1.1-1.3 — Junction, project files, port

```cmd
:: 1.1 — Tạo junction để bypass Unicode (xem Issue 1)
mklink /J C:\hoshin-test "C:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os"

:: 1.2 — Verify project files
dir C:\hoshin-test\package.json C:\hoshin-test\next.config.* C:\hoshin-test\.env.local

:: 1.3 — Port 3000 status
netstat -ano | findstr ":3000 "
```

### 1.4 — Verify credentials trong `.env.local`

#### 🛑 HARD RULE — SECURITY CRITICAL (M-Hoshin-7 L11)

**TUYỆT ĐỐI cấm đọc full file `.env.local` bằng bất kỳ tool nào:**

❌ FORBIDDEN:
- `cmd /c type .env.local`
- `Get-Content .env.local`
- `cat .env.local`
- `desktop_commander:read_file` trên `.env.local`
- Bất kỳ method nào làm value của secrets render vào AI context window

✅ ONLY ALLOWED PATTERNS:

PowerShell (recommend):

```powershell
$found = Select-String -Path .env.local -Pattern "^KEY_NAME=" -Quiet
if ($found) { Write-Host "OK $key exists" } else { Write-Host "MISSING $key" }
```

CMD (fallback):

```cmd
findstr /B "KEY_NAME=" .env.local >nul && echo FOUND || echo MISSING
```

**NẾU `findstr` / `Select-String` báo MISSING:**
- KHÔNG fallback sang `type` / `cat` / `Get-Content` để debug
- Kiểm tra file encoding bằng: `(Get-Item .env.local).Length` + `[System.IO.File]::ReadAllBytes(".env.local")[0..2]` để check BOM
- Báo cáo MISSING + dừng Phase 1, escalate cho user

**NẾU vi phạm rule này (đọc full file):**
1. Báo cáo NGAY ở đầu output Phase 7 với ⚠️ flag SECURITY VIOLATION
2. Liệt kê tên field bị lộ (KHÔNG paste value)
3. Recommend rotate ngay tất cả secrets
4. Halt smoke test cho đến khi user xác nhận đã rotate

#### Verification commands

Chạy qua Desktop Commander `start_process` với `powershell.exe`:

```powershell
$keys = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "RESEND_API_KEY",
  "TAVILY_API_KEY",
  "TEST_USER_EMAIL",
  "TEST_USER_PASSWORD"
)
foreach ($key in $keys) {
  $found = Select-String -Path C:\hoshin-test\.env.local -Pattern "^$key=" -Quiet
  if ($found) { Write-Host "OK   $key" } else { Write-Host "MISS $key" }
}
```

CMD fallback (per-key, anchor `^KEY=`):

```cmd
findstr /B /R /C:"^NEXT_PUBLIC_SUPABASE_URL=" C:\hoshin-test\.env.local >nul && echo OK NEXT_PUBLIC_SUPABASE_URL || echo MISS NEXT_PUBLIC_SUPABASE_URL
findstr /B /R /C:"^NEXT_PUBLIC_SUPABASE_ANON_KEY=" C:\hoshin-test\.env.local >nul && echo OK NEXT_PUBLIC_SUPABASE_ANON_KEY || echo MISS NEXT_PUBLIC_SUPABASE_ANON_KEY
findstr /B /R /C:"^SUPABASE_SERVICE_ROLE_KEY=" C:\hoshin-test\.env.local >nul && echo OK SUPABASE_SERVICE_ROLE_KEY || echo MISS SUPABASE_SERVICE_ROLE_KEY
findstr /B /R /C:"^ANTHROPIC_API_KEY=" C:\hoshin-test\.env.local >nul && echo OK ANTHROPIC_API_KEY || echo MISS ANTHROPIC_API_KEY
findstr /B /R /C:"^RESEND_API_KEY=" C:\hoshin-test\.env.local >nul && echo OK RESEND_API_KEY || echo MISS RESEND_API_KEY
findstr /B /R /C:"^TAVILY_API_KEY=" C:\hoshin-test\.env.local >nul && echo OK TAVILY_API_KEY || echo MISS TAVILY_API_KEY
findstr /B /R /C:"^TEST_USER_EMAIL=" C:\hoshin-test\.env.local >nul && echo OK TEST_USER_EMAIL || echo MISS TEST_USER_EMAIL
findstr /B /R /C:"^TEST_USER_PASSWORD=" C:\hoshin-test\.env.local >nul && echo OK TEST_USER_PASSWORD || echo MISS TEST_USER_PASSWORD
```

**Hành động:**
- Junction fail → STOP, báo lỗi
- Port 3000 busy → kill process cũ
- Thiếu file/credentials → STOP

---

## 🔬 Phase 2 — Static checks (Desktop Commander)

```cmd
:: Đảm bảo working dir là junction
cd /d C:\hoshin-test

:: 2.1 — Skip npm ci nếu node_modules đã có (check trước)
:: 2.2 — Typecheck
npm run typecheck

:: 2.3 — Lint
npm run lint

:: 2.4 — Build production
npm run build
```

**Pass criteria:**
- Typecheck: 0 error
- Lint: 0 error (warning OK)
- Build: 0 error

→ Nếu lint fail nhưng build pass → ghi nhận FAILURE nhưng vẫn chạy tiếp Phase 3-6.

---

## 🔬 Phase 3 — Runtime check (Desktop Commander)

```cmd
cd /d C:\hoshin-test

:: 3.1 — Start dev server background, lưu PID
:: Dùng start_process của Desktop Commander, KHÔNG dùng start /B (block tool call)
:: → Tool call: start_process với command "npm run dev"
:: → Lưu lại PID từ output

:: 3.2 — Đợi server ready (10-15s)
timeout /t 10 /nobreak

:: 3.3 — Health check homepage (KHÔNG check /api/health vì project chưa implement)
curl -I http://localhost:3000
```

**Pass criteria:** HTTP 200 cho `/` trong 30s.

⚠️ **Note:** `/api/health` chưa được implement trong project — bỏ check này, chỉ check `/`.

---

## 🔬 Phase 4 — UI smoke test (Playwright MCP)

### ⚠️ Rules cho Phase 4
1. **Screenshot:** LUÔN `browser_take_screenshot()` không filename
2. **Verify:** Combine URL + title + snapshot text, không chỉ screenshot
3. **Browser context closed:** Re-navigate để mở lại
4. **Logout:** Dùng JS API call (xem Issue 4)

### Flow A — Public landing page
- [ ] `browser_navigate("http://localhost:3000")`
- [ ] `browser_snapshot()` → verify H1 hiển thị, không error
- [ ] `browser_take_screenshot()`

### Flow B — Supabase Auth flow
- [ ] Click button "Đăng nhập"
- [ ] Verify URL → `/login` hoặc `/sign-in`
- [ ] Fill email = TEST_USER_EMAIL
- [ ] Fill password = TEST_USER_PASSWORD
- [ ] Click submit
- [ ] Verify redirect khỏi `/login` trong 5s
- [ ] Verify cookie `sb-cnbsrlhhgrfbdhisizgg-auth-token` được set
- [ ] `browser_take_screenshot()`

### Flow C — Core feature *(điền sau)*

> Placeholder. Khi điền, prefix test data bằng `TEST_SMOKE_`.

### Flow D — Logout (qua JS, do onboarding lock)
- [ ] `browser_evaluate` để clear cookie + localStorage (xem Issue 4)
- [ ] `browser_navigate` lại `/dashboard` hoặc protected route
- [ ] Verify bị redirect về `/login`
- [ ] `browser_take_screenshot()`

### Cleanup browser
- [ ] `browser_close()`

---

## 🔬 Phase 5 — Database verification (Supabase MCP, read-only)

### 5.1 — Test user có session active
```sql
SELECT id, user_id, created_at, not_after
FROM auth.sessions
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'smoketest@hoshinkanri.local'
)
ORDER BY created_at DESC
LIMIT 3;
```

### 5.2 — Public tables phải có RLS
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
```

### 5.3 — Test data Flow C *(skip nếu Flow C chưa fill)*

**Pass criteria:**
- 5.1: ≥ 1 session active
- 5.2: query trả về **rỗng**

⚠️ Supabase MCP đang **read-only** — không DELETE được. Cleanup làm qua app code hoặc Supabase Dashboard manual.

---

## 🧹 Phase 6 — Cleanup

```cmd
:: 6.1 — Kill dev server (dùng PID lưu từ Phase 3)
taskkill /F /T /PID <PID>

:: Fallback nếu không nhớ PID
taskkill /F /IM node.exe

:: 6.2 — Verify port 3000 free
netstat -ano | findstr ":3000 "

:: 6.3 — Copy screenshots vào project folder
mkdir C:\hoshin-test\test-output\latest 2>nul
xcopy /Y C:\Users\ASUS\.playwright-mcp\page-*.png C:\hoshin-test\test-output\latest\

:: 6.4 — Xoá junction
rmdir C:\hoshin-test
```

---

## 📊 Phase 7 — Final Report Format

```markdown
# 🟢/🟡/🔴 SMOKE TEST — Hoshin Kanri OS — [YYYY-MM-DD HH:mm]

## Summary
| Phase | Status | Notes |
|---|---|---|
| 1 — Pre-flight | ✅/❌ | ... |
| 2 — Static | ✅/❌ | typecheck/lint/build |
| 3 — Runtime | ✅/❌ | cold start time |
| 4 — UI | ✅/❌ | (X/Y flows passed) |
| 5 — Database | ✅/❌ | session + RLS |
| 6 — Cleanup | ✅/❌ | ... |

**Verdict:** READY TO DEPLOY / NEEDS FIX / BLOCKED

## 🚨 Security alerts (nếu có)
[Báo cáo NGAY đầu nếu phát hiện secret exposed]

## Failures
[Liệt kê từng lỗi cụ thể, file:line nếu có]

## Warnings
[Warning không fail nhưng đáng chú ý]

## Performance notes
- Build time: Xs
- Typecheck: Xs
- Lint: Xs
- Dev cold start: Xs
- Login round-trip: Xs

## Next steps
[Action items cụ thể, ưu tiên rõ ràng]

## Artifacts
- Screenshots: C:\Users\ASUS\Desktop\...\test-output\latest\
- Junction temp: (đã xoá / chưa xoá)
```

---

## ⚠️ Rules cho Claude (BẮT BUỘC)

1. **Junction first:** Tạo junction trước mọi shell command (Issue 1)
2. **Phase 1 fail → STOP.** Phase khác fail → vẫn chạy phase sau
3. **Screenshot:** LUÔN bỏ filename (Issue 2)
4. **Timeout:** Mỗi command max 120s
5. **KHÔNG sửa code:** Chỉ ĐỌC + CHẠY
6. **KHÔNG commit/push/deploy**
7. **Test data prefix:** `TEST_SMOKE_`
8. **Security:** KHÔNG log secrets (xem Security Rules)
9. **Báo cáo trung thực:** KHÔNG bịa kết quả nếu tool call fail
10. **Cleanup junction:** LUÔN `rmdir C:\hoshin-test` ở Phase 6
