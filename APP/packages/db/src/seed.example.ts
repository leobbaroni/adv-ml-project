// Public seed file — safe to commit. Uses placeholder URLs.
// For real data, copy this to `seed.local.ts` (gitignored) and replace tokens.

import { PrismaClient, ICalLabel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[seed] Seeding placeholder data…');

  // Wipe in dependency order. Safe in dev only.
  await prisma.chatMessage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.shoppingItem.deleteMany();
  await prisma.propertyNote.deleteMany();
  await prisma.overlapDecision.deleteMany();
  await prisma.checkInForm.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.iCalSource.deleteMany();
  await prisma.property.deleteMany();

  const example = await prisma.property.create({
    data: {
      name: 'Example Apartment',
      address: '123 Example Street',
      city: 'Lisbon',
      country: 'Portugal',
      ownerName: 'Owner Name',
      icalSources: {
        create: [
          {
            label: ICalLabel.AIRBNB,
            url: 'https://example.com/airbnb-placeholder.ics',
            active: true,
          },
          {
            label: ICalLabel.BOOKING,
            url: 'https://example.com/booking-placeholder.ics',
            active: true,
          },
        ],
      },
    },
  });

  console.log(`[seed] Created property: ${example.name} (${example.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
