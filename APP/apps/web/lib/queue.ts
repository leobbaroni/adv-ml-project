// BullMQ producer for the web app. Lazy singleton so dev hot-reload doesn't
// open new Redis connections on every render.
//
// The worker consumes these jobs — see apps/worker/src/queue.ts.

import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAME } from '@app/shared';

type GlobalWithQueue = typeof globalThis & {
  __conciergeQueue?: Queue;
  __conciergeRedis?: IORedis;
};
const g = globalThis as GlobalWithQueue;

export function getQueue(): Queue {
  if (g.__conciergeQueue) return g.__conciergeQueue;

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue(QUEUE_NAME, { connection });

  g.__conciergeRedis = connection;
  g.__conciergeQueue = queue;
  return queue;
}
