import { callAiJson, cleanJson } from '../router.js';
import { ShoppingParseSchema, type ShoppingParse } from '@app/shared';
import { ikeaCatalog, getIkeaProductUrl } from '../ikea-catalog.js';

export async function parseShoppingMessage(input: {
  text: string;
  properties: Array<{ id: string; name: string }>;
}): Promise<ShoppingParse> {
  const propertyList = input.properties
    .map((p) => `- id: ${p.id}, name: ${p.name}`)
    .join('\n');

  const catalogLines = ikeaCatalog
    .map((p) => `- ${p.name} (art. ${p.articleNumber}) — €${p.unitPrice.toFixed(2)} ${p.unit}`)
    .join('\n');

  const systemPrompt = `You are an IKEA shopping assistant for a property-management concierge bot.

Your job: extract shopping items from the user's message, match them to real IKEA products from the catalog below, and return them as JSON.

Rules:
1. Identify which property the user is referring to from the list below. Return the property id, or null if unclear.

2. For each item the user wants to buy:
   - qty: quantity the user wants (default 1)
   - Look up the EXACT product in the IKEA catalog below. Match the user's generic description to the closest catalog entry.
   - name: MUST be the EXACT catalog product name (e.g. "GODIS glass", not just "glass")
   - unitPrice: use the exact price from the catalog
   - ikeaUrl: construct the product URL using the article number: https://www.ikea.com/pt/en/p/-s{articleNumberWithoutDots}/
     Example: article 803.607.04 → https://www.ikea.com/pt/en/p/-s80360704/

3. CRITICAL: Always return the ikeaUrl field with the direct product link when the product is in the catalog. NEVER omit it.

4. If the user asks for something NOT in the catalog:
   - name: best IKEA product name you know
   - unitPrice: approximate price
   - ikeaUrl: omit this field

5. Examples:
   - User: "Buy for Triplex: 2x MALM bed frame"
     → items: [{"name": "MALM bed frame", "qty": 2, "unitPrice": 149.00, "ikeaUrl": "https://www.ikea.com/pt/en/p/-s19027489/"}]
   
   - User: "Buy for Nanoush: 6 cups, 4 towels"
     → items: [
         {"name": "GODIS glass", "qty": 6, "unitPrice": 1.99, "ikeaUrl": "https://www.ikea.com/pt/en/p/-s80360704/"},
         {"name": "VÅGSJÖN bath towel", "qty": 4, "unitPrice": 5.99, "ikeaUrl": "https://www.ikea.com/pt/en/p/-s40488091/"}
       ]

Available properties:
${propertyList}

IKEA Catalog (use these exact names, prices and article numbers):
${catalogLines}

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
