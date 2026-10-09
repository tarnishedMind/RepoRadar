import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Skeleton } from "@/components/skeleton";
import { getRepo, type GitHubRepo } from "@/lib/github";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/queries";
import { readWatchlist } from "@/lib/watchlist";
import { WatchlistItems } from "./watchlist-items";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Repositories you are keeping an eye on.",
};

export default function WatchlistPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Saved in a cookie in this browser. No account needed.
        </p>
      </div>
      {/* Reading cookies is per-request, so it must sit inside <Suspense>. */}
      <Suspense fallback={<WatchlistSkeleton />}>
        <WatchlistContent />
      </Suspense>
    </main>
  );
}

async function WatchlistContent() {
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
  queryClient.setQueryData(queryKeys.watchlist, names);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WatchlistItems repos={repos} savedNames={names} />
    </HydrationBoundary>
  );
}

function WatchlistSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}
