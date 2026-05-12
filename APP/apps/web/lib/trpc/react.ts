// Client-side tRPC hooks. Use these in client components:
//   const { data } = trpc.property.list.useQuery();

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from './server';

export const trpc = createTRPCReact<AppRouter>();
