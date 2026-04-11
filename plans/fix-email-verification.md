# Fix Email Verification - Implementation Plan

## Problem
`mailer_autoconfirm: true` in Supabase auto-confirms users without sending verification emails. Supabase built-in SMTP is unreliable (2 emails/hour free tier). Users see "check your email" but no email arrives.

## Solution
Server-side API routes using `supabase.auth.admin.generateLink()` + Resend REST API.

---

## Implementation Order (7 steps)

### Step 1: Create `lib/email/send.ts`
Extract `sendResendEmail` from `app/api/pql/check/route.ts` into a shared module.

```ts
// Reusable Resend email sender
// Params: { to, subject, html }
// Uses RESEND_API_KEY env var
// from: 'Hoshin Kanri OS <noreply@hoshinkanri.vn>' (or resend.dev for dev)
// Throws on failure for callers to handle
```

**Changes**: ~25 lines new file. Then update `app/api/pql/check/route.ts` to import from here (remove local `sendResendEmail` function, ~15 lines deleted).

---

### Step 2: Create `lib/email/templates.ts`
Two exported functions returning `{ subject, html }`:

1. **`verificationEmail(link: string)`** - Vietnamese, subject: "Xac nhan tai khoan Hoshin Kanri OS", button: "Xac nhan email", includes 24h expiry note
2. **`passwordResetEmail(link: string)`** - Vietnamese, subject: "Dat lai mat khau Hoshin Kanri OS", button: "Dat lai mat khau", includes 1h expiry note

Inline CSS, simple branded layout (no external assets). ~60 lines.

---

### Step 3: Create `app/api/auth/register/route.ts`
POST endpoint:

```
Input:  { email, password, full_name, phone }
Flow:
  1. Validate inputs (same rules as client)
  2. createAdminClient().auth.admin.generateLink({
       type: 'signup',
       email,
       password,
       options: { data: { full_name, phone } }
     })
  3. Extract action_link from response
  4. Rewrite link: replace Supabase project URL with app origin
     (parse URL, extract token_hash + type params, rebuild as
      `${origin}/auth/callback?token_hash=X&type=signup`)
  5. Send email via sendEmail() with verificationEmail(rewrittenLink)
  6. Return { success: true }
Output: JSON { success } or { error, status }
```

**Key detail on link rewriting**: `generateLink()` returns a Supabase-hosted URL like `https://<project>.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=...`. We need to extract `token_hash` and `type` query params and build our own callback URL so the existing `/auth/callback` route handles verification.

~50 lines.

---

### Step 4: Create `app/api/auth/forgot-password/route.ts`
POST endpoint:

```
Input:  { email }
Flow:
  1. Validate email format
  2. createAdminClient().auth.admin.generateLink({
       type: 'recovery',
       email
     })
  3. Rewrite action_link same as Step 3 but type=recovery
     `${origin}/auth/callback?token_hash=X&type=recovery`
  4. Send email via sendEmail() with passwordResetEmail(rewrittenLink)
  5. Return { success: true }
     (Always return success even if email not found - prevent enumeration)
Output: JSON { success } or { error, status }
```

~40 lines.

---

### Step 5: Update `app/(auth)/register/page.tsx`
Replace client-side Supabase call with API route call.

**Before** (lines 47-55):
```ts
const supabase = createClient()
const { error } = await supabase.auth.signUp({ ... })
```

**After**:
```ts
const res = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, full_name: fullName.trim(), phone }),
})
const data = await res.json()
const error = !res.ok ? { message: data.error } : null
```

Remove `import { createClient }` since no longer used.

**Changes**: ~10 lines modified, rest of component unchanged.

---

### Step 6: Update `app/(auth)/reset-password/page.tsx`
Replace client-side Supabase call with API route call.

**Before** (lines 29-31):
```ts
const supabase = createClient()
const { error: resetError } = await supabase.auth.resetPasswordForEmail(...)
```

**After**:
```ts
const res = await fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
})
const resetError = !res.ok ? true : null
```

Remove `import { createClient }`.

**Changes**: ~8 lines modified.

---

### Step 7: Update `.env.example`
Add under existing vars:

```
# Resend (email delivery)
RESEND_API_KEY=your_resend_api_key
```

---

## File Summary

| File | Action | Lines |
|---|---|---|
| `lib/email/send.ts` | CREATE | ~25 |
| `lib/email/templates.ts` | CREATE | ~60 |
| `app/api/auth/register/route.ts` | CREATE | ~50 |
| `app/api/auth/forgot-password/route.ts` | CREATE | ~40 |
| `app/(auth)/register/page.tsx` | MODIFY | ~10 lines changed |
| `app/(auth)/reset-password/page.tsx` | MODIFY | ~8 lines changed |
| `app/api/pql/check/route.ts` | MODIFY | delete local fn, add import |
| `.env.example` | MODIFY | +2 lines |

**Total**: 4 new files (~175 lines), 4 modified files (~25 lines changed).

## Critical Implementation Notes

1. **Link rewriting**: `generateLink()` returns `properties.action_link` on the response data. Parse it with `new URL()`, extract `token_hash` and `type` search params, rebuild pointing to app's `/auth/callback`.

2. **Email enumeration protection**: Both routes should return 200 OK regardless of whether the email exists. The `generateLink` call for recovery on a non-existent email will error -- catch it silently and still return success.

3. **`from` address**: Use `noreply@resend.dev` for development (Resend's free tier), switch to verified domain in production. Make this configurable via `RESEND_FROM_EMAIL` env var or default to `Hoshin Kanri OS <noreply@resend.dev>`.

4. **No changes needed to `/auth/callback`**: It already handles `token_hash` + `type` params (line 43-52) and recovery flow (line 90).

5. **Rate limiting**: Not in scope for this fix. Consider adding later via middleware.
