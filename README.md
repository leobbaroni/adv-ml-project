# Concierge — Real Estate Agent

AI-driven channel manager for short-term rental hosts. Merges Airbnb, Booking, VRBO, and Interhome calendars in real time, resolves overlaps with AI, and lets you operate the property portfolio from a Telegram chat.

Course context: 2758-T4 Advanced Topics in ML (Nova SBE). See `.agents/knowledge-base/PRD.md`.

---

## Stack

- **Web**: Next.js 15 (App Router, RSC) + tRPC + Tailwind + shadcn/ui + Framer Motion + one React Three Fiber hero
- **Worker**: Node + BullMQ (Redis) + grammY (Telegram long-polling)
- **DB**: Postgres 16 via Prisma
- **AI**: OpenAI-compatible client → OpenCode Zen "big-pickle" (swappable via env vars)
- **Tooling**: pnpm workspaces + Turbo

Architecture details: `.agents/knowledge-base/ARCHITECTURE.md`.

---

## Quick start

Prereqs: Node 20.18+, pnpm 9+, Docker Desktop.

```bash
# 1. Copy env template and fill in tokens
cp .env.example .env

# 2. Start Postgres + Redis
docker compose up -d

# 3. Install dependencies (run from APP/)
cd APP
pnpm install

# 4. Generate Prisma client + run first migration
pnpm db:generate
pnpm db:migrate

# 5. Seed local data (your real Triplex + Nanoush iCals)
pnpm db:seed:local

# 6. Run web + worker in parallel
pnpm dev
```

Open <http://localhost:3000>.

---

## Phase status

See `.agents/knowledge-base/ROADMAP.md`. Phase 0 + Phase 1 are **DONE**. Next: **Phase 2 — merged calendar view + deterministic overlap detection (R1, R2, R3)**.

---

## Agent fleet

Five specialized opencode sub-agents are defined in `.agents/agents/`:

| Agent | Model | Role |
|---|---|---|
| `orchestrator` | Kimi K2.6 / GLM 5.1 | Plans, decomposes, routes (default entry point) |
| `ui-designer` | Gemini 3.1 Pro Preview | All visual / motion / 3D work |
| `normal-coder` | Kimi K2.6 | ~90% of implementation |
| `hard-coder` | GPT-5.5 (opencode/zen) | Escalation-only for gnarly bugs |
| `light-tasks` | Free (opencode/zen big-pickle) | Docs, READMEs, configs |

Routing rules: see `.agents/agents/orchestrator.md`.

---

## Security

**Pre-demo checklist:**

- [ ] Rotate the Telegram bot token (`@BotFather` → `/revoke` → `/token`).
- [ ] Rotate the OpenCode Zen API key in the provider dashboard.
- [ ] Re-confirm `.env` is gitignored (it is, but verify after each clone).
- [ ] Re-confirm `APP/packages/db/src/seed.local.ts` is gitignored (it is — contains real iCal access tokens).

**Hard rules:**

- Never log iCal URLs (they contain HMAC tokens).
- Never render iCal URLs in any client-facing component.
- Never paste tokens in commit messages, PR descriptions, or issue bodies.

**iCal URLs are secrets.** The Interhome `hmac=...` and Airbnb `s=...`/`t=...` query parameters grant read access to your booking calendars. Anyone with the URL can see your bookings.

---

## Repo layout

```
adv-ml-project/
├── AGENTS.md                          Quick-reference for any agent entering the repo
├── README.md                          ← you are here
├── docker-compose.yml                 Postgres + Redis (web/worker run on host)
├── .env.example                       Template; copy to .env
├── .agents/                           Rules, knowledge base, agent fleet
└── APP/                               pnpm monorepo
    ├── apps/
    │   ├── web/                       Next.js 15 (UI + tRPC + PDF + guest forms)
    │   └── worker/                    iCal poller + Telegram bot + BullMQ
    └── packages/
        ├── db/                        Prisma client + schema + seeds
        ├── ical/                      Deterministic merge/overlap engine
        ├── ai/                        Single AI router, three task functions
        └── shared/                    Zod schemas + shared types
```

---

## Documentation index

- `APP/docs/SETUP.md` — detailed install/run
- `APP/docs/TELEGRAM-BOT-SETUP.md` — BotFather steps
- `APP/docs/ICAL-OVERLAP-RULES.md` — the merge spec in plain language
- `.agents/knowledge-base/ARCHITECTURE.md` — system topology
- `.agents/knowledge-base/DATA-MODEL.md` — Prisma intent
- `.agents/knowledge-base/ICAL-MERGE-SPEC.md` — overlap engine spec
- `.agents/knowledge-base/DESIGN-LANGUAGE.md` — visual rules
- `.agents/knowledge-base/ROADMAP.md` — phased plan
