import { callAiJson, cleanJson } from '../router.js';
import { PdfRequestSchema, type PdfRequest } from '@app/shared';

export async function parsePdfRequest(input: {
  text: string;
  properties: Array<{ id: string; name: string }>;
  reservations: Array<{ id: string; propertyId: string; summary: string; startDate: Date; endDate: Date }>;
}): Promise<PdfRequest> {
  const propertyList = input.properties
    .map((p) => `- id: ${p.id}, name: ${p.name}`)
    .join('\n');

  const reservationList = input.reservations
    .map((r) => `- id: ${r.id}, propertyId: ${r.propertyId}, summary: ${r.summary}, startDate: ${r.startDate.toISOString().split('T')[0]}, endDate: ${r.endDate.toISOString().split('T')[0]}`)
    .join('\n');

  const today = new Date();
  const todayIso = today.toISOString().split('T')[0]!;
  const monthStart = `${todayIso.slice(0, 7)}-01`;

  const systemPrompt = `You are a PDF request parser for a property-management concierge bot.

Your job: interpret the user's request for a PDF document and return the parameters as JSON.

Today's date is ${todayIso}.

Rules:
1. CHECKIN — the user wants a check-in form PDF for a specific reservation.
   - If a date is mentioned (e.g. "May 11", "11/05", "2025-05-11"), match it to a reservation startDate or endDate.
   - If a property name is mentioned, narrow to that property's reservations.
   - Set reservationId to the matched reservation id.
   - Example: "check-in form for May 11" → {"type": "CHECKIN", "reservationId": "..."}

2. SCHEDULE — the user wants a schedule/calendar PDF.
   - Phrases like "schedule for this month", "full schedule", "calendar this month", "schedule pdf", "send me the schedule", "schedule" → type SCHEDULE.
   - referenceDate must be the first day of the relevant month (e.g. if today is ${todayIso} and user says "this month", referenceDate is "${monthStart}").
   - windowDays defaults to 30.
   - If a property name is mentioned, set propertyId. If no property is mentioned, propertyId stays null (all properties).
   - Example: "send me the schedule for this month" → {"type": "SCHEDULE", "referenceDate": "${monthStart}", "windowDays": 30}
   - Example: "schedule for Triplex" → {"type": "SCHEDULE", "propertyId": "<triplex-id>", "referenceDate": "${monthStart}", "windowDays": 30}

3. UNKNOWN — if you genuinely cannot determine the request type.

Available properties:
${propertyList}

Available reservations:
${reservationList}

Respond ONLY with a JSON object matching this exact shape:
{"type": "CHECKIN" | "SCHEDULE" | "UNKNOWN", "propertyId": "..." | null, "reservationId": "..." | null, "referenceDate": "2025-05-01" | null, "windowDays": 30 | null}`;

  try {
    const { raw } = await callAiJson([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input.text },
    ]);

    const cleaned = cleanJson(raw);
    const parsed = JSON.parse(cleaned || '{}');
    const validated = PdfRequestSchema.parse(parsed);

    console.log('[parsePdfRequest] parsed', { text: input.text, result: validated });
    return validated;
  } catch (err) {
    console.error('[parsePdfRequest] failed:', err);
    return { type: 'UNKNOWN', propertyId: null };
  }
}
