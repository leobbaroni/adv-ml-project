// Parse an .ics string into normalized, date-only events.
// Bad events are skipped, never thrown.

import nodeIcal from 'node-ical';

import type { NormalizedEvent } from './index.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function inferStatus(summary: string, icalStatus?: string): 'CONFIRMED' | 'BLOCKED' {
  if (icalStatus) {
    const upper = String(icalStatus).toUpperCase();
    if (upper === 'TENTATIVE' || upper === 'CANCELLED') {
      return 'BLOCKED';
    }
  }
  const lower = summary.toLowerCase();
  if (lower.includes('not available')) {
    return 'BLOCKED';
  }
  return 'CONFIRMED';
}

export function parseICal(icsText: string): NormalizedEvent[] {
  if (!icsText) return [];

  let parsed: ReturnType<typeof nodeIcal.sync.parseICS>;
  try {
    parsed = nodeIcal.sync.parseICS(icsText);
  } catch {
    return [];
  }

  const events: NormalizedEvent[] = [];

  for (const component of Object.values(parsed)) {
    if (component.type !== 'VEVENT') continue;

    const uid = component.uid;
    if (typeof uid !== 'string' || uid.length === 0) continue;

    const startRaw = component.start;
    const endRaw = component.end;
    if (!(startRaw instanceof Date) || !(endRaw instanceof Date)) continue;
    if (Number.isNaN(startRaw.getTime()) || Number.isNaN(endRaw.getTime())) continue;

    const startDate = stripToUtcMidnight(startRaw);
    let endDate = stripToUtcMidnight(endRaw);
    if (endDate.getTime() <= startDate.getTime()) {
      endDate = new Date(startDate.getTime() + MS_PER_DAY);
    }

    const summary = typeof component.summary === 'string' ? component.summary : '';
    const status = inferStatus(summary, component.status);

    events.push({ externalUid: uid, summary, startDate, endDate, status });
  }

  return events;
}

function stripToUtcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
