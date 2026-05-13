// Check-in form router: host edits, guest submits via magic link, PDF generation.

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { CheckInFormSchema } from '@app/shared';
import { router, publicProcedure } from '../trpc';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function generateToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const checkinRouter = router({
  listByProperty: publicProcedure
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
          propertyId: input.propertyId,
          status: { not: 'SUPPRESSED' },
          endDate: { gte: referenceDate },
          startDate: { lte: cutoff },
        },
        include: {
          checkInForm: { include: { guests: true } },
          source: { select: { label: true } },
        },
        orderBy: { startDate: 'asc' },
      });
      return reservations;
    }),

  byToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const form = await ctx.prisma.checkInForm.findUnique({
        where: { guestLinkToken: input.token },
        include: {
          guests: true,
          reservation: {
            include: {
              property: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  country: true,
                  wifiName: true,
                  wifiPassword: true,
                  lockCode: true,
                  arrivalInstructions: true,
                  ownerName: true,
                  ownerContact: true,
                },
              },
              source: { select: { label: true } },
            },
          },
        },
      });
      if (!form) throw new TRPCError({ code: 'NOT_FOUND' });
      if (form.guestLinkExpiresAt && form.guestLinkExpiresAt < new Date()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Link expired' });
      }
      return form;
    }),

  byReservationId: publicProcedure
    .input(z.object({ reservationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const form = await ctx.prisma.checkInForm.findUnique({
        where: { reservationId: input.reservationId },
        include: { guests: true },
      });
      return form ?? null;
    }),

  update: publicProcedure
    .input(
      z.object({
        reservationId: z.string(),
        data: CheckInFormSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.checkInForm.findUnique({
        where: { reservationId: input.reservationId },
      });
      if (existing) {
        const updated = await ctx.prisma.checkInForm.update({
          where: { reservationId: input.reservationId },
          data: { filledVia: 'WEB' },
        });
        if (input.data.guests) {
          await ctx.prisma.checkInGuest.deleteMany({ where: { checkInFormId: existing.id } });
          await ctx.prisma.checkInGuest.createMany({
            data: input.data.guests.map((g) => ({ ...g, checkInFormId: existing.id })),
          });
        }
        return updated;
      }
      const created = await ctx.prisma.checkInForm.create({
        data: {
          reservationId: input.reservationId,
          filledVia: 'WEB',
        },
      });
      if (input.data.guests) {
        await ctx.prisma.checkInGuest.createMany({
          data: input.data.guests.map((g) => ({ ...g, checkInFormId: created.id })),
        });
      }
      return created;
    }),

  generateLink: publicProcedure
    .input(z.object({ reservationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const reservation = await ctx.prisma.reservation.findUnique({
        where: { id: input.reservationId },
        include: { property: true },
      });
      if (!reservation) throw new TRPCError({ code: 'NOT_FOUND' });

      const token = generateToken();
      const expiresAt = new Date(reservation.endDate.getTime() + 7 * 24 * 60 * 60 * 1000);

      const existing = await ctx.prisma.checkInForm.findUnique({
        where: { reservationId: input.reservationId },
      });

      if (existing) {
        return ctx.prisma.checkInForm.update({
          where: { reservationId: input.reservationId },
          data: { guestLinkToken: token, guestLinkExpiresAt: expiresAt },
        });
      }

      return ctx.prisma.checkInForm.create({
        data: {
          reservationId: input.reservationId,
          guestLinkToken: token,
          guestLinkExpiresAt: expiresAt,
        },
      });
    }),

  submit: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        data: CheckInFormSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const form = await ctx.prisma.checkInForm.findUnique({
        where: { guestLinkToken: input.token },
        include: { reservation: { select: { propertyId: true } } },
      });
      if (!form) throw new TRPCError({ code: 'NOT_FOUND' });
      if (form.guestLinkExpiresAt && form.guestLinkExpiresAt < new Date()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Link expired' });
      }

      await ctx.prisma.checkInGuest.deleteMany({ where: { checkInFormId: form.id } });
      await ctx.prisma.checkInGuest.createMany({
        data: input.data.guests.map((g) => ({ ...g, checkInFormId: form.id })),
      });

      const updated = await ctx.prisma.checkInForm.update({
        where: { id: form.id },
        data: {
          filledVia: 'GUEST_LINK',
          submittedAt: new Date(),
        },
      });

      await ctx.prisma.notification.create({
        data: {
          kind: 'CHAT_REQUEST',
          severity: 'INFO',
          propertyId: form.reservation.propertyId,
          payload: { type: 'CHECKIN_SUBMITTED', reservationId: form.reservationId },
        },
      });

      return updated;
    }),
});
