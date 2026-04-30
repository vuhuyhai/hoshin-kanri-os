# Claude Context Index

You are working with Vũ Hải on **Hoshin Kanri OS**.

## Read first (in order)

1. `AGENTS.md` — codebase conventions, pitfalls, file map. Authoritative for "how we code here."
2. `ACTIVE_CONTEXT.md` — what's being worked on right now. Volatile, update per session.
3. `plans/M-NN-<slug>.md` (if mentioned) — multi-step plans drafted in claude.ai web for Cursor execution.
4. This file — stable metadata + workflow rules below. Never duplicate `AGENTS.md` content here.

## Stable metadata

- **Stack:** Next.js 16.2.3 + React 19.2.4 + TypeScript + Tailwind + Supabase + Vercel
- **Project root:** `C:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os`
- **Path note:** Folder name has Vietnamese diacritics. `cmd` shell on this machine fails on quoted Unicode paths. When automating, use junction: `mklink /J C:\hoshin-test C:\Users\ASUS\Desktop\HOSHIN~1\hoshin-kanri-os`, then `rmdir C:\hoshin-test` after.
- **Package manager:** npm (lockfile: `package-lock.json`)
- **Branch:** `master` (NOT `main`). Solo dev, no PR flow.
- **Supabase project ref:** `cnbsrlhhgrfbdhisizgg`
- **Auth cookie name:** `sb-cnbsrlhhgrfbdhisizgg-auth-token`
- **Test user (in `.env.local`):** `smoketest@hoshinkanri.local`
- **Dev server cold start:** ~530ms with Next 16 webpack. >2s = something off, investigate.
- **Deploy:** Vercel auto-deploy on push to `master`. No CI gate.
- **Verification:** `npm run typecheck` + `npm run build` + manual browser. No test suite.
- **Lint baseline:** 0 errors as of `24eb66d`. If lint regresses, investigate before committing.

## Communication

- **Vietnamese** for UI strings, error messages, toasts, and chat with Vũ Hải.
- **English** for code, types, function names, technical comments.
- Direct tone. No nịnh, no corporate fluff. Bullet points beat paragraphs.
- When you can't verify something (e.g., browser-only behavior in a Claude web session), **say so explicitly** — don't fake a success.

## Multi-Claude workflow

This project uses three Claude touchpoints, each with a different strength:

- **Cursor's Claude** (Cursor Tab + Cmd+L) — inline autocomplete, fast local edits.
- **claude.ai web** (this assistant when accessed via browser) — multi-file plans, codebase audits, smoke tests via Desktop Commander + Playwright + Supabase MCP.
- **Both share** `CLAUDE.md` + `AGENTS.md` + `ACTIVE_CONTEXT.md` as ground truth.

### Handoff conventions

**Cursor → claude.ai web:**
1. Update `ACTIVE_CONTEXT.md` (Current focus + Stuck on if applicable).
2. Open new chat, say "Đọc `ACTIVE_CONTEXT.md`, em muốn …".

**claude.ai web → Cursor:**
1. claude.ai web drafts a plan into `plans/M-NN-<slug>.md` (NN = next milestone number).
2. In Cursor: `@plans/M-NN-<slug>.md` to load it, then execute.
3. After execution, Cursor's Claude or human moves the plan to `plans/_archive/` and updates `ACTIVE_CONTEXT.md`.

### When 2 Claudes disagree

If feedback from one Claude conflicts with another's recommendation, paste the dissenting view into the active session and ask it to engage with the critique — don't let either side capitulate to please the user. Final call rests with Vũ Hải.

## Active context maintenance

`ACTIVE_CONTEXT.md` is the volatile bridge file. To prevent rot:

- **claude.ai web auto-proposes updates** at end of session when something notable changed (commit, decision, new blocker). Vũ Hải approves or skips — no manual tracking required.
- **Recently shipped: keep ~5 items.** Older entries belong in `git log`.
- **Open questions: decide or delete after 2 weeks.** Don't let TODOs rot.
- **If `Last updated` > 3 days old**, the file is probably stale — re-sync from `git log` and current branch state before trusting it.
