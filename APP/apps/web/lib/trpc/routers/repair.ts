import { z } from 'zod';
import type { RepairLineItem } from '@app/shared';
import { router, publicProcedure } from '../trpc';

export const repairRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const items = await ctx.prisma.repairEstimate.findMany({
      orderBy: { createdAt: 'desc' },
      include: { property: { select: { name: true } } },
    });
    return items.map((item) => ({
      ...item,
      lineItems: item.lineItems as RepairLineItem[],
    }));
  }),

  listByProperty: publicProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.repairEstimate.findMany({
        where: { propertyId: input.propertyId },
        orderBy: { createdAt: 'desc' },
        include: { property: { select: { name: true } } },
      });
      return items.map((item) => ({
        ...item,
        lineItems: item.lineItems as RepairLineItem[],
      }));
    }),

  create: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        description: z.string().min(1),
        lineItems: z.array(
          z.object({
            name: z.string().min(1),
            cost: z.number().positive(),
            category: z.enum(['MATERIALS', 'LABOR', 'OTHER']),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.repairEstimate.create({
        data: {
          propertyId: input.propertyId,
          description: input.description,
          lineItems: input.lineItems,
          source: 'WEB',
          status: 'PROPOSED',
        },
        include: { property: { select: { name: true } } },
      });
      return {
        ...item,
        lineItems: item.lineItems as RepairLineItem[],
      };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string().optional(),
        lineItems: z.array(
          z.object({
            name: z.string().min(1),
            cost: z.number().positive(),
            category: z.enum(['MATERIALS', 'LABOR', 'OTHER']),
          }),
        ).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const item = await ctx.prisma.repairEstimate.update({
        where: { id },
        data,
        include: { property: { select: { name: true } } },
      });
      return {
        ...item,
        lineItems: item.lineItems as RepairLineItem[],
      };
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['PROPOSED', 'QUOTED', 'APPROVED', 'COMPLETED']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.repairEstimate.update({
        where: { id: input.id },
        data: { status: input.status },
        include: { property: { select: { name: true } } },
      });
      return {
        ...item,
        lineItems: item.lineItems as RepairLineItem[],
      };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.repairEstimate.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
