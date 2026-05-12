// tRPC root router. Add new sub-routers here.

import { router, publicProcedure } from './trpc';
import { propertyRouter } from './routers/property';
import { icalSourceRouter } from './routers/ical-source';
import { icalRouter } from './routers/ical';

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, ts: new Date().toISOString() })),
  property: propertyRouter,
  icalSource: icalSourceRouter,
  ical: icalRouter,
});

export type AppRouter = typeof appRouter;
