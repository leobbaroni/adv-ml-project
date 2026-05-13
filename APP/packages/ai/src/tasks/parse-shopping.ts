import { callAiJson, cleanJson } from '../router.js';
import { ShoppingParseSchema, type ShoppingParse } from '@app/shared';

export async function parseShoppingMessage(input: {
  text: string;
  properties: Array<{ id: string; name: string }>;
}): Promise<ShoppingParse> {
  const propertyList = input.properties
    .map((p) => `- id: ${p.id}, name: ${p.name}`)
    .join('\n');

  const systemPrompt = `You are a shopping-list parser for a property-management concierge bot.

Your job: extract shopping items from the user's message and return them as JSON.

Rules:
1. Identify which property the user is referring to from the list below. Return the property id, or null if unclear.
2. Extract each shopping item with:
   - name: item name (required)
   - qty: quantity (default 1)
   - unitPrice (optional): price per unit in EUR, if mentioned. If not mentioned, omit this field.
   - ikeaUrl (optional): if an IKEA article number is mentioned (e.g. "803.607.04" or "art. 803.607.04"), construct the URL as https://www.ikea.com/pt/en/p/-s{articleNumber}/

3. If the user says "Buy for Triplex: 2x MALM bed frame", extract:
   - propertyId: <id of Triplex>
   - items: [{"name": "MALM bed frame", "qty": 2}]

4. If the user says "Buy for Nanoush: 1x BILLY bookcase €29.99, art. 803.607.04", extract:
   - propertyId: <id of Nanoush>
   - items: [{"name": "BILLY bookcase", "qty": 1, "unitPrice": 29.99, "ikeaUrl": "https://www.ikea.com/pt/en/p/-s80360704/"}]

Available properties:
${propertyList}

Respond ONLY with a JSON object matching this exact shape:
{"propertyId": "..." | null, "items": [{"name": "...", "qty": 1, "unitPrice": 29.99, "ikeaUrl": "https://..."}]}`;

  try {
    const { raw } = await callAiJson([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input.text },
    ]);

    const cleaned = cleanJson(raw);
    const parsed = JSON.parse(cleaned || '{}');
    const validated = ShoppingParseSchema.parse(parsed);

    console.log('[parseShoppingMessage] parsed', { text: input.text, result: validated });
    return validated;
  } catch (err) {
    console.error('[parseShoppingMessage] failed:', err);
    return { propertyId: null, items: [] };
  }
}
