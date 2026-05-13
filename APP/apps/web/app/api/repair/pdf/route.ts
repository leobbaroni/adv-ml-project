import { NextRequest } from 'next/server';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { prisma } from '@app/db';
import { RepairEstimatePdfDocument } from '@/components/RepairEstimatePdfDocument';

function fmt(d: Date): string {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repairId = searchParams.get('repairId');

  if (!repairId) {
    return new Response('Missing repairId', { status: 400 });
  }

  const repair = await prisma.repairEstimate.findUnique({
    where: { id: repairId },
    include: { property: true },
  });

  if (!repair) {
    return new Response('Repair estimate not found', { status: 404 });
  }

  const lineItems = repair.lineItems as Array<{ name: string; cost: number; category: string }>;

  const buffer = await renderToBuffer(
    createElement(RepairEstimatePdfDocument, {
      property: repair.property,
      description: repair.description,
      lineItems,
      generatedAt: new Date(),
    }) as React.ReactElement<DocumentProps>,
  );

  const dateStr = fmt(new Date());
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="repair-${repair.property.name}-${dateStr}.pdf"`,
    },
  });
}
