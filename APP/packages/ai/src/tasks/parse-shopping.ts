import { getAiClient, getAiModel } from '../router.js';
import { ShoppingParseSchema, type ShoppingParse } from '@app/shared';

export async function parseShoppingMessage(input: {
  text: string;
  properties: Array<{ id: string; name: string }>;
}): Promise<ShoppingParse> {
  const client = getAiClient();
  const model = getAiModel();

  const propertyList = input.properties
    .map((p) => `- id: ${p.id}, name: ${p.name}`)
    .join('\n');

  const systemPrompt = `You are a shopping-list parser for a property-management concierge bot.

1. Identify which property the user is referring to from the list below. Return the property id, or null if unclear.
2. Extract each shopping item with:
   - name: item name
   - qty: quantity (default 1)
   - unitPrice (optional): price per unit in EUR, if mentioned
   - ikeaUrl (optional): if an IKEA article number is mentioned (e.g. 803.607.04), construct the URL as https://www.ikea.com/pt/en/p/-s{articleNumber}/

Available properties:
${propertyList}

Respond ONLY with a JSON object matching:
{ "propertyId": string | null, "items": [{ "name": string, "qty": number, "unitPrice"?: number, "ikeaUrl"?: string }] }`;

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
    return ShoppingParseSchema.parse(parsed);
  } catch {
    return { propertyId: null, items: [] };
  }
}
