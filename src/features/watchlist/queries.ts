import { queryOptions } from "@tanstack/react-query";
import { getJson } from "@/shared/lib/get-json";

export const watchlistQueryKey = ["watchlist"] as const;

/** Full names ("owner/repo") on the user's watchlist, newest first. */
export function watchlistQueryOptions() {
  return queryOptions({
    queryKey: watchlistQueryKey,
    queryFn: ({ signal }) => getJson<string[]>("/api/watchlist", signal),
    // Only this browser changes it, through mutations that update the cache.
    staleTime: Infinity,
  });
}
