import { OverlapResolutionSchema, type OverlapResolution } from '@app/shared';
import { getAiClient, getAiModel } from '../router.js';

export async function resolveOverlap(input: {
  events: Array<{ id: string; summary: string; startDate: Date; endDate: Date; sourceLabel: string }>;
}): Promise<OverlapResolution> {
  try {
    const client = getAiClient();
    const model = getAiModel();

    const eventsDescription = input.events
      .map(
        (event, index) =>
          `Event ${index + 1}:
- ID: ${event.id}
- Source: ${event.sourceLabel}
- Summary: ${event.summary}
- Start: ${event.startDate.toISOString()}
- End: ${event.endDate.toISOString()}`
      )
      .join('\n\n');

    const prompt = `You are an AI channel manager for short-term rental properties.
The following calendar events overlap. Decide how to resolve the conflict.

${eventsDescription}

Decision rules (pick the single best option):
1. KEEP_BOTH — Use when both events are legitimate and the overlap is acceptable. Examples: one is a blocked cleaning/maintenance window, the other is a confirmed guest stay; or the property has multiple sub-units and each booking is for a different unit; or one is a host-blocked personal stay that overlaps with a platform block.
2. SUPPRESS — Use when one event is clearly a duplicate, test booking, lower-priority platform block, or calendar artifact that should be removed. You MUST include the \`targetReservationId\` of the event to suppress. The suppressed event will be hidden from the calendar but can be restored later if needed.
3. NEEDS_HUMAN — Use ONLY when you genuinely cannot tell which event is correct (e.g., both look like valid guest bookings with different names and no clear priority).

Return a JSON object with exactly these fields:
- action: "SUPPRESS" | "KEEP_BOTH" | "NEEDS_HUMAN"
- targetReservationId: string (required ONLY when action is "SUPPRESS"; set it to the ID of the event to remove)
- rationale: string (max 300 chars, explain in plain English why you chose this action — be specific about which event is kept and which is removed, or why both are kept)`;

    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty AI response content');
    }

    const parsed = JSON.parse(rawContent);
    const validated = OverlapResolutionSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('[resolveOverlap] AI error:', error);
    return {
      action: 'NEEDS_HUMAN',
      rationale: 'AI unavailable; manual review needed.',
    };
  }
}
