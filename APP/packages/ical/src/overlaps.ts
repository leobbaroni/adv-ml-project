// Deterministic overlap detection.
// Phase 1: R1 only — exact-duplicate dates from different sources.
// Phase 2: R2 (Airbnb same-day block) + R3 (back-to-back not an overlap) + AI escalation.
// See .agents/knowledge-base/ICAL-MERGE-SPEC.md.

import type { NormalizedEvent, Overlap } from './index.js';

type SourcedEvent = NormalizedEvent & { sourceId: string; sourceLabel: string };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isAirbnbSource(event: SourcedEvent): boolean {
  return (
    event.sourceId.toLowerCase().includes('airbnb') ||
    event.sourceLabel.toLowerCase().includes('airbnb')
  );
}

function isOneDay(event: SourcedEvent): boolean {
  return event.endDate.getTime() - event.startDate.getTime() === MS_PER_DAY;
}

function intervalsOverlap(a: SourcedEvent, b: SourcedEvent): boolean {
  // [startA, endA) ∩ [startB, endB) ≠ ∅
  // This also excludes back-to-back adjacency (R3).
  return (
    a.startDate.getTime() < b.endDate.getTime() &&
    b.startDate.getTime() < a.endDate.getTime()
  );
}

export function detectOverlaps(events: SourcedEvent[]): Overlap[] {
  const overlaps: Overlap[] = [];

  for (let i = 0; i < events.length; i++) {
    const a = events[i];
    if (!a) continue;

    for (let j = i + 1; j < events.length; j++) {
      const b = events[j];
      if (!b) continue;
      if (a.sourceId === b.sourceId) continue;

      // R3: back-to-back adjacency is not an overlap.
      if (!intervalsOverlap(a, b)) continue;

      // R1 — Exact duplicate.
      if (
        a.startDate.getTime() === b.startDate.getTime() &&
        a.endDate.getTime() === b.endDate.getTime()
      ) {
        overlaps.push({ a, b, kind: 'EXACT_DUPLICATE' });
        continue;
      }

      // R2 — Same-day Airbnb block.
      const aIsAirbnbBlocked = a.status === 'BLOCKED' && isAirbnbSource(a) && isOneDay(a);
      const bIsAirbnbBlocked = b.status === 'BLOCKED' && isAirbnbSource(b) && isOneDay(b);
      const aIsConfirmed = a.status === 'CONFIRMED';
      const bIsConfirmed = b.status === 'CONFIRMED';

      if (
        (aIsAirbnbBlocked && bIsConfirmed) ||
        (bIsAirbnbBlocked && aIsConfirmed)
      ) {
        overlaps.push({ a, b, kind: 'AIRBNB_SAME_DAY_BLOCK' });
        continue;
      }

      // Ambiguous: any other overlap.
      overlaps.push({ a, b, kind: 'AMBIGUOUS' });
    }
  }

  return overlaps;
}
