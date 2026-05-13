// Schedule router: flat list of reservations sorted by check-in date.

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface FlatReservation {
  id: string;
  property: { id: string; name: string };
  summary: string;
  startDate: Date;
  endDate: Date;
  sourceLabel: string;
  status: string;
  nextCheckIn: Date | null;
}

function computeNextCheckIn(
  reservation: { id: string; endDate: Date },
  allPropertyReservations: { id: string; startDate: Date; endDate: Date }[],
): Date | null {
  const next = allPropertyReservations
    .filter((r) => r.id !== reservation.id && r.startDate.getTime() > reservation.endDate.getTime())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];

  return next?.startDate ?? null;
}

export const scheduleRouter = router({
  list: publicProcedure
    .input(
      z.object({
        referenceDate: z.coerce.date().optional(),
        windowDays: z.number().int().min(1).max(365).optional().default(90),
      }),
    )
    .query(async ({ ctx, input }) => {
      const referenceDate = input.referenceDate ?? new Date();
      const cutoff = new Date(referenceDate.getTime() + input.windowDays * MS_PER_DAY);

      const reservations = await ctx.prisma.reservation.findMany({
        where: {
          startDate: { lte: cutoff },
          NOT: { status: 'BLOCKED', suppressionReason: 'MANUAL' },
        },
        include: {
          property: { select: { id: true, name: true } },
          source: { select: { label: true } },
        },
        orderBy: { startDate: 'asc' },
      });

      // Group by property to compute nextCheckIn
      const byProperty = new Map<string, { id: string; startDate: Date; endDate: Date }[]>();
      for (const r of reservations) {
        const key = r.property.id;
        if (!byProperty.has(key)) {
          byProperty.set(key, []);
        }
        byProperty.get(key)!.push({ id: r.id, startDate: r.startDate, endDate: r.endDate });
      }

      const rows: FlatReservation[] = reservations.map((r) => ({
        id: r.id,
        property: r.property,
        summary: r.summary,
        startDate: r.startDate,
        endDate: r.endDate,
        sourceLabel: r.source.label,
        status: r.status,
        nextCheckIn: computeNextCheckIn(r, byProperty.get(r.property.id) ?? []),
      }));

      return rows;
    }),

  byProperty: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        referenceDate: z.coerce.date().optional(),
        windowDays: z.number().int().min(1).max(365).optional().default(90),
      }),
    )
    .query(async ({ ctx, input }) => {
      const referenceDate = input.referenceDate ?? new Date();
      const cutoff = new Date(referenceDate.getTime() + input.windowDays * MS_PER_DAY);

      const reservations = await ctx.prisma.reservation.findMany({
        where: {
          startDate: { lte: cutoff },
          propertyId: input.propertyId,
          NOT: { status: 'BLOCKED', suppressionReason: 'MANUAL' },
        },
        include: {
          property: { select: { id: true, name: true } },
          source: { select: { label: true } },
        },
        orderBy: { startDate: 'asc' },
      });

      if (reservations.length === 0) {
        const property = await ctx.prisma.property.findUnique({
          where: { id: input.propertyId },
        });
        if (!property) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
      }

      // Group by property to compute nextCheckIn (only one property here)
      const byProperty = new Map<string, { id: string; startDate: Date; endDate: Date }[]>();
      for (const r of reservations) {
        const key = r.property.id;
        if (!byProperty.has(key)) {
          byProperty.set(key, []);
        }
        byProperty.get(key)!.push({ id: r.id, startDate: r.startDate, endDate: r.endDate });
      }

      const rows: FlatReservation[] = reservations.map((r) => ({
        id: r.id,
        property: r.property,
        summary: r.summary,
        startDate: r.startDate,
        endDate: r.endDate,
        sourceLabel: r.source.label,
        status: r.status,
        nextCheckIn: computeNextCheckIn(r, byProperty.get(r.property.id) ?? []),
      }));

      return rows;
    }),
});
