// iCal polling job. Upsert reservations by date to preserve IDs and overlap decisions,
// then run overlap detection and auto-resolve simple cases.

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

async function hasAcceptedSuppressionDecision(reservationId: string): Promise<boolean> {
  const decision = await prisma.overlapDecision.findFirst({
    where: {
      reservationIds: { has: reservationId },
      acceptedByUser: true,
      revertedAt: null,
    },
  });
  return decision !== null;
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

  // 1. Upsert reservations by (sourceId, startDate, endDate) to preserve IDs
  const existing = await prisma.reservation.findMany({ where: { sourceId } });
  const matchedIds = new Set<string>();

  for (const event of events) {
    const match = existing.find(
      (r) =>
        r.startDate.getTime() === event.startDate.getTime() &&
        r.endDate.getTime() === event.endDate.getTime(),
    );

    if (match) {
      const keepSuppressed =
        match.status === 'SUPPRESSED' && (await hasAcceptedSuppressionDecision(match.id));

      await prisma.reservation.update({
        where: { id: match.id },
        data: {
          externalUid: event.externalUid,
          summary: event.summary,
          status: keepSuppressed ? 'SUPPRESSED' : event.status,
          suppressionReason: keepSuppressed ? match.suppressionReason : null,
          lastSeenAt: now,
        },
      });
      matchedIds.add(match.id);
    } else {
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
  }

  // Delete stale reservations that weren't matched
  const staleIds = existing.filter((r) => !matchedIds.has(r.id)).map((r) => r.id);
  if (staleIds.length > 0) {
    await prisma.reservation.deleteMany({ where: { id: { in: staleIds } } });
  }

  // 2. Overlap detection on the current data
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

    const existingDecision = await prisma.overlapDecision.findFirst({
      where: {
        reservationIds: { hasEvery: [resA.id, resB.id] },
        revertedAt: null,
      },
    });
    if (existingDecision) continue;

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
      // Auto-suppress if one is BLOCKED and the other is CONFIRMED
      const aBlocked = resA.status === 'BLOCKED';
      const bBlocked = resB.status === 'BLOCKED';
      const aConfirmed = resA.status === 'CONFIRMED';
      const bConfirmed = resB.status === 'CONFIRMED';

      if ((aBlocked && bConfirmed) || (bBlocked && aConfirmed)) {
        const blocked = aBlocked ? resA : resB;
        const confirmed = aBlocked ? resB : resA;

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
        continue;
      }

      // Both confirmed with different dates → escalate to AI / manual review
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
      updated: matchedIds.size,
      created: events.length - matchedIds.size,
      deleted: staleIds.length,
      overlaps: overlaps.length,
      etag: result.etag ?? null,
      durationMs: Date.now() - startedAt,
    },
    '[poll-ical] done',
  );
}
