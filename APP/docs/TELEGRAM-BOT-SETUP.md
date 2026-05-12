# Telegram Bot Setup

## 1. Create the bot

1. On Telegram, message [`@BotFather`](https://t.me/BotFather).
2. Send `/newbot`.
3. Pick a display name (e.g. "Concierge").
4. Pick a username ending in `bot` (e.g. `my_concierge_bot`).
5. Copy the token BotFather returns. Looks like `123456:ABC-DEF...`.

Paste into `.env`:

```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
```

## 2. Find your numeric user ID

In v1 the bot only responds to you (single-user). It needs your numeric Telegram ID.

1. Message [`@userinfobot`](https://t.me/userinfobot).
2. It replies with your ID (e.g. `987654321`).

Paste into `.env`:

```
TELEGRAM_ADMIN_USER_ID=987654321
```

## 3. Verify

```bash
pnpm dev
```

In the worker terminal you should see:

```
[telegram] long-polling started   username=my_concierge_bot
```

Open the bot in Telegram, send `/start`. You should get a reply.

## Rotating the token

If the token leaks: BotFather → `/revoke` → pick the bot → paste new token into `.env`.

## Why long-polling instead of webhook

Webhooks need a public HTTPS URL. For local development that means ngrok or similar — extra friction. Long-polling works from your laptop with no setup. We'll add webhook support if/when we deploy.
