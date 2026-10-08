"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/skeleton";
import { useInView } from "@/hooks/use-in-view";
import { formatCount } from "@/lib/format";
import { LANGUAGES, type LanguageSlug } from "@/lib/github/catalog";
import {
  SEARCH_SORTS,
  parseSearchParams,
  searchReposInfiniteOptions,
  toQueryString,
  type RepoSearchParams,
  type SearchSort,
} from "@/lib/queries";
import { SearchResultCard } from "./search-result-card";

const EXAMPLES = ["next.js", "tanstack", "state management", "rust cli"];

/** Updates the URL without a server round trip; useSearchParams stays in sync. */
function updateUrl(patch: Partial<RepoSearchParams>) {
  const current = parseSearchParams(new URLSearchParams(window.location.search));
  const qs = toQueryString({ ...current, ...patch });
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

export function SearchView() {
  const params = parseSearchParams(useSearchParams());
  const [input, setInput] = useState(params.q);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isPending,
    isPlaceholderData,
    refetch,
  } = useInfiniteQuery({
    ...searchReposInfiniteOptions(params),
    // Keep showing the previous results while a new query loads.
    placeholderData: keepPreviousData,
  });

  // Infinite scroll: load the next page when the sentinel nears the viewport.
  const [sentinelRef, sentinelInView] = useInView<HTMLDivElement>();
  useEffect(() => {
    if (sentinelInView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [sentinelInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  function onQueryChange(value: string) {
    setInput(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => updateUrl({ q: value.trim() }), 350);
  }

  const repos = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.totalCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={input}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search GitHub repositories…"
          autoFocus
          className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <select
          value={params.sort}
          onChange={(e) => updateUrl({ sort: e.target.value as SearchSort })}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
          aria-label="Sort"
        >
          {Object.entries(SEARCH_SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={params.lang}
          onChange={(e) => updateUrl({ lang: e.target.value as LanguageSlug | "" })}
          className="rounded-md border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
          aria-label="Language"
        >
          <option value="">Any language</option>
          {Object.entries(LANGUAGES).map(([slug, name]) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {!params.q ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          Try:
          {EXAMPLES.map((q) => (
            <Link
              key={q}
              href={`/search?q=${encodeURIComponent(q)}`}
              onClick={() => setInput(q)}
              className="rounded-full border border-zinc-200 px-3 py-1 hover:border-zinc-400 dark:border-zinc-800"
            >
              {q}
            </Link>
          ))}
        </div>
      ) : error && !data ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-red-600">{error.message}</p>
          <button onClick={() => refetch()} className="text-sm underline">
            Try again
          </button>
        </div>
      ) : isPending ? (
        <ResultsSkeleton />
      ) : (
        <>
          <p className="text-sm text-zinc-500" aria-live="polite">
            {formatCount(total)} repositories
            {isFetching && !isFetchingNextPage && " · updating…"}
          </p>
          {repos.length ? (
            <div
              className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${isPlaceholderData ? "opacity-50" : ""}`}
            >
              {repos.map((repo) => (
                <SearchResultCard key={repo.id} repo={repo} />
              ))}
            </div>
          ) : (
            <p className="text-zinc-500">No repositories match “{params.q}”.</p>
          )}
          <div ref={sentinelRef} className="flex justify-center py-6 text-sm text-zinc-500">
            {isFetchingNextPage
              ? "Loading more…"
              : hasNextPage
                ? ""
                : repos.length > 0 && "That's everything GitHub returns."}
          </div>
        </>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }, (_, i) => (
        <Skeleton key={i} className="h-28" />
      ))}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-full" />
      <ResultsSkeleton />
    </div>
  );
}
