// Fetch an iCal URL with a 10s timeout and ETag support.
// Returns the body + ETag on 200, signals not-modified on 304, or an error string.

export type FetchResult =
  | { ok: true; body: string; etag: string | null; notModified: boolean }
  | { ok: false; error: string };

const FETCH_TIMEOUT_MS = 10_000;

export async function fetchICal(
  url: string,
  previousEtag?: string | null,
): Promise<FetchResult> {
  const headers: Record<string, string> = {};
  if (previousEtag) {
    headers['If-None-Match'] = previousEtag;
  }

  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });

    if (response.status === 304) {
      return {
        ok: true,
        body: '',
        etag: previousEtag ?? null,
        notModified: true,
      };
    }

    if (!response.ok) {
      return { ok: false, error: `http-${response.status}` };
    }

    const body = await response.text();
    const etag = response.headers.get('etag');
    return { ok: true, body, etag, notModified: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown-error';
    return { ok: false, error: message };
  }
}
