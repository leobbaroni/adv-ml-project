// iCal actions: trigger a poll, list events.

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { JobName, type PollIcalJob } from '@app/shared';
import { router, publicProcedure } from '../trpc';
import { getQueue } from '../../queue';

export const icalRouter = router({
  // Enqueue a poll-ical job for one source. Worker does the actual fetch.
  fetchNow: publicProcedure
    .input(z.object({ sourceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const source = await ctx.prisma.iCalSource.findUnique({
        where: { id: input.sourceId },
      });
      if (!source) throw new TRPCError({ code: 'NOT_FOUND' });

      const queue = getQueue();
      const payload: PollIcalJob = { sourceId: source.id };
      const job = await queue.add(JobName.POLL_ICAL, payload, {
        removeOnComplete: 100,
        removeOnFail: 100,
      });
      return { jobId: job.id ?? null };
    }),

  // Enqueue poll-ical jobs for ALL sources of a property.
  fetchAll: publicProcedure
    .input(z.object({ propertyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sources = await ctx.prisma.iCalSource.findMany({
        where: { propertyId: input.propertyId, active: true },
      });
      if (sources.length === 0) throw new TRPCError({ code: 'NOT_FOUND', message: 'No active sources' });

      const queue = getQueue();
      const jobs = await Promise.all(
        sources.map((source) =>
          queue.add(JobName.POLL_ICAL, { sourceId: source.id } as PollIcalJob, {
            removeOnComplete: 100,
            removeOnFail: 100,
          })
        )
      );
      return { count: jobs.length, jobIds: jobs.map((j) => j.id ?? null) };
    }),

  // List reservations for a property (most recent first by start date).
  reservationsByProperty: publicProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.reservation.findMany({
        where: { propertyId: input.propertyId },
        orderBy: { startDate: 'desc' },
        include: { source: { select: { label: true } } },
        take: 100,
      });
    }),

  // All reservations for a property ordered by startDate asc (for calendar).
  // Excludes SUPPRESSED reservations so the calendar only shows active bookings.
  calendarByProperty: publicProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.reservation.findMany({
        where: { propertyId: input.propertyId, status: { not: 'SUPPRESSED' } },
        orderBy: { startDate: 'asc' },
        include: { source: { select: { label: true } } },
      });
    }),

  // Pending overlaps that still need user review.
  pendingOverlapsByProperty: publicProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.overlapDecision.findMany({
        where: {
          propertyId: input.propertyId,
          revertedAt: null,
          acceptedByUser: false,
        },
        orderBy: { createdAt: 'desc' },
      });
    }),
});
