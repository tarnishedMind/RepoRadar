import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import { searchRepositories } from "@/lib/github";
import { getQueryClient } from "@/lib/get-query-client";
import { parseSearchParams, searchReposInfiniteOptions } from "@/lib/queries";
import { SearchSkeleton, SearchView } from "./search-view";

type Props = PageProps<"/search">;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = parseSearchParams(await searchParams);
  return { title: q ? `Search: ${q}` : "Search" };
}

export default function SearchPage({ searchParams }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Search repositories</h1>
      <Suspense fallback={<SearchSkeleton />}>
        <PrefetchedSearch searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/**
 * Fetches the first page on the server, then hands TanStack Query's cache to
 * the client via <HydrationBoundary>. The client renders instantly from that
 * cache and takes over for further pages and new queries.
 */
async function PrefetchedSearch({ searchParams }: Pick<Props, "searchParams">) {
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
