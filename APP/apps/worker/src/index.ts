// Worker entrypoint. Boots:
//   - BullMQ queue connection (Redis)
//   - iCal polling job (every 15 min, configurable)
//   - Telegram long-polling bot (no public URL needed)
//
// All three start in parallel. The process stays alive until SIGINT/SIGTERM.

import './env.js';
import { logger } from './logger.js';
import { startQueue } from './queue.js';
import { startTelegramBot } from './telegram/bot.js';
import { schedulePollIcal } from './jobs/poll-ical.js';

async function main() {
  logger.info('[worker] starting');

  // Queue is optional in phase 0 — only logs if Redis is reachable.
  await startQueue().catch((err) => {
    logger.warn({ err: err.message }, '[worker] queue init failed (continuing without queue)');
  });

  await schedulePollIcal().catch((err) => {
    logger.warn({ err: err.message }, '[worker] iCal poller scheduling failed');
  });

  await startTelegramBot().catch((err) => {
    logger.warn({ err: err.message }, '[worker] telegram bot not started');
  });

  logger.info('[worker] ready');
}

main().catch((err) => {
  logger.error({ err: err.message, stack: err.stack }, '[worker] fatal');
  process.exit(1);
});

const shutdown = (signal: string) => {
  logger.info({ signal }, '[worker] shutting down');
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
