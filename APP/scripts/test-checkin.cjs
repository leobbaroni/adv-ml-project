const { PrismaClient } = require('./node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const reservation = await prisma.reservation.findUnique({
    where: { id: 'cmp3ews59006vnuhptaeec0si' },
  });
  if (!reservation) {
    console.log('Reservation not found');
    return;
  }

  const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const expiresAt = new Date(reservation.endDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const existing = await prisma.checkInForm.findUnique({
    where: { reservationId: reservation.id },
  });

  if (existing) {
    await prisma.checkInForm.update({
      where: { reservationId: reservation.id },
      data: { guestLinkToken: token, guestLinkExpiresAt: expiresAt },
    });
  } else {
    await prisma.checkInForm.create({
      data: {
        reservationId: reservation.id,
        guestLinkToken: token,
        guestLinkExpiresAt: expiresAt,
      },
    });
  }

  console.log('Token:', token);
  console.log('Link:', `http://localhost:3000/checkin/${token}`);
  await prisma.$disconnect();
}

main();
