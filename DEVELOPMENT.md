# Development

Human-focused guide: how to run Hoshin Kanri OS on your machine, add things without breaking things, and debug what goes wrong. If you're an AI agent, read `AGENTS.md` first.

For the big architectural picture (tables, flows, frameworks, tech stack), see `MASTER_BUILD_SPEC.md`.

---

## 1. Quickstart

Prereqs: Node 20+, npm, a Supabase project (hosted or `supabase start` local), Anthropic API key.

```bash
# 1. install
npm install

# 2. copy env template — fill values (see Section 2)
cp .env.local .env.local.backup  # if .env.local doesn't exist, create empty one
# edit .env.local with real values

# 3. run migrations against your Supabase project
#    (or use Supabase dashboard SQL editor to paste them in order)

# 4. dev server
npm run dev
# → http://localhost:3000
```

First route to hit after starting: **`/x-ray`** (public, no auth, exercises the full AI-streaming + rate-limit + Resend email flow in one shot).

---

## 2. Environment variables

All live in `.env.local` (gitignored). Never commit real values.

| Var | What | Where to get |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/publishable key | Same page, "anon public" |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key | Same page, "service_role secret" — **server only**, bypasses RLS |
| `ANTHROPIC_API_KEY` | Claude API key | console.anthropic.com → API Keys |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key | PostHog → Project Settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (e.g. `https://eu.posthog.com`) | Same |
| `TAVILY_API_KEY` | Tavily web search (SWOT evidence) | tavily.com dashboard |
| `RESEND_API_KEY` | Resend transactional email | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | "From" address (verified domain) | Resend → Domains |
| `NEXT_PUBLIC_APP_URL` | Public origin (e.g. `http://localhost:3000` local, `https://hoshinkanri.vn` prod) | — |

**Rotate reminder:** These keys live on your local disk unencrypted. Back them up to a password manager, rotate every 90 days, and when an intern / contractor gets access to the machine, rotate again.

---

## 3. Scripts

| Command | What | When |
|---|---|---|
| `npm run dev` | Start Next.js dev server (webpack) | Active development |
| `npm run build` | Full production build incl. TS check + static pages | Before deploy / verify clean state |
| `npm run start` | Serve the built output | Smoke-test prod build locally |
| `npm run typecheck` | `tsc --noEmit` — TS check only, ~5-15s | Quick check before commit |
| `npm run lint` | ESLint | Before commit |

**Pre-commit checklist** (no husky hook — do this manually):
```bash
npm run typecheck && npm run lint && npm run build
```

If `build` fails but `typecheck` passes, it's usually a Next.js route generation issue — read the error carefully, it's almost always a server/client component boundary violation.

---

## 4. Project structure at a glance

```
hoshin-kanri-os/
├── app/                 # Next.js App Router (pages + API routes)
├── components/          # Reusable UI, providers, analytics helpers
├── lib/                 # Business logic, Supabase clients, AI helpers, validation
├── supabase/migrations/ # SQL migrations, run in numeric order
├── public/              # Static assets
├── plans/               # Work-in-progress task notes (not shipped code)
├── AGENTS.md            # ← AI agent onboarding
├── DEVELOPMENT.md       # ← this file
└── MASTER_BUILD_SPEC.md # Full architectural reference
```

Inside `lib/`:
- `supabase/` — `client.ts` (browser), `server.ts` (SSR, role helpers), `admin.ts` (service-role), `types.ts` (auto-gen from DB)
- `ai/` — `models.ts` (semantic aliases `reasoning`/`fast`), `client.ts` (Anthropic factory with retries), `stream-json.ts` (SSE helper)
- `validation/` — Zod schemas + `parseBody()` helper for API routes
- `http/` — `fetch-json.ts` (regular fetch), `sse-client.ts` (`postSse` + `SseError`)
- `rate-limit.ts` — DB-backed rate limit with fail-open semantics
- `analytics/events.ts` — typed PostHog helpers
- `swot/`, `discovery/`, `x-matrix/`, `x-ray/`, `kpi/`, `pql/` — domain modules

---

## 5. How to add things

### 5.1 New API route with validation

1. Define a Zod schema in `lib/validation/schemas.ts`:
   ```ts
   export const myFeatureSchema = z.object({
     foo: z.string().min(1, 'Thiếu foo'),
     count: z.number().int().positive(),
   })
   export type MyFeatureInput = z.infer<typeof myFeatureSchema>
   ```
2. Create `app/api/my-feature/route.ts`:
   ```ts
   import { NextRequest, NextResponse } from 'next/server'
   import { createClient } from '@/lib/supabase/server'
   import { parseBody, myFeatureSchema } from '@/lib/validation'

   export async function POST(request: NextRequest) {
     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

     const body = await parseBody(request, myFeatureSchema)
     if (!body.ok) return body.response
     const { foo, count } = body.data

     // ... your logic
     return NextResponse.json({ result: 'ok' })
   }
   ```
3. Call from client with `postJson` from `lib/http/fetch-json.ts` — errors surface as `FetchJsonError` with `.body` for branch-on-error UX.

### 5.2 New Claude API route with streaming

Use `streamClaudeJson` so the client gets a TTFB of ~200ms instead of waiting for the full response. See `app/api/discovery/pain-mapper/route.ts` for the template. Client side calls `postSse` from `lib/http/sse-client.ts` and handles `progress` events for the "AI is thinking... (N chars)" indicator.

### 5.3 New Supabase migration

