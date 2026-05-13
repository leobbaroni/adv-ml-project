// tRPC router for overlap decisions: history, accept, revert.

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { OverlapAction } from '@app/db';
import { router, publicProcedure } from '../trpc';

export const overlapRouter = router({
  // History of all overlap decisions for a property, with related reservations.
  history: publicProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const decisions = await ctx.prisma.overlapDecision.findMany({
        where: { propertyId: input.propertyId },
        orderBy: { createdAt: 'desc' },
      });

      const allReservationIds = decisions.flatMap((d) => d.reservationIds);
      const uniqueIds = [...new Set(allReservationIds)];

      const reservations =
        uniqueIds.length > 0
          ? await ctx.prisma.reservation.findMany({
              where: { id: { in: uniqueIds } },
              include: { source: { select: { label: true } } },
            })
          : [];

      const resMap = new Map(reservations.map((r) => [r.id, r]));

      return decisions.map((d) => ({
        ...d,
        reservations: d.reservationIds
          .map((id) => resMap.get(id))
          .filter((r): r is NonNullable<typeof r> => r !== undefined),
      }));
    }),

  // Accept an overlap decision.
  accept: publicProcedure
    .input(z.object({ decisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const decision = await ctx.prisma.overlapDecision.findUnique({
        where: { id: input.decisionId },
      });

      if (!decision) throw new TRPCError({ code: 'NOT_FOUND' });

      const updated = await ctx.prisma.overlapDecision.update({
        where: { id: input.decisionId },
        data: { acceptedByUser: true },
      });

      // For AI_PROPOSED decisions, suppress the second reservation as the target.
      if (
        decision.action === OverlapAction.AI_PROPOSED &&
        decision.reservationIds.length >= 2
      ) {
        const targetId = decision.reservationIds[1];
        await ctx.prisma.reservation.update({
          where: { id: targetId },
          data: {
            status: 'SUPPRESSED',
            suppressionReason: 'AI_RESOLVED',
          },
        });
      }

      return updated;
    }),

  // Revert an overlap decision and restore all involved reservations.
  revert: publicProcedure
    .input(z.object({ decisionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const decision = await ctx.prisma.overlapDecision.findUnique({
        where: { id: input.decisionId },
      });

      if (!decision) throw new TRPCError({ code: 'NOT_FOUND' });

      const updated = await ctx.prisma.overlapDecision.update({
        where: { id: input.decisionId },
        data: { revertedAt: new Date() },
      });

      // Restore all involved reservations to CONFIRMED regardless of suppression reason.
      for (const reservationId of decision.reservationIds) {
        await ctx.prisma.reservation.update({
          where: { id: reservationId },
          data: { status: 'CONFIRMED', suppressionReason: null },
        });
      }

      return updated;
    }),
});
