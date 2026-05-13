// Property CRUD. Single-user, no auth. Validation via shared zod schemas.

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { PropertyCreateSchema } from '@app/shared';
import { router, publicProcedure } from '../trpc';

export const propertyRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.property.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { icalSources: true, reservations: true } } },
    });
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const property = await ctx.prisma.property.findUnique({
      where: { id: input.id },
      include: {
        icalSources: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!property) throw new TRPCError({ code: 'NOT_FOUND' });
    return property;
  }),

  create: publicProcedure.input(PropertyCreateSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.property.create({ data: input });
  }),

  update: publicProcedure
    .input(z.object({ id: z.string() }).and(PropertyCreateSchema.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.property.update({ where: { id }, data });
    }),

  checkInTemplate: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const property = await ctx.prisma.property.findUnique({
        where: { id: input.id },
        select: {
          wifiName: true,
          wifiPassword: true,
          lockCode: true,
          arrivalInstructions: true,
        },
      });
      if (!property) throw new TRPCError({ code: 'NOT_FOUND' });
      return property;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.property.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
