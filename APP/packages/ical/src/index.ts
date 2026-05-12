// Public surface of @app/ical.

export type NormalizedEvent = {
  externalUid: string;
  summary: string;
  startDate: Date;
  endDate: Date;
};

export type Overlap = {
  a: NormalizedEvent & { sourceId: string };
  b: NormalizedEvent & { sourceId: string };
  kind: 'EXACT_DUPLICATE' | 'AIRBNB_SAME_DAY_BLOCK' | 'AMBIGUOUS';
};

export { fetchICal } from './fetch.js';
export type { FetchResult } from './fetch.js';
export { parseICal } from './parse.js';
export { detectOverlaps } from './overlaps.js';
