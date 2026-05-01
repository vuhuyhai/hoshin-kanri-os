# Hoshin Kanri OS

SaaS giúp SME Việt Nam biến chiến lược thành hành động đo được trong 90 ngày, sử dụng phương pháp Hoshin Kanri (Policy Deployment) kết hợp AI.

**Stack**: Next.js 16 App Router · TypeScript · Supabase (Postgres + RLS) · Anthropic Claude · PostHog · Vercel

## Documentation

Start with one of these depending on what you're trying to do:

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** — run locally, env vars, scripts, how to add things, troubleshooting. Start here if you're a human about to write code.
- **[AGENTS.md](./AGENTS.md)** — conventions, pitfalls, and "been burned before" notes. Start here if you're an AI coding agent.
- **[MASTER_BUILD_SPEC.md](./MASTER_BUILD_SPEC.md)** — architectural reference: tables, user flows, API routes, frameworks. Read for the big picture.

## Quickstart

```bash
npm install
# fill .env.local — see DEVELOPMENT.md Section 2 for variable list
npm run dev
```

Open http://localhost:3000 and hit `/x-ray` as the first smoke test.

## License

© 2026 Vũ Hải. All rights reserved.

This codebase is published for transparency and reference purposes.
No license is granted for commercial use, redistribution, modification,
or derivative works without explicit written permission from the author.

For inquiries about licensing, partnerships, or consulting:
- Production: https://chienluoc.org
- Repository: https://github.com/vuhuyhai/hoshin-kanri-os
