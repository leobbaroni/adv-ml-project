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

Rules:
- SUPPRESS: choose one reservation to suppress (e.g., duplicate, test booking, or lower-priority platform). You must include the \`targetReservationId\` of the event to suppress.
- KEEP_BOTH: the overlap is acceptable (e.g., blocked cleaning window, host stay, different sub-units).
- NEEDS_HUMAN: you cannot confidently decide.

Return a JSON object with exactly these fields:
- action: "SUPPRESS" | "KEEP_BOTH" | "NEEDS_HUMAN"
- targetReservationId: string (required only when action is "SUPPRESS"; omit otherwise)
- rationale: string (max 500 chars, explain your reasoning)`;

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
