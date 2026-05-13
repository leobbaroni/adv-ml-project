# Agent Guide: adv-ml-project

## Before You Start
1. Read `.agents/rules/RULE.md` — hard behavioral constraints (simplicity first, surgical changes).
2. Read `.agents/rules/coding-style.md` — project-wide coding conventions.
3. Read `.agents/knowledge-base/PRD.md` — project requirements and evaluation criteria.
4. Read `.agents/knowledge-base/ARCHITECTURE.md` — current system topology.
5. Read `.agents/knowledge-base/ROADMAP.md` — current phase and what's next.

## Project Context
- **Course:** 2758-T4 Advanced Topics in ML (Nova SBE). Student project, not production.
- **Goal:** AI-driven startup prototype (business plan + full-stack app with UI).
- **Product:** Concierge — AI channel manager for short-term rental hosts. Merges iCal feeds, resolves overlaps with AI, runs from a Telegram chat. See `README.md`.

## Repo Layout
- `APP/` — pnpm monorepo (apps/web, apps/worker, packages/*). See `README.md` for the full tree.
- `.agents/` — Rules, knowledge base, and the 5-agent fleet. Do not modify unless asked.
- Root — `docker-compose.yml`, `.env.example`, `README.md`, plus this file.

## Tech Stack (frozen for v1)
- **Web**: Next.js 15 (App Router) + tRPC + Tailwind + shadcn/ui + Framer Motion + R3F
- **Worker**: Node + BullMQ (Redis) + grammY (Telegram long-polling)
- **DB**: Postgres 16 + Prisma
- **AI runtime**: OpenAI-compatible client → `google/gemini-3.1-flash-lite` via OpenCode Zen (swappable via `AI_MODEL` env var)
- **Tooling**: pnpm + Turbo

## Agent Fleet
Five specialized opencode sub-agents are defined in `.agents/agents/`. Route via the orchestrator:
- `orchestrator` (Kimi K2.6 / GLM 5.1) — default entry point, plans + delegates
- `ui-designer` (Gemini 3.1 Pro Preview) — all visual, motion, 3D work
- `normal-coder` (Kimi K2.6) — ~90% of implementation
- `hard-coder` (GPT-5.5 / opencode-zen) — escalation only for gnarly bugs
- `light-tasks` (free / big-pickle) — docs, configs, boilerplate

Full routing rules in `.agents/agents/orchestrator.md`.

## Critical Rules

### Planning Mode
- Always ask clarifying questions before designing or implementing.
- Never assume design, tech stack, or features.
- Use deep-dive sub-agents for research and plan review before presenting to the user.

### Change / Edit Mode
- Never implement features yourself when possible — use sub-agents and act as coordinator.
- Identify parallelizable changes and delegate to sub-agents for efficiency.
- Use the best model for the task: premium models for complex coding, mid-tier for documentation.
- After completing features (large or small), always run lint, type check, and build commands to verify code quality.

### Database Schema Changes
- Schema lives at `APP/packages/db/prisma/schema.prisma`.
- Whenever you change it, run `pnpm db:generate` and `pnpm db:migrate` (named migration).
- NEVER run `prisma db push` — we want a real migration history.

### Dev Server Restart Rule (MANDATORY)
- **Always restart the web dev server after code changes** so the user can test immediately.
- Kill the old process first: find and stop any process on port 3000, then start fresh.
- The worker auto-reloads via `tsx watch`, but the web server does NOT. You must restart it manually.

### Testing
- Use any testing tools, libraries, MCP tools, skills, etc. available to test your changes.
- Never assume your changes simply work — always test!
- If the project has no testing tools available, ask the user whether testing should be skipped.
