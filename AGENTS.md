# Agent Onboarding — Hoshin Kanri OS

Read this first if you're Claude Code, OpenCode, Cursor, or any other coding agent starting a fresh session on this repo. It tells you what's non-obvious, what's been burned-on-before, and where to look for the details you won't find by grepping.

For project overview / tables / flows: `MASTER_BUILD_SPEC.md`.
For human dev setup: `DEVELOPMENT.md`.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Current version: **Next.js 16.2.3 + React 19.2.4.** Your training data is probably Next 14 or 15. Don't assume.

---

## Non-obvious facts

1. **Git repo, solo branch (`master`).** Single-author vibe-coding, no PR flow, no code review, no release branches. Work directly on `master` and push when the build is green. `git log` shows *some* history but large untracked blobs of WIP often sit for days — check `git status` before assuming master reflects reality.
2. **Solo founder, vibe-coding style.** User is Vũ Hải, SME Hoshin Kanri SaaS for Vietnam. Direct communication, no corporate fluff, Vietnamese preferred for user-facing replies. Don't nịnh.
3. **No test suite.** Verification = typecheck + build + manual browser exercise. If you claim "tested", say what you actually did — don't paper over "unable to test in browser" with "tests pass".
4. **No CI.** Vercel auto-deploys from `master` push. That's the whole pipeline. Branch is `master`, not `main`.
5. **Single-tenant per-org model** for app tenants (`org_id` on every row). RLS is the security boundary, not middleware. Every query must respect `org_id` — **except** the blog (`blog_posts`), which is platform-level content authored only by super-admin and public-readable.
6. **Two protected areas.** `/dashboard` is per-org authed (respects `org_members.role`). `/admin` is super-admin only, gated in `proxy.ts` via `profiles.is_super_admin`. Never conflate them.

---

## Before you start coding

```bash
npm run typecheck    # must pass — ~5-15s
npm run build        # must pass — ~30-60s, runs TS check + route generation
```

If these don't pass on `master`, something is already broken. Investigate before adding your own changes.

---

## Conventions established in this codebase

These are enforced by the code review bar. Deviate only with a concrete reason:

### Claude API
- **Never** `new Anthropic()` directly. Import `createAnthropicClient` from `@/lib/ai/client` — it sets `maxRetries: 3` and `timeout: 180000` so transient 429s and 5xx don't surface to users.
- **Never** hard-code model IDs. Import `AI_MODELS.reasoning` or `AI_MODELS.fast` from `@/lib/ai/models`.
- **Instantiate inside the handler, not at module scope.** A top-level `const anthropic = createAnthropicClient()` fires during Next's build-time static analysis where env vars may not be set — put the call inside `POST(...)` instead.
- **Discovery AI routes stream** via `streamClaudeJson` from `@/lib/ai/stream-json`. Client uses `postSse` from `@/lib/http/sse-client` and reads `progress` events for a live char counter.

### Validation
- **Every POST/PUT/PATCH API route with a body validates with Zod.** Add the schema to `lib/validation/schemas.ts` next to the matching domain, then use `parseBody(request, schema)` — it returns a discriminated union `{ ok: true, data } | { ok: false, response }` matching the `requireOrgRole` pattern in `lib/supabase/server.ts`.
- **Feature-local schemas** (e.g. `lib/blog/schema.ts`) are fine when they belong to exactly one domain and don't need to be imported by other routes. Keep cross-cutting shapes in `lib/validation/schemas.ts`.
- **Envelope-only validation** when a domain function already handles deep validation (see `validateXMatrix`, `synthesizeSwot`). Zod guards shape at the boundary, domain code handles rules.
- **Don't duplicate** validation between client form and server — define once in Zod, reuse on both sides.
- **Variable naming.** Don't shadow inside handlers: many routes have a later `parsed` variable for AI JSON output. Use `bodyParsed` (or inline destructure) for `parseBody`'s return to avoid collision.

### Auth & RLS
- Use `createClient()` from `@/lib/supabase/server` for user-scoped queries (respects RLS).
- Use `createAdminClient()` from `@/lib/supabase/admin` only when you need to bypass RLS (rate-limit writes, admin lookups, dev helpers). Keep these calls obvious.
- Role checks: `requireOrgRole(supabase, user.id, orgId, ADMIN_ROLES)` before write routes. Returns a clean 403 **before** the RLS policy throws a 42501 — better UX than a raw 500 toast.

