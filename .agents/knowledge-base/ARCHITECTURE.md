# Architecture

Frozen for v1. Any change requires updating this file first.

## Topology

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser ─── Next.js 15 (App Router) ─── tRPC API routes        │
│  shadcn + Tailwind + Framer Motion + one R3F hero               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │ Postgres (Prisma) │
                  └─────────▲─────────┘
                            │
                  ┌─────────┴─────────┐
                  │  Node worker      │  BullMQ + Redis
                  │  - iCal poller    │  every 15 min
                  │  - Overlap engine │  on new fetch
                  │  - Telegram bot   │  long-polling (local)
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │  AI router        │  OpenAI-compatible SDK
                  │  default:         │  - extractCheckInData
                  │  OpenCode Zen     │  - resolveOverlap
                  │  (big-pickle)     │  - parseShoppingMessage
                  └───────────────────┘
```

## Processes

| Process | Tech | Responsibility |
|---|---|---|
| `apps/web` | Next.js 15 | UI, tRPC API, PDF rendering, magic-link guest forms |
| `apps/worker` | Node + tsx | iCal polling job, overlap detection, Telegram long-polling |
| Postgres 16 | Docker | Single source of truth |
| Redis 7 | Docker | BullMQ queue only (not a cache) |

## Shared packages

| Package | Owns |
|---|---|
| `@app/db` | Prisma client + schema + migrations + seeds |
| `@app/ical` | Fetch, parse, merge, overlap-detect (pure, deterministic) |
| `@app/ai` | One AI router with three task functions |
| `@app/shared` | Zod schemas, shared types, constants |

## Hard rules

1. The merge engine is **deterministic**. AI only resolves ambiguity.
2. Every overlap decision is **reversible** (stored in `OverlapDecision`).
3. AI failures fall back to rule-based stubs. The app must never hard-crash on AI errors.
4. No secret is ever logged or rendered.
5. The web process must not call Telegram. Only the worker does.
