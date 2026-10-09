"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useHydrated } from "@/hooks/use-hydrated";
import { watchlistQueryOptions } from "@/lib/queries";

/** Header link with a live count, reading the same cache as every WatchButton. */
export function WatchlistNavLink() {
  const hydrated = useHydrated();
  const { data } = useQuery(watchlistQueryOptions());
  const count = hydrated ? (data?.length ?? 0) : 0;
  return (
    <Link
      href="/watchlist"
      className="ml-auto text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      ★ Watchlist
      {count > 0 && (
        <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-xs text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          {count}
        </span>
      )}
    </Link>
  );
}
