"use server";

import {
  WATCHLIST_LIMIT,
  isRepoFullName,
  readWatchlist,
  sameRepo,
  writeWatchlist,
} from "@/lib/watchlist";

/**
 * Server Actions: functions that run on the server but are called from the
 * browser like normal async functions (or used as a <form action>). Next turns
 * each one into a POST endpoint. Treat their arguments as untrusted input.
 */

export type WatchlistResult =
  | { ok: true; list: string[] }
  | { ok: false; error: string; list: string[] };

export async function setWatched(
  fullName: string,
  watched: boolean,
): Promise<WatchlistResult> {
  const list = await readWatchlist();
  if (!isRepoFullName(fullName)) {
    return { ok: false, error: "Invalid repository name", list };
  }

  const without = list.filter((name) => !sameRepo(name, fullName));
  if (!watched) {
    await writeWatchlist(without);
    return { ok: true, list: without };
  }

  if (without.length >= WATCHLIST_LIMIT) {
    // Returned (not thrown) so the message reaches the client in production.
    return {
      ok: false,
      error: `Your watchlist is full (${WATCHLIST_LIMIT} repos). Remove one first.`,
      list,
    };
  }
  const next = [fullName, ...without];
  await writeWatchlist(next);
  return { ok: true, list: next };
}

/** Form-friendly variant used by the remove buttons on /watchlist. */
export async function removeFromWatchlist(formData: FormData) {
  return setWatched(String(formData.get("fullName") ?? ""), false);
}
