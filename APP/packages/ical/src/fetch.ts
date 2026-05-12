// Fetch an iCal URL. Returns body text + ETag, or an error.
// Real implementation lands in Phase 1/2.

export type FetchResult =
  | { ok: true; body: string; etag: string | null }
  | { ok: false; error: string };

export async function fetchICal(url: string, _previousEtag?: string | null): Promise<FetchResult> {
  // Placeholder — Phase 1 implements real fetch with timeout + ETag.
  void url;
  return { ok: false, error: 'not-implemented' };
}
