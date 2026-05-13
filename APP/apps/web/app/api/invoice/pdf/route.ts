import { NextRequest } from 'next/server';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import { prisma } from '@app/db';
import { InvoicePdfDocument } from '@/components/InvoicePdfDocument';

function fmt(d: Date): string {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  if (!propertyId) {
    return new Response('Missing propertyId', { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { shoppingItems: true },
  });

  if (!property) {
    return new Response('Property not found', { status: 404 });
  }

  const items = property.shoppingItems.map((item) => ({
    name: item.name,
    qty: item.qty,
    unitPrice: item.unitPrice
      ? (item.unitPrice as unknown as { toNumber(): number }).toNumber()
      : null,
  }));

  const buffer = await renderToBuffer(
    createElement(InvoicePdfDocument, {
      property,
      items,
      generatedAt: new Date(),
    }) as React.ReactElement<DocumentProps>,
  );

  const dateStr = fmt(new Date());
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${property.name}-${dateStr}.pdf"`,
    },
  });
}