1. Create `supabase/migrations/0NN_my_change.sql` with the next sequential number.
2. Always include `enable row level security;` on new tables + write policies in the same migration — don't leave RLS for later.
3. Apply it. Three options, pick whichever is available:
   - **Dashboard SQL editor** (fastest, always works): paste and click Run.
   - **Helper script** (no CLI needed — uses the Supabase Management API):
     ```bash
     # get a Personal Access Token at https://supabase.com/dashboard/account/tokens
     SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migration.mjs 0NN_my_change.sql
     ```
     Project ref is read from `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.
   - **Supabase CLI** if you already have it linked: `supabase db push`.
4. Update `lib/supabase/types.ts` with the new table / function type. Auto-gen via `npx supabase gen types typescript` works if the CLI is installed; otherwise hand-append the `Row` / `Insert` / `Update` shape following the existing table entries — append-only edits are safe.
5. Run `npm run typecheck` — if queries resolve to `never`, types are stale.

### 5.4 New PostHog event

1. Add a typed helper in `lib/analytics/events.ts` following the existing pattern. Never put PII (email, phone, names) in event properties — PostHog's distinctId already identifies the user.
2. For Server Component pages, use `<TrackMount event="..." properties={{...}} />` from `components/analytics/TrackMount.tsx`.
3. For client components, call the helper directly in the success branch (not before `await` — you want to track actual completion, not intent).

### 5.5 New rate-limit guarded route

Copy the pattern from `app/api/auth/register/route.ts`:
```ts
const ip = getClientIp(request.headers)
const rl = await checkRateLimit({
  key: `my-feature:${ip}`,
  limit: 5,
  windowSeconds: 900,
})
if (!rl.allowed) {
  const retryAfter = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000))
  return NextResponse.json(
    { error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil(retryAfter / 60)} phút.` },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } },
  )
}
```

Use a **dual-key** pattern (IP + identifier) when the route can be weaponized against a specific victim — see `forgot-password` for the reference implementation.

---

## 6. Testing what you built

There's **no test suite** yet — verification is manual + typecheck + build. When adding features:

1. **Typecheck**: `npm run typecheck` must return 0 errors. If it can't catch your bug, your types are too loose.
2. **Build**: `npm run build` must exit 0. Route-type generation catches boundary violations `tsc` misses.
3. **Browser smoke test**: exercise the feature end-to-end in `npm run dev`. Golden path + 1 edge case minimum.
4. **UI changes**: test mobile viewport (375px) + desktop. Sidebar, bottom-nav, and sheet behavior differ.
5. **RLS changes**: log in as 2 different users from 2 different orgs and confirm cross-org data is inaccessible.

If you touch auth or RLS, test the negative cases too — Member role trying to do CEO-only actions, logged-out user hitting authed routes, etc.

---

## 7. Deployment

- **Platform**: Vercel
- **Preset**: Next.js (from `vercel.json`)
- **Env vars**: set in Vercel Project Settings → Environment Variables (separate for Production / Preview / Development)
- **Promote to prod**: push to `master` branch → Vercel auto-deploys
- **Rollback**: Vercel dashboard → Deployments → previous deployment → Promote

**Before promoting a migration change to prod:**
1. Apply migration to production Supabase first (SQL editor or `scripts/apply-migration.mjs`)
2. Then push the code to `master` so Vercel rebuilds
3. If reversed, the new code hits an old schema and crashes

Server components that query new tables should be written to **degrade gracefully** when the table is missing (log, return empty state) so the window between step 1 and step 2 doesn't bring down public pages. See `app/blog/page.tsx` and `app/sitemap.ts` for the pattern.

---

## 8. Troubleshooting

**TypeScript says Supabase queries return `never`**
Types are stale. Regenerate with `supabase gen types`. If you can't run the CLI, paste the Database type from Supabase dashboard → API → Introspection.

**`npm run build` fails with "module not found" but dev works**
Usually caused by a Client Component importing a Server-only module. Check the import chain. If a file imports `next/headers` or `cookies()`, it can only be used from Server Components.

**Claude API returns 429**
The SDK retries 3x with exponential backoff (see `lib/ai/client.ts`). If you still see 429s, you're hitting account-level rate limits — upgrade the Anthropic tier or slow down concurrent requests.

**Streaming route hangs in browser**
Check browser DevTools → Network → your `/api/...` request. If it shows as "pending" forever:
- Server-side `controller.close()` not called on error path
- Vercel proxy buffering (confirm `X-Accel-Buffering: no` header is set in `lib/ai/stream-json.ts`)
- `NEXT_PUBLIC_APP_URL` mismatch causing CORS preflight failure

**Rate limit blocks legitimate user during testing**
It's IP-based. Wait out the window (900s default) or delete the row from `rate_limits` table. The `increment_rate_limit` RPC is idempotent — safe to delete and retry.

**Auth redirect loop after login**
Almost always the middleware not refreshing cookies. Check `middleware.ts` matcher — if you added a new protected route, it needs to be in the matcher array.

**Coaching prompt behavior changed unexpectedly**
The coaching system prompt interpolates `orgContext`, `stateBlock`, `xrayContext`, and `selectedDimensions`. Changing any of these call sites mutates what the AI sees — test with a fresh org to avoid state carryover.

---

## 9. Known gotchas

- **Next.js 16 is not the Next.js you know.** APIs, file structure, and conventions differ from Next 14/15 content in LLM training data. When in doubt, check `node_modules/next/dist/docs/`.
- **`ignoreBuildErrors` is off** (as of April 2026). Don't turn it back on to skip errors — fix the actual type issue instead.
- **Supabase RLS is enforced**, not advisory. A failing insert is usually an RLS policy rejection (42501), not a bug in your code. Check the policies in `supabase/migrations/002_rls_policies.sql` and `016_role_based_rls.sql`.
- **`lib/validation.ts` moved to `lib/validation/`** — same import path `@/lib/validation`, but `isValidEmail` + Zod schemas now live together.
- **`.env.local` is in `.gitignore`** but still lives on your disk in plaintext. Treat it like a password — rotate on machine access changes.
