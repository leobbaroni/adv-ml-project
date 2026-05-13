import { callAiJson, cleanJson } from '../router.js';
import { RepairParseSchema, type RepairParse } from '@app/shared';

export async function parseRepairMessage(input: {
  text: string;
  properties: Array<{ id: string; name: string }>;
}): Promise<RepairParse> {
  const propertyList = input.properties
    .map((p) => `- id: ${p.id}, name: ${p.name}`)
    .join('\n');

  const systemPrompt = `You are a property repair estimator for a concierge bot.

Your job: extract repair requests from the user's message, identify the property, and generate a cost estimate broken down into line items.

Rules:
1. Identify which property the user is referring to from the list below. Return the property id, or null if unclear.

2. Extract the repair description (e.g. "bathroom door", "leaking faucet", "broken window").

3. Generate a realistic cost estimate for Portugal (Lisbon area) with line items:
   - MATERIALS: approximate cost of parts/materials needed
   - LABOR: approximate labor cost (handyman rates in Portugal: €25-40/hour)
   - OTHER: any additional costs (transport, disposal, etc.)

4. Each line item must have:
   - name: short description (e.g. "Door hinge set", "Handyman labor 2h")
   - cost: price in EUR
   - category: "MATERIALS", "LABOR", or "OTHER"

5. Example:
   User: "Repair triplex bathroom door"
   → {
     "propertyId": "<triplex-id>",
     "description": "bathroom door repair",
     "lineItems": [
       {"name": "Door hinge set", "cost": 15.00, "category": "MATERIALS"},
       {"name": "Handyman labor 2h", "cost": 60.00, "category": "LABOR"},
       {"name": "Transport fee", "cost": 10.00, "category": "OTHER"}
     ]
   }

Available properties:
${propertyList}

Respond ONLY with a JSON object matching this exact shape:
{"propertyId": "..." | null, "description": "...", "lineItems": [{"name": "...", "cost": 29.99, "category": "MATERIALS"}]}`;

  try {
    const { raw } = await callAiJson([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input.text },
    ]);

    const cleaned = cleanJson(raw);
    const parsed = JSON.parse(cleaned || '{}');
    const validated = RepairParseSchema.parse(parsed);

    console.log('[parseRepairMessage] parsed', { text: input.text, result: validated });
    return validated;
  } catch (err) {
    console.error('[parseRepairMessage] failed:', err);
    return { propertyId: null, description: '', lineItems: [] };
  }
}
