// Telegram bot using grammY in long-polling mode.
// In phase 0 we wire only the framework, plus a single /start echo for verification.
// Real handlers (shopping, overlap, forms) arrive in phases 6–8.

import { Bot } from 'grammy';
import { logger } from '../logger.js';

let bot: Bot | null = null;

export async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('[telegram] TELEGRAM_BOT_TOKEN missing — bot disabled');
    return;
  }

  const adminId = process.env.TELEGRAM_ADMIN_USER_ID;
  if (!adminId) {
    logger.warn('[telegram] TELEGRAM_ADMIN_USER_ID missing — bot will respond to anyone');
  }

  bot = new Bot(token);

  // Admin-only gate. Anyone else gets silence.
  bot.use(async (ctx, next) => {
    if (adminId && String(ctx.from?.id) !== adminId) return;
    await next();
  });

  bot.command('start', (ctx) =>
    ctx.reply('Concierge online. Phase 0 scaffold — real commands ship in phases 6–8.'),
  );

  bot.command('ping', (ctx) => ctx.reply('pong'));

  // Fire-and-forget long-polling. grammY handles backoff internally.
  bot.start({
    onStart: (me) => logger.info({ username: me.username }, '[telegram] long-polling started'),
  });
}

export function getBot(): Bot {
  if (!bot) throw new Error('[telegram] bot not started');
  return bot;
}
