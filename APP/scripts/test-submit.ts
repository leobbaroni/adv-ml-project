import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../apps/web/lib/trpc/server';

const client = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
    }),
  ],
});

async function main() {
  try {
    const result = await client.checkin.submit.mutate({
      token: 'c80bfc64d573913f9a2f4b1ae08f686ad9586d8eebf76464',
      data: {
        guests: [
          {
            fullName: 'Jane Doe',
            country: 'Portugal',
            citizenId: '123456',
            dob: new Date('1990-01-01'),
          },
          {
            fullName: 'John Doe',
            country: 'Portugal',
            citizenId: '654321',
            dob: new Date('1985-05-15'),
          },
        ],
      },
    });
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
