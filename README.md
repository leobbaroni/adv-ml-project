# Rental Buddy


<p align="center">
  <img width="2752" height="1536" alt="Gemini_Generated_Image_dlgbbidlgbbidlgb-clean" src="https://github.com/user-attachments/assets/e7046ef7-c735-454a-b8e1-312a1d86fe23" />

</p>

<p align="center">
  <strong>AI-driven channel manager for short-term rental hosts</strong>
</p>

<p align="center">
  <a href="#license"><img src="https://img.shields.io/badge/license-Proprietary-red.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/stars-%E2%AD%90%20us%20on%20GitHub-yellow.svg" alt="Stars"></a>
  <a href="#"><img src="https://img.shields.io/badge/pnpm-9+-ff69b4.svg" alt="pnpm"></a>
  <a href="#"><img src="https://img.shields.io/badge/Node-20.18+-green.svg" alt="Node"></a>
</p>

---

## One-Command AI Setup

Don't want to read the manual? Paste this into any AI agent (Claude, ChatGPT, Cursor, etc.):

````text
You are an expert DevOps engineer. Set up the Rental Buddy project from scratch.

1. Clone the repository: git clone <repo-url> && cd adv-ml-project
2. Copy environment variables: cp .env.example .env
3. Start Docker services: docker compose up -d
4. Install dependencies: cd APP && pnpm install
5. Set up the database:
   - pnpm db:generate
   - pnpm db:migrate
6. Seed local data: pnpm db:seed:local
7. Start development servers: pnpm dev
8. Confirm the web app is running at http://localhost:3000

Report back any errors you encounter.
````

---

## What is Rental Buddy?

Rental Buddy is an intelligent channel manager built for short-term rental hosts who list across multiple platforms. It merges Airbnb, Booking.com, VRBO, and Interhome iCal calendars in real time, uses AI to resolve double-bookings and scheduling conflicts, and lets hosts manage their entire portfolio from a single Telegram chat.

No more switching between tabs. No more manual calendar cross-checking. No more accidental double bookings.

---

## Key Features

- **Real-Time Calendar Sync** — Merges iCal feeds from Airbnb, Booking.com, VRBO, and Interhome into a unified timeline
- **AI Conflict Resolution** — Detects overlapping bookings and proposes resolutions automatically
- **Telegram Bot Interface** — Manage your portfolio, check availability, and receive alerts directly in Telegram
- **Smart Scheduling** — Visual window picker with overlap highlighting (red conflicts, grey upcoming)
- **Printable Reports** — Generate clean, host-ready schedule tables for cleaning crews or property managers
- **Multi-Property Dashboard** — View all your listings in one place with unified analytics
- **Guest Form Automation** — Auto-generate check-in forms and welcome packs
- **AI Shopping Orders** — Send "buy 6 cups for Triplex" via Telegram; AI extracts items, matches them to real IKEA products with live pricing, and tracks orders per property
- **AI Repair Estimates** — Message "repair bathroom door" via Telegram; AI generates a detailed cost breakdown (materials, labor, other) with Portugal-specific pricing

---

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Next.js   │──────▶    tRPC     │──────▶   Prisma    │
│   Web App   │◀─────│   Router    │◀─────│  Postgres   │
│   :3000     │      └─────────────┘      └─────────────┘
└─────────────┘
       │
       │              ┌─────────────┐      ┌─────────────┐
       └─────────────▶│   Worker    │──────▶   BullMQ    │
                      │   (Node)    │      │   (Redis)   │
                      └─────────────┘      └─────────────┘
                            │
                            ▼
                      ┌─────────────┐
                      │   grammY    │
                      │  Telegram   │
                      └─────────────┘
