// iCal source CRUD. Belongs to a Property.

import { z } from 'zod';
import { ICalSourceCreateSchema } from '@app/shared';
import { router, publicProcedure } from '../trpc';

export const icalSourceRouter = router({
  create: publicProcedure.input(ICalSourceCreateSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.iCalSource.create({ data: input });
  }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.iCalSource.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
