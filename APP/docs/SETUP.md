# Setup

## Prerequisites

- **Node 20.18+** — see `.nvmrc`
- **pnpm 9+** — `npm install -g pnpm`
- **Docker Desktop** — for Postgres + Redis

## First-time setup

```bash
# from repo root
cp .env.example .env
# edit .env: fill in TELEGRAM_BOT_TOKEN, OPENAI_API_KEY, AUTH_SECRET

docker compose up -d                 # postgres + redis
cd APP
pnpm install
pnpm db:generate                     # generate Prisma client
pnpm db:migrate                      # apply migrations
pnpm db:seed:local                   # load Triplex + Nanoush from src/seed.local.ts
pnpm dev                             # web on :3000, worker in same terminal
```

## Day-to-day

```bash
pnpm dev                             # web + worker, parallel
pnpm db:studio                       # open Prisma Studio
pnpm typecheck                       # all workspaces
pnpm test                            # vitest where present
pnpm infra:logs                      # docker compose logs -f
```

## Reset everything

```bash
pnpm infra:down                      # stop containers
docker volume rm adv-ml-project_pgdata adv-ml-project_redisdata
docker compose up -d
pnpm db:migrate
pnpm db:seed:local
```

## Troubleshooting

**`pnpm install` fails on Prisma postinstall**
Run `pnpm db:generate` after install completes. Prisma generates into `node_modules/@prisma/client`.

**Web can't reach DB**
`DATABASE_URL` must use `localhost` when running on the host (which is the default for `pnpm dev`). If you move web/worker into Docker, change it to `db`.

**Telegram bot not responding**
Check `pnpm infra:logs` and the worker terminal. Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_USER_ID` are set. Message `@userinfobot` to get your numeric ID.
