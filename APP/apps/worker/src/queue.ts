// BullMQ queue stub. Real jobs wired in phase 1+.

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from './logger.js';

export const QUEUE_NAME = 'realestate';

let queue: Queue | null = null;
let worker: Worker | null = null;

export async function startQueue() {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  // Ping once so we fail fast if Redis is down.
  await connection.ping();

  queue = new Queue(QUEUE_NAME, { connection });
  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      logger.info({ name: job.name, id: job.id }, '[queue] processing');
      // Phase 1+ adds real handlers (pollIcal, resolveOverlap, sendNotification).
      return { ok: true };
    },
    { connection },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, '[queue] job failed');
  });

  logger.info('[queue] connected');
}

export function getQueue(): Queue {
  if (!queue) throw new Error('[queue] not started');
  return queue;
}
