# Active Context

> **What this file is:** the volatile bridge between sessions. Update when starting/finishing a feature.
> **When switching to Claude web (claude.ai):** point Claude here first. Avoids re-pasting code.
> **When starting a Cursor session:** skim "Current focus" + "Stuck on" to remember where you left off.

---

## Last updated

2026-04-30 — after smoke test pass + key rotation + context system rewrite

---

## Current focus

_(Empty — fill in when starting a new task. Format: feature name, why, expected scope.)_

---

## Recently shipped

- **2026-04-30** — `3f82caa` Redeploy with rotated keys (Supabase + Anthropic + Resend + Tavily)
- **2026-04-30** — `24eb66d` Lint fix: smart quotes for "Lưu X-Matrix" reference in `GembaModal.tsx:65`
- **2026-04-30** — `13cf793` M-Hoshin-6.1 hotfix: gate gemba form when hoshin not persisted
- **2026-04-30** — Smoke test 7-phase playbook authored + ran end-to-end (`SMOKE_TEST.md`)
- **earlier** — `27cb2f7` M-Cleanup-2 design audit plan

---

## Open questions / decisions pending

- [ ] Implement `/api/health` route, or remove the check from `SMOKE_TEST.md` playbook? Build route table doesn't include it.
- [ ] `/onboarding/setup-org` has no logout button — design intent or oversight? Newly-authed users with no org get stuck.
- [ ] `SMOKE_TEST.md` Flow C is a placeholder — fill in once a stable "core feature" candidate is picked (X-Matrix create flow? KPI weekly update?).
- [ ] Path drift in playbook — `D:\Projects\...` referenced but project lives at `C:\Users\ASUS\Desktop\...`. Update playbook OR move project (rename folder to ASCII would fix the cmd-Unicode issue too — see `AGENTS.md` caveats).

---

## Files most likely to touch next

_(Empty — fill in when starting a new task. Helps Claude web pre-load context without grepping.)_

---

## Stuck on

_(Empty — when stuck, paste: error message, hypothesis, what's been tried. Claude web reads this first to skip the warm-up questions.)_

---

## Notes for the other Claude (Cursor ↔ web)

**For Cursor's Claude (when starting a session):**

- Lint baseline: **0 errors** (was 2 in `GembaModal.tsx:65`, fixed in `24eb66d`). If lint regresses, investigate before committing.
- API key rotation 2026-04-30 — `.env.local` changed. If routes 401, check env first.
- Junction `C:\hoshin-test` may exist from a previous session. Harmless. `rmdir C:\hoshin-test` to clean up.

**For Claude web (when verifying / debugging):**

- Auth cookie name: `sb-cnbsrlhhgrfbdhisizgg-auth-token`
- Test user: `smoketest@hoshinkanri.local`
- Dev server cold-start is ~530ms with Next 16 webpack — anything >2s = something off.
- `git status` first, `git diff HEAD` to see uncommitted work, `git log --oneline -10` for recent shipped.
- Project path needs junction workaround for cmd shell — see `AGENTS.md` "Test environment caveats."

---

## How to keep this file useful

1. **Update at the boundaries:** start of feature (fill Current focus), end of feature (move to Recently shipped + clear Stuck on).
2. **Don't put codebase rules here** — those go in `AGENTS.md`. This file is "what's happening this week," not "how we work."
3. **Keep Recently shipped to ~5 items.** Older entries belong in `git log`.
4. **If a question stays Open for >2 weeks**, decide it or delete it. Don't let TODOs rot.
