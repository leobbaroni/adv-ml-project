// iCal polling job. Clear old reservations for the source, insert fresh events,
// then run overlap detection independently.

import { resolveOverlap } from '@app/ai';
import { prisma } from '@app/db';
import { detectOverlaps, fetchICal, parseICal } from '@app/ical';
import { JobName, type PollIcalJob } from '@app/shared';
import { getQueue } from '../queue.js';
import { logger } from '../logger.js';

export async function schedulePollIcal() {
  const intervalMin = Number(process.env.ICAL_POLL_INTERVAL_MINUTES ?? 15);

  try {
    const sources = await prisma.iCalSource.findMany({ where: { active: true } });
    const queue = getQueue();

    for (const source of sources) {
      await queue.add(JobName.POLL_ICAL, { sourceId: source.id }, {
        repeat: { every: intervalMin * 60_000 },
        jobId: `poll-ical-${source.id}`,
        removeOnComplete: 10,
        removeOnFail: 10,
      });
    }

    logger.info({ intervalMin, count: sources.length }, '[poll-ical] scheduled');
  } catch (err) {
    logger.error({ err }, '[poll-ical] schedule failed');
  }
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

  // 1. Clear all old reservations for this source
  const deleted = await prisma.reservation.deleteMany({
    where: { sourceId },
  });

  // 2. Insert fresh events
  for (const event of events) {
    await prisma.reservation.create({
      data: {
        propertyId: source.propertyId,
        sourceId,
        externalUid: event.externalUid,
        summary: event.summary,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        lastSeenAt: now,
      },
    });
  }

  // 3. Overlap detection runs independently on the fresh data
  const reservations = await prisma.reservation.findMany({
    where: { propertyId: source.propertyId },
    include: { source: { select: { label: true } } },
  });

  const sourcedEvents = reservations
    .filter((r) => r.status !== 'SUPPRESSED')
    .map((r) => ({
      externalUid: r.externalUid,
      summary: r.summary,
      startDate: r.startDate,
      endDate: r.endDate,
      sourceId: r.sourceId,
      sourceLabel: r.source.label,
      status: r.status as 'CONFIRMED' | 'BLOCKED',
    }));

  const overlaps = detectOverlaps(sourcedEvents);

  for (const overlap of overlaps) {
    const resA = reservations.find(
      (r) => r.sourceId === overlap.a.sourceId && r.externalUid === overlap.a.externalUid,
    );
    const resB = reservations.find(
      (r) => r.sourceId === overlap.b.sourceId && r.externalUid === overlap.b.externalUid,
    );
    if (!resA || !resB) continue;

    const existing = await prisma.overlapDecision.findFirst({
      where: {
        reservationIds: { hasEvery: [resA.id, resB.id] },
        revertedAt: null,
      },
    });
    if (existing) continue;

    if (overlap.kind === 'EXACT_DUPLICATE') {
      const aSummaryLen = overlap.a.summary.trim().length;
      const bSummaryLen = overlap.b.summary.trim().length;
      const kept = aSummaryLen >= bSummaryLen ? resA : resB;
      const dropped = aSummaryLen >= bSummaryLen ? resB : resA;

      await prisma.reservation.update({
        where: { id: dropped.id },
        data: { status: 'SUPPRESSED', suppressionReason: 'DUPLICATE' },
      });

      await prisma.overlapDecision.create({
        data: {
          propertyId: source.propertyId,
          reservationIds: [kept.id, dropped.id],
          action: 'DROP_DUPLICATE',
          createdByAi: false,
          acceptedByUser: true,
        },
      });
    } else if (overlap.kind === 'AIRBNB_SAME_DAY_BLOCK') {
      const blocked = overlap.a.status === 'BLOCKED' ? resA : resB;
      const confirmed = overlap.a.status === 'BLOCKED' ? resB : resA;

      await prisma.reservation.update({
        where: { id: blocked.id },
        data: { status: 'SUPPRESSED', suppressionReason: 'AIRBNB_SAME_DAY_BLOCK' },
      });

      await prisma.overlapDecision.create({
        data: {
          propertyId: source.propertyId,
          reservationIds: [blocked.id, confirmed.id],
          action: 'SUPPRESS_BLOCK',
          createdByAi: false,
          acceptedByUser: true,
        },
      });
    } else if (overlap.kind === 'AMBIGUOUS') {
      let action: 'AI_PROPOSED' | 'KEEP' = 'AI_PROPOSED';
      let aiRationale = 'AI unavailable; manual review needed.';

      try {
        const resolution = await resolveOverlap({
          events: [
            {
              id: resA.id,
              summary: resA.summary,
              startDate: resA.startDate,
              endDate: resA.endDate,
              sourceLabel: resA.source.label,
            },
            {
              id: resB.id,
              summary: resB.summary,
              startDate: resB.startDate,
              endDate: resB.endDate,
              sourceLabel: resB.source.label,
            },
          ],
        });

        if (resolution.action === 'KEEP_BOTH') {
          action = 'KEEP';
          aiRationale = resolution.rationale;
        } else if (resolution.action === 'SUPPRESS') {
          action = 'AI_PROPOSED';
          aiRationale = resolution.rationale;
        }
      } catch (err) {
        logger.warn(
          { sourceId, propertyId: source.propertyId, error: err },
          '[poll-ical] AI overlap resolution failed, falling back to manual review',
        );
      }

      const decision = await prisma.overlapDecision.create({
        data: {
          propertyId: source.propertyId,
          reservationIds: [resA.id, resB.id],
          action,
          createdByAi: true,
          acceptedByUser: false,
          aiRationale,
        },
      });

      await prisma.notification.create({
        data: {
          kind: 'OVERLAP',
          severity: 'WARNING',
          propertyId: source.propertyId,
          payload: { overlapDecisionId: decision.id, reservationIds: [resA.id, resB.id] },
        },
      });
    }
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
      deleted: deleted.count,
      created: events.length,
      overlaps: overlaps.length,
      etag: result.etag ?? null,
      durationMs: Date.now() - startedAt,
    },
    '[poll-ical] done',
  );
}
