import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { GitHubRepo } from "@/lib/github/types";
import {
  SEARCH_MAX_RESULTS,
  SEARCH_PER_PAGE,
  toQueryString,
  type RepoSearchParams,
} from "./search-params";

export * from "./search-params";

/**
 * Query options shared by Server Components (prefetch + dehydrate) and Client
 * Components (useQuery / useInfiniteQuery). Keeping keys in one place is what
 * makes server → client hydration line up.
 */

export interface SearchPage {
  items: GitHubRepo[];
  totalCount: number;
  page: number;
}

export const queryKeys = {
  search: (params: RepoSearchParams) => ["search", params] as const,
  repo: (owner: string, repo: string) =>
    ["repo", owner.toLowerCase(), repo.toLowerCase()] as const,
  watchlist: ["watchlist"] as const,
};

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function searchReposInfiniteOptions(params: RepoSearchParams) {
  return infiniteQueryOptions({
    queryKey: queryKeys.search(params),
    // Client-side fetcher hits our Route Handler, which holds the GitHub token.
    // The server prefetch passes its own queryFn that calls GitHub directly.
    queryFn: ({ pageParam, signal }) =>
      getJson<SearchPage>(`/api/search?${toQueryString(params, pageParam)}`, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const reachable = Math.min(last.totalCount, SEARCH_MAX_RESULTS);
      return last.page * SEARCH_PER_PAGE < reachable &&
        last.items.length === SEARCH_PER_PAGE
        ? last.page + 1
        : undefined;
    },
    enabled: params.q.length > 0,
  });
}

export function repoQueryOptions(owner: string, repo: string) {
  return queryOptions({
    queryKey: queryKeys.repo(owner, repo),
    queryFn: ({ signal }) =>
      getJson<GitHubRepo>(
        `/api/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
        signal,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

/** Full names ("owner/repo") on the user's watchlist, newest first. */
export function watchlistQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.watchlist,
    queryFn: ({ signal }) => getJson<string[]>("/api/watchlist", signal),
    // Only this browser changes it, through mutations that update the cache.
    staleTime: Infinity,
  });
}
