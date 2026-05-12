import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { describe, it, expect } from 'vitest';

import { parseICal } from '../parse.js';

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), 'utf8');
}

describe('parseICal', () => {
  it('returns an empty array for empty input', () => {
    expect(parseICal('')).toEqual([]);
  });

  it('parses an Airbnb feed with reserved + blocked events', () => {
    const events = parseICal(loadFixture('airbnb-sample.ics'));
    expect(events).toHaveLength(2);

    const reserved = events.find((e) => e.summary === 'Reserved');
    expect(reserved).toBeDefined();
    expect(reserved?.externalUid).toBe('abc123def456@airbnb.com');

    const block = events.find((e) => e.summary === 'Airbnb (Not available)');
    expect(block).toBeDefined();
    expect(block?.externalUid).toBe('xyz789ghi012@airbnb.com');
  });

  it('strips time components to UTC midnight', () => {
    const events = parseICal(loadFixture('vrbo-sample.ics'));
    expect(events).toHaveLength(1);

    const event = events[0];
    expect(event).toBeDefined();
    if (!event) return;

    expect(event.startDate.getUTCHours()).toBe(0);
    expect(event.startDate.getUTCMinutes()).toBe(0);
    expect(event.startDate.getUTCSeconds()).toBe(0);
    expect(event.startDate.getUTCMilliseconds()).toBe(0);

    expect(event.endDate.getUTCHours()).toBe(0);
    expect(event.endDate.getUTCMinutes()).toBe(0);

    expect(event.startDate.toISOString()).toBe('2025-12-15T00:00:00.000Z');
    expect(event.endDate.toISOString()).toBe('2025-12-20T00:00:00.000Z');
  });

  it('skips events with missing DTSTART but keeps valid siblings', () => {
    const events = parseICal(loadFixture('malformed.ics'));
    expect(events).toHaveLength(1);

    const valid = events[0];
    expect(valid?.externalUid).toBe('valid-event@example.com');
    expect(valid?.summary).toBe('Valid Booking');
  });

  it('fixes endDate when end <= start by adding one day', () => {
    const events = parseICal(loadFixture('same-day.ics'));
    expect(events).toHaveLength(1);

    const event = events[0];
    expect(event).toBeDefined();
    if (!event) return;

    expect(event.startDate.toISOString()).toBe('2026-02-01T00:00:00.000Z');
    expect(event.endDate.toISOString()).toBe('2026-02-02T00:00:00.000Z');
  });
});
