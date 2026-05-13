import { getAiClient, getAiModel } from '../router.js';
import { PdfRequestSchema, type PdfRequest } from '@app/shared';

export async function parsePdfRequest(input: {
  text: string;
  properties: Array<{ id: string; name: string }>;
  reservations: Array<{ id: string; summary: string; startDate: Date; endDate: Date }>;
}): Promise<PdfRequest> {
  const client = getAiClient();
  const model = getAiModel();

  const propertyList = input.properties
    .map((p) => `- id: ${p.id}, name: ${p.name}`)
    .join('\n');

  const reservationList = input.reservations
    .map((r) => `- id: ${r.id}, summary: ${r.summary}, startDate: ${r.startDate.toISOString()}, endDate: ${r.endDate.toISOString()}`)
    .join('\n');

  const systemPrompt = `You are a PDF request parser for a property-management concierge bot.

Interpret the user's request and return a JSON object with exactly these fields:
- type: "CHECKIN" | "SCHEDULE" | "UNKNOWN"
- propertyId: string | undefined
- reservationId: string | undefined
- referenceDate: ISO string | undefined
- windowDays: number | undefined

Rules:
- "check-in form for May 11" or "guest form for reservation on 2025-05-11" → type CHECKIN, find matching reservation by date.
- "schedule for this month" or "calendar pdf for Triplex" → type SCHEDULE, match property, use current month start as referenceDate, windowDays 30.
- If unclear → type UNKNOWN.

Available properties:
${propertyList}

Available reservations:
${reservationList}

Respond ONLY with the JSON object.`;

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input.text },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    return PdfRequestSchema.parse(parsed);
  } catch {
    return { type: 'UNKNOWN', propertyId: null };
  }
}
