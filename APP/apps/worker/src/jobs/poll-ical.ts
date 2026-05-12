// iCal polling job. Real fetch + parse + overlap detection lands in phase 2.

import { logger } from '../logger.js';

export async function schedulePollIcal() {
  const intervalMin = Number(process.env.ICAL_POLL_INTERVAL_MINUTES ?? 15);
  logger.info({ intervalMin }, '[poll-ical] scheduled (stub)');
  // Phase 1: queue.add('poll-ical', {}, { repeat: { every: intervalMin * 60_000 } })
}
