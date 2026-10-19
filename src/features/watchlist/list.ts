import { isRepoFullName, sameRepo } from "@/entities/github";

export const WATCHLIST_LIMIT = 50;

export type WatchlistResult =
  | { ok: true; list: string[] }
  | { ok: false; error: string; list: string[] };

/**
 * Adds or removes a repo, newest first. Both arguments come straight from a
 * Server Action call, so they are `unknown` and checked here (ADR 0004).
 * On failure the unchanged list comes back so the client can resync.
 */
export function toggleWatched(
  list: string[],
  fullName: unknown,
  watched: unknown,
): WatchlistResult {
  if (!isRepoFullName(fullName) || typeof watched !== "boolean") {
    return { ok: false, error: "Invalid repository name", list };
  }

  const without = list.filter((name) => !sameRepo(name, fullName));
  if (!watched) return { ok: true, list: without };

  if (without.length >= WATCHLIST_LIMIT) {
    // Returned (not thrown) so the message reaches the client in production.
    return {
      ok: false,
      error: `Your watchlist is full (${WATCHLIST_LIMIT} repos). Remove one first.`,
      list,
    };
  }
  return { ok: true, list: [fullName, ...without] };
}
