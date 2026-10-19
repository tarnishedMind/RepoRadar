import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { connection } from "next/server";
import type { GitHubRepo } from "@/entities/github";
import { getRepo } from "@/entities/github/server";
import { getQueryClient } from "@/shared/lib/get-query-client";
import { Skeleton } from "@/shared/ui/skeleton";
import { watchlistQueryKey } from "./queries";
import { readWatchlist } from "./storage";
import { WatchlistItems } from "./watchlist-items";

/** Reads the cookie, so it must render inside <Suspense> (see the page). */
export async function WatchlistContent() {
  // Request-time only: TanStack's dehydrate() below uses Date.now(), which Next
  // won't allow during prerendering (same as /search).
  await connection();
  const names = await readWatchlist();

  // Each getRepo is cached ("use cache"), so this is cheap after the first visit.
  const repos = (
    await Promise.all(
      names.map((name) => {
        const [owner, repo] = name.split("/");
        return getRepo(owner, repo).catch(() => null);
      }),
    )
  ).filter((r): r is GitHubRepo => r !== null);

  // Seed the client cache so the header count and buttons don't refetch.
  const queryClient = getQueryClient();
  queryClient.setQueryData(watchlistQueryKey, names);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WatchlistItems repos={repos} savedNames={names} />
    </HydrationBoundary>
  );
}

export function WatchlistSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}
