import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { prisma, ReservationStatus } from '@app/db';
import SchedulePdfDocument from '@/components/SchedulePdfDocument';

function getDateOnly(date: Date | string): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

interface ScheduleRow {
  property: { id: string; name: string; city: string; country: string };
  current: { summary: string; endDate: Date } | null;
  next: { summary: string; startDate: Date } | null;
  turnoverDays: number | null;
  hasOverlap: boolean;
}

function buildScheduleRows(
  properties: {
    id: string;
    name: string;
    city: string;
    country: string;
    reservations: {
      id: string;
      summary: string;
      startDate: Date;
      endDate: Date;
      status: ReservationStatus;
    }[];
  }[],
  referenceDate: Date,
): ScheduleRow[] {
  const ref = getDateOnly(referenceDate);

  return properties.map((property) => {
    const reservations = property.reservations;

    // Find current: reservation that contains referenceDate
    const currentIndex = reservations.findIndex((r) => {
      const start = getDateOnly(r.startDate);
      const end = getDateOnly(r.endDate);
      return start <= ref && ref <= end;
    });

    const current =
      currentIndex >= 0 ? reservations[currentIndex] : null;

    const next =
      currentIndex >= 0
        ? reservations[currentIndex + 1] ?? null
        : reservations.find((r) => getDateOnly(r.startDate) >= ref) ?? null;

    let turnoverDays: number | null = null;
    let hasOverlap = false;

    if (current && next) {
      const currentEnd = getDateOnly(current.endDate);
      const nextStart = getDateOnly(next.startDate);
      turnoverDays = daysBetween(currentEnd, nextStart);
      hasOverlap = nextStart.getTime() <= currentEnd.getTime();
    }

    return {
      property: {
        id: property.id,
        name: property.name,
        city: property.city,
        country: property.country,
      },
      current: current
        ? { summary: current.summary, endDate: current.endDate }
        : null,
      next: next
        ? { summary: next.summary, startDate: next.startDate }
        : null,
      turnoverDays,
      hasOverlap,
    };
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId') ?? undefined;
  const referenceDateParam = searchParams.get('referenceDate');
  const referenceDate = referenceDateParam
    ? new Date(referenceDateParam)
    : new Date();

  const properties = await prisma.property.findMany({
    where: propertyId ? { id: propertyId } : undefined,
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      reservations: {
        where: {
          status: { not: 'SUPPRESSED' },
        },
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          summary: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      },
    },
  });

  const rows = buildScheduleRows(properties, referenceDate);

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
