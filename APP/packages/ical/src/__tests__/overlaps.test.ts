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
  status: 'CONFIRMED' | 'BLOCKED' = 'CONFIRMED',
): SourcedEvent {
  return {
    externalUid: uid,
    summary,
    startDate: start,
    endDate: end,
    sourceId,
    sourceLabel: sourceId,
    status,
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

describe('detectOverlaps (R2)', () => {
  it('flags an Airbnb 1-day BLOCKED event overlapping a CONFIRMED event as AIRBNB_SAME_DAY_BLOCK', () => {
    const blocked = makeEvent('airbnb-1', 'block@airbnb.com', utc(2025, 12, 15), utc(2025, 12, 16), 'Airbnb (Not available)', 'BLOCKED');
    const confirmed = makeEvent('vrbo-1', 'res@vrbo.com', utc(2025, 12, 10), utc(2025, 12, 20), 'Reserved');
    const overlaps = detectOverlaps([blocked, confirmed]);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.kind).toBe('AIRBNB_SAME_DAY_BLOCK');
  });

  it('does not flag R2 when the blocked event is multi-day', () => {
    const blocked = makeEvent('airbnb-1', 'block@airbnb.com', utc(2025, 12, 15), utc(2025, 12, 18), 'Not available', 'BLOCKED');
    const confirmed = makeEvent('vrbo-1', 'res@vrbo.com', utc(2025, 12, 10), utc(2025, 12, 20), 'Reserved');
    const overlaps = detectOverlaps([blocked, confirmed]);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.kind).toBe('AMBIGUOUS');
  });

  it('does not flag R2 when the blocked event is not from Airbnb', () => {
    const blocked = makeEvent('vrbo-1', 'block@vrbo.com', utc(2025, 12, 15), utc(2025, 12, 16), 'Not available', 'BLOCKED');
    const confirmed = makeEvent('airbnb-1', 'res@airbnb.com', utc(2025, 12, 10), utc(2025, 12, 20), 'Reserved');
    const overlaps = detectOverlaps([blocked, confirmed]);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.kind).toBe('AMBIGUOUS');
  });

  it('does not flag R2 when both events are BLOCKED', () => {
    const blockedAirbnb = makeEvent('airbnb-1', 'block@airbnb.com', utc(2025, 12, 15), utc(2025, 12, 16), 'Not available', 'BLOCKED');
    const blockedVrbo = makeEvent('vrbo-1', 'block@vrbo.com', utc(2025, 12, 10), utc(2025, 12, 20), 'Not available', 'BLOCKED');
    const overlaps = detectOverlaps([blockedAirbnb, blockedVrbo]);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.kind).toBe('AMBIGUOUS');
  });
});

describe('detectOverlaps (R3)', () => {
  it('does not flag back-to-back events as overlaps', () => {
    const a = makeEvent('airbnb-1', 'a@airbnb.com', utc(2025, 12, 15), utc(2025, 12, 20));
    const b = makeEvent('vrbo-1', 'b@vrbo.com', utc(2025, 12, 20), utc(2025, 12, 25));
    expect(detectOverlaps([a, b])).toEqual([]);
  });
});

describe('detectOverlaps (ambiguous)', () => {
  it('flags partial overlaps as AMBIGUOUS', () => {
    const a = makeEvent('airbnb-1', 'a@airbnb.com', utc(2025, 12, 15), utc(2025, 12, 20));
    const b = makeEvent('vrbo-1', 'b@vrbo.com', utc(2025, 12, 18), utc(2025, 12, 25));
    const overlaps = detectOverlaps([a, b]);
    expect(overlaps).toHaveLength(1);
    expect(overlaps[0]?.kind).toBe('AMBIGUOUS');
  });
});
