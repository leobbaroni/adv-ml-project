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
                   │                   │  - parsePdfRequest
                   └───────────────────┘
```

## Processes

| Process | Tech | Responsibility |
|---|---|---|
| `apps/web` | Next.js 15 | UI, tRPC API, PDF rendering, magic-link guest forms |
| `apps/worker` | Node + tsx | iCal polling job, overlap detection, Telegram long-polling, shopping parser, PDF delivery |
| Postgres 16 | Docker | Single source of truth |
| Redis 7 | Docker | BullMQ queue only (not a cache) |

## Shared packages

| Package | Owns |
|---|---|
| `@app/db` | Prisma client + schema + migrations + seeds |
| `@app/ical` | Fetch, parse, merge, overlap-detect (pure, deterministic) |
| `@app/ai` | One AI router with three task functions |
| `@app/shared` | Zod schemas, shared types, constants |

## Telegram bot flows

### Overlap alerts (Phase 6)
- `poll-ical` creates an `AI_PROPOSED` decision → calls `sendOverlapAlert(bot, decision, reservations)`.
- Message includes Accept / Revert inline keyboard buttons.
- Callbacks edit the original message and run the same Prisma logic as the web overlap router.
- All actions are logged to `ChatMessage`.

### Shopping parser (Phase 7)
- Admin sends a free-text message like "Buy for Triplex: 2x MALM bed frame".
- Bot calls `parseShoppingMessage` with the message + list of properties.
- AI extracts property name (fuzzy-matched), item names, quantities, and optional IKEA article numbers/URLs.
- Bot inserts `ShoppingItem` rows with `source: 'CHAT'` and replies with a confirmation.

### Natural-language PDF delivery (Phase 8)
- Admin sends a message like "check-in form for May 11" or "schedule for this month".
- Bot calls `parsePdfRequest` with the message + properties + reservations.
- AI resolves the request to a concrete reservation or schedule window.
- Bot makes an internal HTTP GET to the web PDF API (`/api/checkin/pdf` or `/api/schedule/pdf`), receives the PDF buffer, and sends it as a Telegram document.

## Hard rules

1. The merge engine is **deterministic**. AI only resolves ambiguity.
2. Every overlap decision is **reversible** (stored in `OverlapDecision`).
3. AI failures fall back to rule-based stubs. The app must never hard-crash on AI errors.
4. No secret is ever logged or rendered.
5. The web process must not call Telegram. Only the worker does.
6. The worker may call the web process internally (localhost) for PDF generation only.
