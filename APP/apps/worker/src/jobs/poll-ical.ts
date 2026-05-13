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
    
    // Only notify once per error state change, to avoid spamming every 15 min.
    // We check if the previous state already had an error.
    if (!source.lastError) {
      await prisma.notification.create({
        data: {
          kind: 'OVERLAP',
          severity: 'CRITICAL',
          propertyId: source.propertyId,
          payload: { type: 'FETCH_ERROR', sourceId, error: result.error },
        },
      });
    }

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

  // 2. Handle exact duplicates first: group by exact dates, keep best summary, suppress rest
  const allPropertyReservations = await prisma.reservation.findMany({
    where: { propertyId: source.propertyId },
    include: { source: { select: { label: true } } },
  });
  const activeReservations = allPropertyReservations.filter((r) => r.status !== 'SUPPRESSED');

  const exactDupGroups = new Map<string, typeof activeReservations>();
  for (const r of activeReservations) {
    const key = `${r.startDate.getTime()}-${r.endDate.getTime()}`;
    if (!exactDupGroups.has(key)) exactDupGroups.set(key, []);
    exactDupGroups.get(key)!.push(r);
  }

  for (const group of exactDupGroups.values()) {
    if (group.length <= 1) continue;

    // Sort by summary length descending (best info first)
    const sorted = [...group].sort(
      (a, b) => b.summary.trim().length - a.summary.trim().length,
    );
    const kept = sorted[0]!;
    const dropped = sorted.slice(1);

    // Skip if a non-reverted decision already exists for this exact pair
    const allIds = [kept.id, ...dropped.map((d) => d.id)];
    const existing = await prisma.overlapDecision.findFirst({
      where: {
        reservationIds: { hasEvery: allIds },
        revertedAt: null,
      },
    });
    if (existing) continue;

    for (const d of dropped) {
      await prisma.reservation.update({
        where: { id: d.id },
        data: { status: 'SUPPRESSED', suppressionReason: 'DUPLICATE' },
      });
    }

    await prisma.overlapDecision.create({
      data: {
        propertyId: source.propertyId,
        reservationIds: [kept.id, ...dropped.map((d) => d.id)],
        action: 'DROP_DUPLICATE',
        createdByAi: false,
        acceptedByUser: true,
      },
    });
  }

  // 3. Overlap detection on the remaining active reservations
  const remainingActive = await prisma.reservation.findMany({
    where: { propertyId: source.propertyId, status: { not: 'SUPPRESSED' } },
    include: { source: { select: { label: true } } },
  });

  const sourcedEvents = remainingActive.map((r) => ({
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
    const resA = remainingActive.find(
      (r) => r.sourceId === overlap.a.sourceId && r.externalUid === overlap.a.externalUid,
    );
    const resB = remainingActive.find(
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

    if (overlap.kind === 'AIRBNB_SAME_DAY_BLOCK') {
      const blocked = overlap.a.status === 'BLOCKED' ? resA : resB;
      const confirmed = overlap.a.status === 'BLOCKED' ? resB : resA;

      await prisma.reservation.update({
        where: { id: blocked.id },
        data: { status: 'SUPPRESSED', suppressionReason: 'AIRBNB_SAME_DAY_BLOCK' },
      });

      // reservationIds order: [keep, drop]
      await prisma.overlapDecision.create({
        data: {
          propertyId: source.propertyId,
          reservationIds: [confirmed.id, blocked.id],
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

        // reservationIds order: [keep, drop]
        await prisma.overlapDecision.create({
          data: {
            propertyId: source.propertyId,
            reservationIds: [confirmed.id, blocked.id],
            action: 'SUPPRESS_BLOCK',
            createdByAi: false,
            acceptedByUser: true,
          },
        });
        continue;
      }

      // Both confirmed with different dates → escalate to AI / manual review
      let action: 'AI_PROPOSED' | 'KEEP' = 'AI_PROPOSED';
      let targetId: string | undefined;
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
          targetId = resolution.targetReservationId;
          aiRationale = resolution.rationale;
        }
      } catch (err) {
        logger.warn(
          { sourceId, propertyId: source.propertyId, error: err },
          '[poll-ical] AI overlap resolution failed, falling back to manual review',
        );
      }

      // reservationIds order: [keep, drop]
      const keepId = targetId === resA.id ? resB.id : resA.id;
      const dropId = targetId === resA.id ? resA.id : resB.id;

      const decision = await prisma.overlapDecision.create({
        data: {
          propertyId: source.propertyId,
          reservationIds: [keepId, dropId],
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
          payload: { overlapDecisionId: decision.id, reservationIds: [keepId, dropId] },
        },
      });

      // Phase 6: Telegram overlap alert
      try {
        const { getBot, sendOverlapAlert } = await import('../telegram/bot.js');
        await sendOverlapAlert(getBot(), decision, resA, resB);
      } catch (err) {
        logger.warn({ err }, '[poll-ical] failed to send Telegram overlap alert');
      }
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