### Rate limiting
- Public unauthenticated routes use `checkRateLimit` from `@/lib/rate-limit`. IP-based, fails OPEN on infra errors (intentional — don't "fix" this, see the comment in that file).
- When the route can bomb a specific victim (email blast, password reset spam), use a **dual-key** IP + identifier pattern. See `app/api/auth/forgot-password/route.ts` — email-bucket returns fake-success instead of 429 to avoid leaking user existence.

### PostHog analytics
- Helpers live in `lib/analytics/events.ts`. Add a new typed helper per event; don't sprinkle raw `trackEvent` calls.
- **Never** put PII (email, phone, full name) in event properties. PostHog's distinctId already identifies the user.
- Server Component pages fire events via `<TrackMount event="..." />` from `components/analytics/TrackMount.tsx` — it has a `useRef` guard defeating StrictMode double-effects.

### Code style
- **No comments** unless the WHY is non-obvious. No "added X for Y flow" — git isn't tracking this, but the code still shouldn't rot with narration.
- **Server Components by default**, `"use client"` only when needed (forms, interactivity, hooks, stores).
- **Vietnamese** for UI strings, error messages, toasts. **English** for code, types, comments, function names.
- **Prefer editing existing files** over creating new ones. No speculative abstractions.

---

## Known pitfalls (been burned before)

1. **`ignoreBuildErrors` was on for a while** because Supabase types resolved to `never`. That's fixed now (April 2026) — if you see the flag come back, something regressed and you should investigate, not re-enable.

2. **Coaching system prompt is interpolated** per call with `orgContext`, `stateBlock`, `xrayContext`, `selectedDimensions`. This means (a) it's not byte-identical across calls so Anthropic prompt caching doesn't help today, (b) changing any of these call sites mutates what the AI sees. Test with a fresh org to avoid state carryover.

3. **`createClient` vs `createAdminClient`.** The former respects RLS. The latter bypasses everything. Using admin in the wrong place silently leaks cross-org data. Grep for `createAdminClient` before merging.

4. **Model ID staleness.** There was a stale `claude-sonnet-4-5-20250514` lingering in an ai-generate route that 404'd on prod. That's why `lib/ai/models.ts` exists. Never let model IDs drift back into route files.

5. **SseError vs FetchJsonError.** Routes that stream use `postSse` + `SseError`. Routes that don't use `postJson` + `FetchJsonError`. They have the same `.body` shape on error so branch-on-error UI works identically — just pick the right one for the route type.

6. **`x-forwarded-for` is trusted** by `getClientIp()`. That's fine on Vercel (proxy sets the header) but if you move to self-hosted, attackers can spoof it. If deployment topology changes, re-audit `lib/rate-limit.ts`.

7. **Rate limit table is service-role-only.** Don't try to read it from a user-context query — RLS blocks all roles. Use `createAdminClient` if you really need to inspect it (usually for debugging).

---

## Files you'll touch most often

| Task | Files |
|---|---|
| Add API route | `app/api/<domain>/<action>/route.ts` + `lib/validation/schemas.ts` |
| Add migration | `supabase/migrations/0NN_<slug>.sql` + add the table type manually to `lib/supabase/types.ts` (auto-gen has been flaky; append-only edits are fine) |
| Apply migration | Paste into Supabase SQL Editor OR `SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-migration.mjs 0NN_<slug>.sql` |
| Add UI component | `components/<domain>/` or `app/<route>/components/` |
| Add business logic | `lib/<domain>/` |
| Add blog post | `/admin/blog/new` in the running app — super-admin only, Markdown + live preview, auto-slugify |
| Wire an event | `lib/analytics/events.ts` + call site (or `<TrackMount event="..." />` in a Server Component page) |
| Change Claude prompt | `lib/swot/coaching-prompts.ts`, `lib/swot/coaching-draft-prompt.ts`, `lib/discovery/prompts.ts`, or inline in the route |

---

## When you finish a task

1. `npm run typecheck` — must pass.
2. `npm run build` — must pass for anything touching routes, configs, or types.
3. Explain what you actually verified. If you couldn't test a UI change in a browser, **say so explicitly**. Don't claim a success you didn't observe.
4. Keep the final response terse. Bullet points > paragraphs. User reads diffs, not essays.

---

## Test environment caveats (added 2026-04-30)

- **Unicode path + `cmd` shell:** project root contains Vietnamese diacritics (`Vũ Hải`). On this Windows machine, `cmd` invoked via Desktop Commander MCP fails when quoted Unicode paths are used (e.g. `cd /d "C:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\..."` errors with "filename syntax incorrect"). Workaround: create a junction from an ASCII path and use it for the session. `mklink /J C:\hoshin-test C:\Users\ASUS\Desktop\HOSHIN~1\hoshin-kanri-os`, then `rmdir C:\hoshin-test` after. The junction is a filesystem soft link — no copy, no sync issue.
- **`/api/health` does not exist.** Smoke test playbook references it but the route is not implemented. Use `GET /` returning 200 as the health check. Either add the route or remove from the playbook — pick one.
- **API keys rotated 2026-04-30.** Supabase anon + service_role, Anthropic, Resend, Tavily — all rotated. If routes start 401-ing unexpectedly, first sanity-check `.env.local` matches Supabase dashboard + Anthropic console. Don't assume code regression.
- **Onboarding `/setup-org` has no logout exit.** Newly-authed users with no org are stuck on this page — no avatar menu, no logout link. Either by design or oversight; flag if user asks why they can't escape.

