// tRPC request context. No auth in Phase 1 — single-user localhost.
// Exposes the Prisma client to all procedures.

import { prisma } from '@app/db';

export function createContext() {
  return { prisma };
}

export type Context = ReturnType<typeof createContext>;
