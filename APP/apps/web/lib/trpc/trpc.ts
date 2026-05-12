// tRPC instance + reusable builders. Kept separate from server.ts so router
// modules can import { router, publicProcedure } without circular deps.

import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
