// Deterministic overlap detection.
// Phase 1: R1 only — exact-duplicate dates from different sources.
// Phase 2: R2 (Airbnb same-day block) + R3 (back-to-back not an overlap) + AI escalation.
// See .agents/knowledge-base/ICAL-MERGE-SPEC.md.

import type { NormalizedEvent, Overlap } from './index.js';

type SourcedEvent = NormalizedEvent & { sourceId: string; sourceLabel: string };

export function detectOverlaps(events: SourcedEvent[]): Overlap[] {
  const overlaps: Overlap[] = [];

  for (let i = 0; i < events.length; i++) {
    const a = events[i];
    if (!a) continue;
    for (let j = i + 1; j < events.length; j++) {
      const b = events[j];
      if (!b) continue;
      if (a.sourceId === b.sourceId) continue;
      if (a.startDate.getTime() !== b.startDate.getTime()) continue;
      if (a.endDate.getTime() !== b.endDate.getTime()) continue;

      overlaps.push({ a, b, kind: 'EXACT_DUPLICATE' });
    }
  }

  return overlaps;
}
