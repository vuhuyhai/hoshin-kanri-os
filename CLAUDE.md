# Claude Context Index

You are working with Vũ Hải on **Hoshin Kanri OS**.

## Read first (in order)

1. `AGENTS.md` — codebase conventions, pitfalls, file map. Authoritative for "how we code here."
2. `ACTIVE_CONTEXT.md` — what's being worked on right now. Volatile, update per session.
3. This file — only stable metadata below. Never duplicate content from `AGENTS.md` here.

## Stable metadata

- **Stack:** Next.js 16.2.3 + React 19.2.4 + TypeScript + Tailwind + Supabase + Vercel
- **Project root:** `C:\Users\ASUS\Desktop\Hoshin Kanri by Vũ Hải\hoshin-kanri-os`
- **Path note:** Folder name has Vietnamese diacritics. `cmd` shell on this machine fails on quoted Unicode paths. When automating, use junction: `mklink /J C:\hoshin-test C:\Users\ASUS\Desktop\HOSHIN~1\hoshin-kanri-os`, then `rmdir C:\hoshin-test` after.
- **Package manager:** npm (lockfile: `package-lock.json`)
- **Branch:** `master` (NOT `main`). Solo dev, no PR flow.
- **Supabase project ref:** `cnbsrlhhgrfbdhisizgg`
- **Auth cookie name:** `sb-cnbsrlhhgrfbdhisizgg-auth-token`
- **Test user (in `.env.local`):** `smoketest@hoshinkanri.local`
- **Deploy:** Vercel auto-deploy on push to `master`. No CI gate.
- **Verification:** `npm run typecheck` + `npm run build` + manual browser. No test suite.

## Communication

- **Vietnamese** for UI strings, error messages, toasts, and chat with Vũ Hải.
- **English** for code, types, function names, technical comments.
- Direct tone. No nịnh, no corporate fluff. Bullet points beat paragraphs.
- When you can't verify something (e.g., browser-only behavior in a Claude web session), **say so explicitly** — don't fake a success.
