"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sameRepo } from "@/entities/github";
import { useHydrated } from "@/shared/hooks/use-hydrated";
import { setWatched } from "./actions";
import { watchlistQueryKey, watchlistQueryOptions } from "./queries";

/**
 * Optimistic toggle with TanStack Query:
 * 1. onMutate updates the cached watchlist immediately and keeps a snapshot.
 * 2. mutationFn calls the Server Action.
 * 3. onError restores the snapshot (rollback); onSuccess stores the server's list.
 * Every WatchButton and the header counter read the same cache entry, so they
 * all update together.
 */
export function WatchButton({
  fullName,
  className = "",
}: {
  fullName: string;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const { data } = useQuery(watchlistQueryOptions());
  const list = hydrated ? data : undefined;
  const watched = list?.some((name) => sameRepo(name, fullName)) ?? false;

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const result = await setWatched(fullName, next);
      if (!result.ok) throw new Error(result.error);
      return result.list;
    },
    onMutate: async (next) => {
      // Stop in-flight fetches from overwriting the optimistic value.
      await queryClient.cancelQueries({ queryKey: watchlistQueryKey });
      const previous = queryClient.getQueryData<string[]>(watchlistQueryKey);
      queryClient.setQueryData<string[]>(watchlistQueryKey, (old = []) =>
        next
          ? [fullName, ...old.filter((n) => !sameRepo(n, fullName))]
          : old.filter((n) => !sameRepo(n, fullName)),
      );
      return { previous };
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(watchlistQueryKey, context?.previous);
    },
    onSuccess: (serverList) => {
      queryClient.setQueryData(watchlistQueryKey, serverList);
    },
  });

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        disabled={list === undefined}
        aria-pressed={watched}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          mutation.mutate(!watched);
        }}
        className={`rounded-md border px-3 py-1 text-sm transition-colors disabled:opacity-50 ${
          watched
            ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300"
            : "border-zinc-300 bg-background hover:border-zinc-500 dark:border-zinc-700"
        }`}
      >
        {watched ? "★ Watching" : "☆ Watch"}
      </button>
      {mutation.isError && (
        <span role="alert" className="text-xs text-red-600">
          {mutation.error.message}
        </span>
      )}
    </span>
  );
}
