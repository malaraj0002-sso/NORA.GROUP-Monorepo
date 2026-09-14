import 'server-only';
import { getSanityApiVersion, getSanityDataset, getSanityProjectId, isSanityConfigured } from './env';

type QueryApiResponse = {
  result?: unknown;
  error?: { description?: string };
};

/**
 * Read-only GROQ over the public Sanity HTTP API.
 * No write token. Avoids adding next-sanity to the Dashboard package.
 */
export async function fetchSanityQuery<T>(query: string): Promise<{ ok: true; data: T } | { ok: false; reason: string }> {
  if (!isSanityConfigured()) {
    return { ok: false, reason: 'Sanity project id is not configured' };
  }

  const projectId = getSanityProjectId();
  if (!projectId) {
    return { ok: false, reason: 'Sanity project id is not configured' };
  }

  const dataset = encodeURIComponent(getSanityDataset());
  const apiVersion = encodeURIComponent(getSanityApiVersion());
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set('query', query);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, reason: 'Sanity request failed' };
  }

  let body = '';
  try {
    body = await response.text();
  } catch {
    return { ok: false, reason: 'Sanity response could not be read' };
  }

  if (!body.trim()) {
    return { ok: false, reason: 'Sanity returned an empty response' };
  }

  let parsed: QueryApiResponse;
  try {
    parsed = JSON.parse(body) as QueryApiResponse;
  } catch {
    return { ok: false, reason: 'Sanity returned a non-JSON response' };
  }

  if (!response.ok || parsed.error) {
    return { ok: false, reason: 'Sanity query was not successful' };
  }

  return { ok: true, data: parsed.result as T };
}

const SANITY_ID_RE = /^[a-zA-Z0-9._-]+$/;

/** Constant GROQ with a bound $id parameter. Does not interpolate user input into the query string. */
export async function fetchSanityDocumentType(id: string): Promise<string | null> {
  if (!SANITY_ID_RE.test(id) || id.length > 200) return null;
  if (!isSanityConfigured()) return null;

  const projectId = getSanityProjectId();
  if (!projectId) return null;

  const dataset = encodeURIComponent(getSanityDataset());
  const apiVersion = encodeURIComponent(getSanityApiVersion());
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set('query', '*[_id == $id][0]._type');
  url.searchParams.set('$id', JSON.stringify(id));

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
  } catch {
    return null;
  }

  const body = await response.text();
  if (!body.trim()) return null;
  try {
    const parsed = JSON.parse(body) as { result?: unknown };
    return typeof parsed.result === 'string' ? parsed.result : null;
  } catch {
    return null;
  }
}
