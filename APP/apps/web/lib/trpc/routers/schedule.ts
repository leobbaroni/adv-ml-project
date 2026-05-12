// Schedule router: global dashboard and per-property schedule rows.

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface ScheduleProperty {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface ScheduleReservation {
  id: string;
  propertyId: string;
  sourceId: string;
  externalUid: string;
  summary: string;
  startDate: Date;
  endDate: Date;
  status: string;
  suppressionReason: string | null;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function buildRow(
  property: ScheduleProperty,
  reservations: ScheduleReservation[],
  overlaps: { id: string }[],
  referenceDate: Date,
) {
  const refTime = referenceDate.getTime();

  const current = reservations.find(
    (r) => r.startDate.getTime() <= refTime && r.endDate.getTime() > refTime,
  ) ?? null;

  const nextThreshold = current ? current.endDate.getTime() : refTime;
  const next =
    reservations.find(
      (r) => r.startDate.getTime() >= nextThreshold && r.id !== current?.id,
    ) ?? null;

  const turnoverDays =
    current && next
      ? Math.floor((next.startDate.getTime() - current.endDate.getTime()) / MS_PER_DAY)
      : null;

  return {
    property,
    current,
    next,
    turnoverDays,
    hasOverlap: overlaps.length > 0,
  };
}

export const scheduleRouter = router({
  global: publicProcedure
    .input(
      z.object({
        referenceDate: z.coerce.date().optional(),
        windowDays: z.number().int().min(1).max(365).optional().default(90),
      }),
    )
    .query(async ({ ctx, input }) => {
      const referenceDate = input.referenceDate ?? new Date();
      const cutoff = new Date(referenceDate.getTime() + input.windowDays * MS_PER_DAY);

      const properties = await ctx.prisma.property.findMany({
        include: {
          reservations: {
            where: { startDate: { lte: cutoff } },
            orderBy: { startDate: 'asc' },
          },
          overlaps: {
            where: {
              acceptedByUser: false,
              revertedAt: null,
            },
          },
        },
      });

      return properties.map((p) =>
        buildRow(
          { id: p.id, name: p.name, city: p.city, country: p.country },
          p.reservations,
          p.overlaps,
          referenceDate,
        ),
      );
    }),

  byProperty: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        referenceDate: z.coerce.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const referenceDate = input.referenceDate ?? new Date();
      const cutoff = new Date(referenceDate.getTime() + 90 * MS_PER_DAY);

      const property = await ctx.prisma.property.findUnique({
        where: { id: input.propertyId },
        include: {
          reservations: {
            where: { startDate: { lte: cutoff } },
            orderBy: { startDate: 'asc' },
          },
          overlaps: {
            where: {
              acceptedByUser: false,
              revertedAt: null,
            },
          },
        },
      });

      if (!property) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return buildRow(
        { id: property.id, name: property.name, city: property.city, country: property.country },
        property.reservations,
        property.overlaps,
        referenceDate,
      );
    }),
});
