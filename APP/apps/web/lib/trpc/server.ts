// tRPC root router. Add new sub-routers here.

import { router, publicProcedure } from './trpc';
import { propertyRouter } from './routers/property';
import { icalSourceRouter } from './routers/ical-source';
import { icalRouter } from './routers/ical';
import { notificationRouter } from './routers/notification';
import { overlapRouter } from './routers/overlap';
import { scheduleRouter } from './routers/schedule';
import { checkinRouter } from './routers/checkin';
import { shoppingRouter } from './routers/shopping';

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, ts: new Date().toISOString() })),
  property: propertyRouter,
  icalSource: icalSourceRouter,
  ical: icalRouter,
  notification: notificationRouter,
  overlap: overlapRouter,
  schedule: scheduleRouter,
  checkin: checkinRouter,
  shopping: shoppingRouter,
});

export type AppRouter = typeof appRouter;
