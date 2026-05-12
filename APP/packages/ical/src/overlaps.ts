// Deterministic overlap detection + auto-resolution rules R1, R2, R3.
// See .agents/knowledge-base/ICAL-MERGE-SPEC.md.

import type { NormalizedEvent, Overlap } from './index.js';

export function detectOverlaps(
  _events: Array<NormalizedEvent & { sourceId: string; sourceLabel: string }>,
): Overlap[] {
  return [];
}
