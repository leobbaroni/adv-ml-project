import { z } from 'zod';
import type { ShoppingItem } from '@app/db';
import { router, publicProcedure } from '../trpc';

function mapItem(item: ShoppingItem & { property: { name: string } }) {
  return {
    ...item,
    unitPrice: item.unitPrice
      ? (item.unitPrice as unknown as { toNumber(): number }).toNumber()
      : null,
  };
}

export const shoppingRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const items = await ctx.prisma.shoppingItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { property: { select: { name: true } } },
    });
    return items.map(mapItem);
  }),

  listByProperty: publicProcedure
    .input(z.object({ propertyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.shoppingItem.findMany({
        where: { propertyId: input.propertyId },
        orderBy: { createdAt: 'desc' },
        include: { property: { select: { name: true } } },
      });
      return items.map(mapItem);
    }),

  create: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        name: z.string().min(1),
        qty: z.number().int().min(1).default(1),
        unitPrice: z.number().positive().optional(),
        ikeaUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.shoppingItem.create({
        data: {
          propertyId: input.propertyId,
          name: input.name,
          qty: input.qty,
          unitPrice: input.unitPrice,
          ikeaUrl: input.ikeaUrl,
          source: 'WEB',
          status: 'PROPOSED',
        },
        include: { property: { select: { name: true } } },
      });
      return mapItem(item);
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['PROPOSED', 'ORDERED']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.shoppingItem.update({
        where: { id: input.id },
        data: { status: input.status },
        include: { property: { select: { name: true } } },
      });
      return mapItem(item);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.shoppingItem.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        qty: z.number().int().optional(),
        unitPrice: z.number().positive().optional(),
        ikeaUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const item = await ctx.prisma.shoppingItem.update({
        where: { id },
        data,
        include: { property: { select: { name: true } } },
      });
      return mapItem(item);
    }),
});
