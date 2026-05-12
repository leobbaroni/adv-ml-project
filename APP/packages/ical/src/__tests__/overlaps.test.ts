import { describe, it, expect } from 'vitest';

import { detectOverlaps } from '../overlaps.js';
import type { NormalizedEvent } from '../index.js';

type SourcedEvent = NormalizedEvent & { sourceId: string; sourceLabel: string };

function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

function makeEvent(
  sourceId: string,
  uid: string,
  start: Date,
  end: Date,
  summary = '',
): SourcedEvent {
  return {
    externalUid: uid,
    summary,
    startDate: start,
    endDate: end,
    sourceId,
    sourceLabel: sourceId,
  };
}

describe('detectOverlaps (R1)', () => {
  it('flags two events with identical dates from different sources as EXACT_DUPLICATE', () => {
    const start = utc(2025, 12, 15);
    const end = utc(2025, 12, 20);
    const events = [
      makeEvent('airbnb-1', 'a@airbnb.com', start, end, 'Reserved'),
      makeEvent('vrbo-1', 'b@vrbo.com', start, end, 'Reserved - John'),
    ];

    const overlaps = detectOverlaps(events);
    expect(overlaps).toHaveLength(1);

    const overlap = overlaps[0];
    expect(overlap).toBeDefined();
    if (!overlap) return;
    expect(overlap.kind).toBe('EXACT_DUPLICATE');
    expect(overlap.a.sourceId).not.toBe(overlap.b.sourceId);
  });

  it('returns no overlaps when date ranges differ', () => {
    const events = [
      makeEvent('airbnb-1', 'a@airbnb.com', utc(2025, 12, 15), utc(2025, 12, 20)),
      makeEvent('vrbo-1', 'b@vrbo.com', utc(2025, 12, 21), utc(2025, 12, 25)),
    ];

    expect(detectOverlaps(events)).toEqual([]);
  });

  it('does not flag identical dates from the same source', () => {
    const start = utc(2025, 12, 15);
    const end = utc(2025, 12, 20);
    const events = [
      makeEvent('airbnb-1', 'a@airbnb.com', start, end),
      makeEvent('airbnb-1', 'b@airbnb.com', start, end),
    ];

    expect(detectOverlaps(events)).toEqual([]);
  });

  it('returns no overlaps for an empty input', () => {
    expect(detectOverlaps([])).toEqual([]);
  });
});
