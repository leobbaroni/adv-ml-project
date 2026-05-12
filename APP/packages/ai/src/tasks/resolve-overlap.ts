// Resolve an ambiguous overlap. Phase 3 wires the real call.
// Stub returns NEEDS_HUMAN so nothing is silently auto-resolved.

import type { OverlapResolution } from '@app/shared';

export async function resolveOverlap(input: {
  events: Array<{ id: string; summary: string; startDate: Date; endDate: Date; sourceLabel: string }>;
}): Promise<OverlapResolution> {
  void input;
  return {
    action: 'NEEDS_HUMAN',
    rationale: 'AI resolver not yet implemented; flagging for manual review.',
  };
}
