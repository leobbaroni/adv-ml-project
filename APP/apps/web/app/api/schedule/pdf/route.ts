import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { prisma } from '@app/db';
import SchedulePdfDocument from '@/components/SchedulePdfDocument';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

interface FlatReservation {
  id: string;
  property: { id: string; name: string };
  summary: string;
  startDate: Date;
  endDate: Date;
  sourceLabel: string;
  status: string;
  nextCheckIn: Date | null;
}

function computeNextCheckIn(
  reservation: { id: string; endDate: Date },
  allPropertyReservations: { id: string; startDate: Date; endDate: Date }[],
): Date | null {
  const next = allPropertyReservations
    .filter((r) => r.id !== reservation.id && r.startDate.getTime() > reservation.endDate.getTime())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];

  return next?.startDate ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId') ?? undefined;
  const referenceDateParam = searchParams.get('referenceDate');
  const referenceDate = referenceDateParam
    ? new Date(referenceDateParam)
    : new Date();
  const windowDays = 90;
  const cutoff = new Date(referenceDate.getTime() + windowDays * MS_PER_DAY);

  const reservations = await prisma.reservation.findMany({
    where: {
      startDate: { lte: cutoff },
      ...(propertyId ? { propertyId } : {}),
    },
    orderBy: { startDate: 'asc' },
    select: {
      id: true,
      summary: true,
      startDate: true,
      endDate: true,
      status: true,
      property: { select: { id: true, name: true } },
      source: { select: { label: true } },
    },
  });

  // Group by property to compute nextCheckIn
  const byProperty = new Map<string, { id: string; startDate: Date; endDate: Date }[]>();
  for (const r of reservations) {
    const key = r.property.id;
    if (!byProperty.has(key)) {
      byProperty.set(key, []);
    }
    byProperty.get(key)!.push({ id: r.id, startDate: r.startDate, endDate: r.endDate });
  }

  const rows: FlatReservation[] = reservations.map((r) => ({
    id: r.id,
    property: r.property,
    summary: r.summary,
    startDate: r.startDate,
    endDate: r.endDate,
    sourceLabel: r.source.label,
    status: r.status,
    nextCheckIn: computeNextCheckIn(r, byProperty.get(r.property.id) ?? []),
  }));

  const buffer = await renderToBuffer(
    createElement(SchedulePdfDocument, {
      rows,
      referenceDate,
      generatedAt: new Date(),
    }) as React.ReactElement<DocumentProps>,
  );

  const dateStr = referenceDate.toISOString().split('T')[0];

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="schedule-${dateStr}.pdf"`,
    },
  });
}
