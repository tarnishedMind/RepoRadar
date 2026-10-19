import { infiniteQueryOptions } from "@tanstack/react-query";
import {
  SEARCH_MAX_RESULTS,
  SEARCH_PER_PAGE,
  type GitHubRepo,
  type RepoSearchParams,
} from "@/entities/github";
import { getJson } from "@/shared/lib/get-json";
import { toQueryString } from "./search-params";

/**
 * Query options shared by Server Components (prefetch + dehydrate) and Client
 * Components (useInfiniteQuery). Keeping the key in one place is what makes
 * server → client hydration line up.
 */

export interface SearchPage {
  items: GitHubRepo[];
  totalCount: number;
  page: number;
}

/** `["search"]` alone matches every search query, e.g. for getQueriesData. */
export const searchQueryKey = (params: RepoSearchParams) => ["search", params] as const;

export function searchReposInfiniteOptions(params: RepoSearchParams) {
  return infiniteQueryOptions({
    queryKey: searchQueryKey(params),
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
