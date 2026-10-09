"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic } from "react";
import { removeFromWatchlist } from "@/app/actions/watchlist";
import { formatCount } from "@/lib/format";
import type { GitHubRepo } from "@/lib/github/types";
import { queryKeys, watchlistQueryOptions } from "@/lib/queries";

/**
 * Removal uses React's useOptimistic + a <form action>, the other optimistic
 * pattern (WatchButton uses TanStack's onMutate). The row disappears at once;
 * the Server Action updates the cookie and Next re-renders this page with the
 * new `repos` in the same response. If the action fails, the optimistic state
 * is discarded and the row comes back on its own.
 */
export function WatchlistItems({
  repos,
  savedNames,
}: {
  repos: GitHubRepo[];
  savedNames: string[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [optimisticRepos, removeOptimistic] = useOptimistic(
    repos,
    (state, fullName: string) => state.filter((r) => r.full_name !== fullName),
  );

  // Next keeps this page alive (hidden) when you navigate away. If you watch
  // or unwatch something elsewhere and come back, the client cache is newer
  // than what the server rendered, so ask the server for a fresh render.
  const { data: cachedNames } = useQuery(watchlistQueryOptions());
  const outOfSync =
    cachedNames !== undefined && cachedNames.join("\n") !== savedNames.join("\n");
  useEffect(() => {
    if (outOfSync) router.refresh();
  }, [outOfSync, router]);

  async function remove(formData: FormData) {
    removeOptimistic(String(formData.get("fullName")));
    const result = await removeFromWatchlist(formData);
    queryClient.setQueryData(queryKeys.watchlist, result.list);
  }

  if (!optimisticRepos.length) {
    return (
      <p className="text-zinc-500">
        Nothing here yet. Use{" "}
        <span className="rounded-md border border-zinc-300 px-1.5 py-0.5 text-xs dark:border-zinc-700">
          ☆ Watch
        </span>{" "}
        on a repository or in{" "}
        <Link href="/search" className="underline">
          search
        </Link>{" "}
        results.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {optimisticRepos.map((repo) => (
        <li key={repo.id} className="flex items-center gap-4 px-4 py-3">
          <Image
            src={repo.owner.avatar_url}
            alt=""
            width={32}
            height={32}
            className="rounded-full"
          />
          <Link href={`/${repo.full_name}`} className="flex min-w-0 flex-col hover:underline">
            <span className="truncate font-medium">{repo.full_name}</span>
            {repo.description && (
              <span className="truncate text-sm text-zinc-500">{repo.description}</span>
            )}
          </Link>
          <span className="ml-auto shrink-0 text-sm tabular-nums text-zinc-500">
            ★ {formatCount(repo.stargazers_count)}
          </span>
          <form action={remove}>
            <input type="hidden" name="fullName" value={repo.full_name} />
            <button className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:border-red-400 hover:text-red-600 dark:border-zinc-700">
              Remove
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