```

- **Web App**: Next.js 15 with App Router serves the UI and tRPC API
- **Worker**: Background Node process polls iCal feeds and processes Telegram commands via BullMQ queues
- **Database**: Postgres 16 persists properties, bookings, and calendar events
- **Cache/Queue**: Redis powers BullMQ job scheduling and real-time state
- **AI Layer**: OpenAI-compatible client routes to the configured provider for overlap resolution and natural-language commands

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), tRPC, Tailwind CSS, shadcn/ui, Framer Motion, Spline 3D |
| **Backend** | Node.js, tRPC routers, Prisma ORM |
| **Worker** | Node.js, BullMQ (Redis), grammY (Telegram Bot API) |
| **Database** | Postgres 16 |
| **AI** | OpenAI-compatible client (swappable via `AI_MODEL` env var) |
| **Tooling** | pnpm workspaces, Turbo, TypeScript |

---

## Quick Start

**Prerequisites:** Node 20.18+, pnpm 9+, Docker Desktop

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd adv-ml-project

# 2. Copy environment template
cp .env.example .env

# 3. Start Postgres + Redis
docker compose up -d

# 4. Install dependencies
cd APP
pnpm install

# 5. Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate

# 6. Seed local data
pnpm db:seed:local

# 7. Start dev servers (web + worker)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The worker auto-reloads on file changes via `tsx watch`. The web dev server runs on port `3000`.

---

## AI Integration

Rental Buddy uses an OpenAI-compatible client for all AI operations — calendar conflict resolution, natural-language Telegram commands, and guest communication drafting.

The provider and model are fully swappable via environment variables. See [`docs/AI-INTEGRATION.md`](docs/AI-INTEGRATION.md) for configuration details, prompt architecture, and extending the AI pipeline.

---

## Screenshots

<p align="center">
  <img width="2848" height="1670" alt="image" src="https://github.com/user-attachments/assets/20d6da5f-ecfa-47db-a741-615a71f8a490" />
  <img width="2842" height="1680" alt="image" src="https://github.com/user-attachments/assets/0bf021fd-7d87-4ba2-837a-790bf2a31928" />
  <img width="2842" height="1676" alt="image" src="https://github.com/user-attachments/assets/6abcd2ce-eddc-4b84-a244-7a21f04358cf" />
  <img width="2835" height="1284" alt="image" src="https://github.com/user-attachments/assets/69695b9f-4e7c-4fdf-8731-d68dff92ddac" />
  <img width="2841" height="1325" alt="image" src="https://github.com/user-attachments/assets/e683a911-c2c8-447c-b94c-b1afc22d7322" />
</p>

---

## Security

- **iCal URLs are secrets.** They contain HMAC and session tokens that grant read access to your booking calendars. Never log them, never render them client-side, never commit them.
- **Telegram bot tokens** should be rotated via `@BotFather` before production use.
- **API keys** live only in `.env` (gitignored by default). Verify `.env` remains untracked after every clone.
- **Seed files** containing real iCal access tokens are gitignored. Confirm this before committing.

---

## Contributing

We welcome contributions. Please open an issue first to discuss what you would like to change, or submit a pull request with a clear description of the improvement.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

**All Rights Reserved.**

This code may not be used, copied, modified, or distributed without explicit written permission from the author.

For licensing inquiries, please contact the repository owner.

---

## Documentation

- [`docs/SETUP.md`](APP/docs/SETUP.md) — Detailed installation and run instructions
- [`docs/TELEGRAM-BOT-SETUP.md`](APP/docs/TELEGRAM-BOT-SETUP.md) — Creating and configuring your Telegram bot
- [`docs/ICAL-OVERLAP-RULES.md`](APP/docs/ICAL-OVERLAP-RULES.md) — How the merge engine resolves conflicts
- [`docs/AI-INTEGRATION.md`](APP/docs/AI-INTEGRATION.md) — Full AI pipeline: prompts, schemas, fallbacks
- [`docs/GENAI-LOG.md`](APP/docs/GENAI-LOG.md) — GenAI usage log and unit economics
- [`.agents/knowledge-base/ARCHITECTURE.md`](.agents/knowledge-base/ARCHITECTURE.md) — System topology and data flow
- [`.agents/knowledge-base/DATA-MODEL.md`](.agents/knowledge-base/DATA-MODEL.md) — Prisma schema intent and entity relationships
- [`.agents/knowledge-base/ICAL-MERGE-SPEC.md`](.agents/knowledge-base/ICAL-MERGE-SPEC.md) — Technical specification for the overlap engine
- [`.agents/knowledge-base/DESIGN-LANGUAGE.md`](.agents/knowledge-base/DESIGN-LANGUAGE.md) — Visual design system and UI conventions

---

**⚠️ Legal Notice:** This repository and all its contents are proprietary and confidential. Unauthorized use, copying, modification, or distribution is strictly prohibited without explicit written permission.
