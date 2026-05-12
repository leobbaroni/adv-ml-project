import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const notificationRouter = router({
  unreadCount: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.count({
      where: { readAt: null },
    });
  }),

  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        property: {
          select: { name: true },
        },
      },
    });
  }),

  markRead: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.notification.update({
        where: { id: input.id },
        data: { readAt: new Date() },
      });
    }),

  markAllRead: publicProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.notification.updateMany({
      where: { readAt: null },
      data: { readAt: new Date() },
    });
  }),
});
