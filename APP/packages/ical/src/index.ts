// Public surface of @app/ical.

export type NormalizedEvent = {
  externalUid: string;
  summary: string;
  startDate: Date;
  endDate: Date;
  status: 'CONFIRMED' | 'BLOCKED';
};

export type Overlap = {
  a: NormalizedEvent & { sourceId: string; sourceLabel: string };
  b: NormalizedEvent & { sourceId: string; sourceLabel: string };
  kind: 'EXACT_DUPLICATE' | 'AIRBNB_SAME_DAY_BLOCK' | 'AMBIGUOUS';
};

export { fetchICal } from './fetch.js';
export type { FetchResult } from './fetch.js';
export { parseICal } from './parse.js';
export { detectOverlaps } from './overlaps.js';
