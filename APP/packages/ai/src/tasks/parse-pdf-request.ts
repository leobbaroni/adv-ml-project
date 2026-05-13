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

  const todayIso = new Date().toISOString().split('T')[0]!;

  const systemPrompt = `You are a PDF request parser for a property-management concierge bot.

Today's date is ${todayIso}. Interpret the user's request and return a JSON object with exactly these fields:
- type: "CHECKIN" | "SCHEDULE" | "UNKNOWN"
- propertyId: string | undefined
- reservationId: string | undefined
- referenceDate: ISO string | undefined (start of the relevant window)
- windowDays: number | undefined

Rules:
1. CHECKIN — the user wants a check-in form PDF for a specific reservation.
   - If a date is mentioned (e.g. "May 11", "11/05", "2025-05-11"), match it to a reservation startDate or endDate.
   - If a property name is mentioned, narrow to that property's reservations.
   - Set reservationId to the matched reservation id.

2. SCHEDULE — the user wants a schedule/calendar PDF.
   - Phrases like "schedule for this month", "full schedule", "calendar this month", "schedule pdf" → type SCHEDULE.
   - referenceDate must be the first day of the relevant month (e.g. if today is ${todayIso} and user says "this month", referenceDate is ${todayIso.slice(0, 7)}-01).
   - windowDays defaults to 30.
   - If a property name is mentioned, set propertyId. If no property is mentioned, leave propertyId undefined (all properties).

3. UNKNOWN — if you cannot determine the request type.

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
