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
      checkInForm: true,
    },
  });

  if (!reservation) {
    return new Response('Reservation not found', { status: 404 });
  }

  const buffer = await renderToBuffer(
    createElement(CheckInPdfDocument, {
      property: reservation.property,
      reservation: {
        summary: reservation.summary,
        startDate: fmt(reservation.startDate),
        endDate: fmt(reservation.endDate),
      },
      form: reservation.checkInForm
        ? {
            fullName: reservation.checkInForm.fullName,
            country: reservation.checkInForm.country,
            citizenId: reservation.checkInForm.citizenId,
            dob: reservation.checkInForm.dob ? fmt(reservation.checkInForm.dob) : null,
            submittedAt: reservation.checkInForm.submittedAt ? fmt(reservation.checkInForm.submittedAt) : null,
          }
        : null,
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
