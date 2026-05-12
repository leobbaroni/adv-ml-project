// Parse a free-text Telegram message into a property + list of shopping items.
// Phase 7 wires the real call. Stub returns an empty list.

import type { ShoppingParse } from '@app/shared';

export async function parseShoppingMessage(input: {
  text: string;
  properties: Array<{ id: string; name: string }>;
}): Promise<ShoppingParse> {
  void input;
  return { propertyId: null, items: [] };
}
