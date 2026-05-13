import { NextRequest } from 'next/server';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { prisma } from '@app/db';
import { CheckInPdfDocument } from '@/components/CheckInPdfDocument';

function fmt(d: Date): string {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reservationId = searchParams.get('reservationId');

  if (!reservationId) {
    return new Response('Missing reservationId', { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      property: true,
      checkInForm: { include: { guests: true } },
    },
  });

  if (!reservation) {
    return new Response('Reservation not found', { status: 404 });
  }

  const form = reservation.checkInForm;
  const guests = form?.guests.map((g) => ({
    fullName: g.fullName,
    country: g.country,
    citizenId: g.citizenId,
    dob: g.dob ? fmt(g.dob) : null,
  })) ?? [];

  const buffer = await renderToBuffer(
    createElement(CheckInPdfDocument, {
      property: reservation.property,
      reservation: {
        summary: reservation.summary,
        startDate: fmt(reservation.startDate),
        endDate: fmt(reservation.endDate),
      },
      guests,
      submittedAt: form?.submittedAt ? fmt(form.submittedAt) : null,
      generatedAt: fmt(new Date()),
    }) as React.ReactElement<DocumentProps>,
  );

  const dateStr = fmt(new Date());
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="checkin-${reservation.property.name}-${dateStr}.pdf"`,
    },
  });
}
