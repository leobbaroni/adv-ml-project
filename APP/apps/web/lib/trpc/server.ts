// Minimal tRPC server stub. Real routers land in phase 1.
// This exists so the import path is stable from day one.

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, ts: new Date().toISOString() })),
});

export type AppRouter = typeof appRouter;
