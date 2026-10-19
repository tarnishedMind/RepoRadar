/**
 * Client-side fetch for our own Route Handlers: parses JSON and turns an
 * error response's `{ error }` body into a thrown Error for TanStack Query.
 */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}
