"use server";

import { toggleWatched, type WatchlistResult } from "./list";
import { readWatchlist, writeWatchlist } from "./storage";

/**
 * Server Actions: functions that run on the server but are called from the
 * browser like normal async functions (or used as a <form action>). Next turns
 * each one into a POST endpoint. Treat their arguments as untrusted input:
 * anyone can call them with anything, whatever the TypeScript types say.
 */

export async function setWatched(
  fullName: unknown,
  watched: unknown,
): Promise<WatchlistResult> {
  const result = toggleWatched(await readWatchlist(), fullName, watched);
  if (result.ok) await writeWatchlist(result.list);
  return result;
}

/** Form-friendly variant used by the remove buttons on /watchlist. */
export async function removeFromWatchlist(formData: unknown) {
  const fullName = formData instanceof FormData ? formData.get("fullName") : null;
  return setWatched(fullName, false);
}
