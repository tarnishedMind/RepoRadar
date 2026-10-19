import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { connection } from "next/server";
import { searchRepositories } from "@/entities/github/server";
import { getQueryClient } from "@/shared/lib/get-query-client";
import { searchReposInfiniteOptions } from "./queries";
import { parseSearchParams } from "./search-params";
import { SearchView } from "./search-view";

/**
 * Fetches the first page on the server, then hands TanStack Query's cache to
 * the client via <HydrationBoundary>. The client renders instantly from that
 * cache and takes over for further pages and new queries.
 */
export async function PrefetchedSearch({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Search results are per-request: opt this subtree out of prerendering.
  // (TanStack Query stamps cache entries with Date.now(), which Next would
  // otherwise flag while prerendering.)
  await connection();
  const params = parseSearchParams(await searchParams);
  const queryClient = getQueryClient();

  if (params.q) {
    await queryClient.prefetchInfiniteQuery({
      ...searchReposInfiniteOptions(params),
      // Same key as the client, but call GitHub directly instead of our own API.
      queryFn: ({ pageParam }) => searchRepositories(params, pageParam),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchView />
    </HydrationBoundary>
  );
}
