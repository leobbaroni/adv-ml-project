// BullMQ queue for the worker process. Single queue, job-name routing.

import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAME, JobName, PollIcalJobSchema } from '@app/shared';
import { logger } from './logger.js';
import { runPollIcal } from './jobs/poll-ical.js';

export { QUEUE_NAME };

type JobResult = { ok: true } | { ok: false; error: string };

let queue: Queue | null = null;
let worker: Worker | null = null;

export async function processJob(job: Job): Promise<JobResult> {
  switch (job.name) {
    case JobName.POLL_ICAL: {
      const payload = PollIcalJobSchema.parse(job.data);
      await runPollIcal(payload);
      return { ok: true };
    }
    default: {
      logger.warn({ name: job.name, id: job.id }, '[queue] unknown job');
      return { ok: false, error: 'unknown-job' };
    }
  }
}

export async function startQueue() {
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  // Ping once so we fail fast if Redis is down.
  await connection.ping();

  queue = new Queue(QUEUE_NAME, { connection });
  worker = new Worker(QUEUE_NAME, processJob, { connection, concurrency: 2 });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, name: job?.name, err: err.message }, '[queue] job failed');
  });

  logger.info('[queue] connected');
}

export function getQueue(): Queue {
  if (!queue) throw new Error('[queue] not started');
  return queue;
}
