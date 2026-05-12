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
});
