// iCal polling job. Phase 1: fetch one source, parse, upsert reservations.
// Overlap detection and AI escalation land in Phase 2.

import { prisma } from '@app/db';
import { fetchICal, parseICal } from '@app/ical';
import type { PollIcalJob } from '@app/shared';
import { logger } from '../logger.js';

export async function schedulePollIcal() {
  const intervalMin = Number(process.env.ICAL_POLL_INTERVAL_MINUTES ?? 15);
  logger.info({ intervalMin }, '[poll-ical] scheduled (stub)');
  // Phase 2: queue.add('poll-ical', {}, { repeat: { every: intervalMin * 60_000 } })
}

export async function runPollIcal({ sourceId }: PollIcalJob): Promise<void> {
  const startedAt = Date.now();

  const source = await prisma.iCalSource.findUnique({ where: { id: sourceId } });
  if (!source) {
    logger.warn({ sourceId }, '[poll-ical] source not found');
    return;
  }
  if (!source.active) {
    logger.info({ sourceId }, '[poll-ical] source inactive, skipping');
    return;
  }

  const result = await fetchICal(source.url, source.lastEtag);

  if (!result.ok) {
    await prisma.iCalSource.update({
      where: { id: sourceId },
      data: { lastError: result.error, lastFetchedAt: new Date() },
    });
    logger.warn(
      { sourceId, propertyId: source.propertyId, error: result.error },
      '[poll-ical] fetch failed',
    );
    return;
  }

  if (result.notModified) {
    await prisma.iCalSource.update({
      where: { id: sourceId },
      data: { lastFetchedAt: new Date() },
    });
    logger.info({ sourceId, propertyId: source.propertyId }, '[poll-ical] not modified');
    return;
  }

  const events = parseICal(result.body);
  const now = new Date();

  for (const event of events) {
    await prisma.reservation.upsert({
      where: {
        sourceId_externalUid: { sourceId, externalUid: event.externalUid },
      },
      update: {
        summary: event.summary,
        startDate: event.startDate,
        endDate: event.endDate,
        lastSeenAt: now,
      },
      create: {
        propertyId: source.propertyId,
        sourceId,
        externalUid: event.externalUid,
        summary: event.summary,
        startDate: event.startDate,
        endDate: event.endDate,
        status: 'CONFIRMED',
        lastSeenAt: now,
      },
    });
  }

  await prisma.iCalSource.update({
    where: { id: sourceId },
    data: {
      lastFetchedAt: now,
      lastEtag: result.etag ?? null,
      lastError: null,
    },
  });

  logger.info(
    {
      sourceId,
      propertyId: source.propertyId,
      fetched: events.length,
      upserted: events.length,
      etag: result.etag ?? null,
      durationMs: Date.now() - startedAt,
    },
    '[poll-ical] done',
  );
}
